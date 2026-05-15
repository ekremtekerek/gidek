import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

/**
 * AI Tatil Paketi Tasarlayıcı. Kullanıcı bütçe + tarz + yolcu bilgisi
 * verir, AI bölgedeki gidek envanterinden bir paket kurar: otel + yemek
 * + aktivite + spa/extra. Toplam bütçeyi optimize eder.
 *
 * Rakiplerde sadece "otel + uçak" paketi var; biz yemek/aktivite/spa
 * ekleyip "tam tatil deneyimi" sunuyoruz.
 */

const PackageSchema = z.object({
  vibeName: z.string().min(5).max(80),
  summary: z.string().min(20).max(500),
  hotel: z.object({
    dealId: z.string(),
    title: z.string(),
    why: z.string().min(10).max(300),
    estimatedTotal: z.number().min(0),
  }),
  dining: z
    .array(
      z.object({
        dealId: z.string(),
        title: z.string(),
        when: z.string().min(2).max(60),
        why: z.string().min(10).max(240),
      }),
    )
    .min(0)
    .max(4)
    .default([]),
  activities: z
    .array(
      z.object({
        dealId: z.string(),
        title: z.string(),
        day: z.string().min(1).max(20),
        why: z.string().min(10).max(240),
      }),
    )
    .min(0)
    .max(4)
    .default([]),
  extras: z
    .array(
      z.object({
        dealId: z.string(),
        title: z.string(),
        why: z.string().min(10).max(240),
      }),
    )
    .min(0)
    .max(3)
    .default([]),
  estimatedTotal: z.number().min(0),
  budgetMatch: z.string().min(5).max(200),
});

export type TravelPackage = z.infer<typeof PackageSchema>;

interface InputDeal {
  id: string;
  title: string;
  category: string;
  city: string;
  district: string | null;
  description: string;
  pricePerPerson: number;
  discountPercent: number;
}

const SYSTEM_PROMPT = `Sen gidek.net'in tatil paketi tasarımcısısın.

Kullanıcının bütçesi, yolcu profili ve tarz tercihiyle gidek envanterinden
bir TAM tatil paketi kurarsın. Otel + yemek + aktivite + ekstra (spa/tur).

Kurallar:
1. SADECE verilen inventory'deki gerçek dealId'leri kullan. Asla uydurma.
2. Bütçeyi aş — ama %15 sapma olabilir. budgetMatch'te durumu açıkla.
3. Tarz uyumu: "romantik" → spa + akşam yemeği, "aile" → çocuklu aktivite, "kültür" → müze/tur, "yemek" → fine dining.
4. hotel: 1 tane (zorunlu). Otel kategorisinden en uygunu.
5. dining: 0-4 restoran/kahvaltı/yemek. when alanı: "1. gün akşam", "2. gün kahvaltı" vb.
6. activities: 0-4 aktivite (tur, masaj, kurs). day: "2. gün" gibi.
7. extras: 0-3 ekstra (spa, masaj, özel deneyim).
8. vibeName: kısa karakterize ad ("Bodrum Romantik Kaçamak", "Antalya Aile Macerası")
9. why alanları SPESİFİK ol — "güzel" yasak. "Çocuk havuzu var + 200m sahil" gibi somut.
10. budgetMatch: "Bütçenin %95'ini kullandı, 1500₺ artırdı"
11. Pazarlama dili YASAK ("muhteşem", "olağanüstü").
12. Türkçe, "sen" hitabı.
13. Eğer kategori yok ise ilgili dizide boş array döndür.
`;

interface BuildPackageInput {
  destination: string;
  budget: number;
  adults: number;
  kids: number;
  days: number;
  themes: string[];
  inventory: DealWithMerchant[];
  categoryByDealId: Map<string, string>;
}

function pickInputs(input: BuildPackageInput): InputDeal[] {
  return input.inventory.slice(0, 60).map((d) => ({
    id: d.id,
    title: d.title,
    category: input.categoryByDealId.get(d.id) ?? 'diger',
    city: d.city ?? 'Türkiye',
    district: d.district ?? null,
    description: (d.description ?? '').slice(0, 280),
    pricePerPerson: Number(d.discounted_price),
    discountPercent: d.discount_percent ?? 0,
  }));
}

export async function buildTravelPackage(
  input: BuildPackageInput,
): Promise<TravelPackage> {
  if (input.inventory.length === 0) {
    throw new Error('inventory boş — paket kurulamaz');
  }

  const items = pickInputs(input);
  const travellers = `${input.adults} yetişkin${input.kids ? ` + ${input.kids} çocuk` : ''}`;
  const themeList = input.themes.length > 0 ? input.themes.join(', ') : 'genel keşif';

  const userPrompt = [
    `Destinasyon: ${input.destination}`,
    `Yolcu: ${travellers}`,
    `Süre: ${input.days} gün`,
    `Bütçe (toplam): ${input.budget.toLocaleString('tr-TR')} ₺`,
    `Tarz: ${themeList}`,
    '',
    'Bölgedeki gidek envanteri (kategori belirtili):',
    JSON.stringify(items, null, 2),
    '',
    'Bu envanterden bir TAM tatil paketi kur. hotel + dining + activities + extras.',
    'Bütçeyi optimize et. dealId\'leri yalnızca verilen listeden seç.',
  ].join('\n');

  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: PackageSchema,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  return object;
}
