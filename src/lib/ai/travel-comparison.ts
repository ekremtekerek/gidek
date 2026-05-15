import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { enrichTravelDeal } from '@/lib/travel/enrich';

/**
 * 2-3 oteli kullanıcının kriterlerine göre karşılaştırıp artı/eksi yorum
 * üretir. Rakiplerde sadece statik özellik tablosu var; biz AI yorumuyla
 * "şu sana daha uygun çünkü..." diyebiliyoruz.
 */

const ComparisonSchema = z.object({
  /** Tek cümle özet — hangi seçenek hangi durumda daha iyi */
  verdict: z.string().min(20).max(280),
  /** Her otel için artı + eksi listesi (id ile eşlenir) */
  hotels: z
    .array(
      z.object({
        id: z.string(),
        pros: z.array(z.string().min(2).max(120)).min(1).max(4),
        cons: z.array(z.string().min(2).max(120)).min(0).max(3),
        bestFor: z.string().min(5).max(120).describe('Kime/ne için uygun — "Çiftler için romantik kaçamak" gibi'),
      }),
    )
    .min(2)
    .max(3),
});

export type ComparisonOutput = z.infer<typeof ComparisonSchema>;

const SYSTEM_PROMPT = `Sen gidek.net'in tatil karşılaştırma AI'ısın.

Görev: 2-3 tatil/otel deal'ını kullanıcının kriterleri açısından karşılaştır.
Her biri için spesifik artılar + eksiler + "kime uygun" çıkar.

Kurallar:
1. Spesifik ol — "güzel manzara" yerine "deniz manzaralı çift kişilik oda"
2. Pazarlama dili yok ("muhteşem", "harika" yasak)
3. Dürüst ol — eksiler kısmında gerçek dezavantajları söyle
4. Türkçe, "sen" hitabı
5. Verdict: tek cümlede "X şu kullanıcıya, Y şu kullanıcıya"
6. bestFor: kısa karakterize etiket ("Aileyle aktif tatil", "Sessiz romantik kaçamak")
`;

interface InputDeal {
  id: string;
  title: string;
  city: string;
  district: string | null;
  description: string;
  pricePerPerson: number;
  totalForTwo: number;
  concept: string;
  stars: number;
  features: string[];
  nights: number;
  discountPercent: number;
}

function pickInputs(deals: DealWithMerchant[]): InputDeal[] {
  return deals.map((d) => {
    const meta = enrichTravelDeal(d);
    const price = Number(d.discounted_price);
    return {
      id: d.id,
      title: d.title,
      city: d.city ?? 'Türkiye',
      district: d.district ?? null,
      description: (d.description ?? '').slice(0, 600),
      pricePerPerson: price,
      totalForTwo: price * 2,
      concept: meta.concept,
      stars: meta.stars,
      features: meta.features,
      nights: meta.nights,
      discountPercent: d.discount_percent ?? 0,
    };
  });
}

export async function compareHotelsWithAI(
  deals: DealWithMerchant[],
): Promise<ComparisonOutput> {
  if (deals.length < 2 || deals.length > 3) {
    throw new Error('compareHotelsWithAI: 2 veya 3 deal gerekli');
  }

  const inputs = pickInputs(deals);
  const userPrompt = `Şu ${inputs.length} tatil seçeneğini karşılaştır:\n\n${JSON.stringify(inputs, null, 2)}`;

  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: ComparisonSchema,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  return object;
}
