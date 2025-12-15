'use server';

import { createClient } from '@/lib/supabase/server';

export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  // Utiliser la fonction RPC qui contourne RLS
  const { data: isAdmin } = await supabase
    .rpc('check_is_admin', { check_user_id: user.id });

  return isAdmin === true;
}
