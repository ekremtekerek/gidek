/**
 * Tek doğruluk kaynağı: DB CHECK constraint'leri ve UI label'lar buradan gelir.
 * Yeni bir tag/audience/etc. eklerken hem buraya hem migration'a ekle.
 */

export const DEAL_TAGS = [
  // Atmosfer / vibe
  { slug: 'romantik', label: 'Romantik', group: 'vibe' },
  { slug: 'sessiz', label: 'Sessiz', group: 'vibe' },
  { slug: 'eglenceli', label: 'Eğlenceli', group: 'vibe' },
  { slug: 'luks', label: 'Lüks', group: 'vibe' },
  { slug: 'samimi', label: 'Samimi', group: 'vibe' },
  { slug: 'enerjik', label: 'Enerjik', group: 'vibe' },
  { slug: 'huzurlu', label: 'Huzurlu', group: 'vibe' },
  { slug: 'rahat', label: 'Rahat', group: 'vibe' },

  // Mekân
  { slug: 'acik-hava', label: 'Açık Hava', group: 'place' },
  { slug: 'deniz-manzarali', label: 'Deniz Manzaralı', group: 'place' },
  { slug: 'dogada', label: 'Doğada', group: 'place' },
  { slug: 'sehir-merkezi', label: 'Şehir Merkezi', group: 'place' },
  { slug: 'tarihi', label: 'Tarihi', group: 'place' },

  // Zaman / vesile
  { slug: 'son-dakika', label: 'Son Dakika', group: 'time' },
  { slug: 'hafta-sonu', label: 'Hafta Sonu', group: 'time' },
  { slug: 'gece-hayati', label: 'Gece Hayatı', group: 'time' },
  { slug: 'brunch', label: 'Brunch', group: 'time' },
  { slug: 'ozel-gun', label: 'Özel Gün', group: 'time' },

  // Pratik
  { slug: 'aninda-onay', label: 'Anında Onay', group: 'practical' },
  { slug: 'esnek-iptal', label: 'Esnek İptal', group: 'practical' },
  { slug: 'rezervasyon-sart', label: 'Rezervasyon Şart', group: 'practical' },

  // Kitle / erişim
  { slug: 'cocuk-dostu', label: 'Çocuk Dostu', group: 'audience' },
  { slug: 'evcil-hayvan-dostu', label: 'Evcil Hayvan Dostu', group: 'audience' },
  { slug: 'engelli-erisimi', label: 'Engelli Erişimi', group: 'audience' },
  { slug: 'lgbtq-friendly', label: 'LGBTQ+ Friendly', group: 'audience' },
  { slug: 'business-uygun', label: 'İş/Business', group: 'audience' },
  { slug: 'grup-icin', label: 'Grup İçin', group: 'audience' },

  // Diyet
  { slug: 'vejetaryen', label: 'Vejetaryen', group: 'diet' },
  { slug: 'vegan', label: 'Vegan', group: 'diet' },
  { slug: 'helal', label: 'Helal', group: 'diet' },
  { slug: 'glutensiz', label: 'Glütensiz', group: 'diet' },
  { slug: 'alkolsuz', label: 'Alkolsüz', group: 'diet' },

  // Stil / sosyal kanıt
  { slug: 'odullu', label: 'Ödüllü', group: 'style' },
  { slug: 'populer', label: 'Popüler', group: 'style' },
  { slug: 'yerel-favori', label: 'Yerel Favori', group: 'style' },
  { slug: 'gizli-cevher', label: 'Gizli Cevher', group: 'style' },
  { slug: 'yeni', label: 'Yeni Açıldı', group: 'style' },
] as const;

export type DealTagSlug = (typeof DEAL_TAGS)[number]['slug'];
export type DealTagGroup = (typeof DEAL_TAGS)[number]['group'];

export const DEAL_TAG_LABEL: Record<string, string> = Object.fromEntries(
  DEAL_TAGS.map((t) => [t.slug, t.label]),
);

export const AUDIENCE = [
  { slug: 'couple', label: 'Çiftler' },
  { slug: 'family', label: 'Aile' },
  { slug: 'kids', label: 'Çocuklar' },
  { slug: 'solo', label: 'Tek başına' },
  { slug: 'group', label: 'Grup' },
] as const;

export type AudienceSlug = (typeof AUDIENCE)[number]['slug'];

export const AUDIENCE_LABEL: Record<string, string> = Object.fromEntries(
  AUDIENCE.map((a) => [a.slug, a.label]),
);

export const HOUSEHOLD_TYPES = [
  { slug: 'single', label: 'Yalnız yaşıyorum' },
  { slug: 'couple', label: 'Çift' },
  { slug: 'family_with_kids', label: 'Çocuklu aile' },
  { slug: 'family_no_kids', label: 'Çocuksuz aile' },
  { slug: 'friends', label: 'Arkadaşlarla' },
] as const;

export type HouseholdType = (typeof HOUSEHOLD_TYPES)[number]['slug'];

export const KIDS_AGE_GROUPS = [
  { slug: '0-3', label: '0–3 yaş' },
  { slug: '4-6', label: '4–6 yaş' },
  { slug: '7-12', label: '7–12 yaş' },
  { slug: 'teen', label: '13+ (genç)' },
] as const;

export type KidsAgeGroup = (typeof KIDS_AGE_GROUPS)[number]['slug'];

export const DIETARY = [
  { slug: 'vejetaryen', label: 'Vejetaryen' },
  { slug: 'vegan', label: 'Vegan' },
  { slug: 'helal', label: 'Helal' },
  { slug: 'glutensiz', label: 'Glütensiz' },
  { slug: 'alkolsuz', label: 'Alkolsüz' },
] as const;

export type DietarySlug = (typeof DIETARY)[number]['slug'];

/**
 * V1 ana kategoriler (alt kategoriler DB seed'inde eklenir).
 */
export const MAIN_CATEGORIES = [
  { slug: 'tiyatro', name: 'Tiyatro', icon: 'theater' },
  { slug: 'konser', name: 'Konser', icon: 'music' },
  { slug: 'stand-up', name: 'Stand Up', icon: 'mic' },
  { slug: 'aktivite', name: 'Aktivite', icon: 'rocket' },
  { slug: 'masaj', name: 'Masaj', icon: 'hand' },
  { slug: 'guzellik', name: 'Güzellik', icon: 'sparkles' },
  { slug: 'kahvalti', name: 'Kahvaltı', icon: 'coffee' },
  { slug: 'yemek', name: 'Yemek', icon: 'utensils' },
  { slug: 'turlar', name: 'Turlar', icon: 'map' },
  { slug: 'sehir-otelleri', name: 'Şehir Otelleri', icon: 'hotel' },
  { slug: 'tatil-otelleri', name: 'Tatil Otelleri', icon: 'palmtree' },
  { slug: 'kurs', name: 'Kurs', icon: 'book' },
  { slug: 'hizmet', name: 'Hizmet', icon: 'wrench' },
] as const;

export type CategorySlug = (typeof MAIN_CATEGORIES)[number]['slug'];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'used'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const AI_QUERY_STATUSES = ['success', 'rate_limited', 'circuit_broken', 'error'] as const;
export type AiQueryStatus = (typeof AI_QUERY_STATUSES)[number];

export const SUPPORTED_CITIES = [
  'İstanbul',
  'Ankara',
  'İzmir',
  'Antalya',
  'Bursa',
  'Adana',
  'Eskişehir',
  'Konya',
  'Gaziantep',
  'Kayseri',
] as const;

export type SupportedCity = (typeof SUPPORTED_CITIES)[number];
