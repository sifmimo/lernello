'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Utiliser la fonction RPC qui contourne RLS
      const { data: result } = await supabase
        .rpc('check_is_admin', { check_user_id: user.id });

      setIsAdmin(result === true);
      setLoading(false);
    }

    checkAdmin();
  }, []);

  return { isAdmin, loading };
}
