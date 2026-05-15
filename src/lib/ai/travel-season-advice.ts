import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';

/**
 * AI sezon tavsiyesi — bir destinasyon için ay-ay analiz.
 * "Eylül mü Ekim mi?" sorusunu fiyat eğilimi + hava + kalabalık + tatil
 * günleri ile yanıtlar. Rakiplerde yok.
 */

const SeasonSchema = z.object({
  /** Genel tavsiye — 2-3 cümle */
  summary: z.string().min(60).max(500),
  /** Önerilen 2-3 en iyi ay */
  bestMonths: z
    .array(
      z.object({
        month: z.string().describe('Ocak, Şubat, ..., Aralık'),
        score: z.number().min(1).max(10).describe('1-10 — bu ay için genel puan'),
        why: z.string().min(20).max(200).describe('Neden bu ay iyi — somut sebepler'),
        weather: z.string().min(5).max(80).describe('Tipik hava (sıcaklık, deniz, yağmur)'),
        crowd: z
          .enum(['sakin', 'orta', 'kalabalik'])
          .describe('Beklenen kalabalık seviyesi'),
        priceLevel: z
          .enum(['ucuz', 'orta', 'pahali'])
          .describe('Otel/uçak fiyat seviyesi (rölatif)'),
      }),
    )
    .min(2)
    .max(3),
  /** Kaçınılması gereken aylar (varsa) */
  avoidMonths: z
    .array(
      z.object({
        month: z.string(),
        reason: z.string().min(15).max(160),
      }),
    )
    .max(3),
  /** Önemli özel tarihler — bayram, festivaller */
  events: z
    .array(
      z.object({
        date: z.string().describe('Yaklaşık tarih ("Ağustos sonu", "30 Ekim")'),
        name: z.string(),
        impact: z.string().min(10).max(120).describe('Bu olay tatili nasıl etkiler'),
      }),
    )
    .max(5),
});

export type SeasonAdvice = z.infer<typeof SeasonSchema>;

const SYSTEM_PROMPT = `Sen gidek.net'in tatil sezon analizcisin.

Görev: Kullanıcının seçtiği destinasyon için yıl içinde **en iyi tatil ayları**nı
söyle. Hava, kalabalık, fiyat trendleri, okul/bayram tatilleri faktörlerini
birleştir.

Kurallar:
1. Türkiye coğrafyası bilgisi kullan — Bodrum vs. Kapadokya vs. Karadeniz farklı.
2. Spesifik somut bilgi: "Eylül sonu deniz sıcaklığı hâlâ 24°C, otel fiyatları
   ağustosa göre %30 düşer."
3. bestMonths: 2-3 en iyi ay; her birinde "neden", hava, kalabalık, fiyat.
4. avoidMonths: gerçekten kaçınılması gereken varsa (yağmur, donma, aşırı turist).
   Yoksa boş array.
5. events: yarıyıl tatili, kurban bayramı, ramazan, yerel festivaller — etkiler.
6. Pazarlama dili YASAK ("muhteşem", "olağanüstü").
7. Türkçe, "sen" hitabı.
8. crowd: sakin / orta / kalabalik (enum)
9. priceLevel: ucuz / orta / pahali (rölatif, o destinasyon içinde)
`;

export async function generateSeasonAdvice(destination: string): Promise<SeasonAdvice> {
  const userPrompt = [
    `Destinasyon: ${destination}`,
    `Şu anki tarih: ${new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`,
    '',
    'Bu destinasyon için yıl içinde en iyi tatil aylarını analiz et.',
    'Hava, kalabalık, fiyat trendleri, Türkiye okul tatili ve dini bayramlar dahil.',
  ].join('\n');

  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: SeasonSchema,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  return object;
}
