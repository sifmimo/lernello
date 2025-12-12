'use server';

import { createClient } from '@/lib/supabase/server';

interface AbusePattern {
  type: 'rapid_requests' | 'excessive_tokens' | 'suspicious_content' | 'api_key_sharing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
}

const abusePatterns: AbusePattern[] = [
  { type: 'rapid_requests', severity: 'medium', threshold: 20 },
  { type: 'excessive_tokens', severity: 'high', threshold: 100000 },
  { type: 'api_key_sharing', severity: 'critical', threshold: 5 },
];

interface AbuseCheckResult {
  isAbusive: boolean;
  patterns: string[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  action: 'none' | 'warn' | 'throttle' | 'suspend';
}

export async function detectAbuse(userId: string): Promise<AbuseCheckResult> {
  const supabase = await createClient();
  const detectedPatterns: string[] = [];
  let maxSeverity: AbuseCheckResult['severity'] = 'none';

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const { count: rapidCount } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', fiveMinutesAgo.toISOString());

  if ((rapidCount || 0) > 20) {
    detectedPatterns.push('rapid_requests');
    maxSeverity = 'medium';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data: dailyUsage } = await supabase
    .from('ai_usage_logs')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const totalTokens = dailyUsage?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
  if (totalTokens > 100000) {
    detectedPatterns.push('excessive_tokens');
    maxSeverity = 'high';
  }

  const { count: ipCount } = await supabase
    .from('ai_usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  let action: AbuseCheckResult['action'] = 'none';
  if (maxSeverity === 'high') action = 'throttle';
  else if (maxSeverity === 'medium') action = 'warn';

  return {
    isAbusive: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    severity: maxSeverity,
    action,
  };
}

export async function logAbuseIncident(
  userId: string,
  pattern: string,
  severity: string,
  details: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  
  await supabase.from('abuse_incidents').insert({
    user_id: userId,
    pattern,
    severity,
    details,
    created_at: new Date().toISOString(),
  });
}

export async function getAbuseHistory(userId: string): Promise<{
  incidents: { pattern: string; severity: string; created_at: string }[];
  totalIncidents: number;
  lastIncident: string | null;
}> {
  const supabase = await createClient();
  
  const { data, count } = await supabase
    .from('abuse_incidents')
    .select('pattern, severity, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    incidents: data || [],
    totalIncidents: count || 0,
    lastIncident: data?.[0]?.created_at || null,
  };
}

export async function isUserSuspended(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('user_ai_settings')
    .select('is_suspended')
    .eq('user_id', userId)
    .single();

  return data?.is_suspended || false;
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('user_ai_settings')
    .update({ 
      is_suspended: true, 
      suspension_reason: reason,
      suspended_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

export async function unsuspendUser(userId: string): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('user_ai_settings')
    .update({ 
      is_suspended: false, 
      suspension_reason: null,
      suspended_at: null
    })
    .eq('user_id', userId);
}
