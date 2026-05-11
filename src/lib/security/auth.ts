import 'server-only';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { getServerClient } from '@/lib/db/server';

/**
 * Read the current user from the session cookie. Returns null for anonymous
 * visitors. Server-side only; client code should subscribe to the browser
 * client's auth state instead.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Redirect to /giris if no user. Returns the user otherwise so pages can use
 * it without an extra null check.
 */
export async function requireUser(redirectTo = '/giris'): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}
