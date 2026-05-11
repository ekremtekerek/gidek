/**
 * Idempotent mock data seed for gidek.net (V1).
 *
 * Run with: `npm run seed`
 *
 * Uses the service role key, so RLS is bypassed. All upserts are keyed by
 * `slug`; running this multiple times will update existing rows in place.
 */
import { createClient } from '@supabase/supabase-js';
import { MAIN_CATEGORIES } from '../src/lib/utils/constants';
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

// ----------------------------------------------------------------------------
// MERCHANTS
// ----------------------------------------------------------------------------
type MerchantSeed = {
  slug: string;
  name: string;
  city: string;
  district?: string;
  description: string;
};

const MERCHANTS: MerchantSeed[] = [
  // İstanbul
  { slug: 'bogaz-kahve-evi',         name: 'Boğaz Kahve Evi',         city: 'İstanbul', district: 'Beşiktaş',   description: 'Boğaz manzaralı serpme kahvaltı ve geç saat sandviçler.' },
  { slug: 'karakoy-meyhane',         name: 'Karaköy Meyhane',         city: 'İstanbul', district: 'Karaköy',    description: 'Klasik İstanbul meyhanesi, deniz mahsulleri.' },
  { slug: 'kadikoy-sahne',           name: 'Kadıköy Sahne',           city: 'İstanbul', district: 'Kadıköy',    description: 'Bağımsız tiyatro, stand-up ve canlı müzik mekânı.' },
  { slug: 'arnavutkoy-spa',          name: 'Arnavutköy Spa',          city: 'İstanbul', district: 'Arnavutköy', description: 'Tarihi yalıda butik spa hizmeti.' },
  { slug: 'cihangir-bistro',         name: 'Cihangir Bistro',         city: 'İstanbul', district: 'Cihangir',   description: 'Modern Türk mutfağı, set menü ve brunch.' },
  { slug: 'sultanahmet-tours',       name: 'Sultanahmet Tours',       city: 'İstanbul', district: 'Sultanahmet',description: 'Yürüyüş turları ve özel rehberli geziler.' },
  { slug: 'levent-stage',            name: 'Levent Stage',            city: 'İstanbul', district: 'Levent',     description: 'Konser salonu, jazz ve elektronik.' },
  { slug: 'besiktas-cocuk-tiyatrosu',name: 'Beşiktaş Çocuk Tiyatrosu',city: 'İstanbul', district: 'Beşiktaş',   description: 'Hafta sonu çocuk oyunları ve atölyeler.' },
  { slug: 'sariyer-aktivite',        name: 'Sarıyer Aktivite Merkezi',city: 'İstanbul', district: 'Sarıyer',    description: 'Doğa yürüyüşleri, paintball ve kano.' },
  { slug: 'maltepe-guzellik',        name: 'Maltepe Güzellik',        city: 'İstanbul', district: 'Maltepe',    description: 'Cilt bakımı ve manikür/pedikür.' },
  // Ankara
  { slug: 'cankaya-brunch',          name: 'Çankaya Brunch',          city: 'Ankara',   district: 'Çankaya',    description: 'Bahçeli brunch ve kahvaltı.' },
  { slug: 'tunali-yemek',            name: 'Tunalı Yemek',            city: 'Ankara',   district: 'Çankaya',    description: 'Et restoranı, set menü ve özel günler.' },
  { slug: 'ankara-stand-up',         name: 'Ankara Stand Up Club',    city: 'Ankara',   district: 'Kavaklıdere',description: 'Türkçe stand-up gösterileri.' },
  // İzmir
  { slug: 'alsancak-kahvalti',       name: 'Alsancak Kahvaltı Evi',   city: 'İzmir',    district: 'Alsancak',   description: 'Ege usulü serpme kahvaltı, taze sebzeler.' },
  { slug: 'cesme-otel',              name: 'Çeşme Sahil Otel',        city: 'İzmir',    district: 'Çeşme',      description: 'Deniz kenarı butik otel.' },
  { slug: 'izmir-tiyatro',           name: 'İzmir Bağımsız Tiyatro',  city: 'İzmir',    district: 'Konak',      description: 'Çağdaş Türk tiyatrosu repertuvarı.' },
  // Antalya
  { slug: 'kaleici-restaurant',      name: 'Kaleiçi Restaurant',      city: 'Antalya',  district: 'Muratpaşa',  description: 'Tarihi sokakta Akdeniz mutfağı.' },
  { slug: 'antalya-resort',          name: 'Antalya Beach Resort',    city: 'Antalya',  district: 'Lara',       description: 'Her şey dahil tatil oteli.' },
  { slug: 'antalya-spa',             name: 'Lara Spa',                city: 'Antalya',  district: 'Lara',       description: 'Hamam, masaj ve cilt bakımı.' },
  // Bursa
  { slug: 'bursa-kahvalti',          name: 'Mudanya Kahvaltı Evi',    city: 'Bursa',    district: 'Mudanya',    description: 'Deniz kıyısında köy kahvaltısı.' },
  // Adana
  { slug: 'adana-kebap',             name: 'Adana Kebap Evi',         city: 'Adana',    district: 'Seyhan',     description: 'Geleneksel Adana kebabı, mezeler.' },
  // Eskişehir
  { slug: 'eskisehir-kurs',          name: 'Eskişehir Sanat Atölyesi',city: 'Eskişehir',district: 'Tepebaşı',   description: 'Resim, seramik ve fotoğraf kursları.' },
];

