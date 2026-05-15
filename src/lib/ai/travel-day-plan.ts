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

/**
 * Gemini bazen tam schema'ya uymuyor — min/max'leri esnek tutuyoruz,
 * enum string + runtime normalize, optional alanlara default.
 */
type ActivityKind = 'yemek' | 'aktivite' | 'gezi' | 'dinlence' | 'ulasim' | 'oda';

const ActivitySchema = z.object({
  time: z.string().min(3).max(8),
  title: z.string().min(2).max(200),
  rationale: z.string().min(3).max(400).default(''),
  dealSlug: z.string().nullable().default(null),
  kind: z.string(),
  costEstimate: z.number().min(0).max(500000).default(0),
  durationMin: z.number().min(5).max(1440).default(60),
});

const DayPlanSchema = z.object({
  summary: z.string().min(15).max(800),
  totalEstimate: z.number().min(0).max(5000000).default(0),
  days: z
    .array(
      z.object({
        dayIndex: z.number().min(1).max(20),
        dayLabel: z.string().min(2).max(120),
        activities: z.array(ActivitySchema).min(1).max(12),
      }),
    )
    .min(1)
    .max(20),
});

export interface TravelDayPlan {
  summary: string;
  totalEstimate: number;
  days: Array<{
    dayIndex: number;
    dayLabel: string;
    activities: Array<{
      time: string;
      title: string;
      rationale: string;
      dealSlug: string | null;
      kind: ActivityKind;
      costEstimate: number;
      durationMin: number;
    }>;
  }>;
}

function normalizeKind(v: string): ActivityKind {
  const t = v.toLocaleLowerCase('tr').replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's');
  if (t.includes('yem')) return 'yemek';
  if (t.includes('gez') || t.includes('tur')) return 'gezi';
  if (t.includes('dinl') || t.includes('spa') || t.includes('hav')) return 'dinlence';
  if (t.includes('ulas') || t.includes('transfer') || t.includes('uca')) return 'ulasim';
  if (t.includes('oda') || t.includes('konak') || t.includes('check')) return 'oda';
  return 'aktivite';
}

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

  // Kind alanını normalize et — Gemini bazen Türkçe karakter/farklı kelime dönüyor.
  return {
    summary: object.summary,
    totalEstimate: object.totalEstimate ?? 0,
    days: object.days.map((d) => ({
      dayIndex: d.dayIndex,
      dayLabel: d.dayLabel,
      activities: d.activities.map((a) => ({
        time: a.time,
        title: a.title,
        rationale: a.rationale,
        dealSlug: a.dealSlug,
        kind: normalizeKind(a.kind),
        costEstimate: a.costEstimate,
        durationMin: a.durationMin,
      })),
    })),
  };
}
