/**
 * Procedural travel inventory — 10 popüler destinasyona 100'er otel/paket
 * üretir (toplam ~1000 deal). AI tarafının "ailecek her şey dahil",
 * "romantik butik", "doğa içi bungalov" gibi tüm akıllı filtrelerini
 * iyi test edebilmek için her destinasyonda concept × landmark × duration ×
 * board × room × price-tier kombinasyonu kurulur.
 *
 *   npm run seed:travel
 *
 * Idempotent: aynı slug ile tekrar çalıştırıldığında upsert eder. Mevcut
 * curated deal'lara dokunmaz (farklı slug prefix: `tdest-`).
 */
import { createClient } from '@supabase/supabase-js';
import { dealEmbeddingText, embed, toPgVector } from '../src/lib/ai/embeddings';
import type { Database } from '../src/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env. Check .env.local.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ----------------------------------------------------------------------------
// Concept catalog — her concept'in başlık parçası, açıklama tarzı, audience
// ve tag mix'i tanımlı. Concept enum'u destinasyon dosyasındaki listelerden
// referans verilir.
// ----------------------------------------------------------------------------
type LatLng = { lat: number; lng: number };
type Concept = keyof typeof CONCEPTS;

const CONCEPTS = {
  'marina': {
    label: 'Marina Konseptli',
    desc: 'Marina ve yat manzaralı, sahile yakın butik konaklama.',
    audience: ['couple', 'group'],
    tags: ['deniz-manzarali', 'luks', 'romantik', 'sehir-merkezi'],
  },
  'her-sey-dahil': {
    label: 'Her Şey Dahil',
    desc: 'Ana yemekler, atıştırmalıklar ve yerli içecekler 24 saat dahil.',
    audience: ['family', 'couple', 'group'],
    tags: ['cocuk-dostu', 'rahat', 'huzurlu', 'populer'],
  },
  'ultra-her-sey-dahil': {
    label: 'Ultra Her Şey Dahil',
    desc: 'İthal içecekler, premium restoranlar, mini bar ve oda servisi sınırsız.',
    audience: ['couple', 'family'],
    tags: ['luks', 'cocuk-dostu', 'populer', 'huzurlu'],
  },
  'butik': {
    label: 'Butik Otel',
    desc: 'Az odalı, tasarım odaklı, kişisel servis veren samimi konaklama.',
    audience: ['couple', 'solo'],
    tags: ['romantik', 'samimi', 'luks', 'gizli-cevher'],
  },
  'tasarim-otel': {
    label: 'Tasarım Otel',
    desc: 'İmza mimari, sanat eseri detaylar ve gourmet kahvaltı.',
    audience: ['couple', 'solo'],
    tags: ['luks', 'samimi', 'romantik', 'sehir-merkezi'],
  },
  'aile-resort': {
    label: 'Aile Resort',
    desc: 'Çocuk kulübü, mini disko, aquapark ve aile suit odaları.',
    audience: ['family', 'kids'],
    tags: ['cocuk-dostu', 'rahat', 'eglenceli', 'populer'],
  },
  'spa-otel': {
    label: 'Spa & Wellness Otel',
    desc: 'Türk hamamı, sauna, aroma masaj ve ısıtmalı havuz dahil.',
    audience: ['couple', 'solo'],
    tags: ['huzurlu', 'luks', 'rahat', 'romantik'],
  },
  'plaj-resort': {
    label: 'Plaj Resort',
    desc: 'Sahile sıfır konum, özel plaj kullanımı ve şezlong dahil.',
    audience: ['couple', 'family', 'group'],
    tags: ['deniz-manzarali', 'acik-hava', 'populer', 'rahat'],
  },
  'doga-ici': {
    label: 'Doğa İçi Lodge',
    desc: 'Çam ormanı içinde, kuş sesleri eşliğinde sakin konaklama.',
    audience: ['couple', 'family', 'solo'],
    tags: ['dogada', 'huzurlu', 'samimi', 'gizli-cevher'],
  },
  'eko-otel': {
    label: 'Eko Otel',
    desc: 'Güneş enerjisi, organik bahçe ve yerel mutfak ağırlıklı sürdürülebilir konaklama.',
    audience: ['couple', 'solo', 'family'],
    tags: ['dogada', 'huzurlu', 'gizli-cevher', 'samimi'],
  },
  'bungalov': {
    label: 'Bungalov',
    desc: 'Ahşap müstakil bungalov, küçük bahçe ve hamak dahil.',
    audience: ['couple', 'family'],
    tags: ['dogada', 'romantik', 'huzurlu', 'samimi'],
  },
  'yayla-evi': {
    label: 'Yayla Evi',
    desc: 'Geleneksel yayla evinde şömineli oda, ev yapımı kahvaltı.',
    audience: ['couple', 'family'],
    tags: ['dogada', 'tarihi', 'huzurlu', 'samimi'],
  },
  'magara-otel': {
    label: 'Mağara Otel',
    desc: 'Doğal tüf kayadan oyulmuş otantik mağara odası.',
    audience: ['couple', 'solo'],
    tags: ['tarihi', 'gizli-cevher', 'romantik', 'luks'],
  },
  'kayak-otel': {
    label: 'Kayak Otel',
    desc: 'Pistlere yürüme mesafesinde, ski-in/ski-out konum.',
    audience: ['couple', 'family', 'group'],
    tags: ['dogada', 'enerjik', 'eglenceli', 'cocuk-dostu'],
  },
  'dag-evi': {
    label: 'Dağ Evi',
    desc: 'Şömineli ahşap dağ evi, kayak sezonu için ideal.',
    audience: ['couple', 'family'],
    tags: ['dogada', 'romantik', 'huzurlu', 'samimi'],
  },
  'aqua-park': {
    label: 'Aquaparklı Resort',
    desc: 'Otel içinde dev aquapark, kaydıraklar ve çocuk havuzları.',
    audience: ['family', 'kids', 'group'],
    tags: ['cocuk-dostu', 'eglenceli', 'rahat', 'populer'],
  },
  'gourmet': {
    label: 'Gourmet Otel',
    desc: 'Şef restoranı, şarap tadımı ve özel akşam yemeği menüleri.',
    audience: ['couple', 'solo'],
    tags: ['luks', 'romantik', 'samimi', 'ozel-gun'],
  },
  'ekonomik': {
    label: 'Ekonomik Otel',
    desc: 'Fiyat-performans tatil; temiz oda, kahvaltı dahil.',
    audience: ['couple', 'family', 'solo'],
    tags: ['son-dakika', 'populer', 'sehir-merkezi'],
  },
  'ruzgar-sorfu': {
    label: 'Rüzgar Sörfü Yakını',
    desc: 'Sörf okuluna 5 dakika, ekipman kiralama indirimli.',
    audience: ['couple', 'group', 'solo'],
    tags: ['acik-hava', 'enerjik', 'eglenceli', 'populer'],
  },
  'balon-manzarali': {
    label: 'Balon Manzaralı',
    desc: 'Sabah teras kahvaltısında onlarca sıcak hava balonu manzarası.',
    audience: ['couple'],
    tags: ['romantik', 'ozel-gun', 'luks', 'populer'],
  },
} as const;

