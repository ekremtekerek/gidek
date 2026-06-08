/**
 * Affiliate senkronu — firsatbufirsat.com yayıncı API'sinden fırsatları çekip
 * Supabase `deals`/`merchants` tablolarına upsert eder. Idempotent: (source,
 * external_id) anahtarıyla çakışmada günceller.
 *
 * Çalıştırma:
 *   npm run sync:affiliate                      # tam senkron (browse + events, embedding'li)
 *   npm run sync:affiliate -- --pages=2         # her segmentten en fazla 2 sayfa (duman testi)
 *   npm run sync:affiliate -- --browse-only     # sadece browse
 *   npm run sync:affiliate -- --events-only     # sadece etkinlikler
 *   npm run sync:affiliate -- --no-embed        # embedding hesaplama (sonra `npm run ai:backfill`)
 *   npm run sync:affiliate -- --no-rewrite      # açıklamaları AI ile özgünleştirme (ham metni yaz)
 *   npm run sync:affiliate -- --purge-local     # mock (source='local') deal'ları sil → tam pivot
 *
 * service_role anahtarı kullanır → RLS bypass.
 */
import { createClient } from '@supabase/supabase-js';
import {
  browseAll,
  browseAllByKeywordSweep,
  eventsAll,
  type EventDeal,
} from '../src/lib/affiliate/firsatbufirsat';
import { mapBrowseDeal, mapEventDeal, type MappedDeal } from '../src/lib/affiliate/mapping';
import { geocodeAddress, hasGeocoder } from '../src/lib/affiliate/geocode';
import { dealEmbeddingText, embed, toPgVector } from '../src/lib/ai/embeddings';
import { rewriteDealDescription } from '../src/lib/ai/rewrite-deal-description';
import { MAIN_CATEGORIES } from '../src/lib/utils/constants';
import { CITY_CENTROIDS, type LatLng } from '../src/lib/utils/geo';
import type { Database } from '../src/types/supabase';

const SOURCE = 'firsatbufirsat';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Make sure .env.local is set.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ----------------------------------------------------------------------------
// CLI bayrakları
// ----------------------------------------------------------------------------
const argv = process.argv.slice(2);
const hasFlag = (f: string) => argv.includes(f);
const pagesArg = argv.find((a) => a.startsWith('--pages='));
const maxPages = pagesArg ? parseInt(pagesArg.split('=')[1], 10) : Infinity;
const browseOnly = hasFlag('--browse-only');
const eventsOnly = hasFlag('--events-only');
const noEmbed = hasFlag('--no-embed');
const noGeocode = hasFlag('--no-geocode');
const noRewrite = hasFlag('--no-rewrite');
const purgeLocal = hasFlag('--purge-local');

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------------------
// Kategoriler — 13 ana kategori yoksa oluştur (seed ile aynı içerik).
// ----------------------------------------------------------------------------
async function ensureCategories(): Promise<Map<string, string>> {
  const rows = MAIN_CATEGORIES.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    sort_order: i,
    is_active: true,
    description: `${c.name} kategorisindeki fırsatları keşfet.`,
    meta_title: `${c.name} fırsatları · gidek`,
    meta_description: `gidek üzerinden ${c.name.toLowerCase()} fırsatlarını AI ile keşfet.`,
  }));
  const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  const { data, error: selErr } = await supabase.from('categories').select('id, slug');
  if (selErr) throw selErr;
  return new Map((data ?? []).map((c) => [c.slug, c.id]));
}

