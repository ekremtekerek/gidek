// firsatbufirsat.com yayıncı (publisher) API istemcisi.
//
// NOT: `server-only` import'u yok — bu modül yalnızca standalone sync script'i
// (scripts/sync-affiliate.ts) tarafından tsx ile çalıştırılır; gizli anahtarlar
// asla NEXT_PUBLIC_ değildir, client bundle'a girmez.
//
// İki uç nokta, ortak auth: ?apiKey=...&publisherId=...
//   - /deal/browse.html      → 10 deal/sayfa, zengin alanlar (subDeals, görseller, lat/lng)
//   - /deal/event-deals.html → 50 satır/sayfa, etkinlik seansları (tiyatro/konser/stand-up)
// Sayfalama paramı `p` (1'den başlar). `total` string döner.
import { z } from 'zod';

const BASE_URL = 'https://api.firsatbufirsat.com';

function getCredentials(): { apiKey: string; publisherId: string } {
  const apiKey = process.env.FBF_API_KEY ?? '0T82GBLH5DK0RKZS';
  const publisherId = process.env.FBF_PUBLISHER_ID ?? '1653';
  return { apiKey, publisherId };
}

export function getPublisherId(): string {
  return getCredentials().publisherId;
}

// ----------------------------------------------------------------------------
// zod şemaları — tek doğruluk kaynağı (CLAUDE.md). API alanları gevşek tutulur:
// sayısal değerler string gelebilir, opsiyonel alanlar null/boolean/eksik olabilir
// (ör. couponEndDate bazen `false`, howToUse bazen `null`). optStr bunları
// güvenle string|null'a indirger.
// ----------------------------------------------------------------------------
const optStr = z
  .any()
  .transform((v) => (typeof v === 'string' ? v : null))
  .nullable();

/** optStr ama null yerine boş string döndürür (zorunlu alan benzeri). */
const optStrD = z
  .any()
  .transform((v) => (typeof v === 'string' ? v : ''));

export const BrowseSubDealSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: optStrD,
  realPriceWithSymbol: optStrD,
  dealPriceWithSymbol: optStrD,
  checkoutLink: optStrD,
});
export type BrowseSubDeal = z.infer<typeof BrowseSubDealSchema>;

export const BrowseBusinessSchema = z.object({
  id: optStr,
  title: optStr,
  address: optStr,
});

export const BrowseDealSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    title: optStrD,
    description: optStrD,
    detail: optStrD,
    howToUse: optStrD,
    discountPercent: optStr,
    couponEndDate: optStr,
    country: optStr,
    businessIds: optStr,
    latLngs: optStr,
    businessData: z.array(BrowseBusinessSchema).default([]),
    city: optStr,
    town: optStr,
    realPriceWithSymbol: optStrD,
    dealPriceWithSymbol: optStrD,
    showDealUrl: optStr,
    buyDealUrl: optStr,
    image200_H: optStr,
    image450_H: optStr,
    image1200x1200: optStr,
    descriptionHtml: optStr,
    tags: optStr,
    subDeals: z.array(BrowseSubDealSchema).default([]),
    dealImages: z.array(z.string()).default([]),
  })
  .passthrough();
export type BrowseDeal = z.infer<typeof BrowseDealSchema>;

export const BrowseResponseSchema = z.object({
  result: z.string(),
  resultMessage: z.string().default(''),
  deals: z.array(BrowseDealSchema).default([]),
  total: z.union([z.string(), z.number()]).default(0),
});

export const EventDealSchema = z
  .object({
    dealId: z.union([z.string(), z.number()]).transform(String),
    subDealId: z.union([z.string(), z.number()]).transform(String),
    image400x400: optStr,
    image1200x1200: optStr,
    eventTitle: optStrD,
    eventDate: optStr,
    realPrice: optStr,
    dealPrice: optStr,
    businessId: optStr,
    businessTitle: optStr,
    businessAddress: optStr,
    businessTown: optStr,
    businessCity: optStr,
    dealUrl: optStr,
    permalink: optStr,
    created: optStr,
  })
  .passthrough();
