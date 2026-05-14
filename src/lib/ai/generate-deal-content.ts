import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { DEAL_TAGS, AUDIENCE, MAIN_CATEGORIES } from '@/lib/utils/constants';

/**
 * Admin deal oluşturma akışında — başlık + kategori + serbest ipuçlarından
 * SEO-optimize description + highlights + meta üretir. Gemini'nin
 * structured output'unu zod ile zorluyoruz; çıktı her zaman tip-güvenli.
 *
 * Asıl değer: admin "bostancı'da bahçeli aile akşam yemeği" diye 5 kelime
 * yazar, AI 250 kelimelik SEO description + 5 highlights + 4 öneri tag
 * üretir. İçerik üretimi 30 sn'lik iş 5 sn'ye iniyor.
 */

const TAG_SLUGS = DEAL_TAGS.map((t) => t.slug);
const AUDIENCE_SLUGS = AUDIENCE.map((a) => a.slug);
const CATEGORY_SLUGS = MAIN_CATEGORIES.map((c) => c.slug);

const GenerateInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  categorySlug: z.enum(CATEGORY_SLUGS as [string, ...string[]]).optional(),
  merchantName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  keywords: z.string().trim().max(500).optional(),
});

export type GenerateDealInput = z.infer<typeof GenerateInputSchema>;

const OutputSchema = z.object({
  subtitle: z
    .string()
    .min(20)
    .max(160)
    .describe('Tek cümle, davetkâr; başlığı tekrar etmez'),
  description: z
    .string()
    .min(120)
    .max(1200)
    .describe('200-400 kelime, SEO uyumlu, 2-3 paragraf. Kullanıcı "bu deneyimi ne hissettirir, neyi vaat ediyor" sorusuna cevap bulsun. Pazarlama abartısı YOK; somut detay (mekan, atmosfer, içerik) öne çık.'),
  highlights: z
    .array(z.string().min(8).max(80))
    .min(3)
    .max(6)
    .describe('3-6 madde — fırsatın öne çıkan yönleri, "X dakikalık masaj", "Sınırsız çay", "Boğaz manzaralı teras" gibi somut özellikler'),
  metaTitle: z
    .string()
    .min(20)
    .max(60)
    .describe('60 karakter altı, anahtar kelime + lokasyon + cazibe noktası'),
  metaDescription: z
    .string()
    .min(80)
    .max(160)
    .describe('160 karakter altı, davetkâr ama doğrudan; CTA içersin (ör. "Hemen rezerve et")'),
  tags: z
    .array(z.enum(TAG_SLUGS as [string, ...string[]]))
    .min(3)
    .max(10)
    .describe('Verilen tag listesinden 3-10 alakalı tag — atmosfer, mekan, zaman, kitle, pratik, diyet, stil kombinasyonu'),
  audience: z
    .array(z.enum(AUDIENCE_SLUGS as [string, ...string[]]))
    .min(1)
    .max(4)
    .describe('Bu fırsatın hitap ettiği kitle — couple/family/kids/solo/group'),
});

export type GeneratedDealContent = z.infer<typeof OutputSchema>;

const SYSTEM_PROMPT = `Sen gidek.net için içerik üretiyorsun — Türkiye'de fırsat keşif platformu.

GÖREVİN:
Admin'in verdiği başlık + ipuçlarından SEO-optimize, sıcak ama profesyonel bir fırsat sayfası içeriği üretmek.

KURALLAR:
1. Dil: Türkçe. Akıcı, sıcak, "sen" hitabı kullanma — nötr 3. tekil.
2. Pazarlama abartısı YASAK: "muhteşem", "harika", "olmazsa olmaz", "kaçırma" yok.
3. Somut bilgi öne çık: konum, atmosfer, sürelerin, içeriklerin, neye uygun olduğu.
4. SEO: anahtar kelimeler doğal akışta — keyword stuffing değil.
5. Tags: verilen listeden mantıklı seçim; tag'i seçme sebebi açık olmalı (içerikten çıkar).
6. Audience: hitap edilen kitleyi içerikle uyumlu seç — fitness dersi → solo/group; aile yemeği → family/couple.

ÖRNEK STİLİ:
"Boğaz manzaralı bir terasın sessiz köşesinde, iki kişilik bir akşam yemeği. Şefin mevsime özel hazırladığı 5 kapsamlı menüde deniz mahsulleri ve vejetaryen seçenek ağırlıkta. Yaklaşık 2 saatlik bir oturuş; rezervasyon esnek değil."

NE YAPMAYACAĞIN:
- Yanıltıcı vaat (örn. "kuyruksuz" demese bile somut destek yoksa)
- Kategoriyle çelişkili audience (örn. romantik akşam yemeği → kids)
- Aynı kelimeyi 3+ kez tekrarlama
- Markdown formatı yok — düz metin döndür.
`;

/**
 * Gemini'den structured output al. Zod schema'sı çıktının tipini ve formatını
 * garanti eder. Maliyet: ~0.0005 USD/çağrı (Gemini 2.5 Flash).
 */
export async function generateDealContent(
  input: GenerateDealInput,
): Promise<GeneratedDealContent> {
  const parsed = GenerateInputSchema.parse(input);

  const context = [
    `Başlık: ${parsed.title}`,
    parsed.categorySlug
      ? `Kategori: ${parsed.categorySlug} (${
          MAIN_CATEGORIES.find((c) => c.slug === parsed.categorySlug)?.name
        })`
      : null,
    parsed.merchantName ? `İşletme: ${parsed.merchantName}` : null,
    parsed.city ? `Şehir: ${parsed.city}` : null,
    parsed.district ? `Semt: ${parsed.district}` : null,
    parsed.keywords ? `Ek ipuçları: ${parsed.keywords}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: `Aşağıdaki fırsat için içerik üret:\n\n${context}`,
    schema: OutputSchema,
    temperature: 0.4,
  });

  return object;
}
