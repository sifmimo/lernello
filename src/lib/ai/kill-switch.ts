'use server';

import { createClient } from '@/lib/supabase/server';

interface KillSwitchStatus {
  isActive: boolean;
  reason: string | null;
  activatedAt: string | null;
  affectedProviders: string[];
}

export async function getKillSwitchStatus(): Promise<KillSwitchStatus> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'ai_kill_switch')
    .single();

  if (!data?.value) {
    return {
      isActive: false,
      reason: null,
      activatedAt: null,
      affectedProviders: [],
    };
  }

  const settings = data.value as {
    is_active: boolean;
    reason: string;
    activated_at: string;
    affected_providers: string[];
  };

  return {
    isActive: settings.is_active,
    reason: settings.reason,
    activatedAt: settings.activated_at,
    affectedProviders: settings.affected_providers || [],
  };
}

export async function activateKillSwitch(
  reason: string,
  providers: string[] = ['openai', 'anthropic']
): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('system_settings')
    .upsert({
      key: 'ai_kill_switch',
      value: {
        is_active: true,
        reason,
        activated_at: new Date().toISOString(),
        affected_providers: providers,
      },
      updated_at: new Date().toISOString(),
    });
}

export async function deactivateKillSwitch(): Promise<void> {
  const supabase = await createClient();
  
  await supabase
    .from('system_settings')
    .upsert({
      key: 'ai_kill_switch',
      value: {
        is_active: false,
        reason: null,
        activated_at: null,
        affected_providers: [],
      },
      updated_at: new Date().toISOString(),
    });
}

export async function isProviderEnabled(provider: string): Promise<boolean> {
  const status = await getKillSwitchStatus();
  
  if (!status.isActive) return true;
  
  return !status.affectedProviders.includes(provider);
}

export async function checkAIAvailability(): Promise<{
  available: boolean;
  message: string | null;
  fallbackAvailable: boolean;
}> {
  const status = await getKillSwitchStatus();
  
  if (!status.isActive) {
    return {
      available: true,
      message: null,
      fallbackAvailable: true,
    };
  }

  const allProvidersDisabled = 
    status.affectedProviders.includes('openai') && 
    status.affectedProviders.includes('anthropic');

  return {
    available: !allProvidersDisabled,
    message: status.reason,
    fallbackAvailable: !allProvidersDisabled,
  };
}