// ----------------------------------------------------------------------------
// DEALS
// ----------------------------------------------------------------------------
type DealSeed = {
  slug: string;
  merchant: string;             // merchant slug
  categories: string[];         // category slugs
  title: string;
  subtitle?: string;
  description: string;
  highlights?: string[];
  original: number;
  discounted: number;
  city: string;
  district?: string;
  venue?: string;
  durationMin?: number;
  audience: string[];
  tags: string[];
  featured?: boolean;
  validDays?: number;           // valid_until = now + validDays (default 90)
};

const D: DealSeed[] = [
  // === KAHVALTI ===
  {
    slug: 'bogaz-manzarali-2-kisilik-serpme-kahvalti',
    merchant: 'bogaz-kahve-evi', categories: ['kahvalti'],
    title: '2 Kişilik Boğaz Manzaralı Serpme Kahvaltı',
    subtitle: 'Hafta sonu 09:00–13:00 arası',
    description: 'Bordo manzaralı terasta limitsiz çay eşliğinde 25+ çeşit serpme kahvaltı tabağı. Köy yumurtası, ev yapımı reçeller, taze fırın simit ve menemen dahil.',
    highlights: ['Limitsiz çay', '25+ çeşit', 'Boğaz manzaralı teras', 'Hafta sonu özel'],
    original: 1200, discounted: 690, city: 'İstanbul', district: 'Beşiktaş',
    audience: ['couple','family'], tags: ['hafta-sonu','deniz-manzarali','populer','romantik'],
    featured: true,
  },
  {
    slug: 'cihangir-brunch-arkadaslarla',
    merchant: 'cihangir-bistro', categories: ['kahvalti'],
    title: 'Cihangir’de Cumartesi Brunch',
    subtitle: 'İki kişilik açık büfe brunch',
    description: 'Avokadolu tost, krep istasyonu, taze meyve barı ve sınırsız filtre kahve. 3 saat geçerli rezervasyon.',
    highlights: ['Açık büfe', 'Sınırsız kahve', 'Krep istasyonu'],
    original: 980, discounted: 540, city: 'İstanbul', district: 'Cihangir',
    audience: ['couple','solo','group'], tags: ['brunch','hafta-sonu','sehir-merkezi','samimi'],
  },
  {
    slug: 'cankaya-bahce-brunch',
    merchant: 'cankaya-brunch', categories: ['kahvalti'],
    title: 'Çankaya’da Bahçeli Brunch',
    subtitle: '2 kişi · Pazar günleri',
    description: 'Yeşillikler içinde 4 kişilik masada 20 çeşit kahvaltılık. Çocuklara özel meyve tabağı ve oyun alanı.',
    highlights: ['Bahçe', 'Çocuk dostu', 'Pazar özel'],
    original: 1100, discounted: 620, city: 'Ankara', district: 'Çankaya',
    audience: ['family','couple'], tags: ['brunch','cocuk-dostu','hafta-sonu','acik-hava'],
  },
  {
    slug: 'alsancak-ege-kahvalti',
    merchant: 'alsancak-kahvalti', categories: ['kahvalti'],
    title: 'Alsancak Ege Usulü Serpme Kahvaltı',
    description: 'Ege otları, lor peyniri, taze zeytin ve yöresel reçellerle 30 çeşit serpme kahvaltı. Her gün 08:00–14:00.',
    highlights: ['30 çeşit', 'Yerel otlar', 'Her gün açık'],
    original: 850, discounted: 480, city: 'İzmir', district: 'Alsancak',
    audience: ['family','couple'], tags: ['populer','yerel-favori','rahat'],
  },
  {
    slug: 'mudanya-koy-kahvaltisi',
    merchant: 'bursa-kahvalti', categories: ['kahvalti'],
    title: 'Mudanya Sahilinde Köy Kahvaltısı',
    description: 'Deniz manzarası eşliğinde köy yumurtası, kaymak, bal ve ev yapımı simit. Hafta sonu özel.',
    original: 700, discounted: 390, city: 'Bursa', district: 'Mudanya',
    audience: ['family','couple'], tags: ['deniz-manzarali','hafta-sonu','huzurlu','samimi'],
  },

  // === YEMEK ===
  {
    slug: 'karakoy-2-kisi-aksam-mezeleri',
    merchant: 'karakoy-meyhane', categories: ['yemek'],
    title: '2 Kişi Akşam Yemeği · Karaköy Meyhane',
    subtitle: 'Set menü + 1 şişe yerli içecek',
    description: '8 çeşit meze, 2 ana yemek, tatlı ve içecek. Klasik Türk meyhanesi atmosferi, canlı fasıl.',
    highlights: ['8 çeşit meze', 'Canlı fasıl', 'Set menü'],
    original: 2400, discounted: 1490, city: 'İstanbul', district: 'Karaköy',
    audience: ['couple','group'], tags: ['romantik','gece-hayati','tarihi','ozel-gun'],
    featured: true,
  },
  {
    slug: 'kaleici-akdeniz-aksam-yemegi',
    merchant: 'kaleici-restaurant', categories: ['yemek'],
    title: 'Kaleiçi’nde Akdeniz Akşam Yemeği',
    description: 'Tarihi taş sokakta bahçeli akşam yemeği. 3 kap menü, ev yapımı ekmek ve seçilmiş şarap önerisi.',
    original: 1800, discounted: 990, city: 'Antalya', district: 'Muratpaşa',
    audience: ['couple','solo'], tags: ['romantik','tarihi','sehir-merkezi','acik-hava'],
  },
  {
    slug: 'tunali-set-menu-2-kisi',
    merchant: 'tunali-yemek', categories: ['yemek'],
    title: 'Tunalı’da 2 Kişilik Et Set Menü',
    description: 'Şefin önerisi 4 kap menü: dana antrikot, mezeler, çorba ve tatlı. Akşam servisi.',
    original: 2200, discounted: 1350, city: 'Ankara', district: 'Çankaya',
    audience: ['couple','group'], tags: ['luks','ozel-gun','sehir-merkezi'],
  },
  {
    slug: 'adana-kebap-4-kisilik',
    merchant: 'adana-kebap', categories: ['yemek'],
    title: '4 Kişilik Adana Kebap Ziyafeti',
    description: 'Adana kebap, beyti, lahmacun ve mezeler. Geleneksel ocak başı sunumu.',
    original: 1600, discounted: 890, city: 'Adana', district: 'Seyhan',
    audience: ['family','group'], tags: ['yerel-favori','populer','grup-icin'],
  },
  {
    slug: 'cihangir-romantik-aksam-yemegi',
    merchant: 'cihangir-bistro', categories: ['yemek'],
    title: 'Cihangir’de Romantik Akşam Yemeği',
    subtitle: 'Tek masa, mum ışığı, 3 kap menü',
    description: 'Sadece çiftlere özel köşe masalar. Mum ışığında 3 kap menü, bir şişe ev şarabı dahil.',
    highlights: ['Mum ışığı', 'Şarap dahil', 'Çiftlere özel'],
    original: 2500, discounted: 1490, city: 'İstanbul', district: 'Cihangir',
    audience: ['couple'], tags: ['romantik','luks','ozel-gun','sessiz'],
    featured: true,
  },

  // === TIYATRO ===
  {
    slug: 'kadikoy-sahne-yetiskin-oyunu',
    merchant: 'kadikoy-sahne', categories: ['tiyatro'],
    title: 'Kadıköy Sahne · Yetişkin Tiyatro Oyunu',
    subtitle: 'Cumartesi 20:30 · 90 dakika',
    description: 'Çağdaş Türk yazarından, eleştirmenlerce alkışlanan iki perdelik oyun. 2 kişilik bilet.',
    highlights: ['Ödüllü oyun', '2 kişilik bilet', 'Hafta sonu seansı'],
    original: 800, discounted: 480, city: 'İstanbul', district: 'Kadıköy',
    durationMin: 90,
    audience: ['couple','solo','group'], tags: ['odullu','hafta-sonu','sehir-merkezi'],
  },
  {
    slug: 'besiktas-cocuk-tiyatrosu-pazar',
    merchant: 'besiktas-cocuk-tiyatrosu', categories: ['tiyatro'],
    title: 'Pazar Sabahı Çocuk Tiyatrosu · 1 Çocuk + 1 Yetişkin',
    description: 'Müzikli ve interaktif çocuk oyunu. Oyun sonrası 30 dakika atölye.',
    highlights: ['Müzikli', 'Atölye dahil', 'Pazar 11:00'],
    original: 600, discounted: 320, city: 'İstanbul', district: 'Beşiktaş',
    durationMin: 60,
    audience: ['family','kids'], tags: ['cocuk-dostu','hafta-sonu','eglenceli'],
    featured: true,
  },
  {
    slug: 'izmir-bagimsiz-tiyatro-oyun',
    merchant: 'izmir-tiyatro', categories: ['tiyatro'],
    title: 'İzmir Bağımsız Tiyatro · 2 Kişilik Bilet',
    description: 'Sahnede çağdaş bir uyarlama. 1 saat 45 dakika tek perde.',
    original: 700, discounted: 420, city: 'İzmir', district: 'Konak',
    durationMin: 105,
    audience: ['couple','solo'], tags: ['sehir-merkezi','sessiz'],
  },

  // === KONSER ===
  {
    slug: 'levent-jazz-gecesi',
    merchant: 'levent-stage', categories: ['konser'],
    title: 'Levent Jazz Gecesi · 1 Bilet',
    subtitle: 'Cuma akşamı 21:00',
    description: 'Live jazz quartet performansı. Bir ikram içecek dahil.',
    original: 950, discounted: 590, city: 'İstanbul', district: 'Levent',
    durationMin: 120,
    audience: ['couple','solo','group'], tags: ['gece-hayati','sehir-merkezi','luks'],
  },
  {
    slug: 'levent-elektronik-gece',
    merchant: 'levent-stage', categories: ['konser'],
    title: 'Levent Stage · Elektronik DJ Gecesi',
    description: 'Yerli ve yabancı DJ performansları. Açılış 23:00.',
    original: 1200, discounted: 690, city: 'İstanbul', district: 'Levent',
    audience: ['solo','group','couple'], tags: ['gece-hayati','enerjik','eglenceli'],
  },

  // === STAND UP ===
  {
    slug: 'ankara-stand-up-gosterisi',
    merchant: 'ankara-stand-up', categories: ['stand-up'],
    title: 'Ankara Stand Up · 1 Kişilik Bilet',
    description: 'Türkçe stand-up komedyenlerinden 2 saatlik gösteri. 1 ikram içecek dahil.',
    original: 650, discounted: 380, city: 'Ankara', district: 'Kavaklıdere',
    durationMin: 120,
    audience: ['couple','solo','group'], tags: ['eglenceli','gece-hayati','sehir-merkezi'],
  },
  {
    slug: 'kadikoy-stand-up-cifte-bilet',
    merchant: 'kadikoy-sahne', categories: ['stand-up'],
    title: 'Kadıköy · 2 Kişilik Stand Up Gecesi',
    description: 'Hafta sonu özel 2 kişilik bilet + masa rezervasyonu.',
    original: 900, discounted: 550, city: 'İstanbul', district: 'Kadıköy',
    audience: ['couple','group'], tags: ['hafta-sonu','eglenceli','populer'],
  },

  // === AKTIVITE ===
  {
    slug: 'sariyer-doga-yuruyusu',
    merchant: 'sariyer-aktivite', categories: ['aktivite'],
    title: 'Sarıyer’de Rehberli Doğa Yürüyüşü · 2 Kişi',
    description: 'Belgrad Ormanı’nda 3 saatlik rehberli yürüyüş, fotoğraf molaları ve piknik.',
    highlights: ['3 saat', 'Rehberli', 'Piknik dahil'],
    original: 700, discounted: 390, city: 'İstanbul', district: 'Sarıyer',
    durationMin: 180,
    audience: ['couple','family','group','solo'], tags: ['dogada','acik-hava','huzurlu','hafta-sonu'],
  },
  {
    slug: 'sariyer-paintball-grup',
    merchant: 'sariyer-aktivite', categories: ['aktivite'],
    title: 'Sarıyer · 6 Kişilik Paintball Seansı',
    description: '6 kişilik takım maçı, ekipman ve 200 atış dahil.',
    original: 2400, discounted: 1290, city: 'İstanbul', district: 'Sarıyer',
    audience: ['group','family'], tags: ['eglenceli','enerjik','grup-icin','acik-hava'],
  },
  {
    slug: 'sariyer-kano-deneyimi',
    merchant: 'sariyer-aktivite', categories: ['aktivite'],
    title: 'Sarıyer Kano Deneyimi · Tek Kişi',
    description: 'Eğitmen eşliğinde 90 dakikalık göl üstü kano. Tüm ekipman dahil.',
    original: 600, discounted: 350, city: 'İstanbul', district: 'Sarıyer',
    durationMin: 90,
    audience: ['solo','couple'], tags: ['dogada','enerjik','acik-hava'],
  },

  // === MASAJ ===
  {
    slug: 'arnavutkoy-cift-masaji',
    merchant: 'arnavutkoy-spa', categories: ['masaj'],
    title: 'Arnavutköy Spa · 60 Dakika Çift Masajı',
    subtitle: 'Yalı manzaralı oda',
    description: 'Aromaterapi yağları ile 60 dakika çift masajı. Sonrasında bitki çayı ikramı.',
    highlights: ['Çift terapist', 'Aromaterapi', 'Yalı manzarası'],
    original: 2200, discounted: 1290, city: 'İstanbul', district: 'Arnavutköy',
    durationMin: 60,
    audience: ['couple'], tags: ['romantik','luks','huzurlu','ozel-gun'],
    featured: true,
  },
  {
    slug: 'lara-hamam-masaj-paketi',
    merchant: 'antalya-spa', categories: ['masaj'],
    title: 'Lara Spa · Hamam + Masaj Paketi',
    description: 'Türk hamamı kese-köpük, 30 dk klasik masaj, sauna ve bitki çayı.',
    original: 1400, discounted: 790, city: 'Antalya', district: 'Lara',
    durationMin: 90,
    audience: ['couple','solo'], tags: ['huzurlu','luks','rahat'],
  },

  // === GUZELLIK ===
  {
    slug: 'maltepe-cilt-bakimi',
    merchant: 'maltepe-guzellik', categories: ['guzellik'],
    title: 'Maltepe · Hidrafacial Cilt Bakımı',
    description: '60 dakikalık 5 aşamalı cilt bakımı. Tüm cilt tipleri için.',
    original: 1200, discounted: 690, city: 'İstanbul', district: 'Maltepe',
    durationMin: 60,
    audience: ['solo','couple'], tags: ['luks','populer','rahat'],
  },
  {
    slug: 'maltepe-manikur-pedikur',
    merchant: 'maltepe-guzellik', categories: ['guzellik'],
    title: 'Manikür + Pedikür Paketi',
    description: 'Tek seansta klasik manikür ve pedikür uygulaması.',
    original: 550, discounted: 290, city: 'İstanbul', district: 'Maltepe',
    durationMin: 75,
    audience: ['solo'], tags: ['rahat','populer'],
  },

  // === TURLAR ===
  {
    slug: 'sultanahmet-yuruyus-turu',
    merchant: 'sultanahmet-tours', categories: ['turlar'],
    title: 'Sultanahmet Tarihi Yürüyüş Turu',
    subtitle: 'Türkçe rehberli, 3 saat',
    description: 'Ayasofya, Sultanahmet, Yerebatan ve Topkapı çevresinde tarihi yürüyüş. Müze biletleri hariç.',
    highlights: ['3 saat', 'Türkçe rehber', '2 kişilik'],
    original: 900, discounted: 490, city: 'İstanbul', district: 'Sultanahmet',
    durationMin: 180,
    audience: ['couple','family','solo','group'], tags: ['tarihi','sehir-merkezi','populer','rahat'],
    featured: true,
  },
  {
    slug: 'sultanahmet-fotograf-turu',
    merchant: 'sultanahmet-tours', categories: ['turlar'],
    title: 'Eski İstanbul Fotoğraf Turu',
    description: 'Profesyonel fotoğrafçı ile sokak fotoğrafı atölyesi. 2.5 saat.',
    original: 1100, discounted: 690, city: 'İstanbul', district: 'Sultanahmet',
    durationMin: 150,
    audience: ['solo','couple'], tags: ['tarihi','sehir-merkezi','samimi'],
  },

  // === SEHIR OTELLERI ===
  {
    slug: 'cesme-sahil-1-gece-kahvalti-dahil',
    merchant: 'cesme-otel', categories: ['tatil-otelleri'],
    title: 'Çeşme · Deniz Kenarı 1 Gece + Kahvaltı',
    subtitle: 'Çift kişilik oda',
    description: 'Deniz manzaralı çift kişilik standart odada 1 gece, sınırsız açık büfe kahvaltı dahil.',
    highlights: ['Deniz manzaralı oda', 'Kahvaltı dahil', 'Sahile sıfır'],
    original: 4800, discounted: 2890, city: 'İzmir', district: 'Çeşme',
    audience: ['couple','family'], tags: ['deniz-manzarali','luks','huzurlu','ozel-gun'],
    validDays: 180,
  },

  // === TATIL OTELLERI ===
  {
    slug: 'antalya-resort-her-sey-dahil-2-gece',
    merchant: 'antalya-resort', categories: ['tatil-otelleri'],
    title: 'Antalya · Her Şey Dahil 2 Gece Tatil',
    description: 'Her şey dahil 2 gece, aile odası, spa ve havuz erişimi.',
    original: 12000, discounted: 6900, city: 'Antalya', district: 'Lara',
    audience: ['family','couple'], tags: ['luks','huzurlu','deniz-manzarali','cocuk-dostu'],
    validDays: 180,
    featured: true,
  },

  // === KURS ===
  {
    slug: 'eskisehir-seramik-atolyesi',
    merchant: 'eskisehir-kurs', categories: ['kurs'],
    title: 'Eskişehir · Tek Seans Seramik Atölyesi',
    description: 'Çamur şekillendirme ve süsleme atölyesi. 2.5 saat. Tüm malzemeler dahil.',
    original: 750, discounted: 420, city: 'Eskişehir', district: 'Tepebaşı',
    durationMin: 150,
    audience: ['solo','couple','family'], tags: ['gizli-cevher','yeni','rahat','samimi'],
  },
];

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

