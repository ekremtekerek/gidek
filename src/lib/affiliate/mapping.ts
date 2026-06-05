// firsatbufirsat API yanıtlarını bizim deals/merchants şemamıza eşleyen saf
// fonksiyonlar. Hiçbir I/O yok — test edilebilir, SOLID. Sync script (scripts/
// sync-affiliate.ts) bu çıktıları Supabase'e upsert eder.
//
// Mevcut CHECK constraint'lerine uyum:
//   - tags: yalnızca DEAL_TAGS enum'una eşleşenler yazılır; ham tag'ler external_tags'e.
//   - audience: yalnızca AUDIENCE enum slug'ları.
//   - price_check: original = max(real, deal) ile discounted <= original garanti.
//   - valid_range_check: valid_until daima valid_from'dan büyük (guard'lı).
import { slugify } from '@/lib/utils/format';
import type { LatLng } from '@/lib/utils/geo';
import { DEAL_TAGS, MAIN_CATEGORIES, type CategorySlug } from '@/lib/utils/constants';
import { getPublisherId } from './firsatbufirsat';
import type { BrowseDeal, EventDeal } from './firsatbufirsat';

export interface MappedMerchant {
  external_id: string;
  slug: string;
  name: string;
  city: string | null;
  district: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export interface AffiliateOption {
  subDealId: string;
  label: string;
  price: number | null;
  checkoutLink: string;
}

export interface MappedDeal {
  external_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  highlights: string[];
  terms: string | null;
  cover_image: string;
  images: string[];
  original_price: number;
  discounted_price: number;
  city: string;
  district: string | null;
  venue_name: string | null;
  lat: number | null;
  lng: number | null;
  valid_from: string;
  valid_until: string;
  available_times: unknown | null;
  tags: string[];
  external_tags: string[];
  audience: string[];
  external_url: string | null;
  affiliate_options: AffiliateOption[];
  categorySlug: CategorySlug;
  merchant: MappedMerchant;
}

const VALID_TAG_SLUGS = new Set<string>(DEAL_TAGS.map((t) => t.slug));
const CATEGORY_SLUGS = new Set<string>(MAIN_CATEGORIES.map((c) => c.slug));

// ----------------------------------------------------------------------------
// Primitive parser'lar
// ----------------------------------------------------------------------------

/** "550 ₺", "449.00 TL", "300.00", "1.234,56 TL" → number | null. */
export function parsePrice(input: string | null | undefined): number | null {
  if (!input) return null;
  let t = String(input).replace(/[^\d.,]/g, '');
  if (!t) return null;
  const hasDot = t.includes('.');
  const hasComma = t.includes(',');
  if (hasDot && hasComma) {
    // Son ayraç ondalık kabul edilir.
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) {
      t = t.replace(/\./g, '').replace(',', '.'); // 1.234,56 → 1234.56
    } else {
      t = t.replace(/,/g, ''); // 1,234.56 → 1234.56
    }
  } else if (hasComma) {
    t = t.replace(',', '.');
  } else if (hasDot) {
    // Yalnızca nokta: son parçası 3 haneli ise binlik ayracı (1.500 → 1500),
    // 1-2 haneli ise ondalık (449.00 → 449).
    const last = t.slice(t.lastIndexOf('.') + 1);
    if (last.length === 3) t = t.replace(/\./g, '');
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/** "41.0516680:29.2482300" → {lat,lng} | null. 0:0 ve aralık dışı → null. */
export function parseLatLng(input: string | null | undefined): LatLng | null {
  if (!input) return null;
  const [latStr, lngStr] = String(input).split(':');
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

const ENTITY: Record<string, string> = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&lt;': '<',
  '&gt;': '>',
};

/** HTML → düz metin. dangerouslySetInnerHTML kullanmıyoruz (CLAUDE.md). */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITY[m.toLowerCase()] ?? ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** "2026-06-30 23:59:59" → ISO string | null. */
function parseApiDate(input: string | null | undefined): string | null {
  if (!input) return null;
  const d = new Date(input.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

// ----------------------------------------------------------------------------
// Sınıflandırma (kategori / tag / audience)
// ----------------------------------------------------------------------------

function asciiLower(s: string): string {
  return slugify(s).replace(/-/g, ' ');
}

// Sıra önemli: en spesifik/baskın sinyal önce.
//  - `tokens`: tam kelime eşleşmesi ('tur' → "türk"/"konaklamalı" içinde YANLIŞ
//    eşleşmesin). turlar otellerden ÖNCE: "konaklamalı tur" → turlar, ama
//    "Silivri Hotel konaklama" (tur yok) → sehir-otelleri.
//  - `keywords`: substring. Otel için 'otel'/'hotel' kullanmıyoruz ("otelde spa"
//    ve "...Hotel" başlıkları yanlış eşleşiyor) — güçlü 'konaklama'/'resort' sinyali.
const CATEGORY_RULES: { slug: CategorySlug; keywords?: string[]; tokens?: string[] }[] = [
  { slug: 'turlar', tokens: ['tur', 'turu', 'turlar', 'tura', 'gezi', 'rehberli', 'gunubirlik', 'tekne'] },
  { slug: 'tatil-otelleri', keywords: ['resort', 'tatil koy', 'bungalov', 'her sey dahil', 'pansiyon', 'villa'] },
  { slug: 'sehir-otelleri', keywords: ['konaklama', 'suit'] },
  { slug: 'masaj', keywords: ['masaj', 'spa', 'hamam', 'kese', 'sauna'] },
  {
    slug: 'guzellik',
    keywords: ['guzellik', 'cilt bak', 'manikur', 'pedikur', 'kuafor', 'lazer', 'epilasyon', 'makyaj', 'protez tirnak', 'sac bak'],
  },
  { slug: 'kahvalti', keywords: ['kahvalt', 'brunch', 'serpme'] },
  { slug: 'kurs', keywords: ['kurs', 'egitim', 'atolye', 'workshop', 'sertifika'] },
  { slug: 'stand-up', keywords: ['stand up', 'standup'], tokens: ['standup'] },
  // 'muzik' SUBSTRING değil TOKEN: "müzikli yemek" (pub/restoran tag'i) konsere
  // düşmesin; ama "müzik"/"canlı müzik" tam kelimesi yine konseri tetikler.
  { slug: 'konser', keywords: ['konser', 'festival', 'akustik'], tokens: ['muzik'] },
  { slug: 'tiyatro', keywords: ['tiyatro', 'sahne', 'muzikal'] },
  {
    slug: 'yemek',
    keywords: ['yemek', 'restoran', 'menu', 'lezzet', 'pizza', 'burger', 'cafe', 'kafe', 'steak', 'sushi', 'meyhane', 'doner'],
  },
  {
    slug: 'aktivite',
    keywords: ['aktivite', 'macera', 'paintball', 'go kart', 'tema park', 'hayvanat', 'akvaryum', 'muze', 'sergi', 'lunapark', 'jet ski', 'dalis', 'park'],
  },
];

/**
 * Tag string'ini (browse) veya başlığı (event) 13 ana kategoriden birine eşler.
 * Açıklama metni KULLANILMAZ — gürültülü ("gezi/kaş" gibi kelimeler yanlış tetikler).
 */
export function mapCategory(haystack: string, opts: { isEvent?: boolean } = {}): CategorySlug {
  const h = asciiLower(haystack);
  const tokens = new Set(h.split(' ').filter(Boolean));
  for (const rule of CATEGORY_RULES) {
    if (rule.tokens?.some((t) => tokens.has(t))) return rule.slug;
    if (rule.keywords?.some((kw) => h.includes(kw))) return rule.slug;
  }
  // Etkinlik endpoint'i ağırlıklı sahne sanatları → default tiyatro.
  return opts.isEvent ? 'tiyatro' : 'aktivite';
}

const TAG_RULES: { slug: string; keywords: string[] }[] = [
  { slug: 'cocuk-dostu', keywords: ['cocuk', 'aile', 'kids', 'minik'] },
  { slug: 'romantik', keywords: ['romantik', 'cift', 'sevgili', 'evlilik', 'yildonumu'] },
  { slug: 'dogada', keywords: ['doga', 'orman', 'yayla', 'kamp'] },
  { slug: 'deniz-manzarali', keywords: ['deniz manzara', 'deniz kenar', 'sahil', 'plaj'] },
  { slug: 'acik-hava', keywords: ['acik hava', 'open air', 'bahce'] },
  { slug: 'luks', keywords: ['luks', 'vip', 'premium'] },
  { slug: 'tarihi', keywords: ['tarihi', 'tarih', 'antik'] },
  { slug: 'eglenceli', keywords: ['eglence', 'parti', 'kutlama'] },
  { slug: 'huzurlu', keywords: ['huzur', 'spa', 'masaj', 'rahatlat', 'terapi'] },
  { slug: 'brunch', keywords: ['brunch'] },
  { slug: 'gece-hayati', keywords: ['gece', 'club', 'kulup'] },
  { slug: 'vegan', keywords: ['vegan'] },
  { slug: 'vejetaryen', keywords: ['vejetaryen'] },
  { slug: 'glutensiz', keywords: ['glutensiz'] },
];

/** Serbest metni kontrollü DEAL_TAGS slug'larına eşler (enum dışı atılır). */
export function mapTags(haystack: string): string[] {
  const h = asciiLower(haystack);
  const out = new Set<string>();
  for (const rule of TAG_RULES) {
    if (rule.keywords.some((kw) => h.includes(kw)) && VALID_TAG_SLUGS.has(rule.slug)) {
      out.add(rule.slug);
    }
  }
  return [...out];
}

/** Serbest metinden kitle (audience) çıkarımı — AUDIENCE enum slug'ları. */
export function mapAudience(haystack: string): string[] {
  const h = asciiLower(haystack);
  const out = new Set<string>();
  if (/cocuk|aile|kids|minik/.test(h)) {
    out.add('family');
    out.add('kids');
  }
  if (/romantik|cift|sevgili/.test(h)) out.add('couple');
  if (/grup|takim|arkadas/.test(h)) out.add('group');
  if (out.size === 0) {
    return ['couple', 'family', 'group'];
  }
  return [...out];
}

// ----------------------------------------------------------------------------
// Yardımcılar
// ----------------------------------------------------------------------------

/** showDealUrl / permalink → temiz slug; benzersizlik için externalId eklenir. */
function buildSlug(base: string | null | undefined, fallbackTitle: string, externalId: string): string {
  let raw = base ?? '';
  // Tam URL geldiyse path son segmentini al ve query'yi at.
  if (raw.includes('/')) {
    raw = raw.split('?')[0].replace(/\/+$/, '');
    raw = raw.slice(raw.lastIndexOf('/') + 1);
  } else {
    raw = raw.split('?')[0];
  }
  const slugBase = slugify(raw || fallbackTitle) || 'firsat';
  return `${slugBase}-${externalId}`.slice(0, 200);
}

function pickCover(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    if (c && c.trim()) return c.trim();
  }
  return null;
}

/** İlk boş-olmayan (trim'lenmiş) string'i döndürür. */
function firstNonEmpty(...vals: (string | null | undefined)[]): string {
  for (const v of vals) {
    if (v && String(v).trim()) return String(v).trim();
  }
  return '';
}

/** valid_from < valid_until garanti eden guard. */
function clampRange(from: string, until: string): { valid_from: string; valid_until: string } {
  const f = new Date(from).getTime();
  const u = new Date(until).getTime();
  if (u > f) return { valid_from: from, valid_until: until };
  // Geçmiş tarihli: from'u until'in bir gün öncesine çek (expired filtre yine gizler).
  return { valid_from: new Date(u - 86400_000).toISOString(), valid_until: until };
}

function eventCheckoutLink(dealId: string, subDealId: string): string {
  const pid = getPublisherId();
  return `https://www.firsatbufirsat.com/checkout/cart.html?pid=${pid}&dealId=${dealId}&subDealId=${subDealId}`;
}

function formatSessionLabel(iso: string | null, title: string): string {
  if (!iso) return title;
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return title;
  }
}

// ----------------------------------------------------------------------------
// Browse deal → MappedDeal
// ----------------------------------------------------------------------------
export function mapBrowseDeal(deal: BrowseDeal): MappedDeal | null {
  const cover = pickCover(deal.image1200x1200, deal.image450_H, deal.image200_H);
  if (!cover) return null; // cover_image NOT NULL

  const real = parsePrice(deal.realPriceWithSymbol);
  const dealPrice = parsePrice(deal.dealPriceWithSymbol);
  const discounted = dealPrice ?? real ?? 0;
  const original = Math.max(real ?? discounted, discounted);

  const rawTagStr = deal.tags ?? '';
  const externalTags = rawTagStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  // Tag/audience için açıklama da dahil (sinyal zengin); kategori için yalnızca
  // yapılandırılmış tag'ler + başlık (açıklamadaki "gezi/kaş" gibi kelimeler
  // yanlış kategori tetikliyor).
  const haystack = [deal.title, rawTagStr, deal.description].filter(Boolean).join(' ');
  const categoryHay = [rawTagStr, deal.title].filter(Boolean).join(' ');
  const description = htmlToText(deal.descriptionHtml) || deal.description || deal.title;

  const business = deal.businessData[0];
  const coords = parseLatLng(deal.latLngs);
  const city = deal.city ?? business?.address?.split('/').pop()?.trim() ?? 'İstanbul';
  const merchantExternalId = firstNonEmpty(deal.businessIds?.split(',')[0], business?.id, `deal-${deal.id}`);

  const validFrom = new Date().toISOString();
  const validUntilRaw = parseApiDate(deal.couponEndDate) ?? new Date(Date.now() + 30 * 86400_000).toISOString();
  const { valid_from, valid_until } = clampRange(validFrom, validUntilRaw);

  const affiliate_options: AffiliateOption[] = deal.subDeals
    .filter((sd) => sd.checkoutLink)
    .map((sd) => ({
      subDealId: sd.id,
      label: sd.title || 'Seçenek',
      price: parsePrice(sd.dealPriceWithSymbol),
      checkoutLink: sd.checkoutLink,
    }));

  const merchant: MappedMerchant = {
    external_id: merchantExternalId,
    slug: `${slugify(business?.title ?? city)}-${merchantExternalId}`.slice(0, 200),
    name: business?.title ?? deal.title,
    city,
    district: deal.town ?? null,
    address: business?.address ?? null,
    // latLngs varsa kesin venue konumu; yoksa null → sync adresten geocode eder.
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };

  return {
    external_id: deal.id,
    slug: buildSlug(deal.showDealUrl, deal.title, deal.id),
    title: deal.title,
    subtitle: [deal.town, deal.city].filter(Boolean).join(', ') || null,
    description,
    highlights: deal.subDeals.map((sd) => sd.title).filter(Boolean).slice(0, 6),
    terms: htmlToText(deal.howToUse) || htmlToText(deal.detail) || null,
    cover_image: cover,
    images: [cover, ...deal.dealImages].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12),
    original_price: original,
    discounted_price: discounted,
    city,
    district: deal.town ?? null,
    venue_name: business?.title ?? null,
    lat: merchant.lat,
    lng: merchant.lng,
    valid_from,
    valid_until,
    available_times: null,
    tags: mapTags(haystack),
    external_tags: externalTags,
    audience: mapAudience(haystack),
    external_url: deal.showDealUrl ?? deal.buyDealUrl ?? null,
    affiliate_options,
    categorySlug: mapCategory(categoryHay),
    merchant,
  };
}

// ----------------------------------------------------------------------------
// Event seansları (aynı dealId) → tek MappedDeal
// ----------------------------------------------------------------------------
export function mapEventDeal(sessions: EventDeal[]): MappedDeal | null {
  if (sessions.length === 0) return null;
  const head = sessions[0];
  const cover = pickCover(head.image1200x1200, head.image400x400);
  if (!cover) return null;

  const dealPrices = sessions.map((s) => parsePrice(s.dealPrice)).filter((n): n is number => n != null);
  const realPrices = sessions.map((s) => parsePrice(s.realPrice)).filter((n): n is number => n != null);
  const discounted = dealPrices.length ? Math.min(...dealPrices) : 0;
  const original = Math.max(realPrices.length ? Math.max(...realPrices) : discounted, discounted);

  const dates = sessions
    .map((s) => parseApiDate(s.eventDate))
    .filter((d): d is string => d != null)
    .sort();
  const validFrom = new Date().toISOString();
  const latest = dates.length ? dates[dates.length - 1] : new Date(Date.now() + 30 * 86400_000).toISOString();
  const { valid_from, valid_until } = clampRange(validFrom, latest);

  const city = head.businessCity ?? 'İstanbul';
  const haystack = [head.eventTitle, head.businessTitle].filter(Boolean).join(' ');
  const merchantExternalId = firstNonEmpty(head.businessId, `event-biz-${head.dealId}`);

  const affiliate_options: AffiliateOption[] = sessions
    .slice()
    .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''))
    .map((s) => ({
      subDealId: s.subDealId,
      label: formatSessionLabel(parseApiDate(s.eventDate), s.eventTitle),
      price: parsePrice(s.dealPrice),
      checkoutLink: eventCheckoutLink(s.dealId, s.subDealId),
    }));

  const venue = head.businessTitle ?? null;
  // Etkinlik API'si koordinat vermiyor → null; sync businessAddress'ten geocode eder.
  const description = [
    head.eventTitle,
    venue ? `Mekan: ${venue}${head.businessCity ? `, ${head.businessCity}` : ''}.` : '',
    affiliate_options.length > 1
      ? `${affiliate_options.length} farklı seans için bilet seçeneklerine göz at.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const merchant: MappedMerchant = {
    external_id: merchantExternalId,
    slug: `${slugify(venue ?? city)}-${merchantExternalId}`.slice(0, 200),
    name: venue ?? head.eventTitle,
    city,
    district: head.businessTown ?? null,
    address: head.businessAddress ?? null,
    lat: null,
    lng: null,
  };

  return {
    external_id: head.dealId,
    slug: buildSlug(head.permalink, head.eventTitle, head.dealId),
    title: head.eventTitle,
    subtitle: [head.businessTitle, head.businessCity].filter(Boolean).join(', ') || null,
    description,
    highlights: [venue ?? '', `${affiliate_options.length} seans`].filter(Boolean),
    terms: null,
    cover_image: cover,
    images: [cover],
    original_price: original,
    discounted_price: discounted,
    city,
    district: head.businessTown ?? null,
    venue_name: venue,
    lat: merchant.lat,
    lng: merchant.lng,
    valid_from,
    valid_until,
    available_times: dates.length ? dates : null,
    tags: mapTags(haystack),
    external_tags: [],
    audience: mapAudience(haystack),
    external_url: head.dealUrl ?? null,
    affiliate_options,
    categorySlug: mapCategory(haystack, { isEvent: true }),
    merchant,
  };
}

// ----------------------------------------------------------------------------
// Yorum parser — deal sayfasının schema.org microdata'sından (author/rating/
// reviewBody/datePublished). firsatbufirsat publisher API yorum vermediği için
// deal sayfası HTML'i scrape edilir (scripts/sync-reviews.ts).
// ----------------------------------------------------------------------------
export interface ParsedReview {
  display_name: string;
  rating: number;
  body: string;
  created_at: string | null;
}

export function parseDealReviews(html: string): ParsedReview[] {
  const out: ParsedReview[] = [];
  const blocks = html.split('itemprop="review"').slice(1);
  for (const b of blocks) {
    const name = b.match(/itemprop="author"[\s\S]*?itemprop="name">([^<]*)<\/span>/)?.[1]?.trim() ?? '';
    const ratingStr = b.match(/itemprop="reviewRating"[\s\S]*?itemprop="ratingValue" content="(\d+)"/)?.[1];
    const bodyRaw = b.match(/itemprop="description">([^<]*)<\/div>/)?.[1] ?? '';
    const date = b.match(/itemprop="datePublished" content="([^"]+)"/)?.[1] ?? null;

    const body = htmlToText(bodyRaw);
    const rating = Math.min(5, Math.max(1, parseInt(ratingStr ?? '5', 10) || 5));
    // reviews tablosu kısıtları: display_name 2-50, body 5-1000.
    if (body.length < 5) continue;
    const display_name = (name.length >= 2 ? name : 'Misafir').slice(0, 50);

    out.push({
      display_name,
      rating,
      body: body.slice(0, 1000),
      created_at: date ? new Date(date).toISOString() : null,
    });
  }
  return out;
}

export { CATEGORY_SLUGS };
