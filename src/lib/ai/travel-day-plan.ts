import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

/**
 * Tatil için saat-saat çoklu günlük plan üretici.
 *
 * Rakiplerin yapamadığı şey: otel + bölgedeki tüm fırsatları (tiyatro, masaj,
 * yemek, aktivite, tur) birleşik plana dönüştürmek. Bizim 961 fırsat
 * envanterimiz var; tatilsepeti/etstur sadece otel satıyor.
 */

const ActivitySchema = z.object({
  /** Saat (örn. "09:00") */
  time: z.string().min(4).max(5),
  /** Aktivite başlığı */
  title: z.string().min(3).max(120),
  /** Spesifik öneri açıklaması, neden seçildi (1-2 cümle) */
  rationale: z.string().min(10).max(280),
  /** Eğer bizim deal envanterinde bir fırsat ise — slug */
  dealSlug: z.string().nullable(),
  /** Aktivite kategori: yemek, aktivite, gezi, dinlence, ulasim */
  kind: z.enum(['yemek', 'aktivite', 'gezi', 'dinlence', 'ulasim', 'oda']),
  /** Tahminî maliyet TL (yoksa 0) */
  costEstimate: z.number().min(0).max(50000),
  /** Süresi dk (yoksa 60) */
  durationMin: z.number().min(15).max(720).default(60),
});

const DayPlanSchema = z.object({
  /** Tatil özeti — kullanıcıya tek paragraf sunum (3-4 cümle) */
  summary: z
    .string()
    .min(40)
    .max(600)
    .describe('Bu tatilin ne tarz olacağına dair kişiselleştirilmiş özet — pazarlama dili yok'),
  /** Toplam tahminî maliyet TL */
  totalEstimate: z.number().min(0).max(500000),
  /** Gün gün plan */
  days: z
    .array(
      z.object({
        dayIndex: z.number().min(1).max(14),
        dayLabel: z.string().min(3).max(60).describe('"1. Gün — Varış", "2. Gün — Bodrum sahili" gibi'),
        activities: z.array(ActivitySchema).min(3).max(8),
      }),
    )
    .min(1)
    .max(14),
});

export type TravelDayPlan = z.infer<typeof DayPlanSchema>;

const SYSTEM_PROMPT = `Sen gidek.net'in tatil planlayıcı AI'ısın.

Görev: Kullanıcının seçtiği destinasyon ve süre için saat-saat plan kur.
Sadece otel değil; bölgedeki tüm deneyimleri (yemek, masaj, tiyatro, aktivite, tur)
birleştir. Verilen "envanter" listesinden alabildiğin kadar gerçek deal kullan,
gerekirse jenerik aktivite ekle (örn. "Kale tepesi yürüyüşü").

Kurallar:
1. Her gün 4-6 aktivite, gerçekçi saatler (09:00 başla, ~22:00 bitir).
2. dealSlug — sadece envanterde varsa slug'ı koy; yoksa null.
3. kind: yemek/aktivite/gezi/dinlence/ulasim/oda — doğru kategorize et.
4. Pazarlama dili yasak ("muhteşem", "olağanüstü"). Spesifik konuş.
5. Türkçe, "sen" hitabı.
6. summary: 3-4 cümle — bu tatil ne tarz olacağı; kullanıcıya kişisel ses.
7. totalEstimate: tüm aktivitelerin costEstimate toplamı (rounded).
8. Varış günü daha hafif (öğleden sonra başla), son gün öğleden sonra check-out.
9. Yemek mantığı: kahvaltı (08-10), öğle (12-14), akşam (19-21).
10. Akşam yemeği genelde restoran; öğle hafif/sokak; aktivite yemek arası.
`;

interface PlanInput {
  destination: string;
  nights: number;
  travelers: { adults: number; kids: number };
  budgetTotal?: number;
  /** Bölgedeki kullanılabilir deal'lar — Gemini bunlardan seçer */
  inventory: DealWithMerchant[];
  /** Kullanıcının ek isteği (ör. "romantik, sakin") */
  preference?: string;
}

interface InventoryEntry {
  slug: string;
  title: string;
  category: string;
  district: string | null;
  price: number;
  durationMin: number | null;
}

function summariseInventory(inv: DealWithMerchant[]): InventoryEntry[] {
  return inv.slice(0, 50).map((d) => ({
    slug: d.slug,
    title: d.title,
    category: (d.tags ?? []).slice(0, 3).join(', ') || 'aktivite',
    district: d.district,
    price: Number(d.discounted_price) || 0,
    durationMin: d.duration_minutes,
  }));
}

export async function generateTravelPlan(input: PlanInput): Promise<TravelDayPlan> {
  const inventory = summariseInventory(input.inventory);
  const days = Math.max(1, Math.min(14, input.nights + 1));

  const userPrompt = [
    `Destinasyon: ${input.destination}`,
    `Gün sayısı: ${days} (${input.nights} gece)`,
    `Yolculer: ${input.travelers.adults} yetişkin${input.travelers.kids > 0 ? `, ${input.travelers.kids} çocuk` : ''}`,
    input.budgetTotal ? `Toplam bütçe: ${input.budgetTotal} TL` : '',
    input.preference ? `Ek istek: ${input.preference}` : '',
    '',
    'Mevcut envanter (dealSlug için bunları kullan):',
    JSON.stringify(inventory, null, 2),
  ]
    .filter(Boolean)
    .join('\n');

  const { object } = await generateObject({
    model: google(CHAT_MODEL),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: DayPlanSchema,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 0 },
      },
    },
  });

  return object;
}