export type EventDeal = z.infer<typeof EventDealSchema>;

export const EventResponseSchema = z.object({
  result: z.string(),
  resultMessage: z.string().default(''),
  page: z.union([z.string(), z.number()]).nullish(),
  itemInPage: z.union([z.string(), z.number()]).nullish(),
  total: z.union([z.string(), z.number()]).default(0),
  events: z.array(EventDealSchema).default([]),
});

// ----------------------------------------------------------------------------
// Düşük seviye fetch
// ----------------------------------------------------------------------------
function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const { apiKey, publisherId } = getCredentials();
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('publisherId', publisherId);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`firsatbufirsat API ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json();
}

export interface BrowseFilters {
  /** İl plaka kodu (ör. İstanbul = 34). */
  cityId?: number;
  /** Serbest metin arama. */
  keyword?: string;
}

export async function fetchBrowsePage(page: number, filters: BrowseFilters = {}) {
  const url = buildUrl('/deal/browse.html', {
    p: page,
    cityId: filters.cityId,
    keyword: filters.keyword,
  });
  const json = await fetchJson(url);
  return BrowseResponseSchema.parse(json);
}

export async function fetchEventPage(page: number) {
  const url = buildUrl('/deal/event-deals.html', { p: page });
  const json = await fetchJson(url);
  return EventResponseSchema.parse(json);
}

const PAGE_DELAY_MS = 250;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function toInt(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? '0'), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Tüm browse deal'larını sayfa sayfa döndürür. `total`'a ulaşınca veya boş
 * sayfa gelince durur. `maxPages` ile sınırlanabilir (duman testi için).
 */
export async function* browseAll(opts: { maxPages?: number; filters?: BrowseFilters } = {}) {
  const { maxPages = Infinity, filters = {} } = opts;
  let page = 1;
  let seen = 0;
  let total = Infinity;
  while (page <= maxPages && seen < total) {
    const res = await fetchBrowsePage(page, filters);
    if (page === 1) total = toInt(res.total) || res.deals.length;
    if (res.deals.length === 0) break;
    for (const deal of res.deals) {
      seen += 1;
      yield deal;
    }
    page += 1;
    await sleep(PAGE_DELAY_MS);
  }
}

/**
 * Filtresiz browse `p` pagination'ı ~200 benzersiz deal'de tıkanıp tekrar
 * etmeye başlıyor (API limiti). Tam kataloğa ulaşmak için il bazlı tarama:
 * `cityId` (plaka kodu) filtresiyle her il kendi tam setini EKSİKSİZ ve
 * TEKRARSIZ döndürüyor (ör. cityId=34 → total=72, 72 benzersiz). Plaka 1..81
 * taranır; sync zaten external_id'ye göre dedup ettiğinden iller arası/global
 * çakışmalar sorun değil.
 */
export async function* browseAllByCity(opts: { maxPagesPerCity?: number } = {}) {
  const { maxPagesPerCity = Infinity } = opts;
  for (let cityId = 1; cityId <= 81; cityId++) {
    let page = 1;
    let seen = 0;
    let total = Infinity;
    while (page <= maxPagesPerCity && seen < total) {
      const res = await fetchBrowsePage(page, { cityId });
      if (page === 1) {
        total = toInt(res.total);
        if (total === 0 || res.deals.length === 0) break;
      }
      if (res.deals.length === 0) break;
      for (const deal of res.deals) {
        seen += 1;
        yield deal;
      }
      page += 1;
      await sleep(PAGE_DELAY_MS);
    }
  }
}

/**
 * Keyword sweep için tohum sözlük — 13 ana kategori + yaygın tag/eş anlamlılar.
 * keyword araması (browse) tüm katalogda (1581) çalışır ve 200 cap'ine takılmaz
 * gibi davranır (keyword başına ~200, ama çok sayıda spesifik kelime union'lanır).
 * browseAllByKeywordSweep bunları gezer, sonra bulunan deal'ların tag'leriyle
 * frontier'ı genişletir → ~%97 kapsama (global 200 / il filtresi 633 yerine).
 */
const KEYWORD_SEED = [
  'masaj','spa','hamam','kese','sauna','güzellik','cilt','manikür','kuaför','lazer','epilasyon','makyaj','protez','dolgu',
  'kahvaltı','brunch','serpme','yemek','restoran','menü','pizza','burger','kafe','steak','sushi','meyhane','döner','balık','kebap','tatlı','pasta','nargile','kahve',
  'tur','gezi','tekne','rehberli','günübirlik','konaklama','otel','resort','tatil','bungalov','villa','pansiyon','suit','termal',
  'konser','müzik','festival','tiyatro','sahne','stand up','stand-up','komedi','gösteri','bilet','etkinlik',
  'kurs','eğitim','atölye','workshop','sertifika',
  'aktivite','macera','paintball','go kart','park','müze','akvaryum','lunapark','jet ski','dalış','atv','yamaç',
  'çocuk','aile','romantik','çift','sevgili','gece','bira','pub','kokteyl','içecek',
  'fotoğraf','diş','sağlık','check up','psikolog','dövme','saç',
];

const KW_PAGE_DELAY_MS = 150;
/** keyword araması keyword başına ~200 (20×10) döndürür; ötesi tekrar. */
const KW_MAX_PAGES = 20;

/**
 * Katalog kapsamını maksimize eden keyword sweep'i. Global browse 200'de,
 * il filtresi de eksik subset (~633) döndürdüğü için tek güvenilir tam-katalog
 * yolu: keyword full-text araması. Önce tohum sözlük gezilir; sonra toplanan
 * deal'ların en sık tag'leriyle `expansionRounds` tur frontier genişletilir.
 * Her deal yalnızca bir kez yield edilir (id bazlı dedup içeride).
 */
export async function* browseAllByKeywordSweep(
  opts: { expansionRounds?: number; frontierSize?: number; maxPagesPerKeyword?: number } = {},
) {
  const { expansionRounds = 2, frontierSize = 120, maxPagesPerKeyword = KW_MAX_PAGES } = opts;
  const seen = new Set<string>();
  const tried = new Set<string>();
  const tagFreq = new Map<string, number>();

  async function* sweepKeyword(keyword: string): AsyncGenerator<BrowseDeal> {
    const key = keyword.trim().toLowerCase();
    if (!key || tried.has(key)) return;
    tried.add(key);
    let page = 1;
    while (page <= maxPagesPerKeyword) {
      const res = await fetchBrowsePage(page, { keyword });
      if (res.deals.length === 0) break;
      let fresh = 0;
      for (const deal of res.deals) {
        if (seen.has(deal.id)) continue;
        seen.add(deal.id);
        fresh += 1;
        for (const t of (deal.tags ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
          if (!tried.has(t)) tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1);
        }
        yield deal;
      }
      if (fresh === 0) break; // bu keyword tekrar etmeye başladı
      page += 1;
      await sleep(KW_PAGE_DELAY_MS);
    }
  }

  for (const kw of KEYWORD_SEED) yield* sweepKeyword(kw);

  for (let round = 0; round < expansionRounds; round++) {
    const frontier = [...tagFreq.entries()]
      .filter(([t]) => !tried.has(t))
      .sort((a, b) => b[1] - a[1])
      .slice(0, frontierSize)
      .map(([t]) => t);
    if (frontier.length === 0) break;
    for (const kw of frontier) yield* sweepKeyword(kw);
  }
}

/**
 * Tüm etkinlik seanslarını sayfa sayfa döndürür (50/sayfa).
 */
export async function* eventsAll(opts: { maxPages?: number } = {}) {
  const { maxPages = Infinity } = opts;
  let page = 1;
  let seen = 0;
  let total = Infinity;
  while (page <= maxPages && seen < total) {
    const res = await fetchEventPage(page);
    if (page === 1) total = toInt(res.total) || res.events.length;
    if (res.events.length === 0) break;
    for (const ev of res.events) {
      seen += 1;
      yield ev;
    }
    page += 1;
    await sleep(PAGE_DELAY_MS);
  }
}

export { toInt as parseTotal };