// ----------------------------------------------------------------------------
// Destination catalog — 10 popüler tatil noktası, alt landmark'larıyla.
// ----------------------------------------------------------------------------
interface Landmark {
  name: string;
  coord: LatLng;
}

interface Destination {
  city: string;
  district: string; // ana destinasyon adı
  centroid: LatLng;
  landmarks: Landmark[];
  concepts: Concept[];
  category: 'tatil-otelleri' | 'sehir-otelleri';
  /** Tier base prices (TL, per night). budget < mid < premium < luxury < ultra */
  pricePerNight: { budget: number; mid: number; premium: number; luxury: number; ultra: number };
  /** Şehirsel vibe açıklaması — başlık/altyazı tarafında kullanılır */
  vibe: string;
}

const DESTINATIONS: Destination[] = [
  {
    city: 'Muğla',
    district: 'Bodrum',
    centroid: { lat: 37.0344, lng: 27.4305 },
    landmarks: [
      { name: 'Yalıkavak', coord: { lat: 37.1071, lng: 27.2911 } },
      { name: 'Türkbükü', coord: { lat: 37.1138, lng: 27.3725 } },
      { name: 'Gümbet', coord: { lat: 37.0306, lng: 27.4023 } },
      { name: 'Bitez', coord: { lat: 37.0394, lng: 27.3683 } },
      { name: 'Göltürkbükü', coord: { lat: 37.118, lng: 27.359 } },
      { name: 'Gümüşlük', coord: { lat: 37.0817, lng: 27.231 } },
      { name: 'Torba', coord: { lat: 37.0743, lng: 27.4525 } },
      { name: 'Akyarlar', coord: { lat: 36.987, lng: 27.282 } },
      { name: 'Ortakent', coord: { lat: 37.058, lng: 27.348 } },
      { name: 'Yalıçiftlik', coord: { lat: 37.014, lng: 27.555 } },
    ],
    concepts: ['marina', 'butik', 'tasarim-otel', 'plaj-resort', 'her-sey-dahil', 'spa-otel', 'gourmet'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 1400, mid: 2400, premium: 4200, luxury: 7500, ultra: 14000 },
    vibe: 'Ege incisi, yat marinaları ve butik koylarıyla',
  },
  {
    city: 'Muğla',
    district: 'Fethiye',
    centroid: { lat: 36.6213, lng: 29.1167 },
    landmarks: [
      { name: 'Ölüdeniz', coord: { lat: 36.5475, lng: 29.1167 } },
      { name: 'Çalış', coord: { lat: 36.654, lng: 29.082 } },
      { name: 'Hisarönü', coord: { lat: 36.5717, lng: 29.1209 } },
      { name: 'Ovacık', coord: { lat: 36.5775, lng: 29.117 } },
      { name: 'Faralya', coord: { lat: 36.5275, lng: 29.0892 } },
      { name: 'Göcek', coord: { lat: 36.7456, lng: 28.9425 } },
      { name: 'Kabak', coord: { lat: 36.5022, lng: 29.0936 } },
      { name: 'Akbük', coord: { lat: 36.628, lng: 29.083 } },
    ],
    concepts: ['doga-ici', 'butik', 'eko-otel', 'bungalov', 'aile-resort', 'spa-otel', 'plaj-resort'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 900, mid: 1800, premium: 3200, luxury: 5800, ultra: 11000 },
    vibe: 'Akdeniz turkuazı, yamaç paraşütü ve çam ormanı içinde',
  },
  {
    city: 'Muğla',
    district: 'Marmaris',
    centroid: { lat: 36.855, lng: 28.278 },
    landmarks: [
      { name: 'İçmeler', coord: { lat: 36.8211, lng: 28.2336 } },
      { name: 'Turunç', coord: { lat: 36.7747, lng: 28.2375 } },
      { name: 'Armutalan', coord: { lat: 36.86, lng: 28.255 } },
      { name: 'Marina', coord: { lat: 36.851, lng: 28.273 } },
      { name: 'Siteler', coord: { lat: 36.857, lng: 28.276 } },
      { name: 'Selimiye', coord: { lat: 36.7339, lng: 28.0664 } },
      { name: 'Bozburun', coord: { lat: 36.6781, lng: 28.0578 } },
    ],
    concepts: ['marina', 'her-sey-dahil', 'aile-resort', 'plaj-resort', 'ekonomik', 'spa-otel'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 800, mid: 1500, premium: 2800, luxury: 4800, ultra: 9000 },
    vibe: 'Marina, çam ağaçlı koylarıyla',
  },
  {
    city: 'Antalya',
    district: 'Lara',
    centroid: { lat: 36.8528, lng: 30.8077 },
    landmarks: [
      { name: 'Lara Beach', coord: { lat: 36.847, lng: 30.823 } },
      { name: 'Kundu', coord: { lat: 36.8694, lng: 30.8467 } },
      { name: 'Kemerağzı', coord: { lat: 36.875, lng: 30.835 } },
      { name: 'Aksu Beach', coord: { lat: 36.881, lng: 30.901 } },
    ],
    concepts: ['ultra-her-sey-dahil', 'aile-resort', 'aqua-park', 'spa-otel', 'plaj-resort', 'gourmet'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 1500, mid: 2800, premium: 4800, luxury: 8500, ultra: 16000 },
    vibe: 'Akdeniz uzun kumsalları ve ultra her şey dahil resortlarıyla',
  },
  {
    city: 'Antalya',
    district: 'Kemer',
    centroid: { lat: 36.5953, lng: 30.5602 },
    landmarks: [
      { name: 'Beldibi', coord: { lat: 36.7569, lng: 30.5436 } },
      { name: 'Göynük', coord: { lat: 36.6589, lng: 30.5408 } },
      { name: 'Kiriş', coord: { lat: 36.5703, lng: 30.5728 } },
      { name: 'Tekirova', coord: { lat: 36.5067, lng: 30.5167 } },
      { name: 'Çamyuva', coord: { lat: 36.5497, lng: 30.5719 } },
      { name: 'Olimpos', coord: { lat: 36.395, lng: 30.471 } },
    ],
    concepts: ['her-sey-dahil', 'aile-resort', 'aqua-park', 'butik', 'spa-otel', 'doga-ici'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 1100, mid: 2100, premium: 3600, luxury: 6200, ultra: 12000 },
    vibe: 'Toroslar denize iner, çam ormanı ve kumsalda',
  },
  {
    city: 'İzmir',
    district: 'Çeşme',
    centroid: { lat: 38.3236, lng: 26.3071 },
    landmarks: [
      { name: 'Ilıca', coord: { lat: 38.3208, lng: 26.355 } },
      { name: 'Alaçatı', coord: { lat: 38.2825, lng: 26.3717 } },
      { name: 'Dalyan', coord: { lat: 38.3508, lng: 26.3344 } },
      { name: 'Şifne', coord: { lat: 38.3486, lng: 26.3217 } },
      { name: 'Boyalık', coord: { lat: 38.3253, lng: 26.3267 } },
      { name: 'Çiftlik', coord: { lat: 38.2503, lng: 26.3489 } },
      { name: 'Ayayorgi', coord: { lat: 38.3061, lng: 26.3744 } },
    ],
    concepts: ['butik', 'tasarim-otel', 'ruzgar-sorfu', 'spa-otel', 'gourmet', 'plaj-resort'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 1300, mid: 2300, premium: 4000, luxury: 7000, ultra: 13000 },
    vibe: 'Ege rüzgarı, taş evler ve butik şarap',
  },
  {
    city: 'Aydın',
    district: 'Didim',
    centroid: { lat: 37.376, lng: 27.2654 },
    landmarks: [
      { name: 'Altınkum', coord: { lat: 37.3528, lng: 27.2683 } },
      { name: 'Akbük', coord: { lat: 37.4456, lng: 27.3658 } },
      { name: 'Marina', coord: { lat: 37.341, lng: 27.276 } },
      { name: 'Mavişehir', coord: { lat: 37.336, lng: 27.295 } },
    ],
    concepts: ['her-sey-dahil', 'aile-resort', 'ekonomik', 'plaj-resort', 'spa-otel'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 700, mid: 1400, premium: 2500, luxury: 4500, ultra: 8500 },
    vibe: 'Altın kumlu plajı ve uygun fiyatlı tatil köyleriyle',
  },
  {
    city: 'Nevşehir',
    district: 'Göreme',
    centroid: { lat: 38.6431, lng: 34.8284 },
    landmarks: [
      { name: 'Üçhisar', coord: { lat: 38.6311, lng: 34.8061 } },
      { name: 'Ortahisar', coord: { lat: 38.6253, lng: 34.86 } },
      { name: 'Avanos', coord: { lat: 38.7148, lng: 34.8467 } },
      { name: 'Ürgüp', coord: { lat: 38.6311, lng: 34.9128 } },
      { name: 'Çavuşin', coord: { lat: 38.6597, lng: 34.8439 } },
      { name: 'Mustafapaşa', coord: { lat: 38.594, lng: 34.9244 } },
      { name: 'Çat', coord: { lat: 38.612, lng: 34.873 } },
    ],
    concepts: ['magara-otel', 'butik', 'tasarim-otel', 'balon-manzarali', 'gourmet'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 1200, mid: 2300, premium: 4200, luxury: 7500, ultra: 14000 },
    vibe: 'Peribacaları, mağara otelleri ve sıcak hava balonlarıyla',
  },
  {
    city: 'Bursa',
    district: 'Uludağ',
    centroid: { lat: 40.0967, lng: 29.2178 },
    landmarks: [
      { name: 'I. Gelişim Bölgesi', coord: { lat: 40.0954, lng: 29.2078 } },
      { name: 'II. Gelişim Bölgesi', coord: { lat: 40.092, lng: 29.225 } },
      { name: 'Sarıalan', coord: { lat: 40.111, lng: 29.183 } },
      { name: 'Kirazlıyayla', coord: { lat: 40.106, lng: 29.211 } },
      { name: 'Beceren', coord: { lat: 40.099, lng: 29.198 } },
    ],
    concepts: ['kayak-otel', 'dag-evi', 'spa-otel', 'aile-resort', 'bungalov'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 1300, mid: 2400, premium: 4200, luxury: 7200, ultra: 13000 },
    vibe: 'Türkiye\'nin en gözde kayak merkezi',
  },
  {
    city: 'Trabzon',
    district: 'Uzungöl',
    centroid: { lat: 40.6225, lng: 40.2828 },
    landmarks: [
      { name: 'Uzungöl Merkez', coord: { lat: 40.6225, lng: 40.2828 } },
      { name: 'Şerah', coord: { lat: 40.617, lng: 40.291 } },
      { name: 'Çaykara', coord: { lat: 40.7464, lng: 40.2403 } },
      { name: 'Demirkapı Yaylası', coord: { lat: 40.585, lng: 40.31 } },
      { name: 'Soğanlı', coord: { lat: 40.6125, lng: 40.29 } },
    ],
    concepts: ['bungalov', 'yayla-evi', 'doga-ici', 'butik', 'eko-otel'],
    category: 'tatil-otelleri',
    pricePerNight: { budget: 700, mid: 1300, premium: 2300, luxury: 4000, ultra: 7500 },
    vibe: 'Karadeniz\'in göl manzaralı yayla cenneti',
  },
];

