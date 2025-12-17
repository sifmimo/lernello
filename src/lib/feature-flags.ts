'use server';

import { createClient } from '@/lib/supabase/server';

export interface FeatureFlag {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  target_audience: string;
  conditions: Record<string, unknown>;
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('feature_flags')
    .select('*')
    .order('code');
  return data || [];
}

export async function isFeatureEnabled(code: string, userId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('code', code)
    .single();

  if (!flag || !flag.is_enabled) return false;

  if (flag.rollout_percentage < 100 && userId) {
    const hash = simpleHash(userId + code);
    if (hash % 100 >= flag.rollout_percentage) return false;
  }

  if (userId && flag.target_audience !== 'all') {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (flag.target_audience === 'staff' && user?.role !== 'admin') return false;
    if (flag.target_audience === 'premium') {
      return false;
    }
  }

  return true;
}

export async function toggleFeatureFlag(code: string, enabled: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('feature_flags')
    .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
    .eq('code', code);
}

export async function updateFeatureFlagRollout(code: string, percentage: number): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('feature_flags')
    .update({ rollout_percentage: percentage, updated_at: new Date().toISOString() })
    .eq('code', code);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
