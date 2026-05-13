import { tool } from 'ai';
import { z } from 'zod';
import { buildDayPlan } from '@/lib/ai/plan';
import { searchDealsByQuery } from '@/lib/ai/search-core';

/**
 * Shape the chat consumes — small, JSON-safe, no nullable mongrels that
 * would force Gemini to special-case missing fields in its tool responses.
 */
function shapeDeal(d: Awaited<ReturnType<typeof searchDealsByQuery>>[number]) {
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle ?? '',
    city: d.city,
    district: d.district ?? '',
    venue: d.venue_name ?? '',
    price: Number(d.discounted_price),
    originalPrice: Number(d.original_price),
    discountPct: d.discount_percent,
    audience: d.audience,
    tags: d.tags,
    duration: d.duration_minutes ?? 0,
    coverImage: d.cover_image,
    /** Merchant koordinatları — chat → harita coupling için. */
    lat: d.lat !== null ? Number(d.lat) : null,
    lng: d.lng !== null ? Number(d.lng) : null,
    /** Kullanıcı konumu verildiyse mesafe km — AI yorumda kullansın. */
    distanceKm: d.distance_km !== null ? Number(d.distance_km.toFixed(1)) : null,
  };
}

export interface ChatToolContext {
  /** Kullanıcının ŞU ANKİ konumu — searchDeals'a default olarak iletilir. */
  nearLat?: number | null;
  nearLng?: number | null;
  /** AI sonuç sayısını çok düşürmesin diye server-side taban. */
  minResults?: number;
}

/**
 * Chat tool'larını çağrı zamanında kullanıcı bağlamıyla bind eder. Tools
 * statik export'tan dinamik factory'ye geçti çünkü artık her sohbete kullanıcı
 * konumu ve sonuç tabanı verebiliyoruz.
 */
export function buildChatTools(ctx: ChatToolContext = {}) {
  const minResults = ctx.minResults ?? 3;

  return {
    searchDeals: tool({
      description:
        'Kullanıcının istediği TEK bir tür fırsatı (akşam yemeği, kahvaltı, masaj, tiyatro, otel vs.) arar. Baştan sona gün planı için createDayPlan kullan.',
      inputSchema: z.object({
        query: z
          .string()
          .min(3)
          .max(300)
          .describe(
            'Türkçe doğal dilde sorgu — kullanıcının söylediğine en yakın anlamı kuran tek cümle. Örnek: "Kadıköy\'de pazar sabahı serpme kahvaltı, çocuklu".',
          ),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(8)
          .default(5)
          .describe(
            `Maks. kaç sonuç dönsün. ${minResults}-5 arası kullan — kullanıcıya seçenek sun.`,
          ),
        city: z
          .string()
          .optional()
          .describe('İsteğe bağlı şehir filtresi — kullanıcı bir şehir belirttiyse ekle.'),
      }),
      execute: async ({ query, maxResults, city }) => {
        const deals = await searchDealsByQuery(query, {
          maxResults: Math.max(minResults, maxResults),
          filterCity: city,
          nearLat: ctx.nearLat ?? null,
          nearLng: ctx.nearLng ?? null,
        });
        return {
          count: deals.length,
          results: deals.map(shapeDeal),
        };
      },
    }),

    createDayPlan: tool({
      description:
        'Baştan sona bir GÜN PLANI kurar — sabah kahvaltı + öğlen aktivite + akşam yemeği. Kullanıcı "ailecek bir gün", "baştan sona", "tüm gün", "gün planı kurar mısın" gibi şeyler söylediğinde kullan.',
      inputSchema: z.object({
        description: z
          .string()
          .min(3)
          .max(200)
          .describe(
            'Günün karakteri. Örnek: "Pazar ailecek rahat", "Cumartesi eşimle romantik", "Arkadaş grubuyla eğlenceli".',
          ),
        audience: z
          .enum(['couple', 'family', 'solo', 'group'])
          .optional()
          .describe('Kim ile? Profilden veya konuşmadan çıkarıp ver.'),
        city: z
          .string()
          .optional()
          .describe('Hangi şehir. Belirsizse İstanbul varsayılır.'),
        budgetTotal: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Toplam bütçe (TL). 3 adıma paylaştırılır.'),
      }),
      execute: async ({ description, audience, city, budgetTotal }) => {
        const plan = await buildDayPlan({ description, audience, city, budgetTotal });
        return {
          plan: {
            steps: plan.steps.map((s) => ({
              time: s.time,
              emoji: s.emoji,
              category: s.category,
              rationale: s.rationale,
              deal: s.deal ? shapeDeal(s.deal) : null,
            })),
            totalPrice: plan.totalPrice,
          },
        };
      },
    }),
  };
}

/** Geriye uyum — eskiden statik export'tu, hala konum bağlamsız çağrılabilsin. */
export const chatTools = buildChatTools();

export type DealShape = ReturnType<typeof shapeDeal>;
