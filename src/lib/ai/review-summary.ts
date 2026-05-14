import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { estimateCostUsd, recordSpend } from '@/lib/ai/budget';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { getServiceClient } from '@/lib/db/service';

/**
 * AI yorum özeti — bir deal için tüm aktif yorumları okuyup tek paragraflık
 * "müşteriler ne diyor" özeti, olumlu temalar listesi ve dikkat notları
 * üretir. Cache-aside: `review_summaries` tablosunda yorum sayısı eşitse
 * yeniden hesaplanmaz; değişince invalidate olur.
 *
 * Minimum threshold: < 3 yorum varsa anlamlı özet çıkmaz → null döner.
 */

const SummarySchema = z.object({
  summary: z
    .string()
    .min(60)
    .max(400)
    .describe(
      'Yorumların özünü 2-4 cümlede anlat. "Müşteriler... diyor" çerçevesi. Sayı kullanma (count zaten ayrı gösteriyoruz).',
    ),
  positiveThemes: z
    .array(z.string().min(3).max(40))
    .min(1)
    .max(5)
    .describe('Olumlu temalar — kısa 2-3 kelimelik etiketler (örn. "açık hava terası", "hızlı servis")'),
  cautionNotes: z
    .array(z.string().min(3).max(60))
    .max(3)
    .describe('Dikkat edilecek noktalar — varsa, yoksa boş array. Olumsuz yorumlardan çıkarılan pratik uyarılar.'),
});

export type ReviewSummary = z.infer<typeof SummarySchema>;

const MIN_REVIEWS = 3;

const SYSTEM_PROMPT = `Sen gidek.net için yorum özetleyicisin.

Görev: Bir fırsata yapılan müşteri yorumlarını okuyup objektif bir özet üret.

Kurallar:
1. Pazarlama dili YASAK ("muhteşem", "olmazsa olmaz", "kaçırma" yok).
2. Yorumlardaki SOMUT detayları ön plana çıkar (mekan özellikleri, servis hızı, fiyat algısı, atmosfer).
3. Olumlu + olumsuz dengeyi yansıt — sadece pozitif veya sadece negatif gösterme.
4. cautionNotes: gerçek bir uyarı varsa yaz, yoksa boş bırak. Sahte uyarı türetme.
5. Türkçe, "müşteriler... diyor" çerçevesi.
6. Tekil yorumcuların adlarını kullanma.

Örnek summary stilleri:
- "Gelenler özellikle terasın boğaz manzarasını ve servis hızını öne çıkarıyor. Kahvaltıda peynir çeşitleri öne çıkıyor; hafta sonu rezervasyonsuz gelinmemesi öneriliyor."
- "Müşteriler masaj kalitesi ve sessiz ortamdan memnun. Park yeri sıkıntısı bazı yorumlarda not düşülmüş."
`;

interface ReviewInput {
  rating: number;
  body: string;
}

/**
 * Cache'i kontrol et, gerekirse Gemini ile yeniden üret, sonucu döndür.
 * Yorum sayısı < 3 ise null döner (özet gösterilmez).
 */
export async function getOrGenerateReviewSummary(dealId: string): Promise<{
  summary: string;
  positiveThemes: string[];
  cautionNotes: string[];
  reviewCount: number;
  generatedAt: string;
} | null> {
  const supabase = getServiceClient();

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('deal_id', dealId)
    .eq('is_active', true);

  if (!reviewCount || reviewCount < MIN_REVIEWS) return null;

  // Cache lookup — yorum sayısı aynıysa hâlâ taze.
  const { data: cached } = await supabase
    .from('review_summaries')
    .select('*')
    .eq('deal_id', dealId)
    .maybeSingle();

  if (cached && cached.review_count_at_gen === reviewCount) {
    return {
      summary: cached.summary,
      positiveThemes: cached.positive_themes,
      cautionNotes: cached.caution_notes,
      reviewCount: cached.review_count_at_gen,
      generatedAt: cached.generated_at,
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    // Anahtar yoksa özet üretemeyiz; eski cache'i (varsa) dönelim.
    if (cached) {
      return {
        summary: cached.summary,
        positiveThemes: cached.positive_themes,
        cautionNotes: cached.caution_notes,
        reviewCount: cached.review_count_at_gen,
        generatedAt: cached.generated_at,
      };
    }
    return null;
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, body')
    .eq('deal_id', dealId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  const reviewSamples = (reviews ?? []) as ReviewInput[];
  if (reviewSamples.length < MIN_REVIEWS) return null;

  const reviewText = reviewSamples
    .map((r, i) => `${i + 1}. [${r.rating}/5] ${r.body.trim()}`)
    .join('\n');

  const ratingAvg =
    reviewSamples.reduce((s, r) => s + r.rating, 0) / reviewSamples.length;

  try {
    const { object } = await generateObject({
      model: google(CHAT_MODEL),
      system: SYSTEM_PROMPT,
      prompt: `Bu fırsata yapılan ${reviewSamples.length} yorumu özetle:\n\n${reviewText}`,
      schema: SummarySchema,
      temperature: 0.3,
    });

    await supabase.from('review_summaries').upsert({
      deal_id: dealId,
      summary: object.summary,
      positive_themes: object.positiveThemes,
      caution_notes: object.cautionNotes,
      review_count_at_gen: reviewCount,
      rating_avg_at_gen: Number(ratingAvg.toFixed(2)),
      generated_at: new Date().toISOString(),
    });

    // Kabaca: 50 yorum ~1500 input + 200 output token
    await recordSpend(estimateCostUsd(1500, 200));

    return {
      summary: object.summary,
      positiveThemes: object.positiveThemes,
      cautionNotes: object.cautionNotes,
      reviewCount,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('review summary generation failed:', err);
    // Geçici hata → eski cache'i (varsa) döndür
    if (cached) {
      return {
        summary: cached.summary,
        positiveThemes: cached.positive_themes,
        cautionNotes: cached.caution_notes,
        reviewCount: cached.review_count_at_gen,
        generatedAt: cached.generated_at,
      };
    }
    return null;
  }
}
