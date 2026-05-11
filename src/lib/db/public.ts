import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Anonymous Supabase client without cookie/session wiring. Use for queries
 * that read RLS-permitted public data and run in contexts where there is no
 * HTTP request (build-time `generateStaticParams`, `sitemap`, `generateMetadata`).
 *
 * For data that needs the caller's identity (favorites, profile, bookings),
 * use `getServerClient` from `./server` instead.
 */
export function getPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
