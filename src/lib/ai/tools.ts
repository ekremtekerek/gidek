import { tool } from 'ai';
import { z } from 'zod';
import { buildDayPlan, replaceDayPlanStep } from '@/lib/ai/plan';
import { searchDealsByQuery } from '@/lib/ai/search-core';
import { generateSeasonAdvice } from '@/lib/ai/travel-season-advice';
import { buildTravelPackage } from '@/lib/ai/travel-package';
import { compareHotelsWithAI } from '@/lib/ai/travel-comparison';
import {
  enrichSimilarDeals,
  fetchSimilarTravelDeals,
} from '@/lib/ai/similar-travel-deals';
import { fetchPackageInventory } from '@/lib/db/queries/travel';
import { getServiceClient } from '@/lib/db/service';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

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
        const limit = Math.max(minResults, maxResults);
        const near = {
          nearLat: ctx.nearLat ?? null,
          nearLng: ctx.nearLng ?? null,
        };

        let deals = await searchDealsByQuery(query, {
          maxResults: limit,
          filterCity: city,
          ...near,
        });

        // İstenen bölgede (semt/şehir) hiç fırsat yoksa: filtreyi kaldırıp
        // tekrar ara. Kullanıcı konumu verildiyse match_deals zaten
        // benzerlik+yakınlık hibrit sıralar → en yakın fırsatlar başa gelir.
        // `fallbackUsed` bayrağı ile AI bunu "burada yok ama en yakını bu"
        // diye dürüstçe sunar; sonuçların o bölgede olduğunu İDDİA ETMEZ.
        let fallbackUsed = false;
        if (city && deals.length === 0) {
          fallbackUsed = true;
          deals = await searchDealsByQuery(query, {
            maxResults: limit,
            filterCity: null,
            ...near,
          });
        }

        return {
          count: deals.length,
          requestedArea: city ?? null,
          fallbackUsed,
          results: deals.map(shapeDeal),
        };
      },
    }),

    replaceDayPlanStep: tool({
      description:
        'Mevcut bir gün planının TEK BİR adımını değiştir. Kullanıcı "2. adımı değiştir", "kahvaltıyı başka bir yer yap", "akşamı daha cep dostu yap", "aktiviteyi çocuk dostu yap" gibi şeyler söylediğinde kullan. Önceki turda createDayPlan çağrılmış olmalı; aksi halde önce createDayPlan kullan.',
      inputSchema: z.object({
        stepIndex: z
          .number()
          .int()
          .min(0)
          .max(2)
          .describe('Hangi adım: 0=Kahvaltı, 1=Aktivite, 2=Akşam yemeği.'),
        whatToChange: z
          .string()
          .min(2)
          .max(200)
          .describe(
            'Kullanıcının istediği değişiklik. Örnek: "daha cep dostu", "deniz manzaralı", "vegan menü", "çocuk dostu", "yürüyüş yerine müze".',
          ),
        audience: z.enum(['couple', 'family', 'solo', 'group']).optional(),
        city: z.string().optional(),
        budget: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe('Tek slot için maks. TL (yoksa kısıt yok).'),
        excludeDealIds: z
          .array(z.string())
          .max(8)
          .optional()
          .describe('Önceki turda aynı slotta seçilmiş deal id(ler)i — tekrar önerme.'),
      }),
      execute: async ({ stepIndex, whatToChange, audience, city, budget, excludeDealIds }) => {
        const step = await replaceDayPlanStep({
          stepIndex,
          whatToChange,
          audience,
          city,
          budget,
          excludeDealIds,
        });
        if (!step) return { replaced: false, step: null };
        return {
          replaced: true,
          step: {
            time: step.time,
            emoji: step.emoji,
            category: step.category,
            rationale: step.rationale,
            deal: step.deal ? shapeDeal(step.deal) : null,
          },
        };
      },
    }),

    getWeather: tool({
      description:
        'Bir destinasyonun şu anki + 5 günlük havasını döner. Tatil tavsiyesi/plan kararı vermeden önce çağır. Open-Meteo (ücretsiz, key gerekmez).',
      inputSchema: z.object({
        destination: z
          .string()
          .min(2)
          .max(60)
          .describe('Şehir veya destinasyon adı — Türkçe (Bodrum, Antalya, Kapadokya).'),
      }),
      execute: async ({ destination }) => {
        try {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=tr&country=TR`;
          const geoRes = await fetch(geoUrl);
          const geo = (await geoRes.json()) as {
            results?: Array<{ latitude: number; longitude: number; name: string }>;
          };
          const place = geo.results?.[0];
          if (!place) return { found: false, destination };

          const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&forecast_days=5&timezone=Europe/Istanbul`;
          const wxRes = await fetch(wxUrl);
          const wx = (await wxRes.json()) as {
            current?: { temperature_2m: number; weather_code: number };
            daily?: {
              time: string[];
              temperature_2m_max: number[];
              temperature_2m_min: number[];
              weather_code: number[];
              precipitation_sum: number[];
            };
          };

          return {
            found: true,
            destination: place.name,
            now: wx.current
              ? {
                  tempC: Math.round(wx.current.temperature_2m),
                  code: wx.current.weather_code,
                }
              : null,
            forecast: wx.daily
              ? wx.daily.time.slice(0, 5).map((date, i) => ({
                  date,
                  tempMax: Math.round(wx.daily!.temperature_2m_max[i]),
                  tempMin: Math.round(wx.daily!.temperature_2m_min[i]),
                  code: wx.daily!.weather_code[i],
                  precipitationMm: wx.daily!.precipitation_sum[i],
                }))
              : [],
          };
        } catch (err) {
          return { found: false, destination, error: String(err) };
        }
      },
    }),

    getSeasonAdvice: tool({
      description:
        'Bir destinasyon için AI sezon analizi — yıl içinde en iyi tatil ayları, hava, kalabalık, fiyat trendleri. Kullanıcı "ne zaman gitmeliyim", "hangi ay daha iyi" gibi sorduğunda çağır.',
      inputSchema: z.object({
        destination: z
          .string()
          .min(2)
          .max(60)
          .describe('Destinasyon — Bodrum, Antalya, Kapadokya vs.'),
      }),
      execute: async ({ destination }) => {
        try {
          const advice = await generateSeasonAdvice(destination);
          return {
            ok: true,
            destination,
            summary: advice.summary,
            bestMonths: advice.bestMonths.slice(0, 3).map((m) => ({
              month: m.month,
              score: m.score,
              why: m.why,
              weather: m.weather,
              crowd: m.crowd,
              priceLevel: m.priceLevel,
            })),
            avoidMonths: advice.avoidMonths.slice(0, 3),
            events: advice.events.slice(0, 3),
          };
        } catch (err) {
          return { ok: false, destination, error: String(err) };
        }
      },
    }),

    buildTravelPackage: tool({
      description:
        'Bir destinasyon için TAM tatil paketi kurar — otel + yemek + aktivite + ekstra. Bütçe + yolcu profilini optimize eder. Kullanıcı "tatil paketi kur", "her şey dahil planla" derse çağır.',
      inputSchema: z.object({
        destination: z.string().min(2).max(60),
        budget: z
          .number()
          .int()
          .min(3000)
          .max(500000)
          .describe('Toplam bütçe TL.'),
        adults: z.number().int().min(1).max(8).default(2),
        kids: z.number().int().min(0).max(6).default(0),
        days: z.number().int().min(1).max(14).default(4),
        themes: z
          .array(z.string())
          .max(6)
          .default([])
          .describe('Tarz: deniz, romantik, aile, kultur, yemek, spa, doga, eglence.'),
      }),
      execute: async ({ destination, budget, adults, kids, days, themes }) => {
        try {
          const { deals, categoryByDealId } = await fetchPackageInventory(destination, 60);
          if (deals.length === 0) {
            return { ok: false, reason: 'no_inventory', destination };
          }
          const pkg = await buildTravelPackage({
            destination,
            budget,
            adults,
            kids,
            days,
            themes,
            inventory: deals,
            categoryByDealId,
          });
          return {
            ok: true,
            vibeName: pkg.vibeName,
            summary: pkg.summary,
            estimatedTotal: pkg.estimatedTotal,
            budgetMatch: pkg.budgetMatch,
            hotel: { title: pkg.hotel.title, why: pkg.hotel.why, price: pkg.hotel.estimatedTotal },
            dining: pkg.dining.map((d) => ({ title: d.title, when: d.when, why: d.why })),
            activities: pkg.activities.map((a) => ({ title: a.title, day: a.day, why: a.why })),
            extras: pkg.extras.map((e) => ({ title: e.title, why: e.why })),
          };
        } catch (err) {
          return { ok: false, destination, error: String(err) };
        }
      },
    }),

    compareDeals: tool({
      description:
        '2-3 fırsatı AI ile karşılaştırır, her biri için artı/eksi + "kime uygun" çıkarır. Kullanıcı "şu ikisini karşılaştır", "hangisi daha iyi" derse çağır. dealIds searchDeals sonuçlarından alınır.',
      inputSchema: z.object({
        dealIds: z
          .array(z.string())
          .min(2)
          .max(3)
          .describe('Karşılaştırılacak deal ID\'leri (önceki searchDeals sonucundan).'),
      }),
      execute: async ({ dealIds }) => {
        try {
          const supabase = getServiceClient();
          const { data } = await supabase
            .from('deals')
            .select(
              `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`,
            )
            .in('id', dealIds);

          const deals = (data ?? []) as unknown as DealWithMerchant[];
          if (deals.length < 2) {
            return { ok: false, reason: 'insufficient_deals' };
          }

          const result = await compareHotelsWithAI(deals);
          return {
            ok: true,
            verdict: result.verdict,
            hotels: result.hotels.map((h) => ({
              id: h.id,
              pros: h.pros,
              cons: h.cons,
              bestFor: h.bestFor,
            })),
          };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
      },
    }),

    findSimilarHotels: tool({
      description:
        'pgvector embedding similarity ile bir tatil deal\'ına benzer otelleri bulur. Kullanıcı "buna benzer öner", "bunu beğendim, başka var mı" derse çağır.',
      inputSchema: z.object({
        dealId: z.string().describe('Referans alınacak deal ID.'),
        limit: z.number().int().min(2).max(8).default(5),
      }),
      execute: async ({ dealId, limit }) => {
        try {
          const matches = await fetchSimilarTravelDeals(dealId, limit);
          const enriched = await enrichSimilarDeals(matches);
          return {
            ok: true,
            count: enriched.length,
            similar: enriched.map((d, idx) => ({
              id: d.id,
              slug: d.slug,
              title: d.title,
              city: d.city ?? '',
              district: d.district ?? '',
              price: Number(d.discounted_price),
              originalPrice: Number(d.original_price),
              discountPct: d.discount_percent ?? 0,
              coverImage: d.cover_image,
              similarity: Math.round((matches[idx]?.similarity ?? 0) * 100),
            })),
          };
        } catch (err) {
          return { ok: false, error: String(err) };
        }
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

    /**
     * Tek otelin TÜM detayları — kullanıcı bir otele odaklandığında AI
     * müşteri temsilcisi gibi konuşabilsin: yıldız, check-in/out, amenities,
     * oda tipleri (fiyat × gece dahil), politikalar (iptal/çocuk/pet),
     * ödeme adımları + taksit seçenekleri (mock).
     *
     * AI bu tool'u çağırdıktan sonra "Bu otelde 3 farklı oda var: ...
     * 2 yetişkin × 3 gece = X TL. Ödeme adımları: tarihleri seç → oda seç
     * → misafir bilgileri → ödeme. 9 taksit imkânı var" gibi rep tonunda
     * konuşur.
     */
    getHotelDetail: tool({
      description:
        'Belirli bir otelin TÜM detaylarını döner: yıldız, check-in/out, tesis özellikleri, oda tipleri (fiyat dahil), politikalar (iptal/çocuk/pet), ödeme adımları + taksit. Kullanıcı bir otele odaklanınca (slug ile) çağır — müşteri temsilcisi gibi rezervasyon detaylarını anlatmak için.',
      inputSchema: z.object({
        slug: z
          .string()
          .min(3)
          .max(140)
          .describe(
            "Otelin slug'ı (searchDeals sonuçlarındaki slug alanından). Örn. 'tdest-bodrum-yalikavak-butik-5g-1'.",
          ),
      }),
      execute: async ({ slug }) => {
        const supabase = getServiceClient();
        const { data: deal } = await supabase
          .from('deals')
          .select(
            `id, slug, title, subtitle, description, city, district,
             original_price, discounted_price, discount_percent, currency,
             max_per_user, tags, audience,
             merchant:merchants ( name, lat, lng )`,
          )
          .eq('slug', slug)
          .maybeSingle();

        if (!deal) {
          return { found: false, error: 'Otel bulunamadı (slug eşleşmedi)' };
        }

        const [{ data: meta }, { data: rooms }] = await Promise.all([
          supabase.from('deal_hotel_meta').select('*').eq('deal_id', deal.id).maybeSingle(),
          supabase
            .from('deal_room_types')
            .select(
              'id, name, description, capacity_adults, capacity_children, bed_setup, size_sqm, view_type, base_price_per_night, board_basis, has_balcony, has_jacuzzi',
            )
            .eq('deal_id', deal.id)
            .eq('is_active', true)
            .order('base_price_per_night', { ascending: true }),
        ]);

        // Aktif amenity'leri ad listesi olarak topla
        const activeAmenities: string[] = [];
        if (meta) {
          for (const [k, v] of Object.entries(meta)) {
            if (k.startsWith('has_') && v === true) {
              activeAmenities.push(k.replace(/^has_/, '').replace(/_/g, ' '));
            }
          }
        }

        // Taksit önerisi — mock; gerçek PSP entegrasyonunda burası dinamik
        const totalPrice = Number(deal.discounted_price);
        const installments = [
          { months: 1, perMonth: totalPrice, label: 'Tek çekim' },
          { months: 3, perMonth: Math.round(totalPrice / 3), label: '3 taksit' },
          { months: 6, perMonth: Math.round(totalPrice / 6), label: '6 taksit' },
          { months: 9, perMonth: Math.round(totalPrice / 9), label: '9 taksit' },
          { months: 12, perMonth: Math.round(totalPrice / 12), label: '12 taksit' },
        ];

        return {
          found: true,
          hotel: {
            slug: deal.slug,
            title: deal.title,
            subtitle: deal.subtitle ?? '',
            description: deal.description.slice(0, 800),
            city: deal.city,
            district: deal.district ?? '',
            merchantName: (() => {
              const m = deal.merchant as { name: string } | { name: string }[] | null;
              if (!m) return null;
              return Array.isArray(m) ? m[0]?.name ?? null : m.name;
            })(),
            currency: deal.currency,
            packagePrice: totalPrice,
            originalPrice: Number(deal.original_price),
            discountPct: deal.discount_percent,
            maxPerUser: deal.max_per_user,
            tags: deal.tags ?? [],
            audience: deal.audience ?? [],
          },
          meta: meta
            ? {
                star: meta.star_rating,
                checkIn: meta.check_in_time?.slice(0, 5) ?? '14:00',
                checkOut: meta.check_out_time?.slice(0, 5) ?? '12:00',
                concept: meta.concept,
                totalRooms: meta.total_rooms,
                distanceToBeachM: meta.distance_to_beach_m,
                distanceToCenterM: meta.distance_to_center_m,
                distanceToAirportKm: meta.distance_to_airport_km !== null
                  ? Number(meta.distance_to_airport_km)
                  : null,
                tourismTaxPerNight: Number(meta.tourism_tax_per_night),
                petFriendly: meta.pet_friendly,
                smokingAllowed: meta.smoking_allowed,
                cancellationPolicy: meta.cancellation_policy,
                childPolicy: meta.child_policy,
                petPolicy: meta.pet_policy,
                extraBedAvailable: meta.extra_bed_available,
                extraBedPrice: meta.extra_bed_price !== null ? Number(meta.extra_bed_price) : null,
                amenities: activeAmenities,
              }
            : null,
          rooms: (rooms ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? '',
            capacity: `${r.capacity_adults} yetişkin + ${r.capacity_children} çocuk`,
            bedSetup: r.bed_setup ?? '',
            sizeM2: r.size_sqm,
            view: r.view_type ?? '',
            pricePerNight: Number(r.base_price_per_night),
            board: r.board_basis,
            hasBalcony: r.has_balcony,
            hasJacuzzi: r.has_jacuzzi,
          })),
          paymentOptions: {
            currency: deal.currency,
            installments,
            reservationSteps: [
              '1) Tarih + kişi sayısı seç',
              '2) Oda tipi seç (kapasite + manzara + pansiyon)',
              '3) Misafirlerin kimlik bilgilerini gir (TC kimlik / pasaport)',
              '4) İptal politikası onayı + KVKK',
              '5) Ödeme (kart bilgileri — şu an mock)',
            ],
            note: 'V1 mock ödeme — gerçek tahsilat yok. Üretimde iyzico/PayTR entegrasyonu olacak.',
          },
          reservationUrl: `/rezervasyon/${deal.slug}`,
        };
      },
    }),
  };
}

/** Geriye uyum — eskiden statik export'tu, hala konum bağlamsız çağrılabilsin. */
export const chatTools = buildChatTools();

export type DealShape = ReturnType<typeof shapeDeal>;