function coverFor(slug: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${slug}/${w}/${h}`;
}

function inDaysISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

// ----------------------------------------------------------------------------
// SEED
// ----------------------------------------------------------------------------

async function seedCategories() {
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
  console.log(`  categories: ${rows.length}`);
}

async function seedMerchants() {
  const rows = MERCHANTS.map((m) => ({
    slug: m.slug,
    name: m.name,
    description: m.description,
    city: m.city,
    district: m.district,
    is_active: true,
    is_verified: true,
    logo_url: coverFor(`logo-${m.slug}`, 200, 200),
  }));

  const { error } = await supabase.from('merchants').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  console.log(`  merchants:  ${rows.length}`);
}

async function seedDeals() {
  const { data: cats, error: catErr } = await supabase.from('categories').select('id, slug');
  if (catErr) throw catErr;
  const catId = new Map(cats!.map((c) => [c.slug, c.id]));

  const { data: ms, error: mErr } = await supabase.from('merchants').select('id, slug');
  if (mErr) throw mErr;
  const merchantId = new Map(ms!.map((m) => [m.slug, m.id]));

  // Upsert deals
  const dealRows = D.map((d) => {
    const mId = merchantId.get(d.merchant);
    if (!mId) throw new Error(`Unknown merchant: ${d.merchant}`);
    return {
      slug: d.slug,
      merchant_id: mId,
      title: d.title,
      subtitle: d.subtitle ?? null,
      description: d.description,
      highlights: d.highlights ?? [],
      cover_image: coverFor(d.slug),
      images: [coverFor(`${d.slug}-2`, 1200, 800), coverFor(`${d.slug}-3`, 1200, 800)],
      original_price: d.original,
      discounted_price: d.discounted,
      city: d.city,
      district: d.district ?? null,
      venue_name: d.venue ?? null,
      duration_minutes: d.durationMin ?? null,
      valid_from: new Date().toISOString(),
      valid_until: inDaysISO(d.validDays ?? 90),
      tags: d.tags,
      audience: d.audience,
      is_active: true,
      is_featured: d.featured ?? false,
      published_at: new Date().toISOString(),
    };
  });

  const { error: dealErr } = await supabase.from('deals').upsert(dealRows, { onConflict: 'slug' });
  if (dealErr) throw dealErr;
  console.log(`  deals:      ${dealRows.length}`);

  // Refresh deal ids to wire junctions
  const { data: dealRowsAfter, error: postErr } = await supabase
    .from('deals')
    .select('id, slug')
    .in('slug', D.map((d) => d.slug));
  if (postErr) throw postErr;
  const dealId = new Map(dealRowsAfter!.map((d) => [d.slug, d.id]));

  const junctions = D.flatMap((d) =>
    d.categories.map((catSlug) => {
      const dId = dealId.get(d.slug);
      const cId = catId.get(catSlug);
      if (!dId || !cId) throw new Error(`Missing FK for ${d.slug} -> ${catSlug}`);
      return { deal_id: dId, category_id: cId };
    }),
  );

  const { error: jErr } = await supabase
    .from('deal_categories')
    .upsert(junctions, { onConflict: 'deal_id,category_id' });
  if (jErr) throw jErr;
  console.log(`  junctions:  ${junctions.length}`);
}

async function main() {
  console.log('Seeding gidek.net…');
  await seedCategories();
  await seedMerchants();
  await seedDeals();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
