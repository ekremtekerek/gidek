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

/** Comma-separated allow list, server-side only. */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isAdmin(user: Pick<User, 'email'> | null): boolean {
  if (!user?.email) return false;
  return getAdminEmails().includes(user.email.toLowerCase());
}

/** Guard for /admin/* — anonymous goes to /giris, signed-in non-admins to /. */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser('/giris?next=/admin');
  if (!isAdmin(user)) redirect('/');
  return user;
}
