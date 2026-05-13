import 'server-only';
import { getServerClient } from '@/lib/db/server';

export interface NotificationItem {
  id: string;
  /** Sınıflandırma — UI ikon ve renk için. */
  type: 'expiring_favorite' | 'saved_search' | 'referral_claim' | 'booking_upcoming';
  title: string;
  body: string;
  href: string;
  /** ISO tarih — sıralama için. */
  createdAt: string;
}

/**
 * Header çan ikonu açıldığında gösterilecek bildirimleri agreggate eder.
 * Sadece okunma durumu olmayan, "şu an aksiyon" gerektiren satırlar:
 *  - Yarın olan rezervasyonlar
 *  - 3 gün içinde dolacak favori fırsatlar
 *  - Aktif kayıtlı aramalar (referans)
 *  - Yeni referral claim'leri (son 7 gün)
 *
 * Tek bir tabloya yazmıyoruz — V1 için on-the-fly compute. V2'de
 * notifications tablosu + read state.
 */
export async function listUnreadNotifications(): Promise<NotificationItem[]> {
  const supabase = await getServerClient();
  const out: NotificationItem[] = [];
  const now = Date.now();

  // 1) Upcoming bookings (yarın/önümüzdeki 3 gün, confirmed)
  const cutoffISO = new Date(now + 3 * 86400_000).toISOString().slice(0, 10);
  const todayISO = new Date(now).toISOString().slice(0, 10);
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      'id, booking_code, selected_date, selected_time, status, deal:deals ( title, slug )',
    )
    .eq('status', 'confirmed')
    .gte('selected_date', todayISO)
    .lte('selected_date', cutoffISO)
    .order('selected_date', { ascending: true })
    .limit(5);

  for (const b of bookings ?? []) {
    const deal = b.deal as { title?: string; slug?: string } | { title?: string; slug?: string }[] | null;
    const dealObj = Array.isArray(deal) ? deal[0] : deal;
    const when =
      b.selected_date === todayISO
        ? 'Bugün'
        : new Date(b.selected_date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' });
    out.push({
      id: `booking-${b.id}`,
      type: 'booking_upcoming',
      title: when + (b.selected_time ? ` · ${b.selected_time.slice(0, 5)}` : ''),
      body: dealObj?.title ?? 'Rezervasyonun yaklaşıyor',
      href: `/rezervasyonlarim/${b.booking_code}`,
      createdAt: b.selected_date,
    });
  }

  // 2) Favorite expiring soon (valid_until 3 gün içinde)
  const cutoffExpiryISO = new Date(now + 3 * 86400_000).toISOString();
  const nowIso = new Date(now).toISOString();
  const { data: favs } = await supabase
    .from('favorites')
    .select(
      'created_at, deal:deals ( id, slug, title, valid_until, is_active )',
    )
    .order('created_at', { ascending: false })
    .limit(20);

  for (const f of favs ?? []) {
    const d = f.deal as
      | { id?: string; slug?: string; title?: string; valid_until?: string | null; is_active?: boolean }
      | { id?: string; slug?: string; title?: string; valid_until?: string | null; is_active?: boolean }[]
      | null;
    const deal = Array.isArray(d) ? d[0] : d;
    if (!deal || !deal.valid_until || !deal.is_active) continue;
    const validISO = new Date(deal.valid_until).toISOString();
    if (validISO < nowIso || validISO > cutoffExpiryISO) continue;
    out.push({
      id: `fav-expiry-${deal.id}`,
      type: 'expiring_favorite',
      title: 'Favorin bitmek üzere',
      body: deal.title ?? 'Bir fırsat 3 gün içinde sona eriyor',
      href: `/f/${deal.slug}`,
      createdAt: f.created_at,
    });
  }

  // 3) Yeni referral claim'ler (kullanıcı kendi kodunun claim'lerini görsün)
  const { data: myRef } = await supabase
    .from('referrals')
    .select('code')
    .maybeSingle();
  if (myRef?.code) {
    const sevenDaysAgo = new Date(now - 7 * 86400_000).toISOString();
    const { data: claims } = await supabase
      .from('referral_claims')
      .select('id, claimed_at')
      .eq('code', myRef.code)
      .gte('claimed_at', sevenDaysAgo)
      .order('claimed_at', { ascending: false })
      .limit(5);
    for (const c of claims ?? []) {
      out.push({
        id: `ref-${c.id}`,
        type: 'referral_claim',
        title: 'Yeni davet kabul edildi 🎉',
        body: 'Bir arkadaşın davet kodunla kayıt oldu.',
        href: '/davet',
        createdAt: c.claimed_at,
      });
    }
  }

  // 4) Saved searches — varlık ipucu (V1'de eşleşme tetiği yok, sadece "kayıtlı arama var")
  const { data: saved } = await supabase
    .from('saved_searches')
    .select('id, query, created_at')
    .order('created_at', { ascending: false })
    .limit(2);
  for (const s of saved ?? []) {
    out.push({
      id: `saved-${s.id}`,
      type: 'saved_search',
      title: 'Kayıtlı arama hatırlatıcısı',
      body: `"${s.query.slice(0, 60)}" — eşleşen yeni fırsat var mı bakalım`,
      href: `/?q=${encodeURIComponent(s.query)}`,
      createdAt: s.created_at,
    });
  }

  // En yeniler üstte.
  out.sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
  return out.slice(0, 8);
}