// ----------------------------------------------------------------------------
// Variation pools — room/board/duration/tier
// ----------------------------------------------------------------------------
const ROOMS = [
  'Standart Oda',
  'Deluxe Oda',
  'Deniz Manzaralı Oda',
  'Aile Suit',
  'Junior Suit',
  'King Suite',
  'Bahçe Suit',
  'Honeymoon Suit',
  'Villa',
] as const;

const BOARDS = [
  'Kahvaltı Dahil',
  'Yarım Pansiyon',
  'Tam Pansiyon',
  'Her Şey Dahil',
  'Ultra Her Şey Dahil',
  'Oda + Kahvaltı',
] as const;

const DURATIONS = [1, 2, 3, 4, 5, 7] as const;
type Tier = 'budget' | 'mid' | 'premium' | 'luxury' | 'ultra';

// ----------------------------------------------------------------------------
// Cover image pools — biraz daha çeşitli Unsplash ID'leri.
// ----------------------------------------------------------------------------
const COVER_POOL: Record<string, string[]> = {
  beach: [
    '1571003123894-1f0594d2b5d9', '1582719508461-905c673771fd',
    '1566073771259-6a8506099945', '1540541338287-41700207dee6',
    '1564501049412-61c2a3083791', '1551882547-ff40c63fe5fa',
  ],
  mountain: [
    '1551524559-8af4e6624178', '1542931287-023b922fa89b',
    '1551632811-561732d1e306', '1502301197179-65228ab57f78',
  ],
  cave: [
    '1582719508461-905c673771fd', '1571003123894-1f0594d2b5d9',
    '1542314831-068cd1dbfeeb',
  ],
  forest: [
    '1542640244-7e672d6cef4e', '1448375240586-882707db888b',
    '1502301197179-65228ab57f78',
  ],
  default: [
    '1571003123894-1f0594d2b5d9', '1542314831-068cd1dbfeeb',
    '1549294413-26f195200c16',
  ],
};

