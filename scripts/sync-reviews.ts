/**
 * Affiliate yorum senkronu — firsatbufirsat publisher API yorum vermediği için
 * her affiliate deal'ın firsatbufirsat sayfasındaki schema.org microdata'sından
 * (yazar/puan/metin/tarih) yorumları scrape edip `public.reviews` tablosuna
 * yazar. user_id NULL (dış yorum). reviews trigger'ı deals.rating_avg/count'u
 * otomatik günceller → kartlarda ve detayda yıldız + yorum sayısı görünür.
 *
 * Çalıştırma:
 *   npm run sync:reviews                 # tüm affiliate deal'lar
 *   npm run sync:reviews -- --limit=50   # ilk 50 (test)
 *
 * Idempotent: her deal için önce o deal'ın user_id IS NULL (dış) yorumlarını
 * siler, sonra taze parse edilenleri yazar.
 */
import { createClient } from '@supabase/supabase-js';
import { parseDealReviews } from '../src/lib/affiliate/mapping';
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

const argv = process.argv.slice(2);
const limitArg = argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const CONCURRENCY = 6;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchReviews(url: string): Promise<ReturnType<typeof parseDealReviews>> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 gidek-affiliate-sync' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return parseDealReviews(html);
}

async function main() {
  const t0 = Date.now();
  // PostgREST tek select'te en fazla 1000 satır döndürür → sayfalayarak TÜM
  // affiliate deal'ları çek (aksi halde 1000+'ı işlenmeden kalır).
  type DealRow = { id: string; slug: string; external_url: string | null };
  const deals: DealRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('deals')
      .select('id, slug, external_url')
      .eq('source', 'firsatbufirsat')
      .not('external_url', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    deals.push(...((data ?? []) as DealRow[]));
    if (!data || data.length < PAGE) break;
  }

  const list = deals.filter((d) => d.external_url).slice(0, limit === Infinity ? undefined : limit);
  console.log(`▶ ${list.length} deal için yorum senkronu`);

  let next = 0;
  let dealsWithReviews = 0;
  let totalReviews = 0;
  let failed = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= list.length) return;
      const d = list[i];
      try {
        const reviews = await fetchReviews(d.external_url!);
        // Eski dış yorumları temizle (idempotent).
        await supabase.from('reviews').delete().eq('deal_id', d.id).is('user_id', null);
        if (reviews.length > 0) {
          const rows = reviews.map((r) => ({
            deal_id: d.id,
            user_id: null,
            display_name: r.display_name,
            rating: r.rating,
            body: r.body,
            is_active: true,
            ...(r.created_at ? { created_at: r.created_at } : {}),
          }));
          const { error: insErr } = await supabase.from('reviews').insert(rows);
          if (insErr) throw insErr;
          dealsWithReviews++;
          totalReviews += rows.length;
        }
      } catch (err) {
        failed++;
        if (failed <= 5) {
          console.error(`  fail [${d.slug}]: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      const done = i + 1;
      if (done % 100 === 0) console.log(`  ${done}/${list.length} işlendi (yorum: ${totalReviews})…`);
      await sleep(120);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(
    `✓ tamamlandı — ${dealsWithReviews} deal yorumlandı, ${totalReviews} yorum, ${failed} hata, ${((Date.now() - t0) / 1000).toFixed(1)}s`,
  );
}

main().catch((e) => {
  console.error('SYNC REVIEWS FAILED:', e);
  process.exit(1);
});
