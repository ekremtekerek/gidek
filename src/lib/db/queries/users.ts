import 'server-only';
import { getServiceClient } from '@/lib/db/service';

export interface AdminUserRow {
  id: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
  bannedUntil: string | null;
  bookingCount: number;
  favoriteCount: number;
  merchantId: string | null;
}

/**
 * Admin kullanıcı listesi — auth.users + profiles birleştirilir, her kullanıcının
 * rezervasyon ve favori sayısı hesaplanır. V1 için ilk 200 kayıt yeterli.
 */
export async function listAdminUsers(limit = 200): Promise<AdminUserRow[]> {
  const supabase = getServiceClient();

  const { data: usersData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: Math.min(limit, 200),
  });
  const users = usersData?.users ?? [];

  if (users.length === 0) return [];

  const ids = users.map((u) => u.id);

  const [{ data: profiles }, { data: bookings }, { data: favorites }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, phone, avatar_url, merchant_id')
      .in('id', ids),
    supabase.from('bookings').select('user_id').in('user_id', ids),
    supabase.from('favorites').select('user_id').in('user_id', ids),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, p] as const),
  );
  const bookingCount = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (!b.user_id) continue;
    bookingCount.set(b.user_id, (bookingCount.get(b.user_id) ?? 0) + 1);
  }
  const favoriteCount = new Map<string, number>();
  for (const f of favorites ?? []) {
    if (!f.user_id) continue;
    favoriteCount.set(f.user_id, (favoriteCount.get(f.user_id) ?? 0) + 1);
  }

  return users.map((u) => {
    const p = profileById.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      displayName: p?.display_name ?? null,
      phone: p?.phone ?? null,
      avatarUrl: p?.avatar_url ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      emailConfirmed: Boolean(u.email_confirmed_at),
      bannedUntil: (u as { banned_until?: string | null }).banned_until ?? null,
      bookingCount: bookingCount.get(u.id) ?? 0,
      favoriteCount: favoriteCount.get(u.id) ?? 0,
      merchantId: p?.merchant_id ?? null,
    };
  });
}
