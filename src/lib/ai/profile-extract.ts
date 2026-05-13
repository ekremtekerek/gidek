import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { getServiceClient } from '@/lib/db/service';

/**
 * Sohbet turundan kullanıcı tercih ipuçlarını çıkar ve
 * `user_preferences`'a auto-merge et. Conservative birleştirme:
 * - Skaler alanlar yalnızca DB'de boşsa yazılır.
 * - Array alanlar (interests/dietary/accessibility/dislikes) DB'dekine eklenir.
 * - `kids_age_groups` array — eklenir.
 *
 * Bu pipeline `/api/ai/chat` route'unda fire-and-forget tetiklenir; chat
 * akışını bloklamaz. Yalnızca giriş yapmış kullanıcılar için çalışır.
 */

const HOUSEHOLD_TYPES = ['single', 'couple', 'family_with_kids', 'family_no_kids', 'friends'] as const;
const KIDS_AGE_GROUPS = ['0-3', '4-6', '7-12', 'teen'] as const;

const ExtractedSchema = z.object({
  household_type: z.enum(HOUSEHOLD_TYPES).nullable().optional(),
  kids_age_groups: z.array(z.enum(KIDS_AGE_GROUPS)).optional(),
  city: z.string().min(2).max(50).nullable().optional(),
  district: z.string().min(2).max(50).nullable().optional(),
  budget_min: z.number().min(0).max(100000).nullable().optional(),
  budget_max: z.number().min(0).max(1000000).nullable().optional(),
  interests: z.array(z.string().min(2).max(30)).max(10).optional(),
  dislikes: z.array(z.string().min(2).max(30)).max(10).optional(),
  dietary: z
    .array(z.enum(['vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'lactose-free']))
    .optional(),
  accessibility: z
    .array(z.enum(['wheelchair', 'stroller', 'low-noise', 'pet-friendly']))
    .optional(),
});

type Extracted = z.infer<typeof ExtractedSchema>;

const SYSTEM = `Kullanıcının söylediğinden KAYDI HAK EDECEK kalıcı tercihleri çıkar.
Sadece açık, tekrar kullanılabilir ipuçları döner:
- household_type: tek/çift/çocuklu/çocuksuz/arkadaş
- kids_age_groups: 0-3 / 4-6 / 7-12 / teen
- city, district: kalıcı bölge (geçici "şu an buradayım" değil)
- budget_min/max: TL
- interests: ["spa", "doğa", ...] (en fazla 10)
- dislikes: ["kalabalık", "fast food", ...] (en fazla 10)
- dietary: vegetarian/vegan/halal/kosher/gluten-free/lactose-free
- accessibility: wheelchair/stroller/low-noise/pet-friendly

KURALLAR:
- Geçici durum (örn. "bu akşam") → BOŞ bırak.
- Tahmin etme; metinde açıkça yoksa alanı verme.
- Çocuk yaşı söylenmişse uygun bucket'a yuvarla (5 yaş → "4-6").
- Bütçe varsa min ya da max ne söylüyorsa onu doldur, ikisini de söylemediyse boş bırak.
- Boş çıkarsa BOŞ obje dön — uydurma.`;

interface InferOpts {
  userId: string;
  userText: string;
  /** Şu anki konuşmada zaten kayıtlı tercih özeti — duplicate ekstraktları azaltır. */
  existingHint?: string | null;
}

const MIN_TEXT_LEN = 20;

export async function inferAndMergeProfile(opts: InferOpts): Promise<void> {
  if (!process.env.GEMINI_API_KEY) return;
  const text = opts.userText.trim();
  if (text.length < MIN_TEXT_LEN) return;

  let extracted: Extracted;
  try {
    const result = await generateObject({
      model: google(CHAT_MODEL),
      system: SYSTEM,
      prompt: opts.existingHint
        ? `MEVCUT BİLGİLER (tekrar etme): ${opts.existingHint}\n\nYENİ MESAJ: ${text}`
        : text,
      schema: ExtractedSchema,
      temperature: 0,
      maxOutputTokens: 250,
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 0 } },
      },
    });
    extracted = result.object;
  } catch (err) {
    console.error('profile inference failed:', err);
    return;
  }

  if (isEmpty(extracted)) return;

  await mergeIntoDb(opts.userId, extracted);
}

function isEmpty(e: Extracted): boolean {
  return (
    !e.household_type &&
    (!e.kids_age_groups || e.kids_age_groups.length === 0) &&
    !e.city &&
    !e.district &&
    e.budget_min == null &&
    e.budget_max == null &&
    (!e.interests || e.interests.length === 0) &&
    (!e.dislikes || e.dislikes.length === 0) &&
    (!e.dietary || e.dietary.length === 0) &&
    (!e.accessibility || e.accessibility.length === 0)
  );
}

async function mergeIntoDb(userId: string, e: Extracted) {
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const fillIfEmpty = <T>(curr: T | null | undefined, next: T | null | undefined): T | null => {
    if (curr !== null && curr !== undefined) return curr;
    return next ?? null;
  };

  const mergeArr = <T>(curr: T[] | null | undefined, add: T[] | undefined): T[] | null => {
    const base = curr ?? [];
    const next = add ?? [];
    if (base.length === 0 && next.length === 0) return null;
    const set = new Set([...base, ...next]);
    return Array.from(set);
  };

  const payload = {
    user_id: userId,
    household_type: fillIfEmpty(existing?.household_type, e.household_type ?? null),
    kids_age_groups: mergeArr(existing?.kids_age_groups, e.kids_age_groups),
    city: fillIfEmpty(existing?.city, e.city ?? null),
    district: fillIfEmpty(existing?.district, e.district ?? null),
    budget_min: fillIfEmpty(existing?.budget_min, e.budget_min ?? null),
    budget_max: fillIfEmpty(existing?.budget_max, e.budget_max ?? null),
    interests: mergeArr(existing?.interests, e.interests),
    dislikes: mergeArr(existing?.dislikes, e.dislikes),
    dietary: mergeArr(existing?.dietary, e.dietary),
    accessibility: mergeArr(existing?.accessibility, e.accessibility),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) console.error('user_preferences upsert failed:', error);
}
