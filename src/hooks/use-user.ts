'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/db/browser';

/**
 * Subscribe to the browser session and expose the current Supabase user.
 * Re-renders on sign-in/out events. Returns `loading: true` until the
 * initial getUser() call resolves so consumers can avoid the empty flash.
 */
export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getBrowserClient();
    let cancelled = false;

    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
