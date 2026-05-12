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

  // --- Eklenenler (Sprint 5: zenginleştirilmiş seed) -----
  { slug: 'sisli-kahve',             name: 'Şişli Kahve & Atölye',    city: 'İstanbul', district: 'Şişli',      description: 'Bahçeli kahvaltı, brunch ve çocuk sanat atölyeleri.' },
  { slug: 'bebek-bistro',            name: 'Bebek Bistro',            city: 'İstanbul', district: 'Bebek',      description: 'Boğaz manzaralı brunch ve akşam yemekleri.' },
  { slug: 'bagdat-brunch',           name: 'Bağdat Brunch Evi',       city: 'İstanbul', district: 'Suadiye',    description: 'Caddenin en sevilen brunch noktası.' },
  { slug: 'kadikoy-brunch',          name: 'Moda Brunch',             city: 'İstanbul', district: 'Kadıköy',    description: 'Moda sahilinde bahçeli kahvaltı/brunch.' },
  { slug: 'besiktas-kahvalti',       name: 'Beşiktaş Çarşı Kahvaltı', city: 'İstanbul', district: 'Beşiktaş',   description: 'Erkenci serpme kahvaltı ve çay bahçesi.' },
  { slug: 'etiler-steakhouse',       name: 'Etiler Steakhouse',       city: 'İstanbul', district: 'Etiler',     description: 'Kuru yaşlandırılmış et menüsü.' },
  { slug: 'kurucesme-rooftop',       name: 'Kuruçeşme Rooftop',       city: 'İstanbul', district: 'Kuruçeşme',  description: 'Boğaz manzaralı çatı katı yemek ve atölyeler.' },
  { slug: 'bostanci-sahne',          name: 'Bostancı Sahne',          city: 'İstanbul', district: 'Bostancı',   description: 'Çağdaş tiyatro ve çocuk oyunları.' },
  { slug: 'beyoglu-jazz',            name: 'Beyoğlu Jazz Klübü',      city: 'İstanbul', district: 'Beyoğlu',    description: 'Canlı jazz, akşam yemeği ve set menü.' },
  { slug: 'istanbul-hizmet',         name: 'gidek Ev Hizmetleri',     city: 'İstanbul',                         description: 'Ev temizliği, mobilya montajı, kombi servisi.' },

  // Ankara
  { slug: 'bilkent-otel',            name: 'Bilkent Boutique Otel',   city: 'Ankara',   district: 'Bilkent',    description: 'Şehir otelinde 1 gece + brunch paketleri.' },

  // İzmir
  { slug: 'bornova-kafe',            name: 'Bornova Bahçe Kafe',      city: 'İzmir',    district: 'Bornova',    description: 'Üniversite çevresinde brunch ve atölyeler.' },

  // Muğla
  { slug: 'bodrum-resort',           name: 'Bodrum Sahil Resort',     city: 'Muğla',    district: 'Bodrum',     description: 'Sahile sıfır tatil oteli, su sporları paketleri.' },
  { slug: 'fethiye-otel',            name: 'Fethiye Butik Otel',      city: 'Muğla',    district: 'Fethiye',    description: 'Doğa içinde küçük butik otel.' },

  // Aydın
  { slug: 'kusadasi-turlar',         name: 'Kuşadası Tur Acentesi',   city: 'Aydın',    district: 'Kuşadası',   description: 'Tekne, ada ve yöre turları.' },

  // Çanakkale
  { slug: 'canakkale-doga',          name: 'Çanakkale Doğa',          city: 'Çanakkale',district: 'Merkez',     description: 'Bisiklet, kano ve trekking aktiviteleri.' },

  // Trabzon
  { slug: 'trabzon-yore',            name: 'Karadeniz Sofrası',       city: 'Trabzon',  district: 'Ortahisar',  description: 'Yöresel Karadeniz mutfağı.' },
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

  // ==========================================================================
  // === SPRINT 5 — ZENGİNLEŞTİRİLMİŞ SEED (≈51 yeni fırsat) ==================
  // ==========================================================================

  // === KAHVALTI (+7) ===
  {
    slug: 'sisli-aile-kahvaltisi',
    merchant: 'sisli-kahve', categories: ['kahvalti'],
    title: 'Şişli’de 4 Kişilik Aile Kahvaltısı',
    subtitle: 'Bahçeli teras, çocuk köşesi var',
    description: 'Sıcak gözleme, çay-kahve sınırsız, çocuklar için meyve tabağı ve oyun alanı. Her gün 09:00–13:00.',
    highlights: ['4 kişilik', 'Çocuk dostu', 'Sınırsız çay'],
    original: 1600, discounted: 890, city: 'İstanbul', district: 'Şişli',
    audience: ['family'], tags: ['cocuk-dostu','rahat','populer','samimi'],
  },
  {
    slug: 'bebek-bogaz-brunch',
    merchant: 'bebek-bistro', categories: ['kahvalti'],
    title: 'Bebek’te Boğaz Manzaralı Pazar Brunch',
    description: '20 çeşit açık büfe brunch, taze meyve barı ve filtre kahve. Boğaz’a sıfır masa.',
    highlights: ['Boğaz manzarası', 'Açık büfe', 'Pazar 10:00–14:00'],
    original: 1400, discounted: 790, city: 'İstanbul', district: 'Bebek',
    audience: ['couple','family'], tags: ['deniz-manzarali','brunch','romantik','luks'],
    featured: true,
  },
  {
    slug: 'bagdat-cad-sabah-kahvalti',
    merchant: 'bagdat-brunch', categories: ['kahvalti'],
    title: 'Bağdat Caddesi 2 Kişilik Serpme Kahvaltı',
    description: '20 çeşit serpme + omlet seçenekleri. Hafta içi sakin, hafta sonu canlı.',
    original: 900, discounted: 520, city: 'İstanbul', district: 'Suadiye',
    audience: ['couple','solo','group'], tags: ['sehir-merkezi','populer','yerel-favori'],
  },
  {
    slug: 'moda-bahceli-brunch',
    merchant: 'kadikoy-brunch', categories: ['kahvalti'],
    title: 'Moda’da Bahçeli Hafta Sonu Brunch',
    subtitle: 'Sahile yürüme mesafesi',
    description: 'Yaprak yeşilliği içinde 18 çeşit brunch, taze sıkılmış portakal suyu sınırsız.',
    original: 1100, discounted: 640, city: 'İstanbul', district: 'Kadıköy',
    audience: ['couple','family','group'], tags: ['brunch','hafta-sonu','acik-hava','samimi'],
  },
  {
    slug: 'besiktas-erkenci-kahvalti',
    merchant: 'besiktas-kahvalti', categories: ['kahvalti'],
    title: 'Beşiktaş Çarşı’da Erkenci Kahvaltı',
    description: '07:00’den itibaren açık. Geleneksel çay bahçesinde sade ve yerel kahvaltı.',
    original: 600, discounted: 360, city: 'İstanbul', district: 'Beşiktaş',
    audience: ['solo','couple'], tags: ['yerel-favori','sehir-merkezi','huzurlu'],
  },
  {
    slug: 'bilkent-pazar-brunchi',
    merchant: 'bilkent-otel', categories: ['kahvalti'],
    title: 'Bilkent Otelde 2 Kişilik Pazar Brunch',
    description: 'Otel restoranında açık büfe brunch, sıcak yemekler ve tatlı barı dahil.',
    original: 1500, discounted: 850, city: 'Ankara', district: 'Bilkent',
    audience: ['couple','family'], tags: ['brunch','luks','populer'],
  },
  {
    slug: 'bornova-kafe-kahvalti',
    merchant: 'bornova-kafe', categories: ['kahvalti'],
    title: 'Bornova Bahçe Kafe · Köy Kahvaltısı',
    description: 'Yerel üreticiden ürünler, ev yapımı reçel ve taze ekmek. Hafta içi de açık.',
    original: 700, discounted: 420, city: 'İzmir', district: 'Bornova',
    audience: ['family','couple','group'], tags: ['samimi','yerel-favori','rahat','acik-hava'],
  },

  // === YEMEK (+7) ===
  {
    slug: 'etiler-kuru-yaslandirilmis-et',
    merchant: 'etiler-steakhouse', categories: ['yemek'],
    title: 'Etiler Steakhouse · 2 Kişilik Et Menüsü',
    subtitle: 'Kuru yaşlandırılmış antrikot + meze + içecek',
    description: 'Şefin önerisi 4 kap menü, premium et seçenekleri. İş yemeklerine uygun.',
    highlights: ['Premium et', 'Set menü', 'İş yemeği'],
    original: 3200, discounted: 1990, city: 'İstanbul', district: 'Etiler',
    audience: ['couple','group'], tags: ['luks','business-uygun','ozel-gun'],
    featured: true,
  },
  {
    slug: 'kurucesme-rooftop-aksam',
    merchant: 'kurucesme-rooftop', categories: ['yemek'],
    title: 'Kuruçeşme Rooftop · Boğaz Manzaralı Akşam Yemeği',
    description: 'Çatı katında 3 kap menü + 2 ikram içecek. Mum ışığında romantik atmosfer.',
    original: 2800, discounted: 1690, city: 'İstanbul', district: 'Kuruçeşme',
    audience: ['couple'], tags: ['romantik','deniz-manzarali','luks','ozel-gun','gece-hayati'],
  },
  {
    slug: 'beyoglu-jazz-aksam-set',
    merchant: 'beyoglu-jazz', categories: ['yemek'],
    title: 'Beyoğlu Jazz · Akşam Yemeği + Konser',
    subtitle: '2 kişilik set menü, jazz performansı dahil',
    description: '3 kap yemek + bir şişe ev şarabı + canlı jazz performansı. Cuma-Cumartesi.',
    original: 2600, discounted: 1490, city: 'İstanbul', district: 'Beyoğlu',
    audience: ['couple','group'], tags: ['gece-hayati','romantik','sehir-merkezi','ozel-gun'],
  },
  {
    slug: 'bostanci-bahce-yemek',
    merchant: 'bostanci-sahne', categories: ['yemek'],
    title: 'Bostancı’da Bahçeli Aile Akşam Yemeği',
    description: '4 kişilik açık büfe + çocuklar için ayrı menü. Hafta içi 19:00 sonrası açık.',
    original: 1800, discounted: 990, city: 'İstanbul', district: 'Bostancı',
    audience: ['family'], tags: ['cocuk-dostu','acik-hava','rahat','grup-icin'],
  },
  {
    slug: 'bilkent-otel-aksam-yemegi',
    merchant: 'bilkent-otel', categories: ['yemek'],
    title: 'Bilkent Otel · Şefin Akşam Menüsü',
    description: 'Otel restoranında 4 kap menü, şefin önerisi. Şarap eşleştirmesi opsiyonel.',
    original: 1700, discounted: 1090, city: 'Ankara', district: 'Bilkent',
    audience: ['couple','solo'], tags: ['luks','business-uygun','sehir-merkezi'],
  },
  {
    slug: 'bodrum-balik-akşam-yemegi',
    merchant: 'bodrum-resort', categories: ['yemek'],
    title: 'Bodrum Sahil Balık Yemeği · 2 Kişi',
    description: 'Günün balığı, deniz ürünleri tabağı, salata ve içecek. Sahile yürüme mesafesi.',
    original: 2200, discounted: 1290, city: 'Muğla', district: 'Bodrum',
    audience: ['couple','family'], tags: ['deniz-manzarali','romantik','tarihi','populer'],
  },
  {
    slug: 'trabzon-karadeniz-sofrasi',
    merchant: 'trabzon-yore', categories: ['yemek'],
    title: 'Trabzon · 4 Kişilik Karadeniz Sofrası',
    description: 'Hamsi, kuymak, mıhlama, yöresel börek ve çay. Geleneksel sunum.',
    original: 1400, discounted: 790, city: 'Trabzon', district: 'Ortahisar',
    audience: ['family','group'], tags: ['yerel-favori','populer','grup-icin','samimi'],
  },

  // === TIYATRO (+3) ===
  {
    slug: 'bostanci-yetiskin-oyun',
    merchant: 'bostanci-sahne', categories: ['tiyatro'],
    title: 'Bostancı Sahne · Yetişkin Oyunu · 2 Kişi',
    description: '90 dakikalık çağdaş Türk oyunu, hafta içi seans. Ödüllü yapıt.',
    original: 700, discounted: 420, city: 'İstanbul', district: 'Bostancı',
    durationMin: 90,
    audience: ['couple','solo','group'], tags: ['odullu','sehir-merkezi','sessiz'],
  },
  {
    slug: 'bostanci-cocuk-tiyatrosu',
    merchant: 'bostanci-sahne', categories: ['tiyatro'],
    title: 'Bostancı · Cumartesi Çocuk Tiyatrosu',
    description: 'Müzikli, interaktif çocuk oyunu. Aile bileti (1 yetişkin + 1 çocuk).',
    original: 550, discounted: 290, city: 'İstanbul', district: 'Bostancı',
    durationMin: 60,
    audience: ['family','kids'], tags: ['cocuk-dostu','hafta-sonu','eglenceli'],
  },
  {
    slug: 'beyoglu-cagdas-tiyatro',
    merchant: 'beyoglu-jazz', categories: ['tiyatro'],
    title: 'Beyoğlu · Çağdaş Tiyatro Performansı',
    description: '75 dakikalık tek perde, deneysel sahne uyarlaması.',
    original: 650, discounted: 380, city: 'İstanbul', district: 'Beyoğlu',
    durationMin: 75,
    audience: ['couple','solo'], tags: ['sehir-merkezi','tarihi','sessiz'],
  },

  // === KONSER (+3) ===
  {
    slug: 'beyoglu-jazz-pazartesi',
    merchant: 'beyoglu-jazz', categories: ['konser'],
    title: 'Beyoğlu Jazz · Pazartesi Akustik Gece',
    description: 'Türk jazz sanatçılarından akustik performans. 2 kişilik bilet, ikram dahil.',
    original: 850, discounted: 490, city: 'İstanbul', district: 'Beyoğlu',
    durationMin: 100,
    audience: ['couple','solo'], tags: ['gece-hayati','sehir-merkezi','samimi','romantik'],
  },
  {
    slug: 'levent-rock-cuma',
    merchant: 'levent-stage', categories: ['konser'],
    title: 'Levent Stage · Cuma Rock Gecesi',
    description: 'Yerli rock gruplarından 3 saatlik performans. Genç kitle, enerjik atmosfer.',
    original: 700, discounted: 390, city: 'İstanbul', district: 'Levent',
    audience: ['solo','group','couple'], tags: ['gece-hayati','enerjik','eglenceli'],
  },
  {
    slug: 'izmir-akustik-konser',
    merchant: 'izmir-tiyatro', categories: ['konser'],
    title: 'İzmir · Akustik Türkçe Konser',
    description: 'Akustik düzenlemelerle popüler şarkılar, 2 kişilik bilet.',
    original: 600, discounted: 360, city: 'İzmir', district: 'Konak',
    audience: ['couple','solo','group'], tags: ['samimi','sehir-merkezi','populer'],
  },

  // === STAND UP (+2) ===
  {
    slug: 'kurucesme-stand-up-cifte',
    merchant: 'kurucesme-rooftop', categories: ['stand-up'],
    title: 'Kuruçeşme Çatı · 2 Kişilik Stand Up Gecesi',
    description: 'Açık hava sahne, 2 saatlik gösteri + 2 ikram içecek.',
    original: 1100, discounted: 640, city: 'İstanbul', district: 'Kuruçeşme',
    durationMin: 120,
    audience: ['couple','group'], tags: ['gece-hayati','acik-hava','populer','eglenceli'],
  },
  {
    slug: 'izmir-stand-up-bilet',
    merchant: 'izmir-tiyatro', categories: ['stand-up'],
    title: 'İzmir · Stand Up Salı Gecesi',
    description: 'Türkçe stand-up performansı, 1 kişilik bilet.',
    original: 500, discounted: 290, city: 'İzmir', district: 'Konak',
    durationMin: 90,
    audience: ['solo','couple','group'], tags: ['eglenceli','gece-hayati','sehir-merkezi'],
  },

  // === AKTIVITE (+5) ===
  {
    slug: 'bodrum-sup-paddle',
    merchant: 'bodrum-resort', categories: ['aktivite'],
    title: 'Bodrum’da SUP (Stand Up Paddle) Deneyimi',
    description: 'Eğitmen eşliğinde 1.5 saatlik denizde paddle. Tüm ekipman dahil.',
    original: 800, discounted: 450, city: 'Muğla', district: 'Bodrum',
    durationMin: 90,
    audience: ['solo','couple','group'], tags: ['acik-hava','enerjik','deniz-manzarali','dogada'],
    featured: true,
  },
  {
    slug: 'sariyer-bisiklet-turu',
    merchant: 'sariyer-aktivite', categories: ['aktivite'],
    title: 'Sarıyer Belgrad Ormanı Bisiklet Turu · 2 Kişi',
    description: 'Rehberli 3 saatlik bisiklet turu, kiralık bisiklet ve kask dahil.',
    original: 900, discounted: 540, city: 'İstanbul', district: 'Sarıyer',
    durationMin: 180,
    audience: ['couple','solo','family','group'], tags: ['dogada','enerjik','acik-hava','hafta-sonu'],
  },
  {
    slug: 'canakkale-trekking-grup',
    merchant: 'canakkale-doga', categories: ['aktivite'],
    title: 'Çanakkale · 6 Kişilik Trekking Etkinliği',
    description: 'Yarımada doğa parkurunda rehberli yürüyüş. 4 saat, mola çayı dahil.',
    original: 1800, discounted: 990, city: 'Çanakkale', district: 'Merkez',
    durationMin: 240,
    audience: ['group','solo','couple'], tags: ['dogada','huzurlu','grup-icin','acik-hava'],
  },
  {
    slug: 'sariyer-piknik-paketi',
    merchant: 'sariyer-aktivite', categories: ['aktivite'],
    title: 'Sarıyer Hafta Sonu Aile Pikniği · 4 Kişi',
    description: 'Hazır piknik sepeti, masa rezervasyonu ve oyun alanı erişimi.',
    original: 1200, discounted: 690, city: 'İstanbul', district: 'Sarıyer',
    audience: ['family','group'], tags: ['cocuk-dostu','dogada','hafta-sonu','rahat'],
  },
  {
    slug: 'canakkale-kano-deneyimi',
    merchant: 'canakkale-doga', categories: ['aktivite'],
    title: 'Çanakkale · Tek Kişilik Kano Deneyimi',
    description: 'Eğitmenli 2 saatlik nehir üstü kano, ekipman dahil.',
    original: 700, discounted: 390, city: 'Çanakkale', district: 'Merkez',
    durationMin: 120,
    audience: ['solo','couple'], tags: ['dogada','enerjik','acik-hava','huzurlu'],
  },

  // === MASAJ (+4) ===
  {
    slug: 'cihangir-aroma-terapi',
    merchant: 'cihangir-bistro', categories: ['masaj'],
    title: 'Cihangir · 75 Dakika Aromaterapi Masajı',
    description: 'Lavanta ve okaliptüs yağları ile derin doku masajı. Müsaitlik 7 gün.',
    original: 1100, discounted: 690, city: 'İstanbul', district: 'Cihangir',
    durationMin: 75,
    audience: ['solo','couple'], tags: ['huzurlu','luks','rahat','sessiz'],
  },
  {
    slug: 'arnavutkoy-tek-kisi-masaj',
    merchant: 'arnavutkoy-spa', categories: ['masaj'],
    title: 'Arnavutköy Spa · Tek Kişilik 60 Dk Masaj',
    description: 'Çift terapist seçeneği, ardından bitki çayı ikramı.',
    original: 1100, discounted: 650, city: 'İstanbul', district: 'Arnavutköy',
    durationMin: 60,
    audience: ['solo'], tags: ['rahat','luks','huzurlu'],
  },
  {
    slug: 'lara-cift-masaj-paketi',
    merchant: 'antalya-spa', categories: ['masaj'],
    title: 'Lara · Çift Masajı + Hamam Paketi',
    description: '90 dakikalık çift masajı, hamam ve özel oda. Romantik anılar için.',
    original: 2400, discounted: 1390, city: 'Antalya', district: 'Lara',
    durationMin: 120,
    audience: ['couple'], tags: ['romantik','luks','huzurlu','ozel-gun'],
    featured: true,
  },
  {
    slug: 'bodrum-spa-deneyimi',
    merchant: 'bodrum-resort', categories: ['masaj'],
    title: 'Bodrum Resort · Spa + Sauna Paketi',
    description: 'Tesis spa erişimi 3 saat + 50 dakika klasik masaj.',
    original: 1600, discounted: 890, city: 'Muğla', district: 'Bodrum',
    durationMin: 180,
    audience: ['couple','solo'], tags: ['luks','huzurlu','deniz-manzarali','rahat'],
  },

  // === GUZELLIK (+3) ===
  {
    slug: 'beyoglu-manikur-pedikur',
    merchant: 'beyoglu-jazz', categories: ['guzellik'],
    title: 'Beyoğlu · Manikür + Pedikür Paketi',
    description: 'Tek seansta klasik manikür ve pedikür. Hafta içi indirimli.',
    original: 600, discounted: 320, city: 'İstanbul', district: 'Beyoğlu',
    durationMin: 75,
    audience: ['solo'], tags: ['rahat','populer','sehir-merkezi'],
  },
  {
    slug: 'cihangir-cilt-bakimi-deluxe',
    merchant: 'arnavutkoy-spa', categories: ['guzellik'],
    title: 'Cihangir · Hidrafacial + LED Terapi',
    description: '90 dakikalık 6 aşamalı cilt bakımı. Tüm cilt tipleri için.',
    original: 1500, discounted: 890, city: 'İstanbul', district: 'Arnavutköy',
    durationMin: 90,
    audience: ['solo','couple'], tags: ['luks','populer','rahat'],
  },
  {
    slug: 'izmir-sac-bakimi',
    merchant: 'izmir-tiyatro', categories: ['guzellik'],
    title: 'İzmir · Saç Bakımı + Şekil Verme',
    description: 'Yıkama, bakım maskesi, kesim ve şekil verme. 75 dakika.',
    original: 700, discounted: 390, city: 'İzmir', district: 'Konak',
    durationMin: 75,
    audience: ['solo'], tags: ['populer','rahat','sehir-merkezi'],
  },

  // === TURLAR (+3) ===
  {
    slug: 'kusadasi-tekne-turu',
    merchant: 'kusadasi-turlar', categories: ['turlar'],
    title: 'Kuşadası · 5 Koy Tekne Turu',
    subtitle: 'Tüm gün, öğle yemeği dahil',
    description: '5 farklı koyda yüzme molası, öğle yemeği ve müzik. Tekne kapasitesi 30 kişi.',
    highlights: ['Tam gün', 'Yemek dahil', '5 koy'],
    original: 1200, discounted: 690, city: 'Aydın', district: 'Kuşadası',
    durationMin: 480,
    audience: ['family','couple','group','solo'], tags: ['acik-hava','populer','deniz-manzarali','grup-icin'],
    featured: true,
  },
  {
    slug: 'sultanahmet-yemek-turu',
    merchant: 'sultanahmet-tours', categories: ['turlar'],
    title: 'Sultanahmet · Yemek ve Sokak Lezzetleri Turu',
    description: 'Tarihi yarımadada 5 farklı yemek durağı, rehber eşliğinde 3.5 saat.',
    original: 1400, discounted: 790, city: 'İstanbul', district: 'Sultanahmet',
    durationMin: 210,
    audience: ['couple','solo','family','group'], tags: ['tarihi','sehir-merkezi','populer','yerel-favori'],
  },
  {
    slug: 'kusadasi-efes-turu',
    merchant: 'kusadasi-turlar', categories: ['turlar'],
    title: 'Kuşadası · Efes Antik Kenti Turu',
    description: 'Türkçe rehberli yarım gün Efes turu, ulaşım dahil.',
    original: 950, discounted: 540, city: 'Aydın', district: 'Kuşadası',
    durationMin: 240,
    audience: ['family','couple','solo','group'], tags: ['tarihi','populer','rahat'],
  },

  // === SEHIR OTELLERI (+3) ===
  {
    slug: 'bilkent-1-gece-kahvalti',
    merchant: 'bilkent-otel', categories: ['sehir-otelleri'],
    title: 'Ankara Bilkent · 1 Gece Konaklama + Kahvaltı',
    description: 'Standart çift kişilik oda, açık büfe kahvaltı dahil.',
    original: 3200, discounted: 1890, city: 'Ankara', district: 'Bilkent',
    audience: ['couple','solo','family'], tags: ['business-uygun','luks','sehir-merkezi'],
    validDays: 180,
  },
  {
    slug: 'cesme-1-gece-spa',
    merchant: 'cesme-otel', categories: ['sehir-otelleri'],
    title: 'Çeşme · 1 Gece + Spa Erişimi',
    description: 'Deniz manzaralı oda, kahvaltı ve spa erişimi 2 saat.',
    original: 4200, discounted: 2490, city: 'İzmir', district: 'Çeşme',
    audience: ['couple'], tags: ['romantik','luks','deniz-manzarali','huzurlu'],
    validDays: 180,
  },
  {
    slug: 'antalya-1-gece-her-sey',
    merchant: 'antalya-resort', categories: ['sehir-otelleri'],
    title: 'Antalya · 1 Gece Her Şey Dahil',
    description: 'Lara’da her şey dahil 1 gece konaklama, havuz ve spa erişimi.',
    original: 5500, discounted: 3290, city: 'Antalya', district: 'Lara',
    audience: ['couple','family'], tags: ['luks','huzurlu','deniz-manzarali','cocuk-dostu'],
    validDays: 180,
  },

  // === TATIL OTELLERI (+3) ===
  {
    slug: 'bodrum-3-gece-paket',
    merchant: 'bodrum-resort', categories: ['tatil-otelleri'],
    title: 'Bodrum · 3 Gece Yarım Pansiyon Paket',
    description: 'Sahile sıfır oda, yarım pansiyon ve havuz erişimi.',
    original: 14000, discounted: 8290, city: 'Muğla', district: 'Bodrum',
    audience: ['couple','family'], tags: ['luks','deniz-manzarali','huzurlu','cocuk-dostu'],
    validDays: 180,
    featured: true,
  },
  {
    slug: 'fethiye-2-gece-butik',
    merchant: 'fethiye-otel', categories: ['tatil-otelleri'],
    title: 'Fethiye · 2 Gece Butik Otel',
    description: 'Doğa içinde butik otelde 2 gece, kahvaltı dahil.',
    original: 7800, discounted: 4490, city: 'Muğla', district: 'Fethiye',
    audience: ['couple','solo'], tags: ['romantik','dogada','huzurlu','luks'],
    validDays: 180,
  },
  {
    slug: 'antalya-aile-3-gece',
    merchant: 'antalya-resort', categories: ['tatil-otelleri'],
    title: 'Antalya · Ailecek 3 Gece Her Şey Dahil',
    description: 'Aile odası, çocuklar için aktivite kulübü, spa ve havuz.',
    original: 18500, discounted: 10900, city: 'Antalya', district: 'Lara',
    audience: ['family'], tags: ['luks','cocuk-dostu','deniz-manzarali','huzurlu'],
    validDays: 180,
  },

  // === KURS (+4) ===
  {
    slug: 'sisli-cocuk-resim-atolyesi',
    merchant: 'sisli-kahve', categories: ['kurs'],
    title: 'Şişli · Çocuklar İçin Resim Atölyesi',
    description: '7-12 yaş için 90 dakikalık tek seans atölye, malzemeler dahil.',
    original: 500, discounted: 280, city: 'İstanbul', district: 'Şişli',
    durationMin: 90,
    audience: ['kids','family'], tags: ['cocuk-dostu','samimi','yeni','hafta-sonu'],
  },
  {
    slug: 'kurucesme-yoga-atolye',
    merchant: 'kurucesme-rooftop', categories: ['kurs'],
    title: 'Kuruçeşme · Açık Hava Yoga Atölyesi',
    description: 'Çatıda 60 dakikalık vinyasa yoga seansı. Mat sağlanır.',
    original: 450, discounted: 250, city: 'İstanbul', district: 'Kuruçeşme',
    durationMin: 60,
    audience: ['solo','couple'], tags: ['huzurlu','rahat','acik-hava','populer','yeni'],
  },
  {
    slug: 'bornova-fotograf-kursu',
    merchant: 'bornova-kafe', categories: ['kurs'],
    title: 'Bornova · Tek Seans Fotoğraf Atölyesi',
    description: 'Sokak fotoğrafı pratik atölyesi, 3 saat. Kameranızla katılım.',
    original: 800, discounted: 450, city: 'İzmir', district: 'Bornova',
    durationMin: 180,
    audience: ['solo','couple'], tags: ['gizli-cevher','samimi','yeni'],
  },
  {
    slug: 'besiktas-yemek-atolyesi',
    merchant: 'besiktas-kahvalti', categories: ['kurs'],
    title: 'Beşiktaş · İtalyan Yemekleri Atölyesi',
    description: 'Şef eşliğinde fresh pasta yapımı. 2 saat, malzemeler ve şarap dahil.',
    original: 950, discounted: 540, city: 'İstanbul', district: 'Beşiktaş',
    durationMin: 120,
    audience: ['couple','solo'], tags: ['samimi','populer','yeni','sehir-merkezi'],
  },

  // === HİZMET (+4) ===
  {
    slug: 'istanbul-ev-temizligi-4-saat',
    merchant: 'istanbul-hizmet', categories: ['hizmet'],
    title: 'Profesyonel Ev Temizliği · 4 Saat',
    description: '2 personel, malzeme dahil, sigortalı temizlik. Aynı gün rezervasyon mümkün.',
    highlights: ['Sigortalı', '2 personel', 'Malzeme dahil'],
    original: 1500, discounted: 890, city: 'İstanbul',
    durationMin: 240,
    audience: ['solo','family'], tags: ['aninda-onay','rahat','populer'],
  },
  {
    slug: 'istanbul-mobilya-montaji',
    merchant: 'istanbul-hizmet', categories: ['hizmet'],
    title: 'Mobilya Montaj Hizmeti · 1 Birim',
    description: 'IKEA, Bellona ve benzeri tek mobilya montajı. Ortalama 1-2 saat.',
    original: 600, discounted: 350, city: 'İstanbul',
    durationMin: 120,
    audience: ['solo','family'], tags: ['aninda-onay','rahat'],
  },
  {
    slug: 'istanbul-kombi-bakim',
    merchant: 'istanbul-hizmet', categories: ['hizmet'],
    title: 'Kombi Bakım ve Kontrol Servisi',
    description: 'Yetkili teknisyen, kombi bakımı ve performans testi.',
    original: 800, discounted: 490, city: 'İstanbul',
    durationMin: 60,
    audience: ['solo','family'], tags: ['aninda-onay','populer'],
  },
  {
    slug: 'istanbul-cam-temizligi',
    merchant: 'istanbul-hizmet', categories: ['hizmet'],
    title: 'Cam Temizliği · Daire (3 odaya kadar)',
    description: 'İç ve dış cam silme, profesyonel ekipman ile.',
    original: 700, discounted: 390, city: 'İstanbul',
    durationMin: 120,
    audience: ['solo','family'], tags: ['aninda-onay','rahat'],
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