// ----------------------------------------------------------------------------
// Toplama — API'den MappedDeal listesi üret.
// ----------------------------------------------------------------------------
async function collectDeals(): Promise<MappedDeal[]> {
  const deals: MappedDeal[] = [];

  if (!eventsOnly) {
    let n = 0;
    const onDeal = (d: Parameters<typeof mapBrowseDeal>[0]) => {
      const m = mapBrowseDeal(d);
      if (m) deals.push(m);
      n += 1;
      if (n % 200 === 0) console.log(`  browse: ${n} işlendi…`);
    };

    if (maxPages === Infinity) {
      // Tam senkron: keyword sweep (full-text → ~%97 katalog kapsama) + global
      // feed (ilk 200, hızlı tamamlayıcı). API'nin global browse'u 200'de,
      // il (cityId) filtresi de eksik subset (~633) döndürdüğü için tek
      // güvenilir tam-katalog yolu keyword araması. Dedup external_id ile.
      for await (const d of browseAllByKeywordSweep()) onDeal(d);
      console.log(`  browse (keyword sweep): ${n} satır`);
      for await (const d of browseAll({ maxPages: 20 })) onDeal(d);
    } else {
      // Kısmi/duman testi: hızlı global feed.
      for await (const d of browseAll({ maxPages })) onDeal(d);
    }
    console.log(`  browse: ${n} satır alındı (dedup öncesi)`);
  }

  if (!browseOnly) {
    const byDeal = new Map<string, EventDeal[]>();
    let sessions = 0;
    for await (const e of eventsAll({ maxPages })) {
      const arr = byDeal.get(e.dealId) ?? [];
      arr.push(e);
      byDeal.set(e.dealId, arr);
      sessions += 1;
    }
    let eventCount = 0;
    for (const group of byDeal.values()) {
      const m = mapEventDeal(group);
      if (m) {
        deals.push(m);
        eventCount += 1;
      }
    }
    console.log(`  events: ${sessions} seans → ${eventCount} etkinlik`);
  }

  // Aynı fırsat hem browse hem event endpoint'inde olabilir (ortak id uzayı).
  // external_id'ye göre dedup — browse önce eklendiği için browse sürümü korunur
  // (daha zengin: gerçek subDeal checkout linkleri, görseller, lat/lng).
  const byExt = new Map<string, MappedDeal>();
  for (const d of deals) {
    if (!byExt.has(d.external_id)) byExt.set(d.external_id, d);
  }
  if (byExt.size !== deals.length) {
    console.log(`  dedup: ${deals.length - byExt.size} çift kayıt birleştirildi`);
  }
  return [...byExt.values()];
}

type MerchantData = MappedDeal['merchant'];

/** Geocode için adres sorgusu — şehir yoksa ekle ("nokta atışı" için). */
function geoQuery(m: MerchantData): string {
  const addr = m.address?.trim();
  if (addr) {
    return m.city && !addr.includes(m.city) ? `${addr}, ${m.city}` : addr;
  }
  return [m.name, m.district, m.city].filter(Boolean).join(', ');
}

/**
 * Koordinatı olmayan merchant'ların adresini Mapbox ile geocode eder
 * (latLngs vermeyen browse + tüm etkinlikler). Başarısız → şehir centroid'i.
 * Aynı adres tekrar tekrar geocode edilmesin diye cache'li.
 */
async function geocodeMerchants(merchants: MerchantData[]): Promise<Map<string, LatLng>> {
  const coords = new Map<string, LatLng>();
  for (const m of merchants) {
    if (m.lat != null && m.lng != null) coords.set(m.external_id, { lat: m.lat, lng: m.lng });
  }
  const need = merchants.filter((m) => m.lat == null);

  const centroidFallback = (m: MerchantData): LatLng | null =>
    m.city && CITY_CENTROIDS[m.city] ? CITY_CENTROIDS[m.city] : null;

  if (noGeocode || !hasGeocoder()) {
    if (!noGeocode) console.log('  geocode: atlandı (NEXT_PUBLIC_MAPBOX_TOKEN yok)');
    for (const m of need) {
      const fb = centroidFallback(m);
      if (fb) coords.set(m.external_id, fb);
    }
    return coords;
  }

  const cache = new Map<string, LatLng | null>();
  let next = 0;
  let exact = 0;
  let done = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= need.length) return;
      const m = need[i];
      const q = geoQuery(m);
      let hit = cache.get(q);
      if (hit === undefined) {
        hit = await geocodeAddress(q);
        cache.set(q, hit);
        await sleep(70);
      }
      const resolved = hit ?? centroidFallback(m);
      if (resolved) coords.set(m.external_id, resolved);
      if (hit) exact++;
      if (++done % 100 === 0) console.log(`  geocode: ${done}/${need.length}…`);
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`  geocode: ${need.length} adres → ${exact} kesin konum (kalan centroid)`);
  return coords;
}

