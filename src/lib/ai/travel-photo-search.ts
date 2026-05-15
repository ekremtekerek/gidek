import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';

/**
 * Foto-tabanlı tatil arama. Kullanıcı bir tatil fotoğrafı yükler (örn:
 * Bali, Maldivler, Mykonos), Gemini Vision ile analiz edilir ve Türkiye'den
 * benzer atmosfere sahip destinasyonlar önerilir. Rakiplerde yok.
 *
 * Output:
 *   - vibe: ana atmosfer (chill, adventurous, romantic, family, party)
 *   - setting: ortam (beach, mountain, city, cultural, desert, island)
 *   - features: gözlemlenen öğeler (palm trees, infinity pool, …)
 *   - turkishMatches: Türkiye'den 3-5 benzer destinasyon (gerekçeli)
 *   - searchKeywords: /tatil/ara için kullanılacak anahtar kelimeler
 */

const VibeEnum = z.string().describe('chill / adventurous / romantic / family / party / cultural / wellness (ASCII)');
const SettingEnum = z.string().describe('beach / mountain / city / cultural / desert / island / lake / forest (ASCII)');

const PhotoAnalysisSchema = z.object({
  vibe: VibeEnum,
  setting: SettingEnum,
  description: z.string().min(20).max(400),
  features: z.array(z.string().min(2).max(60)).min(2).max(8),
  colorPalette: z.array(z.string().min(3).max(30)).min(2).max(5).default([]),
  turkishMatches: z
    .array(
      z.object({
        destination: z.string().min(2).max(60),
        score: z.number().min(1).max(10),
        why: z.string().min(10).max(300),
        searchKeyword: z.string().min(2).max(80),
      }),
    )
    .min(3)
    .max(5),
  searchKeywords: z.array(z.string().min(2).max(40)).min(3).max(8).default([]),
});

type Vibe =
  | 'chill'
  | 'adventurous'
  | 'romantic'
  | 'family'
  | 'party'
  | 'cultural'
  | 'wellness';
type Setting =
  | 'beach'
  | 'mountain'
  | 'city'
  | 'cultural'
  | 'desert'
  | 'island'
  | 'lake'
  | 'forest';

export interface PhotoAnalysisResult {
  vibe: Vibe;
  setting: Setting;
  description: string;
  features: string[];
  colorPalette: string[];
  turkishMatches: Array<{
    destination: string;
    score: number;
    why: string;
    searchKeyword: string;
  }>;
  searchKeywords: string[];
}

function normalizeVibe(v: string): Vibe {
  const t = v.toLocaleLowerCase('tr');
  if (t.includes('adv') || t.includes('macera')) return 'adventurous';
  if (t.includes('rom')) return 'romantic';
  if (t.includes('fam') || t.includes('aile')) return 'family';
  if (t.includes('part')) return 'party';
  if (t.includes('cult') || t.includes('kült')) return 'cultural';
  if (t.includes('well') || t.includes('spa')) return 'wellness';
  return 'chill';
}

function normalizeSetting(v: string): Setting {
  const t = v.toLocaleLowerCase('tr');
  if (t.includes('mount') || t.includes('dağ')) return 'mountain';
  if (t.includes('city') || t.includes('şehir') || t.includes('sehir')) return 'city';
  if (t.includes('cult') || t.includes('kült')) return 'cultural';
  if (t.includes('des') || t.includes('çöl')) return 'desert';
  if (t.includes('isl') || t.includes('ada')) return 'island';
  if (t.includes('lake') || t.includes('göl') || t.includes('gol')) return 'lake';
  if (t.includes('for') || t.includes('orman')) return 'forest';
  return 'beach';
}

const SYSTEM_PROMPT = `Sen gidek.net'in tatil görsel analizcisin.

Kullanıcı bir tatil/seyahat fotoğrafı yüklüyor (yurtdışından veya
Türkiye'den). Görseli analiz edip Türkiye'den benzer atmosfere sahip
destinasyonlar öneriyorsun.

Görev:
1. Görseldeki temel vibe'ı, ortamı, görsel öğeleri tespit et.
2. Türkiye coğrafyasındaki en yakın 3-5 alternatifi öner.
   - Bali tropikal plaj → Antalya, Side, Marmaris, Çıralı, Kaş
   - Mykonos beyaz mimari → Bozcaada, Cunda, Alaçatı, Çeşme
   - İsviçre dağ → Uludağ, Kaçkar, Sapanca, Bolu Abant
   - Toskana bağ → Şirince, Tire, Urla bağları
   - Maldivler bungalov → Gökova, Selimiye, Bodrum tekne turu
   - Dubai çöl + lüks → ultra all inclusive Belek, Antalya marina
   - Paris şehir kültür → İstanbul Beyoğlu, Bursa, Edirne, Safranbolu
3. Her öneri için "neden bu fotoya benziyor" gerekçesi yaz (somut: "aynı feldispar
   beyaz mimari, lavanta tarlalı", "deniz suyu tonu eşleşiyor — turkuaz lagün").
4. searchKeyword: kullanıcının /tatil/ara'da yazıp arayabileceği kısa fraz
   (örn: "Antalya Side all inclusive", "Bozcaada butik otel").

Kurallar:
- Pazarlama dili YASAK ("muhteşem", "harika", "olağanüstü", "eşsiz").
- Spesifik ol — "deniz" yerine "turkuaz sığ lagün", "yeşillik" yerine "çam ormanı".
- Score: ne kadar yakın eşleşme (1-10). 10 = neredeyse aynı atmosfer.
- vibe ve setting alanları SADECE ASCII enum değerleri.
- colorPalette: 2-4 dominant renk adı (Türkçe veya İngilizce, kısa).
- Türkçe, "sen" hitabı.`;

/**
 * Gemini Vision üzerinden görsel analizi yap.
 * @param imageBuffer Görsel byte buffer'ı (jpeg/png/webp)
 * @param mimeType Görsel MIME tipi
 */
export async function analyzeVacationPhoto(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<PhotoAnalysisResult> {
  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    schema: PhotoAnalysisSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Bu tatil fotoğrafını analiz et. Türkiye\'den benzer atmosfere sahip 3-5 destinasyon öner. ÖNEMLİ: vibe ve setting SADECE ASCII enum (chill/adventurous/romantic/family/party/cultural/wellness ve beach/mountain/city/cultural/desert/island/lake/forest).',
          },
          {
            type: 'image',
            image: imageBuffer,
            mediaType: mimeType,
          },
        ],
      },
    ],
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  return {
    vibe: normalizeVibe(object.vibe),
    setting: normalizeSetting(object.setting),
    description: object.description,
    features: object.features,
    colorPalette: object.colorPalette ?? [],
    turkishMatches: object.turkishMatches,
    searchKeywords: object.searchKeywords ?? [],
  };
}
