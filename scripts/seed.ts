/**
 * Idempotent mock data seed for gidek.net (V1).
 *
 * Run with: `npm run seed`
 *
 * Uses the service role key, so RLS is bypassed. All upserts are keyed by
 * `slug`; running this multiple times will update existing rows in place.
 */
import { createClient } from '@supabase/supabase-js';
import { dealEmbeddingText, embed, toPgVector } from '../src/lib/ai/embeddings';
import { MAIN_CATEGORIES } from '../src/lib/utils/constants';
import { CITY_CENTROIDS, ISTANBUL_CENTER, type LatLng } from '../src/lib/utils/geo';
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

  // --- Sprint 13 — ek tedarikçiler ----------------------------------------
  // İstanbul (semt çeşitliliği)
  { slug: 'galata-bistro',           name: 'Galata Bistro',           city: 'İstanbul', district: 'Galata',     description: 'Tarihi sokakta brunch ve şarap akşamları.' },
  { slug: 'maslak-otel',             name: 'Maslak Plaza Otel',       city: 'İstanbul', district: 'Maslak',     description: 'Business kullanıcılar için şehir oteli.' },
  { slug: 'uskudar-aktivite',        name: 'Üsküdar Sahil Spor',      city: 'İstanbul', district: 'Üsküdar',    description: 'Yoga, pilates, koşu kulübü ve kano.' },
  { slug: 'pera-stand-up',           name: 'Pera Stand Up',           city: 'İstanbul', district: 'Beyoğlu',    description: 'Beyoğlu’da Türkçe stand-up gecesi.' },
  { slug: 'cankaya-spa',             name: 'Çankaya Wellness',        city: 'Ankara',   district: 'Çankaya',    description: 'Spa, masaj ve cilt bakımı merkezi.' },
  { slug: 'sisli-cocuk-tiyatrosu',   name: 'Şişli Çocuk Sahnesi',     city: 'İstanbul', district: 'Şişli',      description: 'Hafta sonu çocuk oyunları ve atölyeler.' },

  // Yeni şehirler
  { slug: 'konya-mutfak',            name: 'Konya Mevlana Lokantası', city: 'Konya',    district: 'Selçuklu',   description: 'Etli ekmek, fırın kebabı, helva.' },
  { slug: 'gaziantep-baklava',       name: 'Gaziantep Lezzet Evi',    city: 'Gaziantep',district: 'Şahinbey',   description: 'Baklava, katmer, beyran çorbası.' },
  { slug: 'bodrum-beach',            name: 'Bodrum Beach Club',       city: 'Muğla',    district: 'Bodrum',     description: 'Şezlong + havuz + DJ partileri.' },
  { slug: 'marmaris-otel',           name: 'Marmaris Yat Otel',       city: 'Muğla',    district: 'Marmaris',   description: 'Marina manzaralı tatil oteli.' },
  { slug: 'kapadokya-balonu',        name: 'Kapadokya Sky',           city: 'Nevşehir', district: 'Göreme',     description: 'Sıcak hava balonu ve doğa turları.' },
  { slug: 'didim-otel',              name: 'Didim Altınkum Resort',   city: 'Aydın',    district: 'Didim',      description: 'Sahile sıfır her şey dahil resort.' },
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

  // ==========================================================================
  // === SPRINT 13 — 200'e çıkaran yeni fırsatlar =============================
  // ==========================================================================

  // === KAHVALTI (+10) ===
  { slug: 'galata-pazar-brunch',     merchant: 'galata-bistro',    categories: ['kahvalti'], title: 'Galata Kuleli Pazar Brunch · 2 Kişi', description: 'Galata Kulesi manzarasına bakan açık teras, 22 çeşit brunch.', original: 1500, discounted: 850, city: 'İstanbul', district: 'Galata', audience: ['couple','solo','group'], tags: ['brunch','sehir-merkezi','tarihi','populer'] },
  { slug: 'uskudar-sahil-kahvalti',  merchant: 'uskudar-aktivite', categories: ['kahvalti'], title: 'Üsküdar Sahil 2 Kişilik Kahvaltı', description: 'Boğaz’a karşı sade köy kahvaltısı, koşu sonrası favorimiz.', original: 750, discounted: 440, city: 'İstanbul', district: 'Üsküdar', audience: ['couple','solo','family'], tags: ['deniz-manzarali','hafta-sonu','huzurlu'] },
  { slug: 'sisli-erkenci-omlet',     merchant: 'sisli-kahve',      categories: ['kahvalti'], title: 'Şişli 07:00 Erkenci Omlet & Kahve', description: 'İş öncesi açık 25 dk hızlı kahvaltı + filtre kahve.', original: 400, discounted: 220, city: 'İstanbul', district: 'Şişli', audience: ['solo','couple'], tags: ['son-dakika','business-uygun','sehir-merkezi'] },
  { slug: 'bebek-glutensiz-brunch',  merchant: 'bebek-bistro',     categories: ['kahvalti'], title: 'Bebek Glütensiz Brunch', description: 'Tüm çeşitlerde glütensiz alternatif. Çölyak güvenli mutfak.', original: 1200, discounted: 720, city: 'İstanbul', district: 'Bebek', audience: ['couple','solo'], tags: ['glutensiz','samimi','deniz-manzarali'] },
  { slug: 'kadikoy-vegan-brunch',    merchant: 'kadikoy-brunch',   categories: ['kahvalti'], title: 'Moda Vegan Brunch Tabağı', description: 'Avokado tost, kaju peyniri, smoothie bowl. Tamamen vegan.', original: 850, discounted: 490, city: 'İstanbul', district: 'Kadıköy', audience: ['couple','solo'], tags: ['vegan','brunch','populer','samimi'] },
  { slug: 'cesme-zeytin-kahvalti',   merchant: 'alsancak-kahvalti',categories: ['kahvalti'], title: 'Çeşme Köyünde Zeytinlikte Kahvaltı', description: 'Ege’nin köy serpme kahvaltısı, zeytinliklerin arasında.', original: 900, discounted: 540, city: 'İzmir', district: 'Çeşme', audience: ['couple','family'], tags: ['acik-hava','huzurlu','samimi','dogada'] },
  { slug: 'antalya-kaleici-kahvalti',merchant: 'kaleici-restaurant',categories:['kahvalti'], title: 'Kaleiçi Tarihi Konak Kahvaltı', description: 'Osmanlı konağında bahçeli serpme kahvaltı.', original: 1100, discounted: 640, city: 'Antalya', district: 'Muratpaşa', audience: ['couple','family'], tags: ['tarihi','samimi','sehir-merkezi'] },
  { slug: 'gaziantep-katmer',        merchant: 'gaziantep-baklava',categories: ['kahvalti'], title: 'Gaziantep Geleneksel Katmer Kahvaltısı', description: 'Antep usulü katmer + menemen + çay. 2 kişilik.', original: 600, discounted: 340, city: 'Gaziantep', district: 'Şahinbey', audience: ['couple','solo','family'], tags: ['yerel-favori','gizli-cevher','samimi'] },
  { slug: 'bilkent-pazartesi-brunch',merchant: 'bilkent-otel',     categories: ['kahvalti'], title: 'Bilkent Otel Hafta İçi Brunch', description: 'İş günlerinde sakin, sınırsız çay/kahve.', original: 950, discounted: 540, city: 'Ankara', district: 'Bilkent', audience: ['solo','couple'], tags: ['business-uygun','rahat','huzurlu'] },
  { slug: 'konya-mutfak-yore-kahvalti', merchant: 'konya-mutfak', categories: ['kahvalti'], title: 'Konya Yöresel Etli Pide Kahvaltı', description: 'Pazar sabahı Konya usulü kahvaltı. Etli pide dahil.', original: 700, discounted: 420, city: 'Konya', district: 'Selçuklu', audience: ['family','couple'], tags: ['yerel-favori','gizli-cevher','populer'] },

  // === YEMEK (+10) ===
  { slug: 'galata-bistro-aksam',     merchant: 'galata-bistro',    categories: ['yemek'], title: 'Galata Bistro · 3 Kap Akşam Yemeği', description: 'Şefin önerisi 3 kap menü + 1 kadeh şarap.', original: 2200, discounted: 1290, city: 'İstanbul', district: 'Galata', audience: ['couple'], tags: ['romantik','sehir-merkezi','tarihi','luks'] },
  { slug: 'maslak-business-yemek',   merchant: 'maslak-otel',      categories: ['yemek'], title: 'Maslak · Business İş Yemeği Menü', description: '2 kişilik öğle yemeği. Sessiz köşe masalar.', original: 1800, discounted: 990, city: 'İstanbul', district: 'Maslak', audience: ['couple','group'], tags: ['business-uygun','luks','sehir-merkezi'] },
  { slug: 'bagdat-balik-aksam',      merchant: 'bagdat-brunch',    categories: ['yemek'], title: 'Bağdat Caddesi 2 Kişilik Balık Mezesi', description: 'Mevsim balığı + 10 çeşit meze. Cuma-Cumartesi.', original: 2400, discounted: 1390, city: 'İstanbul', district: 'Suadiye', audience: ['couple','group'], tags: ['romantik','gece-hayati','populer','luks'] },
  { slug: 'cihangir-iki-kisi-meze',  merchant: 'cihangir-bistro',  categories: ['yemek'], title: 'Cihangir 2 Kişilik Meze + Şarap Gecesi', description: 'Şarap eşliğinde 12 çeşit meze + ana yemek.', original: 2000, discounted: 1190, city: 'İstanbul', district: 'Cihangir', audience: ['couple'], tags: ['romantik','samimi','sehir-merkezi'] },
  { slug: 'konya-etli-ekmek',        merchant: 'konya-mutfak',     categories: ['yemek'], title: 'Konya Mevlana 4 Kişilik Et Sofrası', description: 'Etli ekmek, fırın kebabı, çorba, helva.', original: 1600, discounted: 890, city: 'Konya', district: 'Selçuklu', audience: ['family','group'], tags: ['yerel-favori','grup-icin','tarihi'] },
  { slug: 'gaziantep-mutfak-tabagi', merchant: 'gaziantep-baklava',categories: ['yemek'], title: 'Antep Mutfağı Tadım Tabağı · 2 Kişi', description: 'Beyran, lahmacun, kibe, baklava. Tadım menüsü.', original: 1400, discounted: 790, city: 'Gaziantep', district: 'Şahinbey', audience: ['couple','solo'], tags: ['yerel-favori','populer','gizli-cevher'] },
  { slug: 'bodrum-balik-iskele',     merchant: 'bodrum-resort',    categories: ['yemek'], title: 'Bodrum İskele Balık Akşam Yemeği', description: 'İskelede günün balığı, beyaz şarap, gün batımı.', original: 2800, discounted: 1690, city: 'Muğla', district: 'Bodrum', audience: ['couple','group'], tags: ['romantik','deniz-manzarali','luks','ozel-gun'] },
  { slug: 'antalya-osmanli-mutfak',  merchant: 'kaleici-restaurant',categories:['yemek'], title: 'Antalya Osmanlı Saray Mutfağı', description: 'Tarihi reçeteler, tandır eti, gül şerbeti.', original: 1900, discounted: 1090, city: 'Antalya', district: 'Muratpaşa', audience: ['couple','family'], tags: ['tarihi','luks','populer'] },
  { slug: 'kurucesme-vip-aksam',     merchant: 'kurucesme-rooftop',categories: ['yemek'], title: 'Kuruçeşme Rooftop VIP Akşam · 2 Kişi', description: 'Özel masada Boğaz manzarası, premium menü, şampanya.', original: 4500, discounted: 2690, city: 'İstanbul', district: 'Kuruçeşme', audience: ['couple'], tags: ['romantik','luks','ozel-gun','deniz-manzarali'], featured: true },
  { slug: 'cesme-otel-aksam',        merchant: 'cesme-otel',       categories: ['yemek'], title: 'Çeşme Sahil Otel · A La Carte Akşam Yemeği', description: 'Plaja sıfır restoran, deniz mahsulleri menü.', original: 2200, discounted: 1290, city: 'İzmir', district: 'Çeşme', audience: ['couple','family'], tags: ['deniz-manzarali','luks','romantik'] },

  // === TIYATRO (+5) ===
  { slug: 'sisli-cocuk-pazar',       merchant: 'sisli-cocuk-tiyatrosu', categories: ['tiyatro'], title: 'Şişli Çocuk Sahnesi Pazar Matine', description: 'Müzikli interaktif çocuk oyunu, atölye dahil.', original: 600, discounted: 320, city: 'İstanbul', district: 'Şişli', durationMin: 60, audience: ['family','kids'], tags: ['cocuk-dostu','hafta-sonu','eglenceli'] },
  { slug: 'sisli-cocuk-cumartesi',   merchant: 'sisli-cocuk-tiyatrosu', categories: ['tiyatro'], title: 'Şişli Çocuk Sahnesi Cumartesi · Yetişkin + Çocuk', description: 'Aile bileti, hafta sonu interaktif gösteri.', original: 550, discounted: 290, city: 'İstanbul', district: 'Şişli', durationMin: 55, audience: ['family','kids'], tags: ['cocuk-dostu','hafta-sonu','samimi'] },
  { slug: 'kadikoy-deneysel',        merchant: 'kadikoy-sahne',    categories: ['tiyatro'], title: 'Kadıköy Deneysel Tiyatro Gecesi', description: '2 kişilik bilet, çağdaş deneysel performans.', original: 750, discounted: 440, city: 'İstanbul', district: 'Kadıköy', durationMin: 90, audience: ['couple','solo'], tags: ['odullu','gizli-cevher','sessiz'] },
  { slug: 'bostanci-tek-perde-2',    merchant: 'bostanci-sahne',   categories: ['tiyatro'], title: 'Bostancı · Çağdaş Tek Perde · 2 Kişi', description: 'Çağdaş yapım, hafta içi indirimli bilet.', original: 700, discounted: 380, city: 'İstanbul', district: 'Bostancı', durationMin: 85, audience: ['couple','solo'], tags: ['sehir-merkezi','odullu','sessiz'] },
  { slug: 'izmir-cocuk-tiyatrosu',   merchant: 'izmir-tiyatro',    categories: ['tiyatro'], title: 'İzmir · Hafta Sonu Çocuk Tiyatrosu', description: 'Aile bileti, atölye dahil 60 dakika.', original: 500, discounted: 260, city: 'İzmir', district: 'Konak', durationMin: 60, audience: ['family','kids'], tags: ['cocuk-dostu','hafta-sonu','samimi'] },

  // === KONSER (+5) ===
  { slug: 'beyoglu-akustik-cuma',    merchant: 'beyoglu-jazz',     categories: ['konser'], title: 'Beyoğlu · Cuma Akustik Türk Klasikleri', description: 'Türk klasikleri akustik düzenlemeyle. 2 kişilik bilet.', original: 900, discounted: 540, city: 'İstanbul', district: 'Beyoğlu', durationMin: 105, audience: ['couple','solo'], tags: ['gece-hayati','romantik','samimi'] },
  { slug: 'levent-blues',            merchant: 'levent-stage',     categories: ['konser'], title: 'Levent Stage · Blues Gecesi', description: 'Uluslararası blues sanatçıları, 2 saatlik gösteri.', original: 1100, discounted: 660, city: 'İstanbul', district: 'Levent', durationMin: 120, audience: ['couple','solo','group'], tags: ['gece-hayati','populer','enerjik'] },
  { slug: 'bodrum-beach-konser',     merchant: 'bodrum-beach',     categories: ['konser'], title: 'Bodrum Beach Club · Yaz Konseri', description: 'Açık hava sahne, ünlü DJ’ler, yaz partisi.', original: 1500, discounted: 890, city: 'Muğla', district: 'Bodrum', audience: ['couple','group','solo'], tags: ['gece-hayati','enerjik','acik-hava','deniz-manzarali'] },
  { slug: 'cesme-yaz-konser',        merchant: 'cesme-otel',       categories: ['konser'], title: 'Çeşme · Otelde Yaz Konseri Gecesi', description: 'Otel sahil sahnesinde canlı performans.', original: 1200, discounted: 720, city: 'İzmir', district: 'Çeşme', audience: ['couple','group'], tags: ['acik-hava','gece-hayati','deniz-manzarali'] },
  { slug: 'ankara-rock-cuma',        merchant: 'ankara-stand-up',  categories: ['konser'], title: 'Ankara · Cuma Rock Gecesi', description: 'Yerli rock grubu performansı.', original: 700, discounted: 410, city: 'Ankara', district: 'Kavaklıdere', durationMin: 150, audience: ['couple','solo','group'], tags: ['gece-hayati','enerjik','eglenceli'] },

  // === STAND UP (+4) ===
  { slug: 'pera-cumartesi-stand-up', merchant: 'pera-stand-up',    categories: ['stand-up'], title: 'Pera Stand Up · Cumartesi Gecesi', description: '3 farklı komedyen, 2 saatlik gösteri.', original: 900, discounted: 540, city: 'İstanbul', district: 'Beyoğlu', durationMin: 120, audience: ['couple','solo','group'], tags: ['gece-hayati','eglenceli','populer'] },
  { slug: 'pera-persembe-stand-up',  merchant: 'pera-stand-up',    categories: ['stand-up'], title: 'Pera Stand Up · Persembe Mikrofona Açık', description: 'Acemilerin denemediği mikrofon. Sürprizli gece.', original: 400, discounted: 240, city: 'İstanbul', district: 'Beyoğlu', durationMin: 90, audience: ['solo','couple'], tags: ['gizli-cevher','eglenceli','samimi'] },
  { slug: 'ankara-stand-up-cifte',   merchant: 'ankara-stand-up',  categories: ['stand-up'], title: 'Ankara · 2 Kişilik Stand Up Bileti', description: 'Türkçe stand-up, masa rezervasyonu dahil.', original: 1000, discounted: 590, city: 'Ankara', district: 'Kavaklıdere', durationMin: 100, audience: ['couple','group'], tags: ['gece-hayati','populer','eglenceli'] },
  { slug: 'izmir-stand-up-cumartesi',merchant: 'izmir-tiyatro',    categories: ['stand-up'], title: 'İzmir · Cumartesi Stand Up Show', description: '2 kişilik bilet + 1 ikram içecek.', original: 800, discounted: 480, city: 'İzmir', district: 'Konak', durationMin: 100, audience: ['couple','group','solo'], tags: ['eglenceli','gece-hayati','populer'] },

  // === AKTIVITE (+12) ===
  { slug: 'uskudar-yoga-sahil',      merchant: 'uskudar-aktivite', categories: ['aktivite'], title: 'Üsküdar Sahilde Açık Hava Yoga', description: '90 dakika vinyasa yoga, mat sağlanır.', original: 500, discounted: 290, city: 'İstanbul', district: 'Üsküdar', durationMin: 90, audience: ['solo','couple'], tags: ['huzurlu','acik-hava','dogada','rahat'] },
  { slug: 'uskudar-pilates',         merchant: 'uskudar-aktivite', categories: ['aktivite'], title: 'Üsküdar Pilates · 4 Ders Paket', description: 'Reformer pilates 4 ders, eğitmenli.', original: 1800, discounted: 1090, city: 'İstanbul', district: 'Üsküdar', durationMin: 60, audience: ['solo'], tags: ['rahat','populer','huzurlu'] },
  { slug: 'uskudar-kano-cifte',      merchant: 'uskudar-aktivite', categories: ['aktivite'], title: 'Üsküdar Sahil Çift Kişilik Kano', description: '90 dk kano, ekipman dahil, eğitmen eşliğinde.', original: 1200, discounted: 690, city: 'İstanbul', district: 'Üsküdar', durationMin: 90, audience: ['couple'], tags: ['enerjik','deniz-manzarali','romantik','acik-hava'] },
  { slug: 'sariyer-yamac-parasutu',  merchant: 'sariyer-aktivite', categories: ['aktivite'], title: 'Sarıyer · Yamaç Paraşütü Deneyimi', description: 'Eğitmen eşliğinde tandem yamaç paraşütü.', original: 3000, discounted: 1790, city: 'İstanbul', district: 'Sarıyer', durationMin: 30, audience: ['solo','couple'], tags: ['enerjik','acik-hava','populer','ozel-gun'], featured: true },
  { slug: 'canakkale-trekking-2',    merchant: 'canakkale-doga',   categories: ['aktivite'], title: 'Çanakkale · Yarımada Trekking', description: 'Tarihi yarımadada rehberli trekking, 5 saat.', original: 1100, discounted: 640, city: 'Çanakkale', district: 'Merkez', durationMin: 300, audience: ['group','solo','couple'], tags: ['dogada','tarihi','acik-hava','grup-icin'] },
  { slug: 'bodrum-tekne-gunbatimi',  merchant: 'bodrum-beach',     categories: ['aktivite'], title: 'Bodrum · Gün Batımı Tekne Turu', description: '3 saat tekne, içecek ve atıştırmalık dahil.', original: 1800, discounted: 1090, city: 'Muğla', district: 'Bodrum', durationMin: 180, audience: ['couple','group'], tags: ['romantik','deniz-manzarali','acik-hava','luks'] },
  { slug: 'bodrum-dalmaçya-snorkel', merchant: 'bodrum-resort',    categories: ['aktivite'], title: 'Bodrum · Şnorkelle Yüzme Turu', description: 'Eğitmenli şnorkel turu, 3 saat tekne.', original: 1400, discounted: 790, city: 'Muğla', district: 'Bodrum', durationMin: 180, audience: ['couple','family','group','solo'], tags: ['dogada','enerjik','acik-hava','populer'] },
  { slug: 'kapadokya-balon',         merchant: 'kapadokya-balonu', categories: ['aktivite'], title: 'Kapadokya · Sıcak Hava Balonu Sabahı', description: 'Sunrise balon turu, şampanya kahvaltısı dahil.', original: 5500, discounted: 3290, city: 'Nevşehir', district: 'Göreme', durationMin: 90, audience: ['couple','solo','group'], tags: ['ozel-gun','dogada','acik-hava','luks','populer'], featured: true },
  { slug: 'kapadokya-jeep-safari',   merchant: 'kapadokya-balonu', categories: ['aktivite'], title: 'Kapadokya · Jeep Safari Turu', description: '4 saat off-road peri bacaları arası tur.', original: 2200, discounted: 1290, city: 'Nevşehir', district: 'Göreme', durationMin: 240, audience: ['couple','family','group'], tags: ['dogada','enerjik','acik-hava','tarihi'] },
  { slug: 'antalya-rafting',         merchant: 'antalya-resort',   categories: ['aktivite'], title: 'Antalya · Köprülü Kanyon Rafting', description: 'Tam gün rafting + öğle yemeği dahil.', original: 1500, discounted: 890, city: 'Antalya', district: 'Manavgat', durationMin: 480, audience: ['couple','group','family'], tags: ['enerjik','dogada','acik-hava','grup-icin'] },
  { slug: 'fethiye-kelebek-vadisi',  merchant: 'fethiye-otel',     categories: ['aktivite'], title: 'Fethiye · Kelebek Vadisi Tekne Turu', description: '6 koy + Kelebek Vadisi, öğle yemeği dahil.', original: 1300, discounted: 740, city: 'Muğla', district: 'Fethiye', durationMin: 480, audience: ['couple','family','group','solo'], tags: ['dogada','acik-hava','deniz-manzarali','populer'] },
  { slug: 'sariyer-paintball-cifte', merchant: 'sariyer-aktivite', categories: ['aktivite'], title: 'Sarıyer · 2 Kişilik Paintball', description: '2 kişilik mini turnuva, ekipman dahil.', original: 900, discounted: 540, city: 'İstanbul', district: 'Sarıyer', durationMin: 90, audience: ['couple'], tags: ['eglenceli','enerjik','acik-hava'] },

  // === MASAJ (+8) ===
  { slug: 'cankaya-anti-stres',      merchant: 'cankaya-spa',      categories: ['masaj'], title: 'Çankaya Wellness · 60 dk Anti-Stres Masajı', description: 'Klasik masaj, aromaterapi yağları.', original: 950, discounted: 540, city: 'Ankara', district: 'Çankaya', durationMin: 60, audience: ['solo','couple'], tags: ['huzurlu','rahat','populer'] },
  { slug: 'cankaya-cift-masaj',      merchant: 'cankaya-spa',      categories: ['masaj'], title: 'Çankaya · Çift Masajı 90 dk', description: 'Aynı odada çift terapist, aromaterapi yağları.', original: 2200, discounted: 1290, city: 'Ankara', district: 'Çankaya', durationMin: 90, audience: ['couple'], tags: ['romantik','luks','huzurlu','ozel-gun'] },
  { slug: 'cankaya-hamam-paket',     merchant: 'cankaya-spa',      categories: ['masaj'], title: 'Çankaya · Hamam + Kese + Masaj Paketi', description: 'Geleneksel hamam, kese, köpük, klasik masaj.', original: 1600, discounted: 890, city: 'Ankara', district: 'Çankaya', durationMin: 120, audience: ['solo','couple'], tags: ['huzurlu','rahat','populer','luks'] },
  { slug: 'maslak-business-masaj',   merchant: 'maslak-otel',      categories: ['masaj'], title: 'Maslak Otel · 45 dk Sırt-Boyun Masajı', description: 'Ofis yorgunluğuna kısa ama etkili masaj.', original: 700, discounted: 390, city: 'İstanbul', district: 'Maslak', durationMin: 45, audience: ['solo'], tags: ['business-uygun','rahat','aninda-onay'] },
  { slug: 'antalya-spa-vip',         merchant: 'antalya-spa',      categories: ['masaj'], title: 'Lara Spa · VIP Tam Gün Wellness', description: 'Tam gün spa: hamam, sauna, 2× masaj, öğle yemeği.', original: 4500, discounted: 2690, city: 'Antalya', district: 'Lara', durationMin: 360, audience: ['couple','solo'], tags: ['luks','huzurlu','ozel-gun','rahat'], featured: true },
  { slug: 'marmaris-masaj',          merchant: 'marmaris-otel',    categories: ['masaj'], title: 'Marmaris · Spa Paketi 90 dk', description: 'Marina manzaralı oda, klasik masaj + hamam.', original: 1500, discounted: 890, city: 'Muğla', district: 'Marmaris', durationMin: 90, audience: ['couple','solo'], tags: ['luks','huzurlu','deniz-manzarali'] },
  { slug: 'didim-cift-spa',          merchant: 'didim-otel',       categories: ['masaj'], title: 'Didim · Sahile Karşı Çift Masajı', description: 'Sahil odasında 60 dk çift masajı.', original: 1700, discounted: 990, city: 'Aydın', district: 'Didim', durationMin: 60, audience: ['couple'], tags: ['romantik','deniz-manzarali','luks'] },
  { slug: 'sariyer-doga-masaj',      merchant: 'sariyer-aktivite', categories: ['masaj'], title: 'Sarıyer · Doğa İçinde Açık Hava Masajı', description: 'Belgrad Ormanı kampüsünde, eğitmenli.', original: 1100, discounted: 640, city: 'İstanbul', district: 'Sarıyer', durationMin: 75, audience: ['solo','couple'], tags: ['dogada','huzurlu','acik-hava','gizli-cevher'] },

  // === GUZELLIK (+5) ===
  { slug: 'cankaya-manikur-pedikur', merchant: 'cankaya-spa',      categories: ['guzellik'], title: 'Çankaya · Manikür + Pedikür + Jel', description: 'Tek seansta jel manikür ve pedikür.', original: 700, discounted: 390, city: 'Ankara', district: 'Çankaya', durationMin: 90, audience: ['solo'], tags: ['rahat','populer','aninda-onay'] },
  { slug: 'sisli-cilt-bakimi',       merchant: 'sisli-kahve',      categories: ['guzellik'], title: 'Şişli · Profesyonel Cilt Bakımı 60 dk', description: 'Cilt analizi + peeling + maske.', original: 900, discounted: 540, city: 'İstanbul', district: 'Şişli', durationMin: 60, audience: ['solo'], tags: ['rahat','populer'] },
  { slug: 'kadikoy-sac-bakim',       merchant: 'kadikoy-brunch',   categories: ['guzellik'], title: 'Kadıköy · Saç Bakım + Kesim Paketi', description: 'Yıkama, maske, kesim, fön.', original: 800, discounted: 440, city: 'İstanbul', district: 'Kadıköy', durationMin: 90, audience: ['solo'], tags: ['rahat','populer'] },
  { slug: 'maltepe-saç-renk',        merchant: 'maltepe-guzellik', categories: ['guzellik'], title: 'Maltepe · Saç Renklendirme + Bakım', description: 'Renk + bakım + fön. Profesyonel ürünler.', original: 1500, discounted: 890, city: 'İstanbul', district: 'Maltepe', durationMin: 180, audience: ['solo'], tags: ['luks','populer'] },
  { slug: 'cankaya-kasilar',         merchant: 'cankaya-spa',      categories: ['guzellik'], title: 'Çankaya · Kaş Şekillendirme + Boyama', description: '30 dk kaş tasarımı ve boyama.', original: 350, discounted: 190, city: 'Ankara', district: 'Çankaya', durationMin: 30, audience: ['solo'], tags: ['aninda-onay','rahat','populer'] },

  // === TURLAR (+10) ===
  { slug: 'sultanahmet-bizans-turu', merchant: 'sultanahmet-tours',categories: ['turlar'], title: 'Bizans İstanbul Turu · 4 Saat', description: 'Ayasofya, Sultanahmet, Yerebatan + rehber.', original: 1300, discounted: 740, city: 'İstanbul', district: 'Sultanahmet', durationMin: 240, audience: ['couple','solo','family','group'], tags: ['tarihi','populer','sehir-merkezi'] },
  { slug: 'sultanahmet-bospori-tur', merchant: 'sultanahmet-tours',categories: ['turlar'], title: 'Bosphorus Cruise · 2 Kişilik Tekne Turu', description: '2 saat Boğaz turu, 1 ikram içecek.', original: 900, discounted: 540, city: 'İstanbul', district: 'Sultanahmet', durationMin: 120, audience: ['couple','family','solo'], tags: ['deniz-manzarali','populer','tarihi'] },
  { slug: 'kapadokya-tam-gun',       merchant: 'kapadokya-balonu', categories: ['turlar'], title: 'Kapadokya · Tam Gün Rehberli Tur', description: 'Göreme, Uçhisar, Avanos. Öğle yemeği dahil.', original: 1800, discounted: 1090, city: 'Nevşehir', district: 'Göreme', durationMin: 480, audience: ['couple','family','group','solo'], tags: ['tarihi','populer','dogada','grup-icin'] },
  { slug: 'kusadasi-pamukkale',      merchant: 'kusadasi-turlar',  categories: ['turlar'], title: 'Kuşadası · Pamukkale + Hierapolis Turu', description: 'Tam gün otobüs turu, öğle yemeği dahil.', original: 1500, discounted: 890, city: 'Aydın', district: 'Kuşadası', durationMin: 600, audience: ['couple','family','group','solo'], tags: ['tarihi','dogada','populer'] },
  { slug: 'bodrum-mavi-tur',         merchant: 'bodrum-beach',     categories: ['turlar'], title: 'Bodrum · 1 Günlük Mavi Tur', description: 'Tam gün tekne, 4 koy, öğle yemeği dahil.', original: 1200, discounted: 720, city: 'Muğla', district: 'Bodrum', durationMin: 480, audience: ['family','couple','group','solo'], tags: ['deniz-manzarali','acik-hava','populer','grup-icin'] },
  { slug: 'galata-yuruyus-turu',     merchant: 'galata-bistro',    categories: ['turlar'], title: 'Galata · Sokak Sanatı Yürüyüş Turu', description: '2.5 saat Galata + Karaköy sokak sanatı turu.', original: 700, discounted: 390, city: 'İstanbul', district: 'Galata', durationMin: 150, audience: ['solo','couple','group'], tags: ['sehir-merkezi','tarihi','gizli-cevher'] },
  { slug: 'gaziantep-mutfak-turu',   merchant: 'gaziantep-baklava',categories: ['turlar'], title: 'Gaziantep · Mutfak Turu', description: 'Yöresel lezzetleri tanıyan rehberli tur, 5 durak.', original: 1100, discounted: 640, city: 'Gaziantep', district: 'Şahinbey', durationMin: 240, audience: ['couple','solo','family','group'], tags: ['yerel-favori','populer','gizli-cevher','tarihi'] },
  { slug: 'konya-mevlana-turu',      merchant: 'konya-mutfak',     categories: ['turlar'], title: 'Konya · Mevlana ve Tarihi Konya Turu', description: 'Mevlana Müzesi + Karatay Medresesi + İnce Minare.', original: 800, discounted: 440, city: 'Konya', district: 'Selçuklu', durationMin: 240, audience: ['couple','family','solo','group'], tags: ['tarihi','populer','huzurlu'] },
  { slug: 'fethiye-olu-deniz-tur',   merchant: 'fethiye-otel',     categories: ['turlar'], title: 'Fethiye · Ölüdeniz + Kayaköy Tur', description: 'Yarım gün otobüs turu + plaj ziyareti.', original: 700, discounted: 410, city: 'Muğla', district: 'Fethiye', durationMin: 300, audience: ['couple','family','solo'], tags: ['dogada','populer','deniz-manzarali','tarihi'] },
  { slug: 'marmaris-dalyan-turu',    merchant: 'marmaris-otel',    categories: ['turlar'], title: 'Marmaris · Dalyan + Kaplumbağa Plajı Tur', description: 'Tam gün gemi turu, çamur banyosu, öğle yemeği.', original: 1000, discounted: 590, city: 'Muğla', district: 'Marmaris', durationMin: 480, audience: ['couple','family','group','solo'], tags: ['dogada','acik-hava','populer'] },

  // === SEHIR OTELLERI (+8) ===
  { slug: 'maslak-1-gece-business',  merchant: 'maslak-otel',      categories: ['sehir-otelleri'], title: 'Maslak Plaza · 1 Gece + Brunch', description: 'Business kullanıcılar için merkezi konum.', original: 3000, discounted: 1790, city: 'İstanbul', district: 'Maslak', audience: ['solo','couple','family'], tags: ['business-uygun','sehir-merkezi','luks'], validDays: 180 },
  { slug: 'galata-butik-1-gece',     merchant: 'galata-bistro',    categories: ['sehir-otelleri'], title: 'Galata · Butik Otel 1 Gece + Kahvaltı', description: 'Tarihi binada butik oda, kahvaltı dahil.', original: 2800, discounted: 1690, city: 'İstanbul', district: 'Galata', audience: ['couple','solo'], tags: ['romantik','tarihi','sehir-merkezi','samimi'], validDays: 180 },
  { slug: 'bilkent-2-gece-paket',    merchant: 'bilkent-otel',     categories: ['sehir-otelleri'], title: 'Bilkent · 2 Gece Hafta İçi Paket', description: 'Hafta içi 2 gece, kahvaltı + spa erişimi.', original: 6000, discounted: 3490, city: 'Ankara', district: 'Bilkent', audience: ['couple','solo'], tags: ['business-uygun','luks','huzurlu'], validDays: 180 },
  { slug: 'konya-otel-1-gece',       merchant: 'konya-mutfak',     categories: ['sehir-otelleri'], title: 'Konya · Şehir Otel 1 Gece + Kahvaltı', description: 'Mevlana Müzesi yakını şehir oteli.', original: 2200, discounted: 1290, city: 'Konya', district: 'Selçuklu', audience: ['couple','solo','family'], tags: ['tarihi','sehir-merkezi','huzurlu'], validDays: 180 },
  { slug: 'gaziantep-otel-1-gece',   merchant: 'gaziantep-baklava',categories: ['sehir-otelleri'], title: 'Gaziantep · 1 Gece Konaklama + Kahvaltı', description: 'Şehir oteli, yerel mutfak kahvaltısı.', original: 2400, discounted: 1390, city: 'Gaziantep', district: 'Şahinbey', audience: ['couple','solo'], tags: ['business-uygun','sehir-merkezi','yerel-favori'], validDays: 180 },
  { slug: 'trabzon-otel-1-gece',     merchant: 'trabzon-yore',     categories: ['sehir-otelleri'], title: 'Trabzon · Şehir Otelinde 1 Gece', description: 'Merkez konum, kahvaltı dahil.', original: 2600, discounted: 1490, city: 'Trabzon', district: 'Ortahisar', audience: ['couple','family'], tags: ['sehir-merkezi','huzurlu'], validDays: 180 },
  { slug: 'bursa-otel-1-gece',       merchant: 'bursa-kahvalti',   categories: ['sehir-otelleri'], title: 'Bursa · 1 Gece + Hamam Paketi', description: 'Mudanya yakını otel + hamam erişimi.', original: 2900, discounted: 1690, city: 'Bursa', district: 'Mudanya', audience: ['couple'], tags: ['huzurlu','tarihi','luks'], validDays: 180 },
  { slug: 'eskisehir-otel-1-gece',   merchant: 'eskisehir-kurs',   categories: ['sehir-otelleri'], title: 'Eskişehir · Şehir Otel 1 Gece', description: 'Porsuk Çayı yakını, kahvaltı dahil.', original: 2100, discounted: 1190, city: 'Eskişehir', district: 'Tepebaşı', audience: ['couple','solo','family'], tags: ['sehir-merkezi','huzurlu','samimi'], validDays: 180 },

  // === TATIL OTELLERI (+12) ===
  { slug: 'marmaris-3-gece-paket',   merchant: 'marmaris-otel',    categories: ['tatil-otelleri'], title: 'Marmaris · 3 Gece Her Şey Dahil', description: 'Marina manzaralı oda, her şey dahil.', original: 13000, discounted: 7490, city: 'Muğla', district: 'Marmaris', audience: ['couple','family'], tags: ['luks','deniz-manzarali','huzurlu','cocuk-dostu'], validDays: 180 },
  { slug: 'marmaris-1-gece-romantik',merchant: 'marmaris-otel',    categories: ['tatil-otelleri'], title: 'Marmaris · 1 Gece Romantik + Şampanya', description: 'Marina suite, gün batımı şampanyası.', original: 5500, discounted: 3290, city: 'Muğla', district: 'Marmaris', audience: ['couple'], tags: ['romantik','luks','ozel-gun','deniz-manzarali'], featured: true, validDays: 180 },
  { slug: 'didim-her-sey-dahil-2',   merchant: 'didim-otel',       categories: ['tatil-otelleri'], title: 'Didim · 2 Gece Her Şey Dahil', description: 'Altınkum sahiline sıfır, aile uygun.', original: 8500, discounted: 4990, city: 'Aydın', district: 'Didim', audience: ['family','couple'], tags: ['luks','deniz-manzarali','cocuk-dostu','huzurlu'], validDays: 180 },
  { slug: 'didim-1-gece-spa',        merchant: 'didim-otel',       categories: ['tatil-otelleri'], title: 'Didim · 1 Gece + Spa Erişimi', description: 'Standart oda, kahvaltı, spa erişimi.', original: 3500, discounted: 1990, city: 'Aydın', district: 'Didim', audience: ['couple'], tags: ['romantik','luks','deniz-manzarali'], validDays: 180 },
  { slug: 'bodrum-2-gece-suite',     merchant: 'bodrum-resort',    categories: ['tatil-otelleri'], title: 'Bodrum · 2 Gece Suite + Kahvaltı', description: 'Sahile sıfır suite oda.', original: 9000, discounted: 5290, city: 'Muğla', district: 'Bodrum', audience: ['couple'], tags: ['romantik','luks','deniz-manzarali','huzurlu'], validDays: 180 },
  { slug: 'fethiye-3-gece-doga',     merchant: 'fethiye-otel',     categories: ['tatil-otelleri'], title: 'Fethiye · 3 Gece Doğa Otel + Yarım Pansiyon', description: 'Çam ormanı içinde butik otel, yarım pansiyon.', original: 11000, discounted: 6390, city: 'Muğla', district: 'Fethiye', audience: ['couple','family'], tags: ['dogada','huzurlu','romantik','cocuk-dostu'], validDays: 180 },
  { slug: 'fethiye-1-gece-romantik', merchant: 'fethiye-otel',     categories: ['tatil-otelleri'], title: 'Fethiye · 1 Gece Romantik Paket', description: 'Doğa içinde oda + şampanya + kahvaltı.', original: 3800, discounted: 2190, city: 'Muğla', district: 'Fethiye', audience: ['couple'], tags: ['romantik','dogada','ozel-gun','luks'], validDays: 180 },
  { slug: 'antalya-resort-aile-paket',merchant: 'antalya-resort',  categories: ['tatil-otelleri'], title: 'Antalya · 5 Gece Aile Tatil Paketi', description: 'Her şey dahil 5 gece, çocuk kulübü.', original: 28000, discounted: 16490, city: 'Antalya', district: 'Lara', audience: ['family'], tags: ['luks','cocuk-dostu','deniz-manzarali','huzurlu'], validDays: 180, featured: true },
  { slug: 'cesme-3-gece-yarim',      merchant: 'cesme-otel',       categories: ['tatil-otelleri'], title: 'Çeşme · 3 Gece Yarım Pansiyon', description: 'Deniz manzaralı oda, yarım pansiyon.', original: 9500, discounted: 5490, city: 'İzmir', district: 'Çeşme', audience: ['couple','family'], tags: ['luks','deniz-manzarali','huzurlu'], validDays: 180 },
  { slug: 'cesme-1-gece-aksam-yemegi',merchant: 'cesme-otel',      categories: ['tatil-otelleri'], title: 'Çeşme · 1 Gece + Akşam Yemeği', description: 'Sahil suite + a la carte akşam yemeği.', original: 3700, discounted: 2190, city: 'İzmir', district: 'Çeşme', audience: ['couple'], tags: ['romantik','deniz-manzarali','luks'], validDays: 180 },
  { slug: 'kapadokya-magara-otel',   merchant: 'kapadokya-balonu', categories: ['tatil-otelleri'], title: 'Kapadokya · Mağara Otelde 2 Gece', description: 'Geleneksel mağara oda, kahvaltı dahil.', original: 7000, discounted: 4190, city: 'Nevşehir', district: 'Göreme', audience: ['couple'], tags: ['romantik','tarihi','luks','gizli-cevher'], validDays: 180 },
  { slug: 'uludag-2-gece-kayak',     merchant: 'bursa-kahvalti',   categories: ['tatil-otelleri'], title: 'Uludağ · 2 Gece Kayak Otel', description: 'Pistlere sıfır, kayak takımı kiralık.', original: 8500, discounted: 4990, city: 'Bursa', district: 'Uludağ', audience: ['couple','family','group'], tags: ['dogada','luks','huzurlu'], validDays: 180 },

  // === KURS (+9) ===
  { slug: 'uskudar-yoga-haftalik',   merchant: 'uskudar-aktivite', categories: ['kurs'], title: 'Üsküdar · 8 Hafta Yoga Kursu', description: 'Haftada 2 ders, eğitmenli vinyasa yoga.', original: 3200, discounted: 1890, city: 'İstanbul', district: 'Üsküdar', durationMin: 90, audience: ['solo'], tags: ['rahat','populer','huzurlu'] },
  { slug: 'uskudar-pilates-paket',   merchant: 'uskudar-aktivite', categories: ['kurs'], title: 'Üsküdar · Reformer Pilates 8 Ders', description: 'Eğitmenli reformer pilates 8 ders paketi.', original: 4000, discounted: 2390, city: 'İstanbul', district: 'Üsküdar', durationMin: 60, audience: ['solo'], tags: ['rahat','populer'] },
  { slug: 'eskisehir-fotograf',      merchant: 'eskisehir-kurs',   categories: ['kurs'], title: 'Eskişehir · Fotoğrafçılık 4 Hafta Kursu', description: 'Temel fotoğraf teknikleri, sokak fotoğrafı, atölye.', original: 2200, discounted: 1290, city: 'Eskişehir', district: 'Tepebaşı', durationMin: 120, audience: ['solo','couple'], tags: ['gizli-cevher','samimi','yeni'] },
  { slug: 'eskisehir-resim',         merchant: 'eskisehir-kurs',   categories: ['kurs'], title: 'Eskişehir · Akrilik Resim Atölyesi', description: 'Tek seans 3 saatlik akrilik resim atölyesi.', original: 600, discounted: 340, city: 'Eskişehir', district: 'Tepebaşı', durationMin: 180, audience: ['solo','couple'], tags: ['samimi','gizli-cevher','yeni','rahat'] },
  { slug: 'kurucesme-yoga-paket',    merchant: 'kurucesme-rooftop',categories: ['kurs'], title: 'Kuruçeşme · 5 Ders Açık Hava Yoga Paketi', description: 'Çatıda 5 ders, hafta sonu sabahı.', original: 1800, discounted: 990, city: 'İstanbul', district: 'Kuruçeşme', durationMin: 60, audience: ['solo'], tags: ['acik-hava','huzurlu','rahat','populer'] },
  { slug: 'bornova-keramik',         merchant: 'bornova-kafe',     categories: ['kurs'], title: 'Bornova · Seramik Atölyesi', description: 'Çamur şekillendirme + sırlama atölyesi.', original: 800, discounted: 440, city: 'İzmir', district: 'Bornova', durationMin: 180, audience: ['solo','couple','family'], tags: ['samimi','yeni','rahat'] },
  { slug: 'galata-italyan-yemek',    merchant: 'galata-bistro',    categories: ['kurs'], title: 'Galata · İtalyan Pasta Atölyesi', description: 'Şefle taze pasta yapımı, akşam yemeği dahil.', original: 1500, discounted: 890, city: 'İstanbul', district: 'Galata', durationMin: 180, audience: ['couple','solo','group'], tags: ['samimi','populer','yeni'] },
  { slug: 'sisli-cizgi-roman',       merchant: 'sisli-kahve',      categories: ['kurs'], title: 'Şişli · Çocuk Çizgi Roman Atölyesi', description: 'Hafta sonu çocuk atölyesi, 8-12 yaş.', original: 700, discounted: 390, city: 'İstanbul', district: 'Şişli', durationMin: 120, audience: ['kids','family'], tags: ['cocuk-dostu','samimi','yeni','hafta-sonu'] },
  { slug: 'kadikoy-dans-salsa',      merchant: 'kadikoy-sahne',    categories: ['kurs'], title: 'Kadıköy · Salsa Dans 4 Hafta Kursu', description: 'Başlangıç düzeyi salsa, çift halinde.', original: 1600, discounted: 890, city: 'İstanbul', district: 'Kadıköy', durationMin: 75, audience: ['couple'], tags: ['eglenceli','enerjik','samimi'] },

  // === HIZMET (+10) ===
  { slug: 'istanbul-derin-temizlik', merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Profesyonel Derin Temizlik · Daire (3+1)', description: '3+1 daire için 5 saatlik derin temizlik.', original: 2500, discounted: 1490, city: 'İstanbul', durationMin: 300, audience: ['solo','family'], tags: ['aninda-onay','populer','luks'] },
  { slug: 'istanbul-ofis-temizlik',  merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Ofis Temizliği · 50m² · Tek Seferlik', description: 'Hafta içi ofis temizliği. Akşam saatleri uygun.', original: 1200, discounted: 690, city: 'İstanbul', durationMin: 180, audience: ['solo'], tags: ['business-uygun','aninda-onay','populer'] },
  { slug: 'istanbul-haserle-mucadele',merchant: 'istanbul-hizmet', categories: ['hizmet'], title: 'Haşere ile Mücadele · Daire', description: 'Profesyonel ekipman, çevre dostu kimyasallar.', original: 1500, discounted: 890, city: 'İstanbul', durationMin: 120, audience: ['solo','family'], tags: ['aninda-onay','populer'] },
  { slug: 'istanbul-bakim-kombi-2',  merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Kombi Bakım + Petek Temizliği', description: 'Kombi bakımı + tüm petek temizliği paketi.', original: 1400, discounted: 790, city: 'İstanbul', durationMin: 120, audience: ['solo','family'], tags: ['aninda-onay','populer'] },
  { slug: 'istanbul-elektrik',       merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Elektrikçi · Tesisat Kontrol + Onarım', description: 'Yetkili elektrikçi, tesisat kontrol ve küçük onarımlar.', original: 900, discounted: 540, city: 'İstanbul', durationMin: 90, audience: ['solo','family'], tags: ['aninda-onay'] },
  { slug: 'istanbul-tesisat',        merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Tesisatçı · Sıhhi Tesisat Onarımı', description: 'Sızıntı, tıkanıklık, musluk değişimi.', original: 800, discounted: 440, city: 'İstanbul', durationMin: 90, audience: ['solo','family'], tags: ['aninda-onay'] },
  { slug: 'istanbul-perde-yikama',   merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Perde Yıkama · Tek Daire', description: 'Tüm perdelerin kaldırılması, yıkanması, asılması.', original: 1000, discounted: 540, city: 'İstanbul', durationMin: 240, audience: ['solo','family'], tags: ['aninda-onay','rahat'] },
  { slug: 'istanbul-halı-yikama',    merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Halı Yıkama · Yerinde Servis', description: 'Kuru yerinde halı yıkama, makineli temizlik.', original: 700, discounted: 390, city: 'İstanbul', durationMin: 180, audience: ['solo','family'], tags: ['aninda-onay','rahat'] },
  { slug: 'istanbul-evde-bakim',     merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Evde Yaşlı Bakım Hizmeti · Yarım Gün', description: 'Sertifikalı bakım personeli, 4 saatlik refakat.', original: 1100, discounted: 640, city: 'İstanbul', durationMin: 240, audience: ['solo','family'], tags: ['rahat','populer'] },
  { slug: 'istanbul-bahce-bakim',    merchant: 'istanbul-hizmet',  categories: ['hizmet'], title: 'Bahçe Bakım · Çim + Çitler + Sulama', description: 'Profesyonel bahçe bakım hizmeti.', original: 1500, discounted: 890, city: 'İstanbul', durationMin: 240, audience: ['solo','family'], tags: ['aninda-onay','dogada','rahat'] },
];

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

// Curated Unsplash photo IDs per category. The pool is small (4-5 IDs each)
// so deals in the same category visually rhyme without being identical.
// Each ID corresponds to a real Unsplash photo. If any ID is invalid the
// image just won't load — alt text takes over.
const CATEGORY_PHOTOS: Record<string, string[]> = {
  kahvalti: [
    '1414235077428-338989a2e8c0', '1525351484163-7529414344d8',
    '1551218808-94e220e084d2', '1525755662778-989d0524087e', '1467003909585-2f8a72700288',
  ],
  yemek: [
    '1546069901-ba9599a7e63c', '1517248135467-4c7edcad34c4',
    '1567620905732-2d1ec7ab7445', '1555939594-58d7cb561ad1', '1565299624946-b28f40a0ae38',
  ],
  tiyatro: [
    '1503095396549-807759245b35', '1507676184212-d03ab07a01bf', '1518609878373-06d740f60d8b',
  ],
  konser: [
    '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f',
    '1459749411175-04bf5292ceea', '1429962714451-bb934ecdc4ec',
  ],
  'stand-up': [
    // 1564613302700-94b6a8b3ab74 ve 1597173115256-d49e6f2cf60d Unsplash'tan
    // kaldırıldı (Mayıs 2026 fix). Yerine konser havuzundan canlı sahne karelerini ekledik.
    '1531058020387-3be344556be6', '1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f',
  ],
  aktivite: [
    // 1502780402662-acc01917738e kaldırıldı; yerine outdoor benzeri.
    '1448375240586-882707db888b',
    '1517649763962-0c623066013b', '1518609878373-06d740f60d8b',
    '1502602898657-3e91760cbb34',
  ],
  masaj: [
    '1540555700478-4be289fbecef', '1544161515-4ab6ce6db874',
    '1583416750470-965b2707b355', '1487412947147-5cebf100ffc2',
  ],
  guzellik: [
    // 1607008829749-c0f284a49841 kaldırıldı.
    '1522337360788-8b13dee7a37e',
    '1487412947147-5cebf100ffc2', '1532635241-17e820acc59f',
  ],
  turlar: [
    // 3 kare kaldırıldı; sehir-otelleri havuzundaki cityscape'leri ekledik
    // ve picsum'da olan stabil bir-iki ID.
    '1564501049412-61c2a3083791', '1551882547-ff40c63fe5fa',
    '1542314831-068cd1dbfeeb', '1549294413-26f195200c16',
  ],
  'sehir-otelleri': [
    '1551882547-ff40c63fe5fa', '1542314831-068cd1dbfeeb',
    '1549294413-26f195200c16', '1564501049412-61c2a3083791',
  ],
  'tatil-otelleri': [
    '1571003123894-1f0594d2b5d9', '1582719508461-905c673771fd',
    '1566073771259-6a8506099945', '1540541338287-41700207dee6',
  ],
  kurs: [
    '1503676260728-1c00da094a0b', '1488521787991-ed7bbaae773c',
    '1454165804606-c3d57bc86b40', '1543269865-cbf427effbad',
  ],
  hizmet: [
    '1581578731548-c64695cc6952', '1558618666-fcd25c85cd64', '1521587760476-6c12a4b040da',
  ],
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Mock koordinat üretimi: ilçe centroid'i + slug'a göre deterministik
 * ±0.005° (~500m) jitter. Aynı merchant her seed'de aynı noktayı alır.
 */
const DISTRICT_CENTROIDS: Record<string, LatLng> = {
  // İstanbul
  Beşiktaş: { lat: 41.0426, lng: 29.0078 },
  Karaköy: { lat: 41.0254, lng: 28.9742 },
  Kadıköy: { lat: 40.9923, lng: 29.0244 },
  Arnavutköy: { lat: 41.0686, lng: 29.0428 },
  Cihangir: { lat: 41.0334, lng: 28.9836 },
  Sultanahmet: { lat: 41.0058, lng: 28.9769 },
  Levent: { lat: 41.0814, lng: 29.0166 },
  Sarıyer: { lat: 41.1668, lng: 29.0571 },
  Maltepe: { lat: 40.9352, lng: 29.1336 },
  Şişli: { lat: 41.0602, lng: 28.987 },
  Bebek: { lat: 41.0773, lng: 29.0438 },
  Suadiye: { lat: 40.953, lng: 29.086 },
  Etiler: { lat: 41.0822, lng: 29.0317 },
  Kuruçeşme: { lat: 41.0641, lng: 29.0376 },
  Bostancı: { lat: 40.9504, lng: 29.0961 },
  Beyoğlu: { lat: 41.0349, lng: 28.9777 },
  Galata: { lat: 41.0258, lng: 28.9744 },
  Maslak: { lat: 41.1107, lng: 29.021 },
  Üsküdar: { lat: 41.0233, lng: 29.0156 },
  // Ankara
  Çankaya: { lat: 39.9081, lng: 32.8612 },
  Kavaklıdere: { lat: 39.908, lng: 32.8624 },
  Bilkent: { lat: 39.8682, lng: 32.7497 },
  // İzmir
  Alsancak: { lat: 38.4327, lng: 27.1429 },
  Konak: { lat: 38.4192, lng: 27.1287 },
  Bornova: { lat: 38.4708, lng: 27.2117 },
  Çeşme: { lat: 38.3236, lng: 26.3071 },
  // Antalya
  Muratpaşa: { lat: 36.8841, lng: 30.7056 },
  Lara: { lat: 36.8528, lng: 30.8077 },
  // Bursa
  Mudanya: { lat: 40.3753, lng: 28.8806 },
  // Adana
  Seyhan: { lat: 37.0067, lng: 35.3214 },
  // Eskişehir
  Tepebaşı: { lat: 39.7842, lng: 30.4854 },
  // Muğla
  Bodrum: { lat: 37.0344, lng: 27.4305 },
  Fethiye: { lat: 36.6213, lng: 29.1167 },
  Marmaris: { lat: 36.855, lng: 28.278 },
  // Aydın
  Kuşadası: { lat: 37.8597, lng: 27.2563 },
  Didim: { lat: 37.376, lng: 27.2654 },
  // Çanakkale
  Merkez: { lat: 40.1553, lng: 26.4142 },
  // Trabzon
  Ortahisar: { lat: 41.0027, lng: 39.7168 },
  // Konya
  Selçuklu: { lat: 38.0204, lng: 32.5076 },
  // Gaziantep
  Şahinbey: { lat: 37.059, lng: 37.3833 },
  // Nevşehir
  Göreme: { lat: 38.6431, lng: 34.8284 },
};

function coordsFor(slug: string, city: string, district?: string): LatLng {
  const centroid =
    (district && DISTRICT_CENTROIDS[district]) || CITY_CENTROIDS[city] || ISTANBUL_CENTER;
  const h = hashSlug(slug);
  const jitterLat = ((h % 1000) / 1000 - 0.5) * 0.01;
  const jitterLng = (((Math.floor(h / 1000)) % 1000) / 1000 - 0.5) * 0.01;
  return {
    lat: +(centroid.lat + jitterLat).toFixed(6),
    lng: +(centroid.lng + jitterLng).toFixed(6),
  };
}

function pickPhoto(slug: string, category?: string): string {
  const pool = category ? CATEGORY_PHOTOS[category] : undefined;
  if (pool && pool.length > 0) {
    const id = pool[hashSlug(slug) % pool.length];
    return `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop`;
  }
  return `https://picsum.photos/seed/${slug}/800/600`;
}

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
  const rows = MERCHANTS.map((m) => {
    const c = coordsFor(m.slug, m.city, m.district);
    return {
      slug: m.slug,
      name: m.name,
      description: m.description,
      city: m.city,
      district: m.district,
      lat: c.lat,
      lng: c.lng,
      is_active: true,
      is_verified: true,
      logo_url: coverFor(`logo-${m.slug}`, 200, 200),
    };
  });

  const { error } = await supabase.from('merchants').upsert(rows, { onConflict: 'slug' });
  if (error) throw error;
  console.log(`  merchants:  ${rows.length}`);
}

/**
 * Concurrent embedding generator — N=5 paralel istek ile Gemini'yi rahat
 * çağırır. Hata olursa o deal `embedding: null` döner; sonra ai:backfill ile
 * tamamlanır. Anahtar yoksa hiç çağırmaz, sessizce null geçer.
 */
async function embedDealRows<T extends ReturnType<typeof buildEmbedSeed>>(
  rows: T[],
): Promise<Array<T & { embedding: string | null }>> {
  if (!process.env.GEMINI_API_KEY) {
    console.log('  embeddings: skipped (GEMINI_API_KEY yok — sonra `npm run ai:backfill`)');
    return rows.map((r) => ({ ...r, embedding: null }));
  }

  const out: Array<T & { embedding: string | null }> = new Array(rows.length);
  const CONCURRENCY = 5;
  let next = 0;
  let ok = 0;
  let fail = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= rows.length) return;
      const row = rows[i];
      try {
        const vec = await embed(
          dealEmbeddingText({
            title: row.title,
            subtitle: row.subtitle,
            description: row.description,
            tags: row.tags,
            audience: row.audience,
            city: row.city,
            district: row.district,
            venue_name: row.venue_name,
          }),
        );
        out[i] = { ...row, embedding: toPgVector(vec) };
        ok++;
      } catch (err) {
        fail++;
        console.error(
          `  embed fail [${row.slug}]: ${err instanceof Error ? err.message : String(err)}`,
        );
        out[i] = { ...row, embedding: null };
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`  embeddings: ok=${ok} fail=${fail}${fail ? ' — sonra `npm run ai:backfill`' : ''}`);
  return out;
}

/**
 * Type helper — embedDealRows imza inferensi için. dealRows'un asıl şekli
 * `seedDeals` içinde literal — fonksiyonu generic tutmak yerine bu yardımcı
 * üzerinden tipi çekiyoruz.
 */
function buildEmbedSeed() {
  return {
    slug: '' as string,
    title: '' as string,
    subtitle: null as string | null,
    description: '' as string,
    tags: [] as string[],
    audience: [] as string[],
    city: '' as string,
    district: null as string | null,
    venue_name: null as string | null,
  };
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
      cover_image: pickPhoto(d.slug, d.categories[0]),
      images: [
        pickPhoto(`${d.slug}-2`, d.categories[0]),
        pickPhoto(`${d.slug}-3`, d.categories[0]),
      ],
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

  // RAG için her deal'a embedding üret — pgvector araması ancak embedding'i
  // olan satırları görür. GEMINI_API_KEY yoksa embedsiz devam ederiz ama AI
  // sohbeti boş döner; uyarı bas, sonra ai:backfill ile tamamlanabilir.
  const dealsWithEmbeddings = await embedDealRows(dealRows);

  const { error: dealErr } = await supabase
    .from('deals')
    .upsert(dealsWithEmbeddings, { onConflict: 'slug' });
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

// ----------------------------------------------------------------------------
// REVIEWS — her aktif deal için 0-8 mock yorum. Trigger rating_avg/count'u
// otomatik günceller. Aynı seed yeniden çalıştığında temizleyip yeniden yazar.
// ----------------------------------------------------------------------------
const REVIEW_NAMES = [
  'Selin K.', 'Mert A.', 'Ayşe Y.', 'Burak D.', 'Ece T.', 'Onur G.',
  'Zeynep B.', 'Furkan M.', 'Deniz Ö.', 'Cansu E.', 'Kerem U.', 'Naz S.',
  'Eren C.', 'İrem H.', 'Berk N.', 'Pelin V.', 'Tolga P.', 'Defne R.',
  'Çağrı Z.', 'Yağmur F.', 'Volkan I.', 'Sıla J.', 'Barış L.', 'Melis O.',
];

const REVIEW_TEMPLATES = [
  'Beklediğimden çok daha iyi bir deneyimdi. Tekrar gelmeyi planlıyoruz.',
  'Hizmet kaliteli, fiyat-performans gayet iyi. Tavsiye ederim.',
  'Ortam çok şıktı, personel ilgili. Eşimle harika bir akşam geçirdik.',
  'Lezzetler taze ve sunum güzeldi. Yine geleceğiz mutlaka.',
  'Konum çok rahat ulaşılabilir, otoparkı da var. Çocuklarla rahat ettik.',
  'Rezervasyon süreci kolaydı, mekan beklentimizi karşıladı.',
  'Biraz kalabalıktı ama servis hızlıydı. Genel olarak memnunuz.',
  'Manzara nefes kesiciydi, akşam yemeği için ideal.',
  'Spa kısmı çok rahatlatıcı, profesyonel ekip. Mutlaka tekrar deneyeceğim.',
  'Çocuklar için harika bir aktivite, biz de keyif aldık.',
  'Kahvaltı sınırsız çay ve geniş seçenekleriyle gayet doyurucuydu.',
  'Tiyatro performansı etkileyiciydi, oyuncular çok başarılıydı.',
  'Konser sesi temiz, atmosfer harikaydı. Bilet karşılığını fazlasıyla aldım.',
  'Otelde temizlik üst düzeydi, yatak konforlu. Tatil için ideal.',
  'Tur rehberi çok bilgiliydi, programı sıkmadan akıttı.',
  'Personel güler yüzlü, kahve ve atıştırmalıklar kaliteliydi.',
  'Tatlısı muhteşemdi, ana yemekler standartın üzerinde.',
  'Atölye eğlenceli geçti, materyaller hazırdı, başlamak kolaydı.',
  'Mekan küçük ama sıcacık. Romantik bir akşam yemeği için doğru tercih.',
  'Fiyat biraz yüksek ama deneyim değerdi. Özel günler için saklıyoruz.',
];

function pickReviewCount(slug: string): number {
  // Slug hash'inden 0-8 deterministik sayı; çoğu deal için 3-6 yorum çıkar.
  const h = hashSlug(slug);
  const bias = h % 10;
  if (bias < 2) return 0; // %20 deal için yorum yok (gerçekçi dağılım)
  if (bias < 6) return (h % 4) + 2; // 2-5
  return (h % 4) + 5; // 5-8
}

function pickRating(slug: string, idx: number): number {
  // 3-5 yıldız ağırlıklı (ortalama ~4.4)
  const h = hashSlug(`${slug}-r-${idx}`);
  const roll = h % 10;
  if (roll < 1) return 3;
  if (roll < 4) return 4;
  return 5;
}

function pickReview(slug: string, idx: number): { name: string; body: string; daysAgo: number } {
  const h = hashSlug(`${slug}-n-${idx}`);
  return {
    name: REVIEW_NAMES[h % REVIEW_NAMES.length],
    body: REVIEW_TEMPLATES[(h >>> 4) % REVIEW_TEMPLATES.length],
    daysAgo: (h >>> 8) % 60, // son 60 gün
  };
}

async function seedReviews() {
  const { data: deals, error: dErr } = await supabase.from('deals').select('id, slug');
  if (dErr) throw dErr;

  // Temizle ve yeniden yaz — seed idempotent kalır.
  const { error: delErr } = await supabase.from('reviews').delete().not('id', 'is', null);
  if (delErr) throw delErr;

  type ReviewRow = {
    deal_id: string;
    user_id: null;
    display_name: string;
    rating: number;
    body: string;
    created_at: string;
  };
  const rows: ReviewRow[] = [];
  for (const d of deals ?? []) {
    const n = pickReviewCount(d.slug);
    for (let i = 0; i < n; i++) {
      const { name, body, daysAgo } = pickReview(d.slug, i);
      rows.push({
        deal_id: d.id,
        user_id: null,
        display_name: name,
        rating: pickRating(d.slug, i),
        body,
        created_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
      });
    }
  }

  if (rows.length === 0) {
    console.log('  reviews:    0');
    return;
  }

  // Batch insert (1000 limit'i aşmasın, deal sayısı ~200 olduğunda toplam < 1500).
  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const { error } = await supabase.from('reviews').insert(rows.slice(i, i + batchSize));
    if (error) throw error;
  }
  console.log(`  reviews:    ${rows.length}`);
}

async function main() {
  console.log('Seeding gidek.net…');
  await seedCategories();
  await seedMerchants();
  await seedDeals();
  await seedReviews();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