function poolForConcept(c: Concept): string[] {
  if (c === 'magara-otel') return COVER_POOL.cave;
  if (c === 'kayak-otel' || c === 'dag-evi' || c === 'yayla-evi') return COVER_POOL.mountain;
  if (c === 'doga-ici' || c === 'eko-otel' || c === 'bungalov') return COVER_POOL.forest;
  if (c === 'plaj-resort' || c === 'marina' || c === 'ruzgar-sorfu' || c === 'aqua-park') return COVER_POOL.beach;
  return COVER_POOL.default;
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function jitterCoord(c: LatLng, rnd: () => number): LatLng {
  const angle = rnd() * 2 * Math.PI;
  const r = 0.004 * Math.sqrt(rnd());
  const lngScale = Math.cos((c.lat * Math.PI) / 180);
  return {
    lat: +(c.lat + Math.sin(angle) * r).toFixed(6),
    lng: +(c.lng + (Math.cos(angle) * r) / Math.max(lngScale, 0.2)).toFixed(6),
  };
}

function inDaysISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function pickRoom(concept: Concept, tier: Tier, rnd: () => number): string {
  // Daha lüks tier'larda suite/villa ağırlığını artır.
  if (concept === 'magara-otel') return rnd() < 0.6 ? 'Mağara Oda' : 'Mağara Suite';
  if (concept === 'bungalov' || concept === 'yayla-evi' || concept === 'dag-evi') {
    return rnd() < 0.5 ? 'Ahşap Bungalov' : 'Aile Bungalov';
  }
  if (tier === 'ultra' || tier === 'luxury') {
    const opts = ['King Suite', 'Honeymoon Suit', 'Villa', 'Bahçe Suit'];
    return opts[Math.floor(rnd() * opts.length)];
  }
  if (tier === 'premium') {
    const opts = ['Deluxe Oda', 'Junior Suit', 'Deniz Manzaralı Oda', 'Aile Suit'];
    return opts[Math.floor(rnd() * opts.length)];
  }
  return ROOMS[Math.floor(rnd() * 3)]; // standart/deluxe/deniz-manzarali
}

function pickBoard(concept: Concept, rnd: () => number): string {
  if (concept === 'ultra-her-sey-dahil') return 'Ultra Her Şey Dahil';
  if (concept === 'her-sey-dahil' || concept === 'aile-resort' || concept === 'aqua-park') {
    return rnd() < 0.7 ? 'Her Şey Dahil' : 'Ultra Her Şey Dahil';
  }
  if (concept === 'butik' || concept === 'tasarim-otel' || concept === 'gourmet' || concept === 'magara-otel') {
    return rnd() < 0.7 ? 'Kahvaltı Dahil' : 'Yarım Pansiyon';
  }
  if (concept === 'doga-ici' || concept === 'eko-otel' || concept === 'bungalov' || concept === 'yayla-evi') {
    return rnd() < 0.6 ? 'Kahvaltı Dahil' : 'Yarım Pansiyon';
  }
  return BOARDS[Math.floor(rnd() * BOARDS.length)];
}

function pickTier(concept: Concept, rnd: () => number): Tier {
  // Concept'e göre tier dağılımı.
  const r = rnd();
  if (concept === 'ultra-her-sey-dahil' || concept === 'gourmet') {
    if (r < 0.15) return 'premium';
    if (r < 0.55) return 'luxury';
    return 'ultra';
  }
  if (concept === 'ekonomik') {
    if (r < 0.6) return 'budget';
    return 'mid';
  }
  if (concept === 'butik' || concept === 'tasarim-otel' || concept === 'magara-otel') {
    if (r < 0.15) return 'mid';
    if (r < 0.6) return 'premium';
    if (r < 0.9) return 'luxury';
    return 'ultra';
  }
  // Default: mid-heavy
  if (r < 0.15) return 'budget';
  if (r < 0.55) return 'mid';
  if (r < 0.85) return 'premium';
  if (r < 0.97) return 'luxury';
  return 'ultra';
}

function buildAudience(concept: Concept, room: string, rnd: () => number): string[] {
  const base = new Set<string>(CONCEPTS[concept].audience as readonly string[]);
  if (/Aile|Honeymoon|Villa|King/i.test(room)) {
    if (room.startsWith('Honeymoon')) {
      base.clear();
      base.add('couple');
    } else if (room.startsWith('Aile')) {
      base.add('family');
      base.add('kids');
    }
  }
  // Hafif rastgele eklenti
  if (rnd() < 0.3) base.add('group');
  return Array.from(base);
}

function buildTags(concept: Concept, board: string, tier: Tier, duration: number, rnd: () => number): string[] {
  const set = new Set<string>(CONCEPTS[concept].tags as readonly string[]);
  if (board === 'Ultra Her Şey Dahil' || board === 'Her Şey Dahil') set.add('rahat');
  if (tier === 'ultra' || tier === 'luxury') set.add('luks');
  if (tier === 'budget') set.add('son-dakika');
  if (duration >= 5) set.add('huzurlu');
  if (duration === 1) set.add('hafta-sonu');
  if (rnd() < 0.2) set.add('hafta-sonu');
  if (rnd() < 0.15) set.add('ozel-gun');
  return Array.from(set);
}

function pickCover(slug: string, concept: Concept): string {
  const pool = poolForConcept(concept);
  const id = pool[hashStr(slug) % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop`;
}

// ----------------------------------------------------------------------------
// Deal generator — destinasyon başına 100 deal
// ----------------------------------------------------------------------------
interface GenDeal {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  city: string;
  district: string; // landmark adı (daha granular)
  parentDistrict: string; // ana destinasyon adı
  coord: LatLng;
  category: string;
  audience: string[];
  tags: string[];
  durationMin: number;
  duration: number;
  board: string;
  concept: Concept;
  room: string;
  original: number;
  discounted: number;
  cover: string;
}

function generateForDestination(dest: Destination, count: number): GenDeal[] {
  const out: GenDeal[] = [];
  const seedBase = hashStr(`tdest-${dest.district}`);

  for (let i = 0; i < count; i++) {
    const rnd = makeRng(seedBase + i * 7919);
    const concept = dest.concepts[i % dest.concepts.length];
    const landmark = dest.landmarks[(i + Math.floor(rnd() * dest.landmarks.length)) % dest.landmarks.length];
    const duration = DURATIONS[Math.floor(rnd() * DURATIONS.length)];
    const tier = pickTier(concept, rnd);
    const board = pickBoard(concept, rnd);
    const room = pickRoom(concept, tier, rnd);
    const audience = buildAudience(concept, room, rnd);
    const tags = buildTags(concept, board, tier, duration, rnd);

    const conceptMeta = CONCEPTS[concept];
    const titleConcept = conceptMeta.label;
    const subtitleParts = [`${duration} gece konaklama`, board, room];

    const title = `${landmark.name} ${titleConcept} · ${duration} Gece ${board}`;
    const subtitle = subtitleParts.join(' · ');
    const description =
      `${dest.district}'in popüler bölgelerinden ${landmark.name}'da ${conceptMeta.desc} ` +
      `${room} kategorisinde ${duration} gece ${board.toLowerCase()} konseptli konaklama. ` +
      `${dest.vibe} öne çıkan destinasyonda eşsiz bir tatil deneyimi sunar.`;

    const highlights = [
      `${duration} gece konaklama`,
      board,
      room,
      tags.includes('deniz-manzarali') ? 'Deniz manzaralı oda' : 'Bahçe veya manzaralı oda',
      conceptMeta.label,
    ];

    // Price
    const perNight = dest.pricePerNight[tier];
    const variance = 0.85 + rnd() * 0.3; // ±15-30%
    const originalRaw = perNight * duration * variance;
    const original = Math.max(500, Math.round(originalRaw / 50) * 50);
    const discount = 18 + Math.floor(rnd() * 32); // 18-49%
    const discounted = Math.max(400, Math.round((original * (1 - discount / 100)) / 10) * 10);

    const slug = slugify(`tdest-${dest.district}-${landmark.name}-${concept}-${duration}g-${i}`);
    const coord = jitterCoord(landmark.coord, rnd);
    const cover = pickCover(slug, concept);

    out.push({
      slug,
      title,
      subtitle,
      description,
      highlights,
      city: dest.city,
      district: landmark.name,
      parentDistrict: dest.district,
      coord,
      category: dest.category,
      audience,
      tags,
      duration,
      durationMin: duration * 24 * 60, // overnight stays in minutes
      board,
      concept,
      room,
      original,
      discounted,
      cover,
    });
  }
  return out;
}

// ----------------------------------------------------------------------------
// Pipeline
// ----------------------------------------------------------------------------
async function main() {
  console.log('Tatil envanteri üretiliyor — 10 destinasyon × 100 deal…');

  const all: GenDeal[] = [];
  for (const dest of DESTINATIONS) {
    const deals = generateForDestination(dest, 100);
    console.log(`  ${dest.district}: ${deals.length}`);
    all.push(...deals);
  }
  console.log(`Toplam: ${all.length} deal`);

  // 1) Merchants (her deal için unique — tüm tatil otellerinin "tdest-m-"
  //    slug'ı altında, koord'u deal ile aynı).
  const merchantRows = all.map((d) => ({
    slug: `tdest-m-${d.slug}`,
    name: `${d.district} ${CONCEPTS[d.concept].label}`,
    description: `${d.parentDistrict} - ${d.district} bölgesinde ${CONCEPTS[d.concept].label.toLowerCase()} konseptli konaklama tesisi.`,
    city: d.city,
    district: d.district,
    lat: d.coord.lat,
    lng: d.coord.lng,
    is_active: true,
    is_verified: true,
    logo_url: `https://picsum.photos/seed/${d.slug}-logo/200/200`,
  }));

  console.log('Merchants upsert…');
  for (let i = 0; i < merchantRows.length; i += 100) {
    const { error } = await supabase
      .from('merchants')
      .upsert(merchantRows.slice(i, i + 100), { onConflict: 'slug' });
    if (error) throw error;
  }

  // Slug → id (50'lik batch — `.in` URL limit).
  const merchantIdBySlug = new Map<string, string>();
  for (let i = 0; i < merchantRows.length; i += 50) {
    const slugs = merchantRows.slice(i, i + 50).map((m) => m.slug);
    const { data, error } = await supabase
      .from('merchants')
      .select('id, slug')
      .in('slug', slugs);
    if (error) throw error;
    for (const m of data ?? []) merchantIdBySlug.set(m.slug, m.id);
  }
  console.log(`  ${merchantIdBySlug.size} merchant id geldi`);

  // 2) Categories
  const { data: cats, error: cErr } = await supabase.from('categories').select('id, slug');
  if (cErr) throw cErr;
  const catIdBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  // 3) Embeddings — concurrency=5
  console.log('Embeddingler üretiliyor…');
  const embeds: (string | null)[] = new Array(all.length).fill(null);
  if (!process.env.GEMINI_API_KEY) {
    console.log('  GEMINI_API_KEY yok — atlandı (sonra `npm run ai:backfill`)');
  } else {
    let next = 0;
    let ok = 0;
    let fail = 0;
    async function worker() {
      while (true) {
        const i = next++;
        if (i >= all.length) return;
        const d = all[i];
        try {
          const vec = await embed(
            dealEmbeddingText({
              title: d.title,
              subtitle: d.subtitle,
              description: d.description,
              tags: d.tags,
              audience: d.audience,
              city: d.city,
              district: d.district,
              venue_name: null,
            }),
          );
          embeds[i] = toPgVector(vec);
          ok++;
        } catch (err) {
          fail++;
          console.error(
            `  embed fail [${d.slug}]: ${err instanceof Error ? err.message : err}`,
          );
        }
        if ((ok + fail) % 50 === 0) {
          console.log(`  embeddings [${ok + fail}/${all.length}]`);
        }
      }
    }
    await Promise.all(Array.from({ length: 5 }, worker));
    console.log(`  embeddings: ok=${ok} fail=${fail}`);
  }

  // 4) Deals upsert
  console.log('Deals upsert…');
  const dealRows = all.map((d, i) => ({
    slug: d.slug,
    merchant_id: merchantIdBySlug.get(`tdest-m-${d.slug}`)!,
    title: d.title,
    subtitle: d.subtitle,
    description: d.description,
    highlights: d.highlights,
    cover_image: d.cover,
    images: [d.cover, d.cover.replace(/w=1200/, 'w=900')],
    original_price: d.original,
    discounted_price: d.discounted,
    city: d.city,
    district: d.district,
    venue_name: null,
    duration_minutes: d.durationMin,
    valid_from: new Date().toISOString(),
    valid_until: inDaysISO(120 + Math.floor(Math.random() * 90)),
    tags: d.tags,
    audience: d.audience,
    is_active: true,
    is_featured: false,
    published_at: new Date().toISOString(),
    embedding: embeds[i] ?? null,
  }));

  for (let i = 0; i < dealRows.length; i += 100) {
    const { error } = await supabase
      .from('deals')
      .upsert(dealRows.slice(i, i + 100), { onConflict: 'slug' });
    if (error) throw error;
  }

  // 5) Junctions (deal_categories)
  const dealIdBySlug = new Map<string, string>();
  for (let i = 0; i < all.length; i += 50) {
    const slugs = all.slice(i, i + 50).map((d) => d.slug);
    const { data, error } = await supabase
      .from('deals')
      .select('id, slug')
      .in('slug', slugs);
    if (error) throw error;
    for (const d of data ?? []) dealIdBySlug.set(d.slug, d.id);
  }

  const junctions = all
    .map((d) => {
      const dealId = dealIdBySlug.get(d.slug);
      const catId = catIdBySlug.get(d.category);
      if (!dealId || !catId) return null;
      return { deal_id: dealId, category_id: catId };
    })
    .filter((j): j is NonNullable<typeof j> => j !== null);

  for (let i = 0; i < junctions.length; i += 200) {
    const { error } = await supabase
      .from('deal_categories')
      .upsert(junctions.slice(i, i + 200), { onConflict: 'deal_id,category_id' });
    if (error) throw error;
  }
  console.log(`  ${junctions.length} junction yazıldı`);

  // 6) Mock reviews — her deal için 0-6 yorum (destinasyon kartlarında
  //    rating görünsün). Mevcut review'ları silmez; yalnızca bu seed'in
  //    deal'larına yorum ekler.
  console.log('Mock yorumlar ekleniyor…');
  const REVIEW_NAMES = [
    'Selin K.', 'Mert A.', 'Ayşe Y.', 'Burak D.', 'Ece T.', 'Onur G.',
    'Zeynep B.', 'Furkan M.', 'Deniz Ö.', 'Cansu E.', 'Kerem U.', 'Naz S.',
  ];
  const REVIEW_BODIES = [
    'Konaklama beklediğimden iyiydi, oda temiz ve manzaralıydı.',
    'Personel çok ilgiliydi, tatilimiz harika geçti.',
    'Yemekler kaliteli, çocuklarımız çok eğlendi.',
    'Konum mükemmel, plaja yürüme mesafesinde.',
    'Spa ve havuz kısmı çok rahatlatıcıydı.',
    'Fiyat-performans açısından gayet iyi, tekrar geleceğiz.',
    'Romantik bir akşam yemeği için ideal mekan.',
    'Doğa içinde sakinlik arayanlar için birebir.',
    'Aile dostu, çocuk kulübü çok başarılı.',
    'Manzara büyüleyiciydi, fotoğraflar yetersiz kalıyor.',
  ];

  type ReviewRow = {
    deal_id: string;
    user_id: null;
    display_name: string;
    rating: number;
    body: string;
    created_at: string;
  };
  const reviews: ReviewRow[] = [];
  for (const d of all) {
    const dealId = dealIdBySlug.get(d.slug);
    if (!dealId) continue;
    const h = hashStr(d.slug);
    const count = (h % 7); // 0-6 review
    for (let i = 0; i < count; i++) {
      const nh = hashStr(`${d.slug}-r${i}`);
      const rating = (nh % 10) < 1 ? 3 : (nh % 10) < 4 ? 4 : 5;
      reviews.push({
        deal_id: dealId,
        user_id: null,
        display_name: REVIEW_NAMES[nh % REVIEW_NAMES.length],
        rating,
        body: REVIEW_BODIES[(nh >>> 4) % REVIEW_BODIES.length],
        created_at: new Date(Date.now() - ((nh >>> 8) % 90) * 86_400_000).toISOString(),
      });
    }
  }
  for (let i = 0; i < reviews.length; i += 500) {
    const { error } = await supabase.from('reviews').insert(reviews.slice(i, i + 500));
    if (error) throw error;
  }
  console.log(`  ${reviews.length} yorum eklendi`);

  console.log('\nDone. 10 destinasyon × 100 deal = ' + all.length + ' tatil envanterine eklendi.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
