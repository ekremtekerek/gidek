import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Activity feed — kullanıcının takip ettiklerinin son aktiviteleri.
 *
 * Runtime'da bookings + reviews + favorites + user_badges'tan derive ediyoruz.
 * (Ayrı activities tablosu MVP scale'de gereksiz; write path'leri kirletmez.)
 * Her tipi ayrı sorgular, sonra zaman sırasına göre birleştiririz.
 */

export type ActivityKind = 'booking' | 'review' | 'favorite' | 'badge';

export interface ActivityActor {
  id: string;
  publicSlug: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  occurredAt: string;
  actor: ActivityActor;
  // Hedef nesne — kind'a göre dolu olur
  deal?: { slug: string; title: string; coverImage: string };
  badge?: { slug: string; name: string; tier: string; icon: string | null };
  reviewSnippet?: string;
  reviewRating?: number;
}

interface ProfileRow {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

function profileMap(rows: ProfileRow[]): Map<string, ActivityActor> {
  const m = new Map<string, ActivityActor>();
  for (const r of rows) {
    m.set(r.id, {
      id: r.id,
      publicSlug: r.public_slug,
      displayName: r.display_name ?? r.public_slug ?? '—',
      avatarUrl: r.avatar_url,
    });
  }
  return m;
}

export async function getActivityFeed(userId: string, limit = 30): Promise<ActivityItem[]> {
  const supabase = getServiceClient();

  // 1. Takip edilen kullanıcılar
  const { data: followRows } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', userId);
  const followeeIds = (followRows ?? []).map((r) => r.followee_id);
  if (followeeIds.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  // 2. Paralel: actor profilleri + 4 aktivite tipi
  const [
    profilesRes,
    bookingsRes,
    reviewsRes,
    favsRes,
    badgesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, public_slug, display_name, avatar_url')
      .in('id', followeeIds),
    supabase
      .from('bookings')
      .select(
        `id, user_id, created_at,
         deal:deals (slug, title, cover_image)`,
      )
      .in('user_id', followeeIds)
      .in('status', ['confirmed', 'used'])
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('reviews')
      .select(
        `id, user_id, created_at, rating, body,
         deal:deals (slug, title, cover_image)`,
      )
      .in('user_id', followeeIds)
      .eq('status', 'published')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('favorites')
      .select(
        `id, user_id, created_at,
         deal:deals (slug, title, cover_image)`,
      )
      .in('user_id', followeeIds)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('user_badges')
      .select(
        `user_id, earned_at,
         badge:badges (slug, name, tier, icon)`,
      )
      .in('user_id', followeeIds)
      .gte('earned_at', sinceIso)
      .order('earned_at', { ascending: false })
      .limit(limit),
  ]);

  const actors = profileMap((profilesRes.data ?? []) as ProfileRow[]);

  function pickDeal(rel: unknown): { slug: string; title: string; coverImage: string } | undefined {
    const r = Array.isArray(rel) ? rel[0] : rel;
    if (!r || typeof r !== 'object') return undefined;
    const d = r as { slug?: string; title?: string; cover_image?: string };
    if (!d.slug || !d.title || !d.cover_image) return undefined;
    return { slug: d.slug, title: d.title, coverImage: d.cover_image };
  }

  const items: ActivityItem[] = [];

  for (const b of bookingsRes.data ?? []) {
    const actor = actors.get(b.user_id ?? '');
    if (!actor) continue;
    const deal = pickDeal(b.deal);
    if (!deal) continue;
    items.push({
      id: `b:${b.id}`,
      kind: 'booking',
      occurredAt: b.created_at,
      actor,
      deal,
    });
  }

  for (const r of reviewsRes.data ?? []) {
    const actor = actors.get(r.user_id ?? '');
    if (!actor) continue;
    const deal = pickDeal(r.deal);
    if (!deal) continue;
    items.push({
      id: `r:${r.id}`,
      kind: 'review',
      occurredAt: r.created_at,
      actor,
      deal,
      reviewSnippet:
        typeof r.body === 'string'
          ? r.body.length > 140
            ? r.body.slice(0, 137).trim() + '…'
            : r.body
          : undefined,
      reviewRating: typeof r.rating === 'number' ? r.rating : undefined,
    });
  }

  for (const f of favsRes.data ?? []) {
    const actor = actors.get(f.user_id ?? '');
    if (!actor) continue;
    const deal = pickDeal(f.deal);
    if (!deal) continue;
    items.push({
      id: `f:${f.id}`,
      kind: 'favorite',
      occurredAt: f.created_at,
      actor,
      deal,
    });
  }

  for (const ub of badgesRes.data ?? []) {
    const actor = actors.get(ub.user_id ?? '');
    if (!actor) continue;
    const badgeRel = ub.badge as
      | { slug?: string; name?: string; tier?: string; icon?: string | null }
      | { slug?: string; name?: string; tier?: string; icon?: string | null }[]
      | null;
    const b = Array.isArray(badgeRel) ? badgeRel[0] : badgeRel;
    if (!b?.slug || !b.name || !b.tier) continue;
    items.push({
      id: `bg:${ub.user_id}:${b.slug}`,
      kind: 'badge',
      occurredAt: ub.earned_at,
      actor,
      badge: { slug: b.slug, name: b.name, tier: b.tier, icon: b.icon ?? null },
    });
  }

  return items
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, limit);
}
