import 'server-only';
import { generateObject } from 'ai';
import { z } from 'zod';
import { CHAT_MODEL, google } from '@/lib/ai/sdk';
import { getServiceClient } from '@/lib/db/service';
import { getUserPreferences, summarisePreferences } from '@/lib/db/queries/preferences';

/**
 * "Neden bu öneri?" rationale üretici. Kullanıcının sorgusunu + profilini
 * + dealin özelliklerini Gemini'ye verir; structured output ile kısa
 * açıklama + 2-4 eşleşme faktörü döner.
 *
 * Bu cağrı tooltip için — anlık, cache yok (kullanıcının her sorgusu
 * farklı bağlama oturur).
 */

const RationaleSchema = z.object({
  rationale: z
    .string()
    .min(15)
    .max(400)
    .describe('1-2 cümle, doğrudan "sen şu istedin → bu deal şuna uyuyor" mantığı. Pazarlama dili YOK.'),
  factors: z
    .array(z.string().min(2).max(60))
    .min(1)
    .max(6)
    .describe('Eşleşme nedenleri — kısa etiketler ("vejetaryen menü uyumu", "yakın konum", "akşam saatleri")'),
});

export type Rationale = z.infer<typeof RationaleSchema>;

const SYSTEM_PROMPT = `Sen gidek.net'in "neden bu öneri" açıklayıcısısın.

Görev: Kullanıcının doğal dil sorgusunu + (varsa) profil tercihlerini, önerilen fırsatın özellikleriyle eşleştirip "bu sana neden uyuyor" şeklinde açıkla.

Kurallar:
1. Spesifik ol — "harika bir yer" değil; "vejetaryen menüsü var, sen vejetaryen demiştin" gibi.
2. Pazarlama dili YASAK ("muhteşem", "kaçırma", "olağanüstü").
3. Eşleşme faktörlerini açık kelimelerle göster (factors array'i).
4. Eğer sorgu + profil deal ile zayıf eşleşiyorsa, dürüst ol: "şu yönü tam uymuyor ama..." de.
5. Türkçe, "sen" hitabı.
6. Sorgu yoksa profil bilgisini kullan; ikisi de yoksa deal'ın objektif öne çıkanlarını anlat.

Örnek çıktı stilleri:
- rationale: "Cumartesi akşam çift için romantik mekan aradın. Bu deal Kadıköy sahilinde, sessiz bir bahçe terası — saat 19'dan sonra rezervasyon alıyor. Vejetaryen seçenek var."
- factors: ["çiftler için", "sahil + sessiz", "vejetaryen menü", "akşam saatleri"]
`;

interface RationaleInput {
  dealId: string;
  /** Kullanıcının son mesajı / sorgu metni (chat'ten) */
  userQuery?: string;
  /** Auth'lı user id (yoksa profil bağlamı kullanılmaz) */
  userId?: string | null;
}

/**
 * Deal'ın özelliklerini + (varsa) kullanıcı bağlamını alıp Gemini'den
 * structured rationale çek. Yetkilendirme/budget kontrolü çağıran katman
 * sorumluluğunda.
 */
export async function generateRecommendationRationale(
  input: RationaleInput,
): Promise<Rationale | null> {
  const supabase = getServiceClient();

  const { data: deal } = await supabase
    .from('deals')
    .select(
      'title, subtitle, description, city, district, venue_name, tags, audience, duration_minutes, discounted_price, original_price',
    )
    .eq('id', input.dealId)
    .maybeSingle();

  if (!deal) return null;

  let profileContext: string | null = null;
  if (input.userId) {
    try {
      profileContext = summarisePreferences(await getUserPreferences(input.userId));
    } catch {
      profileContext = null;
    }
  }

  const dealLines = [
    `Başlık: ${deal.title}`,
    deal.subtitle ? `Alt başlık: ${deal.subtitle}` : null,
    `Konum: ${[deal.district, deal.city].filter(Boolean).join(', ')}`,
    deal.venue_name ? `Mekan: ${deal.venue_name}` : null,
    deal.duration_minutes ? `Süre: ${deal.duration_minutes} dk` : null,
    `Fiyat: ₺${deal.discounted_price}${
      deal.discounted_price < deal.original_price ? ` (₺${deal.original_price} yerine)` : ''
    }`,
    deal.tags?.length ? `Etiketler: ${deal.tags.join(', ')}` : null,
    deal.audience?.length ? `Kitle: ${deal.audience.join(', ')}` : null,
    deal.description ? `Açıklama: ${deal.description.slice(0, 400)}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const userLines = [
    input.userQuery ? `Sorgusu: "${input.userQuery}"` : null,
    profileContext ? `Profili: ${profileContext}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = userLines
    ? `Kullanıcı:\n${userLines}\n\nÖnerilen fırsat:\n${dealLines}\n\nKullanıcıya bu önerinin neden uygun olduğunu anlat.`
    : `Önerilen fırsat:\n${dealLines}\n\nKullanıcı bilgisi yok. Fırsatın hangi durumlara/kitlelere uygun olduğunu objektif anlat.`;

  try {
    const { object } = await generateObject({
      model: google(CHAT_MODEL),
      system: SYSTEM_PROMPT,
      prompt,
      schema: RationaleSchema,
      temperature: 0.4,
      // Thinking budget = 0 → Flash daha hızlı + structured output daha güvenilir
      providerOptions: {
        google: { thinkingConfig: { thinkingBudget: 0 } },
      },
    });
    return object;
  } catch (err) {
    // Hangi adımda patladığını net görmek için tam detay log
    console.error('[rationale] generation failed:', {
      dealId: input.dealId,
      hasQuery: Boolean(input.userQuery),
      hasUser: Boolean(input.userId),
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 4) : undefined,
    });
    return null;
  }
}
