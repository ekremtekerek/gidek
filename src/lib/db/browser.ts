import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for Client Components. Reads/writes the session cookie via
 * the browser. RLS gates row access via the anon key + auth.uid().
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