// ----------------------------------------------------------------------------
// Merchant upsert (+geocode) → external_id haritaları
// ----------------------------------------------------------------------------
async function upsertMerchants(
  deals: MappedDeal[],
): Promise<{ idMap: Map<string, string>; coordsMap: Map<string, LatLng> }> {
  const byExt = new Map<string, MerchantData>();
  for (const d of deals) byExt.set(d.merchant.external_id, d.merchant);
  const merchants = [...byExt.values()];

  const coordsMap = await geocodeMerchants(merchants);

  const rows = merchants.map((m) => {
    const c = coordsMap.get(m.external_id);
    return {
      source: SOURCE,
      external_id: m.external_id,
      slug: m.slug,
      name: m.name,
      city: m.city,
      district: m.district,
      address: m.address,
      lat: c?.lat ?? m.lat,
      lng: c?.lng ?? m.lng,
      is_active: true,
      is_verified: true,
    };
  });

  const idMap = new Map<string, string>();
  for (const part of chunk(rows, 500)) {
    const { data, error } = await supabase
      .from('merchants')
      .upsert(part, { onConflict: 'source,external_id' })
      .select('id, external_id');
    if (error) throw error;
    for (const r of data ?? []) if (r.external_id) idMap.set(r.external_id, r.id);
  }
  console.log(`  merchants: ${rows.length} upsert`);
  return { idMap, coordsMap };
}

