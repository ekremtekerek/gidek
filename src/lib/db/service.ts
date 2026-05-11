import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Privileged Supabase client. Bypasses RLS — only for trusted server-side
 * operations: AI logging, cache writes, seeding, admin tasks. NEVER expose
 * this client (or the service role key) to the browser.
 */
export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );
}
