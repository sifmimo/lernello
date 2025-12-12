'use server';

import { createClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'ai:generation': { maxRequests: 50, windowMs: 60 * 60 * 1000 },
  'ai:explanation': { maxRequests: 100, windowMs: 60 * 60 * 1000 },
  'ai:hint': { maxRequests: 200, windowMs: 60 * 60 * 1000 },
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  userId: string,
  action: string
): Promise<RateLimitResult> {
  const config = rateLimitConfigs[action] || { maxRequests: 100, windowMs: 60 * 60 * 1000 };
  const windowStart = new Date(Date.now() - config.windowMs);
  
  const supabase = await createClient();
  
  const { count } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', windowStart.toISOString());

  const currentCount = count || 0;
  const remaining = Math.max(0, config.maxRequests - currentCount);
  const resetAt = new Date(Date.now() + config.windowMs);

  return {
    allowed: currentCount < config.maxRequests,
    remaining,
    resetAt,
  };
}

export async function logAIUsage(
  userId: string,
  action: string,
  model: string,
  tokensUsed: number,
  cost?: number
): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from('ai_usage_logs').insert({
    user_id: userId,
    action,
    model,
    tokens_used: tokensUsed,
    cost: cost || 0,
    created_at: new Date().toISOString(),
  });
}

export async function getDailyUsage(userId: string): Promise<{
  totalTokens: number;
  totalCost: number;
  requestCount: number;
}> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used, cost')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (!data || data.length === 0) {
    return { totalTokens: 0, totalCost: 0, requestCount: 0 };
  }

  return {
    totalTokens: data.reduce((sum, log) => sum + (log.tokens_used || 0), 0),
    totalCost: data.reduce((sum, log) => sum + (log.cost || 0), 0),
    requestCount: data.length,
  };
}

export async function getMonthlyUsage(userId: string): Promise<{
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  dailyBreakdown: { date: string; tokens: number; cost: number }[];
}> {
  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used, cost, created_at')
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString())
    .order('created_at', { ascending: true });

  if (!data || data.length === 0) {
    return { totalTokens: 0, totalCost: 0, requestCount: 0, dailyBreakdown: [] };
  }

  const dailyMap = new Map<string, { tokens: number; cost: number }>();
  
  data.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    const existing = dailyMap.get(date) || { tokens: 0, cost: 0 };
    dailyMap.set(date, {
      tokens: existing.tokens + (log.tokens_used || 0),
      cost: existing.cost + (log.cost || 0),
    });
  });

  return {
    totalTokens: data.reduce((sum, log) => sum + (log.tokens_used || 0), 0),
    totalCost: data.reduce((sum, log) => sum + (log.cost || 0), 0),
    requestCount: data.length,
    dailyBreakdown: Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      tokens: stats.tokens,
      cost: stats.cost,
    })),
  };
}

export async function checkDailyLimit(
  userId: string,
  dailyLimit: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const { totalTokens } = await getDailyUsage(userId);
  return {
    allowed: totalTokens < dailyLimit,
    used: totalTokens,
    limit: dailyLimit,
  };
}

export async function checkMonthlyLimit(
  userId: string,
  monthlyLimit: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const { totalTokens } = await getMonthlyUsage(userId);
  return {
    allowed: totalTokens < monthlyLimit,
    used: totalTokens,
    limit: monthlyLimit,
  };
}