// ----------------------------------------------------------------------------
// Embedding — N=5 paralel. Anahtar yoksa/--no-embed ile null geçer.
// ----------------------------------------------------------------------------
async function embedAll(deals: MappedDeal[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (noEmbed || !process.env.GEMINI_API_KEY) {
    console.log(
      '  embeddings: atlandı (--no-embed veya GEMINI_API_KEY yok → `npm run ai:backfill`)',
    );
    for (const d of deals) out.set(d.external_id, null);
    return out;
  }

  const CONCURRENCY = 5;
  let next = 0;
  let ok = 0;
  let fail = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= deals.length) return;
      const d = deals[i];
      try {
        const vec = await embed(
          dealEmbeddingText({
            title: d.title,
            subtitle: d.subtitle,
            description: d.description,
            // external_tags da metne katılır → semantik zenginlik.
            tags: [...d.tags, ...d.external_tags],
            audience: d.audience,
            city: d.city,
            district: d.district,
            venue_name: d.venue_name,
          }),
        );
        out.set(d.external_id, toPgVector(vec));
        ok++;
      } catch (err) {
        fail++;
        out.set(d.external_id, null);
        if (fail <= 5) {
          console.error(
            `  embed fail [${d.slug}]: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      if ((ok + fail) % 200 === 0) console.log(`  embeddings: ${ok + fail}/${deals.length}…`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`  embeddings: ok=${ok} fail=${fail}`);
  return out;
}

// ----------------------------------------------------------------------------
// Açıklama yeniden yazımı (SEO — duplike içerik riskini azaltır)
// ----------------------------------------------------------------------------
type DescInfo = { description: string; ai: boolean };

/**
 * Ham (tedarikçiden birebir) açıklamaları AI ile özgünleştirir. Idempotent:
 * DB'de description_ai=true olan deal'ların açıklaması KORUNUR — her senkronda
 * tekrar AI çağrısı yapılmaz ve ham metinle ezilmez. Yalnızca henüz
 * özgünleştirilmemiş (yeni veya başarısız) açıklamalar yeniden yazılır.
 * --no-rewrite veya GEMINI_API_KEY yoksa: mevcut özgün metinler korunur, yeniler
 * ham bırakılır (bayrak false → sonraki çalıştırmada yeniden denenir).
 */
async function rewriteDescriptions(deals: MappedDeal[]): Promise<Map<string, DescInfo>> {
  const out = new Map<string, DescInfo>();

  const { data, error } = await supabase
    .from('deals')
    .select('external_id, description, description_ai')
    .eq('source', SOURCE);
  if (error) throw error;
  const existing = new Map<string, DescInfo>();
  for (const r of data ?? []) {
    if (r.external_id)
      existing.set(r.external_id, { description: r.description, ai: r.description_ai });
  }

  // Zaten özgünleştirilmiş olanları her durumda koru (ham metinle ezme).
  for (const d of deals) {
    const ex = existing.get(d.external_id);
    if (ex?.ai) out.set(d.external_id, { description: ex.description, ai: true });
  }

  if (noRewrite || !process.env.GEMINI_API_KEY) {
    console.log(`  rewrite: atlandı (${noRewrite ? '--no-rewrite' : 'GEMINI_API_KEY yok'})`);
    for (const d of deals) {
      if (!out.has(d.external_id))
        out.set(d.external_id, { description: d.description, ai: false });
    }
    return out;
  }

  const todo = deals.filter((d) => !existing.get(d.external_id)?.ai);
  console.log(
    `  rewrite: ${todo.length} açıklama yeniden yazılacak (${deals.length - todo.length} zaten özgün)`,
  );

  const catName = (slug: string) => MAIN_CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
  const CONCURRENCY = 5;
  let next = 0;
  let ok = 0;
  let kept = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= todo.length) return;
      const d = todo[i];
      try {
        const rewritten = await rewriteDealDescription({
          title: d.title,
          description: d.description,
          category: catName(d.categorySlug),
          city: d.city,
          district: d.district,
          highlights: d.highlights,
        });
        // Metin gerçekten değiştiyse "ai" işaretle; aksi halde ham say (retry).
        const changed = rewritten.trim().length >= 40 && rewritten.trim() !== d.description.trim();
        out.set(d.external_id, { description: changed ? rewritten : d.description, ai: changed });
        if (changed) ok++;
        else kept++;
      } catch (err) {
        kept++;
        out.set(d.external_id, { description: d.description, ai: false });
        if (kept <= 5) {
          console.error(
            `  rewrite fail [${d.slug}]: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      if ((ok + kept) % 100 === 0) console.log(`  rewrite: ${ok + kept}/${todo.length}…`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`  rewrite: ok=${ok} (özgünleştirildi), atlanan/ham=${kept}`);
  return out;
}

// ----------------------------------------------------------------------------
// Deal upsert + kategori junction
// ----------------------------------------------------------------------------
async function upsertDeals(
  deals: MappedDeal[],
  merchantIds: Map<string, string>,
  catIds: Map<string, string>,
  embeddings: Map<string, string | null>,
  descriptions: Map<string, DescInfo>,
  coordsMap: Map<string, LatLng>,
): Promise<string[]> {
  const nowIso = new Date().toISOString();
  const rows = deals
    .map((d) => {
      const merchantId = merchantIds.get(d.merchant.external_id);
      if (!merchantId) return null;
      // Deal koordinatı = merchant'ın çözülmüş (geocode'lu) konumu.
      const c = coordsMap.get(d.merchant.external_id);
      const desc = descriptions.get(d.external_id);
      return {
        source: SOURCE,
        external_id: d.external_id,
        slug: d.slug,
        merchant_id: merchantId,
        title: d.title,
        subtitle: d.subtitle,
        description: desc?.description ?? d.description,
        description_ai: desc?.ai ?? false,
        highlights: d.highlights,
        terms: d.terms,
        cover_image: d.cover_image,
        images: d.images,
        original_price: d.original_price,
        discounted_price: d.discounted_price,
        city: d.city,
        district: d.district,
        venue_name: d.venue_name,
        lat: c?.lat ?? d.lat,
        lng: c?.lng ?? d.lng,
        valid_from: d.valid_from,
        valid_until: d.valid_until,
        available_times: d.available_times as never,
        tags: d.tags,
        external_tags: d.external_tags,
        audience: d.audience,
        external_url: d.external_url,
        affiliate_options: d.affiliate_options as never,
        is_active: true,
        published_at: nowIso,
        embedding: embeddings.get(d.external_id) ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // external_id → deal uuid + categorySlug eşleştirme.
  // Chunk küçük (100): her satır ~1536-dim embedding taşıyor → büyük payload +
  // ağır vector-index yazımı. 500'lük chunk statement_timeout'a takılıyordu (57014).
  const seenExternalIds: string[] = [];
  const dealUuidByExt = new Map<string, string>();
  for (const part of chunk(rows, 100)) {
    const { data, error } = await supabase
      .from('deals')
      .upsert(part, { onConflict: 'source,external_id' })
      .select('id, external_id');
    if (error) throw error;
    for (const r of data ?? []) {
      if (r.external_id) {
        dealUuidByExt.set(r.external_id, r.id);
        seenExternalIds.push(r.external_id);
      }
    }
  }
  console.log(`  deals: ${rows.length} upsert`);

  // Kategori junction'ları — RECONCILE: önce bu senkronda görülen deal'ların
  // mevcut junction'larını sil, sonra yeniden ekle. Insert-only upsert eski
  // (yanlış) kategori bağını bırakırdı; kategori mapping'i değişince deal iki
  // kategoride kalırdı. Delete+insert ile kategori daima güncel/tekil olur.
  const syncedDealIds = [...dealUuidByExt.values()];
  for (const part of chunk(syncedDealIds, 200)) {
    const { error } = await supabase.from('deal_categories').delete().in('deal_id', part);
    if (error) throw error;
  }

  const junctions = deals
    .map((d) => {
      const dealId = dealUuidByExt.get(d.external_id);
      const catId = catIds.get(d.categorySlug);
      if (!dealId || !catId) return null;
      return { deal_id: dealId, category_id: catId };
    })
    .filter((j): j is NonNullable<typeof j> => j !== null);

  for (const part of chunk(junctions, 1000)) {
    const { error } = await supabase
      .from('deal_categories')
      .upsert(part, { onConflict: 'deal_id,category_id' });
    if (error) throw error;
  }
  console.log(`  junctions: ${junctions.length} (reconcile: ${syncedDealIds.length} deal temizlendi)`);

  return seenExternalIds;
}

// ----------------------------------------------------------------------------
// Stale deaktivasyon — yalnızca tam senkronda (her iki segment, sayfa limiti yok).
// ----------------------------------------------------------------------------
async function deactivateStale(seenExternalIds: string[]) {
  const fullRun = !browseOnly && !eventsOnly && maxPages === Infinity;
  if (!fullRun) {
    console.log('  stale: atlandı (kısmi senkron)');
    return;
  }
  if (seenExternalIds.length === 0) return;
  // Görülmeyen firsatbufirsat deal'larını pasifleştir.
  const { data: existing, error } = await supabase
    .from('deals')
    .select('id, external_id')
    .eq('source', SOURCE)
    .eq('is_active', true);
  if (error) throw error;
  const seen = new Set(seenExternalIds);
  const staleIds = (existing ?? [])
    .filter((r) => r.external_id && !seen.has(r.external_id))
    .map((r) => r.id);
  if (staleIds.length === 0) {
    console.log('  stale: 0');
    return;
  }
  for (const part of chunk(staleIds, 500)) {
    const { error: upErr } = await supabase
      .from('deals')
      .update({ is_active: false })
      .in('id', part);
    if (upErr) throw upErr;
  }
  console.log(`  stale: ${staleIds.length} pasifleştirildi`);
}

async function purgeLocalDeals() {
  if (!purgeLocal) return;
  // Junction'lar ON DELETE CASCADE; favoriler/booking FK kısıtlı olabilir →
  // önce ilişkili kayıtları temizlemeden silmek hata verebilir. V1 mock veride
  // bu kayıtlar genelde yok; hata olursa kullanıcı db:reset ile temiz başlar.
  const { error, count } = await supabase
    .from('deals')
    .delete({ count: 'exact' })
    .eq('source', 'local');
  if (error) {
    console.error('  purge-local hatası (ilişkili kayıtlar olabilir):', error.message);
    return;
  }
  console.log(`  purge-local: ${count ?? 0} mock deal silindi`);
}

async function main() {
  const t0 = Date.now();
  console.log('▶ affiliate sync başlıyor', {
    maxPages: maxPages === Infinity ? 'all' : maxPages,
    browseOnly,
    eventsOnly,
    noEmbed,
    noRewrite,
    purgeLocal,
  });

  const catIds = await ensureCategories();
  const deals = await collectDeals();
  console.log(`= toplam ${deals.length} deal eşlendi`);
  if (deals.length === 0) {
    console.log('Hiç deal yok — çıkılıyor.');
    return;
  }

  const { idMap: merchantIds, coordsMap } = await upsertMerchants(deals);
  const embeddings = await embedAll(deals);
  const descriptions = await rewriteDescriptions(deals);
  const seen = await upsertDeals(deals, merchantIds, catIds, embeddings, descriptions, coordsMap);
  await deactivateStale(seen);
  await purgeLocalDeals();

  console.log(`✓ tamamlandı — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error('SYNC FAILED:', e);
  process.exit(1);
});
