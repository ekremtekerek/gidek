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

/**
 * Merchant identity — kullanıcının yönettiği işletmenin id'sini döner. Yoksa
 * null. profiles.merchant_id 1:1 ilişkisini okur (service-role değil,
 * normal session client; RLS owner-only select policy'si gereği kullanıcı
 * kendi profilini görebilir).
 */
export async function getCurrentMerchantId(user?: User | null): Promise<string | null> {
  const u = user ?? (await getCurrentUser());
  if (!u) return null;
  const { getServerClient } = await import('@/lib/db/server');
  const supabase = await getServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('merchant_id')
    .eq('id', u.id)
    .maybeSingle();
  return data?.merchant_id ?? null;
}

/**
 * Guard for /isletme/* — merchant kullanıcısına bağlı bir merchant_id
 * yoksa /giris'e veya anasayfaya yönlendir.
 */
export async function requireMerchant(): Promise<{ user: User; merchantId: string }> {
  const user = await requireUser('/giris?next=/isletme');
  const merchantId = await getCurrentMerchantId(user);
  if (!merchantId) redirect('/');
  return { user, merchantId };
}

/**
 * Guard for shared endpoints (image upload vb.) — admin VEYA bir merchant'a
 * bağlı kullanıcı geçer. İkisi de değilse 403.
 */
export async function requireAdminOrMerchant(): Promise<User> {
  const user = await requireUser('/giris');
  if (isAdmin(user)) return user;
  const merchantId = await getCurrentMerchantId(user);
  if (!merchantId) redirect('/');
  return user;
}
