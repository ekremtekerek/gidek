import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';

/**
 * AI sezon tavsiyesi — bir destinasyon için ay-ay analiz.
 * "Eylül mü Ekim mi?" sorusunu fiyat eğilimi + hava + kalabalık + tatil
 * günleri ile yanıtlar. Rakiplerde yok.
 */

/**
 * Gemini bazen tam schema'ya uymuyor — min/max kısıtları gevşek tutuyoruz,
 * enum'ları string olarak alıp runtime'da normalize ediyoruz.
 */

const CrowdEnum = z.string().describe('sakin / orta / kalabalik (ASCII)');
const PriceEnum = z.string().describe('ucuz / orta / pahali (ASCII)');

const SeasonSchema = z.object({
  summary: z.string().min(20).max(800),
  bestMonths: z
    .array(
      z.object({
        month: z.string(),
        score: z.number().min(1).max(10),
        why: z.string().min(5).max(280),
        weather: z.string().min(3).max(140),
        crowd: CrowdEnum,
        priceLevel: PriceEnum,
      }),
    )
    .min(1)
    .max(4),
  avoidMonths: z
    .array(
      z.object({
        month: z.string(),
        reason: z.string().min(5).max(280),
      }),
    )
    .max(4)
    .default([]),
  events: z
    .array(
      z.object({
        date: z.string(),
        name: z.string(),
        impact: z.string().min(5).max(200),
      }),
    )
    .max(8)
    .default([]),
});

type CrowdLevel = 'sakin' | 'orta' | 'kalabalik';
type PriceLevel = 'ucuz' | 'orta' | 'pahali';

export interface SeasonAdvice {
  summary: string;
  bestMonths: Array<{
    month: string;
    score: number;
    why: string;
    weather: string;
    crowd: CrowdLevel;
    priceLevel: PriceLevel;
  }>;
  avoidMonths: Array<{ month: string; reason: string }>;
  events: Array<{ date: string; name: string; impact: string }>;
}

function normalizeCrowd(v: string): CrowdLevel {
  const t = v.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's');
  if (t.includes('kala')) return 'kalabalik';
  if (t.includes('orta')) return 'orta';
  return 'sakin';
}

function normalizePrice(v: string): PriceLevel {
  const t = v.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i');
  if (t.includes('pah')) return 'pahali';
  if (t.includes('orta')) return 'orta';
  return 'ucuz';
}

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
8. crowd alanı SADECE şu üç değerden biri: "sakin", "orta", "kalabalik" (ASCII, Türkçe karakter yok)
9. priceLevel alanı SADECE şu üç değerden biri: "ucuz", "orta", "pahali" (ASCII, Türkçe karakter yok)
10. avoidMonths ve events array — yoksa boş array döndür ([]).
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
    '',
    'ÖNEMLİ: crowd ve priceLevel alanlarını sadece ASCII enum değerleriyle döndür.',
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

  // Gemini bazen Türkçe karakterlerle dönüyor — normalize et
  return {
    summary: object.summary,
    bestMonths: object.bestMonths.map((m) => ({
      month: m.month,
      score: m.score,
      why: m.why,
      weather: m.weather,
      crowd: normalizeCrowd(m.crowd),
      priceLevel: normalizePrice(m.priceLevel),
    })),
    avoidMonths: object.avoidMonths ?? [],
    events: object.events ?? [],
  };
}
