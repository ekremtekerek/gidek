/**
 * Procedural mock data fill — İstanbul, Ankara ve İzmir'i her biri 100
 * aktif fırsata tamamlar. Idempotent: mevcut deal'lara dokunmaz, sadece
 * eksiği üretir. Her deal benzersiz bir merchant + benzersiz koordinata
 * sahip (aynı semt olsa bile farklı sokağa düşer).
 *
 *   npm run seed:fill
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
// Hedef sayılar + her şehrin semt koordinatları
// ----------------------------------------------------------------------------
type LatLng = { lat: number; lng: number };

const TARGETS: Record<string, number> = {
  İstanbul: 100,
  Ankara: 100,
  İzmir: 100,
};

const NEIGHBORHOODS: Record<string, Record<string, LatLng>> = {
  İstanbul: {
    Beşiktaş: { lat: 41.0426, lng: 29.0078 },
    Karaköy: { lat: 41.0254, lng: 28.9742 },
    Kadıköy: { lat: 40.9923, lng: 29.0244 },
    Moda: { lat: 40.9817, lng: 29.0245 },
    Caddebostan: { lat: 40.9614, lng: 29.0686 },
    Suadiye: { lat: 40.953, lng: 29.086 },
    Bostancı: { lat: 40.9504, lng: 29.0961 },
    Maltepe: { lat: 40.9352, lng: 29.1336 },
    Ataşehir: { lat: 40.9923, lng: 29.1244 },
    Üsküdar: { lat: 41.0233, lng: 29.0156 },
    Beykoz: { lat: 41.1247, lng: 29.0944 },
    Sarıyer: { lat: 41.1668, lng: 29.0571 },
    Tarabya: { lat: 41.1361, lng: 29.0567 },
    Yeniköy: { lat: 41.1228, lng: 29.0625 },
    Emirgan: { lat: 41.1083, lng: 29.0561 },
    Bebek: { lat: 41.0773, lng: 29.0438 },
    Etiler: { lat: 41.0822, lng: 29.0317 },
    Levent: { lat: 41.0814, lng: 29.0166 },
    Maslak: { lat: 41.1107, lng: 29.021 },
    Mecidiyeköy: { lat: 41.0671, lng: 28.9962 },
    Nişantaşı: { lat: 41.0501, lng: 28.9897 },
    Şişli: { lat: 41.0602, lng: 28.987 },
    Beyoğlu: { lat: 41.0349, lng: 28.9777 },
    Galata: { lat: 41.0258, lng: 28.9744 },
    Cihangir: { lat: 41.0334, lng: 28.9836 },
    Sultanahmet: { lat: 41.0058, lng: 28.9769 },
    Fatih: { lat: 41.019, lng: 28.9494 },
    Eminönü: { lat: 41.0173, lng: 28.9712 },
    Bakırköy: { lat: 40.9819, lng: 28.8772 },
    Yeşilköy: { lat: 40.9603, lng: 28.8214 },
    Florya: { lat: 40.9764, lng: 28.7847 },
  },
  Ankara: {
    Çankaya: { lat: 39.9081, lng: 32.8612 },
    Kavaklıdere: { lat: 39.908, lng: 32.8624 },
    Tunalı: { lat: 39.9081, lng: 32.8543 },
    Bahçelievler: { lat: 39.9211, lng: 32.8276 },
    Bilkent: { lat: 39.8682, lng: 32.7497 },
    Çayyolu: { lat: 39.8763, lng: 32.7158 },
    Ümitköy: { lat: 39.9024, lng: 32.7167 },
    Beştepe: { lat: 39.9407, lng: 32.8085 },
    Sıhhiye: { lat: 39.932, lng: 32.8568 },
    Ulus: { lat: 39.9408, lng: 32.8541 },
    Kızılay: { lat: 39.9208, lng: 32.8541 },
    Yenimahalle: { lat: 39.9569, lng: 32.7861 },
    Etlik: { lat: 39.9685, lng: 32.8331 },
    Keçiören: { lat: 39.9803, lng: 32.8635 },
    Mamak: { lat: 39.9341, lng: 32.9099 },
    Gölbaşı: { lat: 39.7918, lng: 32.8094 },
    Pursaklar: { lat: 40.034, lng: 32.9028 },
    Sincan: { lat: 39.9694, lng: 32.5806 },
    Eryaman: { lat: 39.9728, lng: 32.6469 },
    Batıkent: { lat: 39.9676, lng: 32.7314 },
    'Oran Sitesi': { lat: 39.8843, lng: 32.8462 },
    Dikmen: { lat: 39.8849, lng: 32.8419 },
    Kurtuluş: { lat: 39.9197, lng: 32.8676 },
    Kolej: { lat: 39.926, lng: 32.8624 },
    Maltepe: { lat: 39.9326, lng: 32.8366 },
    Emek: { lat: 39.9442, lng: 32.8094 },
    Söğütözü: { lat: 39.9159, lng: 32.7943 },
  },
  İzmir: {
    Alsancak: { lat: 38.4327, lng: 27.1429 },
    Konak: { lat: 38.4192, lng: 27.1287 },
    Karşıyaka: { lat: 38.4575, lng: 27.1149 },
    Bostanlı: { lat: 38.4621, lng: 27.0958 },
    Bayraklı: { lat: 38.4632, lng: 27.16 },
    Bornova: { lat: 38.4708, lng: 27.2117 },
    Pınarbaşı: { lat: 38.4517, lng: 27.2391 },
    Buca: { lat: 38.3938, lng: 27.18 },
    Karabağlar: { lat: 38.3892, lng: 27.122 },
    Gaziemir: { lat: 38.3169, lng: 27.1306 },
    Balçova: { lat: 38.3895, lng: 27.0653 },
    Narlıdere: { lat: 38.3954, lng: 27.0288 },
    Güzelbahçe: { lat: 38.3702, lng: 26.8758 },
    Çeşme: { lat: 38.3236, lng: 26.3071 },
    Alaçatı: { lat: 38.2825, lng: 26.3717 },
    Urla: { lat: 38.323, lng: 26.7644 },
    Sığacık: { lat: 38.198, lng: 26.7869 },
    Seferihisar: { lat: 38.197, lng: 26.8367 },
    Foça: { lat: 38.6711, lng: 26.7553 },
    Yenifoça: { lat: 38.7286, lng: 26.8408 },
    Çiğli: { lat: 38.5006, lng: 27.0686 },
    Mavişehir: { lat: 38.484, lng: 27.0664 },
    Göztepe: { lat: 38.4083, lng: 27.0958 },
    Hatay: { lat: 38.4097, lng: 27.115 },
    Karataş: { lat: 38.4147, lng: 27.1283 },
    Pasaport: { lat: 38.434, lng: 27.1394 },
    Kemeraltı: { lat: 38.4174, lng: 27.1331 },
    Basmane: { lat: 38.4181, lng: 27.1402 },
  },
};

// ----------------------------------------------------------------------------
// Kategori şablonları
// ----------------------------------------------------------------------------
interface Tmpl {
  title: (nb: string) => string;
  description: (nb: string, city: string) => string;
  priceMin: number;
  priceMax: number;
  audience: string[];
  tags: string[];
  durationMin?: number;
}

const TEMPLATES: Record<string, Tmpl[]> = {
  kahvalti: [
    { title: (nb) => `${nb} Serpme Kahvaltı 2 Kişi`, description: (nb) => `${nb}'nın yerel favorisinde serpme kahvaltı — peynir tabağı, ev reçelleri, taze ekmek.`, priceMin: 320, priceMax: 720, audience: ['couple', 'family'], tags: ['rahat', 'rahat', 'huzurlu'], durationMin: 90 },
    { title: (nb) => `${nb} Bahçe Kahvaltısı`, description: (nb) => `${nb}'da açık havada serpme kahvaltı, sahil ya da bahçe manzaralı.`, priceMin: 280, priceMax: 580, audience: ['couple', 'family', 'group'], tags: ['acik-hava', 'rahat'], durationMin: 90 },
    { title: (nb) => `${nb} Brunch Tabağı 2 Kişi`, description: (nb) => `${nb}'da modern brunch — avokado, omlet, smoothie, taze meyveler.`, priceMin: 380, priceMax: 780, audience: ['couple', 'solo'], tags: ['samimi', 'sehir-merkezi'], durationMin: 75 },
    { title: (nb) => `${nb} Çocuklu Aile Kahvaltısı`, description: (nb) => `${nb}'da çocuk dostu bir kahvaltı menüsü, krep ve meyveli tabaklarla.`, priceMin: 360, priceMax: 720, audience: ['family', 'kids'], tags: ['cocuk-dostu', 'rahat'], durationMin: 90 },
    { title: (nb) => `${nb} Hafta Sonu Köy Kahvaltı`, description: (nb) => `${nb}'da köy usulü zengin tabaklar, sıcak menemen ve organik ürünler.`, priceMin: 320, priceMax: 660, audience: ['family', 'couple'], tags: ['hafta-sonu', 'rahat'], durationMin: 100 },
    { title: (nb) => `${nb} Erkenci Kahve & Tost`, description: (nb) => `${nb}'da hızlı bir başlangıç — taze kahve ve sıcak tost menüsü.`, priceMin: 180, priceMax: 360, audience: ['solo', 'couple'], tags: ['son-dakika', 'sehir-merkezi'], durationMin: 30 },
  ],
  yemek: [
    { title: (nb) => `${nb} Et Restoranı 2 Kişilik`, description: (nb) => `${nb}'nın özenle hazırlanmış et menüsü; ızgaralar, ev usulü salatalar.`, priceMin: 900, priceMax: 2200, audience: ['couple', 'group'], tags: ['romantik', 'sehir-merkezi'], durationMin: 90 },
    { title: (nb) => `${nb} Balık Mezesi Akşam`, description: (nb) => `${nb}'da deniz mahsulleri, klasik meze tabakları ve rakılı klasik bir gece.`, priceMin: 1100, priceMax: 2400, audience: ['couple', 'group'], tags: ['rahat', 'rahat'], durationMin: 120 },
    { title: (nb) => `${nb} İtalyan 3 Kap Menü`, description: (nb) => `${nb}'da otantik İtalyan; antipasti, pasta ve tatlı üçlüsü.`, priceMin: 750, priceMax: 1600, audience: ['couple'], tags: ['romantik', 'samimi'], durationMin: 90 },
    { title: (nb) => `${nb} Vegan Akşam Menü`, description: (nb) => `${nb}'da tam vegan menü — taze sebzeler, baklagil tabakları, ev tatlısı.`, priceMin: 580, priceMax: 1200, audience: ['couple', 'solo'], tags: ['vegan', 'samimi'], durationMin: 75 },
    { title: (nb) => `${nb} Asya Mutfağı 2 Kişi`, description: (nb) => `${nb}'da uzakdoğu mutfağı; ramen, sushi, wok seçenekleri.`, priceMin: 700, priceMax: 1500, audience: ['couple', 'solo'], tags: ['samimi', 'sehir-merkezi'], durationMin: 75 },
    { title: (nb) => `${nb} İş Yemeği Set Menü`, description: (nb) => `${nb}'da business toplantısı için hızlı 3 kap iş yemeği.`, priceMin: 480, priceMax: 950, audience: ['solo', 'group'], tags: ['business-uygun', 'sehir-merkezi'], durationMin: 60 },
    { title: (nb) => `${nb} Çocuk Menülü Aile Yemeği`, description: (nb) => `${nb}'da geniş aile masaları, çocuk menüleri, oyun alanı.`, priceMin: 650, priceMax: 1300, audience: ['family', 'kids'], tags: ['cocuk-dostu', 'rahat'], durationMin: 90 },
  ],
  tiyatro: [
    { title: (nb) => `${nb} Çocuk Tiyatrosu 1 Çocuk + 1 Yetişkin`, description: (nb) => `${nb}'da hafta sonu çocuk oyunu — eğlenceli, eğitici.`, priceMin: 220, priceMax: 480, audience: ['family', 'kids'], tags: ['cocuk-dostu', 'hafta-sonu', 'eglenceli'], durationMin: 60 },
    { title: (nb) => `${nb} Yetişkin Tiyatro Oyunu`, description: (nb) => `${nb}'da klasik veya modern bir yetişkin oyunu — 2 kişilik bilet.`, priceMin: 380, priceMax: 720, audience: ['couple', 'solo'], tags: ['romantik', 'sehir-merkezi'], durationMin: 90 },
    { title: (nb) => `${nb} Pazar Matine`, description: (nb) => `${nb}'da pazar günü matine tiyatro — rahat saat, kalabalık az.`, priceMin: 280, priceMax: 540, audience: ['couple', 'family'], tags: ['hafta-sonu', 'rahat'], durationMin: 75 },
  ],
  konser: [
    { title: (nb) => `${nb} Canlı Akustik Gece`, description: (nb) => `${nb}'da samimi bir akustik konser; sıcak bir mekanda.`, priceMin: 280, priceMax: 580, audience: ['couple', 'group', 'solo'], tags: ['romantik', 'sehir-merkezi'], durationMin: 120 },
    { title: (nb) => `${nb} Jazz Kulübü Bileti`, description: (nb) => `${nb}'nın canlı jazz mekânında bir gece.`, priceMin: 380, priceMax: 720, audience: ['couple', 'solo'], tags: ['samimi', 'sehir-merkezi'], durationMin: 150 },
    { title: (nb) => `${nb} Rock Sahnesi Geç Saat`, description: (nb) => `${nb}'da yerli rock gruplarıyla geç saat konser.`, priceMin: 320, priceMax: 640, audience: ['group', 'solo'], tags: ['eglenceli'], durationMin: 180 },
  ],
  'stand-up': [
    { title: (nb) => `${nb} Stand-up Gecesi 2 Kişi`, description: (nb) => `${nb}'da hafta sonu stand-up — yerli komedyenlerle.`, priceMin: 350, priceMax: 700, audience: ['couple', 'group'], tags: ['eglenceli', 'hafta-sonu'], durationMin: 90 },
    { title: (nb) => `${nb} Cumartesi Komedi`, description: (nb) => `${nb}'da cumartesi gecesi yerli komedyenlerle 2 set.`, priceMin: 320, priceMax: 640, audience: ['group', 'couple'], tags: ['eglenceli', 'hafta-sonu'], durationMin: 90 },
  ],
  aktivite: [
    { title: (nb) => `${nb} Yürüyüş Turu Grup`, description: (nb) => `${nb}'nın gizli sokaklarında rehberli yürüyüş turu.`, priceMin: 220, priceMax: 480, audience: ['solo', 'group', 'couple'], tags: ['acik-hava', 'sehir-merkezi'], durationMin: 90 },
    { title: (nb) => `${nb} Bisiklet Kiralama 4 Saat`, description: (nb) => `${nb}'da 4 saatlik bisiklet kiralama; haritalar dahil.`, priceMin: 180, priceMax: 360, audience: ['solo', 'couple', 'family'], tags: ['acik-hava', 'eglenceli'], durationMin: 240 },
    { title: (nb) => `${nb} Tırmanış Salonu 1 Saat`, description: (nb) => `${nb}'da iç mekan duvar tırmanışı; rehber + ekipman dahil.`, priceMin: 280, priceMax: 540, audience: ['solo', 'group'], tags: ['eglenceli'], durationMin: 60 },
    { title: (nb) => `${nb} Trambolin Çocuklara`, description: (nb) => `${nb}'da çocuklar için 1 saat trambolin parkı bileti.`, priceMin: 180, priceMax: 360, audience: ['kids', 'family'], tags: ['cocuk-dostu', 'eglenceli'], durationMin: 60 },
    { title: (nb) => `${nb} Paintball Grup`, description: (nb) => `${nb}'da arkadaş grubuyla 2 saatlik paintball deneyimi.`, priceMin: 380, priceMax: 720, audience: ['group'], tags: ['eglenceli', 'grup-icin'], durationMin: 120 },
    { title: (nb) => `${nb} Kano Kiralama`, description: (nb) => `${nb}'da göl/deniz kıyısında 2 saat kano deneyimi.`, priceMin: 280, priceMax: 540, audience: ['couple', 'group'], tags: ['acik-hava', 'eglenceli'], durationMin: 120 },
  ],
  masaj: [
    { title: (nb) => `${nb} 60dk Klasik Masaj`, description: (nb) => `${nb}'da terapötik 60 dakika klasik masaj.`, priceMin: 580, priceMax: 1100, audience: ['solo', 'couple'], tags: ['rahat', 'huzurlu'], durationMin: 60 },
    { title: (nb) => `${nb} Çift Masajı 90dk`, description: (nb) => `${nb}'da eşinizle 90 dakika eş zamanlı masaj seansı.`, priceMin: 1100, priceMax: 2200, audience: ['couple'], tags: ['romantik', 'huzurlu'], durationMin: 90 },
    { title: (nb) => `${nb} Spa Hamam Paketi`, description: (nb) => `${nb}'da geleneksel hamam + kese + 30dk masaj paketi.`, priceMin: 780, priceMax: 1500, audience: ['solo', 'couple'], tags: ['huzurlu', 'rahat'], durationMin: 120 },
    { title: (nb) => `${nb} Aromaterapi 75dk`, description: (nb) => `${nb}'nın stüdyosunda 75 dakika aromaterapi masajı.`, priceMin: 720, priceMax: 1400, audience: ['solo', 'couple'], tags: ['huzurlu'], durationMin: 75 },
  ],
  guzellik: [
    { title: (nb) => `${nb} Cilt Bakımı 60dk`, description: (nb) => `${nb}'da derinlemesine yüz temizliği + nemlendirme bakımı.`, priceMin: 420, priceMax: 880, audience: ['solo', 'couple'], tags: ['sehir-merkezi'], durationMin: 60 },
    { title: (nb) => `${nb} Manikür Pedikür Paketi`, description: (nb) => `${nb}'da klasik manikür + pedikür, masaj dahil.`, priceMin: 380, priceMax: 720, audience: ['solo'], tags: ['rahat'], durationMin: 90 },
    { title: (nb) => `${nb} Saç Bakım + Kesim`, description: (nb) => `${nb}'da besleyici saç bakımı + uzman kesim.`, priceMin: 420, priceMax: 880, audience: ['solo'], tags: ['sehir-merkezi'], durationMin: 90 },
    { title: (nb) => `${nb} Hidrafacial Tek Seans`, description: (nb) => `${nb}'da makine destekli derin temizlik + nemlendirme.`, priceMin: 880, priceMax: 1800, audience: ['solo'], tags: ['samimi'], durationMin: 75 },
  ],
  turlar: [
    { title: (nb) => `${nb} Şehir Turu Rehberli`, description: (nb) => `${nb}'nın tarihi noktalarını rehberle 3 saatte gez.`, priceMin: 320, priceMax: 720, audience: ['solo', 'couple', 'group'], tags: ['sehir-merkezi'], durationMin: 180 },
    { title: (nb) => `${nb} Fotoğraf Turu`, description: (nb) => `${nb}'nın en güzel sokaklarında fotoğraf odaklı rehberli tur.`, priceMin: 380, priceMax: 780, audience: ['solo', 'couple'], tags: ['samimi'], durationMin: 150 },
    { title: (nb) => `${nb} Tarihi Yarımada Turu`, description: (nb) => `${nb}'dan başlayan klasik tarih turu, yerel rehber eşliğinde.`, priceMin: 280, priceMax: 580, audience: ['solo', 'couple', 'family'], tags: ['hafta-sonu'], durationMin: 240 },
  ],
  'sehir-otelleri': [
    { title: (nb) => `${nb} 1 Gece Boutique Konaklama`, description: (nb) => `${nb}'da küçük otel — kahvaltı dahil 1 gece konaklama.`, priceMin: 2400, priceMax: 5800, audience: ['couple'], tags: ['romantik', 'sehir-merkezi'] },
    { title: (nb) => `${nb} Şehir Merkezi 2 Gece`, description: (nb) => `${nb}'da 4 yıldız şehir oteli, 2 gece + kahvaltı.`, priceMin: 4400, priceMax: 9800, audience: ['couple', 'family'], tags: ['sehir-merkezi'] },
  ],
  'tatil-otelleri': [
    { title: (nb) => `${nb} 2 Gece Sahil Oteli`, description: (nb) => `${nb}'da deniz manzaralı 2 gece konaklama + kahvaltı.`, priceMin: 4400, priceMax: 11000, audience: ['couple', 'family'], tags: ['romantik', 'acik-hava'] },
    { title: (nb) => `${nb} Hafta Sonu Tatil Paketi`, description: (nb) => `${nb}'da cumartesi-pazar konaklama + tüm öğünler dahil paket.`, priceMin: 5500, priceMax: 12000, audience: ['couple', 'family'], tags: ['hafta-sonu', 'rahat'] },
  ],
  kurs: [
    { title: (nb) => `${nb} Yoga 4 Hafta Paketi`, description: (nb) => `${nb}'da haftada 2 ders, toplam 8 ders yoga paketi.`, priceMin: 880, priceMax: 1800, audience: ['solo'], tags: ['huzurlu', 'samimi'], durationMin: 60 },
    { title: (nb) => `${nb} Pilates 8 Ders`, description: (nb) => `${nb}'da reformer ya da mat pilates, 8 ders paketi.`, priceMin: 1200, priceMax: 2400, audience: ['solo'], tags: ['samimi'], durationMin: 50 },
    { title: (nb) => `${nb} Resim Atölyesi 1 Gün`, description: (nb) => `${nb}'da uzman eğitmenle 1 günlük resim atölyesi.`, priceMin: 480, priceMax: 980, audience: ['solo', 'couple'], tags: ['samimi'], durationMin: 240 },
    { title: (nb) => `${nb} Çocuk Atölye 1 Gün`, description: (nb) => `${nb}'da çocuklar için 1 günlük yaratıcı atölye.`, priceMin: 320, priceMax: 680, audience: ['kids', 'family'], tags: ['cocuk-dostu', 'eglenceli'], durationMin: 180 },
  ],
  hizmet: [
    { title: (nb) => `${nb} Derin Daire Temizliği`, description: (nb) => `${nb} ve çevresine 3+1 daireye uçtan uca derin temizlik.`, priceMin: 1800, priceMax: 3600, audience: ['solo', 'family'], tags: ['samimi'], durationMin: 300 },
    { title: (nb) => `${nb} Tesisat Onarım`, description: (nb) => `${nb} bölgesinde sıhhi tesisat onarımı; yerinde fatura.`, priceMin: 480, priceMax: 1200, audience: ['solo', 'family'], tags: [], durationMin: 90 },
    { title: (nb) => `${nb} Halı Yıkama Tek Daire`, description: (nb) => `${nb}'da kapıdan kapıya halı yıkama; 100m²'ye kadar.`, priceMin: 880, priceMax: 1800, audience: ['family'], tags: [] },
  ],
};

const CATEGORY_SLUGS = Object.keys(TEMPLATES);

const CAT_PHOTOS: Record<string, string[]> = {
  kahvalti: ['1414235077428-338989a2e8c0', '1525351484163-7529414344d8', '1551218808-94e220e084d2'],
  yemek: ['1546069901-ba9599a7e63c', '1517248135467-4c7edcad34c4', '1567620905732-2d1ec7ab7445'],
  tiyatro: ['1503095396549-807759245b35', '1507676184212-d03ab07a01bf', '1518609878373-06d740f60d8b'],
  konser: ['1501386761578-eac5c94b800a', '1493225457124-a3eb161ffa5f', '1459749411175-04bf5292ceea'],
  'stand-up': ['1531058020387-3be344556be6', '1501386761578-eac5c94b800a'],
  aktivite: ['1448375240586-882707db888b', '1517649763962-0c623066013b'],
  masaj: ['1540555700478-4be289fbecef', '1544161515-4ab6ce6db874', '1583416750470-965b2707b355'],
  guzellik: ['1522337360788-8b13dee7a37e', '1487412947147-5cebf100ffc2'],
  turlar: ['1564501049412-61c2a3083791', '1551882547-ff40c63fe5fa'],
  'sehir-otelleri': ['1551882547-ff40c63fe5fa', '1542314831-068cd1dbfeeb', '1549294413-26f195200c16'],
  'tatil-otelleri': ['1571003123894-1f0594d2b5d9', '1582719508461-905c673771fd'],
  kurs: ['1503676260728-1c00da094a0b', '1488521787991-ed7bbaae773c'],
  hizmet: ['1581578731548-c64695cc6952', '1558618666-fcd25c85cd64'],
};

// ----------------------------------------------------------------------------
// Yardımcılar
// ----------------------------------------------------------------------------
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function pickRandom<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function jitterCoord(c: LatLng, rnd: () => number): LatLng {
  // ~300m yarıçap deterministik per-deal kayma.
  const angle = rnd() * 2 * Math.PI;
  const r = 0.003 * Math.sqrt(rnd());
  const lngScale = Math.cos((c.lat * Math.PI) / 180);
  return {
    lat: +(c.lat + Math.sin(angle) * r).toFixed(6),
    lng: +(c.lng + (Math.cos(angle) * r) / Math.max(lngScale, 0.2)).toFixed(6),
  };
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function inDaysISO(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function imgFor(category: string, seed: string): string {
  const pool = CAT_PHOTOS[category] ?? ['1551218808-94e220e084d2'];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const id = pool[Math.abs(h) % pool.length];
  return `https://images.unsplash.com/photo-${id}?w=1200&q=70&auto=format&fit=crop`;
}

// ----------------------------------------------------------------------------
// Generator
// ----------------------------------------------------------------------------
interface GenDeal {
  slug: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  category: string;
  audience: string[];
  tags: string[];
  durationMin?: number;
  price: number;
  original: number;
  discount: number;
}

function generateForCity(args: {
  city: string;
  count: number;
  existingSlugs: Set<string>;
  startSeed: number;
}): GenDeal[] {
  const neighborhoods = NEIGHBORHOODS[args.city];
  if (!neighborhoods) return [];
  const nbNames = Object.keys(neighborhoods);
  const rnd = makeRng(args.startSeed);
  const out: GenDeal[] = [];
  let attempts = 0;

  while (out.length < args.count && attempts < args.count * 10) {
    attempts++;
    const category = pickRandom(CATEGORY_SLUGS, rnd);
    const tmpl = pickRandom(TEMPLATES[category], rnd);
    const nb = pickRandom(nbNames, rnd);
    const baseTitle = tmpl.title(nb);
    const slug = slugify(`auto-${args.city}-${baseTitle}-${attempts}`);
    if (args.existingSlugs.has(slug)) continue;

    const { lat, lng } = jitterCoord(neighborhoods[nb], rnd);
    const original = Math.round(tmpl.priceMin + rnd() * (tmpl.priceMax - tmpl.priceMin));
    const discount = 25 + Math.floor(rnd() * 35);
    const price = Math.round((original * (1 - discount / 100)) / 10) * 10;

    out.push({
      slug,
      city: args.city,
      district: nb,
      lat,
      lng,
      title: baseTitle,
      description: tmpl.description(nb, args.city),
      category,
      audience: tmpl.audience,
      tags: tmpl.tags,
      durationMin: tmpl.durationMin,
      price,
      original,
      discount,
    });
    args.existingSlugs.add(slug);
  }
  return out;
}

// ----------------------------------------------------------------------------
// Insert pipeline
// ----------------------------------------------------------------------------
async function main() {
  // Mevcut deal slug + şehir sayıları
  const { data: existing, error: e1 } = await supabase.from('deals').select('slug, city');
  if (e1) throw e1;
  const existingSlugs = new Set((existing ?? []).map((d) => d.slug));
  const cityCounts = new Map<string, number>();
  for (const d of existing ?? []) cityCounts.set(d.city, (cityCounts.get(d.city) ?? 0) + 1);

  console.log('Mevcut sayılar:');
  for (const c of Object.keys(TARGETS)) {
    console.log(`  ${c}: ${cityCounts.get(c) ?? 0} / ${TARGETS[c]}`);
  }

  // Generate
  const all: GenDeal[] = [];
  let seedOffset = 12345;
  for (const [city, target] of Object.entries(TARGETS)) {
    const have = cityCounts.get(city) ?? 0;
    const need = Math.max(0, target - have);
    if (need === 0) {
      console.log(`  ${city}: dolu, atlandı`);
      continue;
    }
    console.log(`  ${city}: ${need} yeni üretilecek`);
    all.push(...generateForCity({ city, count: need, existingSlugs, startSeed: seedOffset }));
    seedOffset += 7777;
  }

  if (all.length === 0) {
    console.log('Yapılacak bir şey yok.');
    return;
  }

  console.log(`\n${all.length} yeni deal üretildi. Merchant + deal + junction yazılıyor…`);

  // 1) Her deal için BENZERSİZ merchant (koord çeşitliliği için).
  const merchantRows = all.map((d) => ({
    slug: `m-${d.slug}`,
    name: `${d.district} ${d.category.replace(/-/g, ' ')}`,
    description: `${d.district} bölgesinde ${d.category.replace(/-/g, ' ')} hizmeti sunar.`,
    city: d.city,
    district: d.district,
    lat: d.lat,
    lng: d.lng,
    is_active: true,
  }));

  for (let i = 0; i < merchantRows.length; i += 100) {
    const { error } = await supabase
      .from('merchants')
      .upsert(merchantRows.slice(i, i + 100), { onConflict: 'slug' });
    if (error) throw error;
  }

  // `.in('slug', [...])` URL'i şişirip "URI too long" verir; 50'lik batch.
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

  // 2) Kategori id'leri
  const { data: cats, error: cErr } = await supabase.from('categories').select('id, slug');
  if (cErr) throw cErr;
  const catIdBySlug = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  // 3) Embedding'ler (concurrency=5)
  console.log('Embedding üretiliyor…');
  const embeds: (string | null)[] = new Array(all.length);
  if (process.env.GEMINI_API_KEY) {
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
              subtitle: null,
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
          embeds[i] = null;
          fail++;
          console.error(`  embed fail [${d.slug}]: ${err instanceof Error ? err.message : err}`);
        }
        if ((ok + fail) % 25 === 0) console.log(`  [${ok + fail}/${all.length}]`);
      }
    }
    await Promise.all(Array.from({ length: 5 }, worker));
    console.log(`  embeddings: ok=${ok} fail=${fail}`);
  } else {
    console.log('  GEMINI_API_KEY yok — atlandı (ai:backfill ile sonra)');
  }

  // 4) Deal upsert
  const dealRows = all.map((d, i) => ({
    slug: d.slug,
    merchant_id: merchantIdBySlug.get(`m-${d.slug}`)!,
    title: d.title,
    subtitle: null,
    description: d.description,
    highlights: [],
    cover_image: imgFor(d.category, d.slug),
    images: [imgFor(d.category, `${d.slug}-2`), imgFor(d.category, `${d.slug}-3`)],
    original_price: d.original,
    discounted_price: d.price,
    city: d.city,
    district: d.district,
    venue_name: null,
    duration_minutes: d.durationMin ?? null,
    valid_from: new Date().toISOString(),
    valid_until: inDaysISO(60 + Math.floor(Math.random() * 60)),
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

  // 5) Junctions — yine 50'lik batch.
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

  console.log(
    `\n✓ Bitti. ${dealRows.length} deal + ${merchantRows.length} merchant + ${junctions.length} kategori bağı eklendi.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
