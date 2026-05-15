/**
 * Tatil fırsatlarına UI için metadata türetme.
 *
 * Mevcut deals şemasında otel-spesifik kolonlar yok (yıldız, konsept, gece).
 * Bunları tags + description + duration'dan çıkarıyoruz. Schema migration
 * yapmadan tatil platformu hissi yaratmak için.
 */

import type { DealWithMerchant } from '@/lib/db/queries/deals';

export type Concept = 'all-inclusive' | 'breakfast' | 'half-board' | 'room-only';

export interface TravelMeta {
  /** Tahmini yıldız (3, 4, 5) — tags veya başlıktan */
  stars: 3 | 4 | 5;
  /** Tatil konsepti — gösterimde rozet için */
  concept: Concept;
  /** Tesis özellikleri */
  features: TravelFeature[];
  /** Tahmini gece sayısı (turlar için description, oteller default 1) */
  nights: number;
  /** Plaja yakınlık etiketi (varsa) */
  beachLabel: string | null;
}

export type TravelFeature =
  | 'pool'
  | 'spa'
  | 'beach'
  | 'kids-club'
  | 'wifi'
  | 'breakfast'
  | 'all-inclusive'
  | 'sea-view'
  | 'transfer'
  | 'tour-included';

export const CONCEPT_LABEL: Record<Concept, string> = {
  'all-inclusive': 'Her şey dahil',
  'breakfast': 'Kahvaltı dahil',
  'half-board': 'Yarım pansiyon',
  'room-only': 'Sadece oda',
};

export const CONCEPT_ACCENT: Record<Concept, string> = {
  'all-inclusive': 'from-amber-500 to-orange-500',
  'breakfast': 'from-emerald-500 to-teal-500',
  'half-board': 'from-sky-500 to-blue-500',
  'room-only': 'from-slate-500 to-slate-600',
};

export const FEATURE_LABEL: Record<TravelFeature, string> = {
  pool: 'Havuz',
  spa: 'Spa & wellness',
  beach: 'Plajı var',
  'kids-club': 'Çocuk kulübü',
  wifi: 'Ücretsiz WiFi',
  breakfast: 'Kahvaltı',
  'all-inclusive': 'Her şey dahil',
  'sea-view': 'Deniz manzarası',
  transfer: 'Ulaşım dahil',
  'tour-included': 'Tur dahil',
};

const SEA_DISTRICTS = new Set([
  'Bodrum',
  'Çeşme',
  'Alaçatı',
  'Antalya',
  'Kuşadası',
  'Marmaris',
  'Fethiye',
  'Datça',
  'Foça',
  'Kalkan',
  'Kaş',
  'Ölüdeniz',
  'Side',
  'Belek',
  'Kemer',
  'Alanya',
  'Yalıkavak',
  'Türkbükü',
  'Sığacık',
]);

/**
 * Bir deal için tatil metadata'sını türetir.
 * Saf fonksiyon — server veya client'tan güvenle çağrılır.
 */
export function enrichTravelDeal(deal: DealWithMerchant): TravelMeta {
  const title = (deal.title ?? '').toLowerCase();
  const desc = (deal.description ?? '').toLowerCase();
  const tags = (deal.tags ?? []).map((t) => t.toLowerCase());
  const blob = `${title} ${desc} ${tags.join(' ')}`;
  const district = deal.district ?? '';

  // --- Konsept ---
  let concept: Concept = 'room-only';
  if (/her\s*sey\s*dahil|all[-\s]?inclusive|hsd/i.test(blob)) concept = 'all-inclusive';
  else if (/yarim\s*pansiyon|half[-\s]?board/i.test(blob)) concept = 'half-board';
  else if (/kahvalti\s*dahil|breakfast/i.test(blob)) concept = 'breakfast';

  // --- Yıldız (mock — fiyata göre tahmin) ---
  const price = Number(deal.discounted_price) || 0;
  let stars: 3 | 4 | 5 = 3;
  if (price >= 5000) stars = 5;
  else if (price >= 2500) stars = 4;

  // --- Özellikler ---
  const features = new Set<TravelFeature>();
  if (/havuz|pool|aquapark/i.test(blob)) features.add('pool');
  if (/spa|massage|masaj|hamam|sauna|wellness/i.test(blob)) features.add('spa');
  if (concept === 'all-inclusive') features.add('all-inclusive');
  if (concept === 'breakfast' || concept === 'half-board') features.add('breakfast');
  if (/cocuk|kids|aile|children/i.test(blob) || (deal.audience ?? []).includes('family')) {
    features.add('kids-club');
  }
  if (/wifi|internet/i.test(blob)) features.add('wifi');
  if (/transfer|ulasim|ucak|otobus/i.test(blob)) features.add('transfer');
  if (/tur|gez|gezi/i.test(blob) && (tags.includes('turlar') || /tur/i.test(title))) {
    features.add('tour-included');
  }

  // Denize yakın bölgeler için otomatik beach/sea-view
  if (SEA_DISTRICTS.has(district)) {
    features.add('beach');
    if (price >= 3000) features.add('sea-view');
  }

  // --- Gece sayısı ---
  let nights = 1;
  const nightMatch = /(\d+)\s*gece/i.exec(blob);
  if (nightMatch) nights = Math.min(14, Math.max(1, Number(nightMatch[1])));
  else if (deal.duration_minutes && deal.duration_minutes >= 60 * 24) {
    nights = Math.round(deal.duration_minutes / (60 * 24));
  }

  // --- Plaj mesafe etiketi ---
  let beachLabel: string | null = null;
  if (features.has('beach')) {
    if (features.has('sea-view')) beachLabel = 'Deniz manzaralı';
    else beachLabel = 'Denize yürüme mesafesi';
  }

  return {
    stars,
    concept,
    features: [...features],
    nights,
    beachLabel,
  };
}

/**
 * Aramada feature filtresi için: kullanıcının seçtiği özellikler dealsta
 * varsa true.
 */
export function dealHasFeatures(
  deal: DealWithMerchant,
  required: TravelFeature[],
): boolean {
  if (required.length === 0) return true;
  const meta = enrichTravelDeal(deal);
  const has = new Set(meta.features);
  return required.every((f) => has.has(f));
}

export function dealHasConcept(deal: DealWithMerchant, concept: Concept | null): boolean {
  if (!concept) return true;
  return enrichTravelDeal(deal).concept === concept;
}

export function dealHasStars(deal: DealWithMerchant, stars: number[]): boolean {
  if (stars.length === 0) return true;
  return stars.includes(enrichTravelDeal(deal).stars);
}
