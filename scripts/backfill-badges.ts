/**
 * Tüm mevcut kullanıcılar için rozet değerlendirmesi.
 * Migration sonrası bir kerelik çalıştırılır; sonra evaluator (server-only
 * modül) her booking / review action'ından otomatik tetiklenir. Bu script
 * 'server-only' içe aktarımı bypass etmek için evaluator mantığını
 * yerinde tekrar yapar.
 *
 * `npm run seed:badges` ile çalışır.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Make sure .env.local is set.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface BadgeCriteria {
  id: string;
  slug: string;
  criteria_type: string;
  criteria_value: number;
  criteria_extra: string | null;
}

async function evaluateForUser(
  userId: string,
  badges: BadgeCriteria[],
  earnedIds: Set<string>,
): Promise<string[]> {
  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('deal_id, status, deal:deals ( district, deal_categories ( category:categories ( slug ) ) )')
    .eq('user_id', userId)
    .in('status', ['confirmed', 'used']);

  let totalBookings = 0;
  const byCategory = new Map<string, number>();
  const districts = new Set<string>();

  for (const row of bookingRows ?? []) {
    totalBookings++;
    const dealRel = row.deal as
      | { district: string | null; deal_categories: { category: { slug: string } | { slug: string }[] }[] }
      | { district: string | null; deal_categories: { category: { slug: string } | { slug: string }[] }[] }[]
      | null;
    const deal = Array.isArray(dealRel) ? dealRel[0] : dealRel;
    if (!deal) continue;
    if (deal.district) districts.add(deal.district);
    for (const dc of deal.deal_categories ?? []) {
      const catRel = dc.category as { slug: string } | { slug: string }[] | null;
      const cat = Array.isArray(catRel) ? catRel[0] : catRel;
      if (!cat) continue;
      byCategory.set(cat.slug, (byCategory.get(cat.slug) ?? 0) + 1);
    }
  }

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  const { count: favCount } = await supabase
    .from('favorites')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_weeks')
    .eq('id', userId)
    .maybeSingle();
  const streakWeeks =
    ((profile as { streak_weeks?: number } | null)?.streak_weeks ?? 0);

  const toGrant: { user_id: string; badge_id: string }[] = [];
  const granted: string[] = [];

  for (const b of badges) {
    if (earnedIds.has(b.id)) continue;
    let ok = false;
    switch (b.criteria_type) {
      case 'booking_count':
        ok = totalBookings >= b.criteria_value;
        break;
      case 'category_first':
        ok = Boolean(b.criteria_extra) && (byCategory.get(b.criteria_extra!) ?? 0) >= 1;
        break;
      case 'category_count':
        ok = Boolean(b.criteria_extra) && (byCategory.get(b.criteria_extra!) ?? 0) >= b.criteria_value;
        break;
      case 'district_count':
        ok = districts.size >= b.criteria_value;
        break;
      case 'review_count':
        ok = (reviewCount ?? 0) >= b.criteria_value;
        break;
      case 'favorite_count':
        ok = (favCount ?? 0) >= b.criteria_value;
        break;
      case 'streak_weeks':
        ok = streakWeeks >= b.criteria_value;
        break;
    }
    if (ok) {
      toGrant.push({ user_id: userId, badge_id: b.id });
      granted.push(b.slug);
    }
  }

  if (toGrant.length > 0) {
    await supabase.from('user_badges').insert(toGrant);
  }

  return granted;
}

async function main() {
  const [{ data: profiles }, { data: badges }] = await Promise.all([
    supabase.from('profiles').select('id, display_name'),
    supabase.from('badges').select('id, slug, criteria_type, criteria_value, criteria_extra'),
  ]);

  if (!profiles || profiles.length === 0) {
    console.log('Kullanıcı yok — atlanıyor.');
    return;
  }
  if (!badges || badges.length === 0) {
    console.log('Rozet kataloğu boş — atlanıyor.');
    return;
  }

  console.log(`${profiles.length} kullanıcı · ${badges.length} rozet için değerlendirme…\n`);

  for (const p of profiles) {
    const { data: earned } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', p.id);
    const earnedIds = new Set((earned ?? []).map((r) => r.badge_id));

    const granted = await evaluateForUser(p.id, badges as BadgeCriteria[], earnedIds);
    const name = p.display_name ?? p.id.slice(0, 8);
    if (granted.length > 0) {
      console.log(`  ▸ ${name}: ${granted.join(', ')}`);
    } else {
      console.log(`  · ${name}: (yeni rozet yok)`);
    }
  }

  console.log('\n✅ Tamam.');
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
