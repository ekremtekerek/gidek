import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dealEmbeddingText, embed, toPgVector } from '@/lib/ai/embeddings';
import { getServiceClient } from '@/lib/db/service';
import {
  AUDIENCE,
  DEAL_TAGS,
  MAIN_CATEGORIES,
} from '@/lib/utils/constants';
import { slugify } from '@/lib/utils/format';

/**
 * Otel deal create/update'inin paylaşılan core'u. Hem admin
 * (`/admin/oteller`) hem işletme sahibi (`/isletme/oteller`) tarafından
 * çağrılır. Auth context'i ve scope'u caller belirler:
 *
 * - admin: `scopedMerchantId = null` — form'daki merchant_id geçerli
 * - merchant: `scopedMerchantId = userMerchantId` — form'daki merchant_id
 *   override edilir; UPDATE'te mevcut deal.merchant_id eşleşmeli (404 yerine
 *   yetki hatası dönülür)
 *
 * Bu dosya `'use server'` DEĞİL — yalnızca server-only constants/helpers
 * yayınlar. Use-server'lar (action sarmalayıcıları) ayrı dosyalarda.
 */

const AUDIENCE_SET = new Set<string>(AUDIENCE.map((a) => a.slug));
const TAG_SET = new Set<string>(DEAL_TAGS.map((t) => t.slug));
const CATEGORY_SLUGS = new Set<string>(MAIN_CATEGORIES.map((c) => c.slug));
const TRAVEL_CATS = new Set(['tatil-otelleri', 'sehir-otelleri', 'turlar']);

const CONCEPTS = [
  'her-sey-dahil','ultra-her-sey-dahil','butik','tasarim-otel','aile-resort',
  'spa-otel','plaj-resort','doga-ici','eko-otel','bungalov','yayla-evi',
  'magara-otel','kayak-otel','dag-evi','aqua-park','gourmet','ekonomik',
  'ruzgar-sorfu','balon-manzarali','marina',
] as const;

const VIEW_TYPES = [
  'deniz','bahce','havuz','dag','sehir','park','ic-bahce','manzara-yok',
] as const;

const BOARD_BASIS = [
  'oda','oda-kahvalti','yarim-pansiyon','tam-pansiyon','her-sey-dahil','ultra-her-sey-dahil',
] as const;

const AMENITY_KEYS = [
  'has_beach_access','has_private_beach','has_pool','has_indoor_pool',
  'has_spa','has_hamam','has_sauna','has_gym','has_aquapark',
  'has_kids_club','has_kids_pool','has_restaurant','has_bar','has_room_service',
  'has_parking','has_valet','has_wifi','has_aircon','has_breakfast',
  'has_transfer','has_laundry','has_business_center','has_meeting_room','has_disabled_access',
] as const;

// ----------------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------------
const optionalText = z.string().trim().max(2000).optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalShortText = z.string().trim().max(200).optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalInt = z.string().optional().transform((v) => {
  if (!v || v.trim().length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
});

const optionalNum = z.string().optional().transform((v) => {
  if (!v || v.trim().length === 0) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
});

const checkbox = z.string().optional().transform((v) => v === 'on' || v === 'true');

const roomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, 'Oda adı zorunlu').max(120),
  description: optionalText,
  capacity_adults: z.coerce.number().int().min(1).max(12),
  capacity_children: z.coerce.number().int().min(0).max(8),
  bed_setup: optionalShortText,
  size_sqm: optionalInt,
  view_type: z.enum(VIEW_TYPES).optional().or(z.literal('').transform(() => undefined)),
  base_price_per_night: z.coerce.number().min(1, "Gece fiyatı 0'dan büyük olmalı"),
  board_basis: z.enum(BOARD_BASIS).default('oda-kahvalti'),
  total_units: z.coerce.number().int().min(1, 'Toplam ünite sayısı zorunlu (envanter koruması için)').max(999),
  cover_image: optionalShortText,
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: checkbox.default(true),
  has_balcony: checkbox.default(false),
  has_jacuzzi: checkbox.default(false),
  has_kitchenette: checkbox.default(false),
  has_minibar: checkbox.default(false),
  has_safe: checkbox.default(false),
  has_tv: checkbox.default(true),
});

const hotelFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().trim().min(3).max(200),
  subtitle: z.string().trim().max(200).optional().transform((v) => (v && v.length > 0 ? v : null)),
  description: z.string().trim().min(20).max(5000),
  merchant_id: z.string().uuid('Tedarikçi seç'),
  categories: z.array(z.string()).min(1, 'En az bir kategori seç')
    .refine((arr) => arr.every((c) => CATEGORY_SLUGS.has(c)), 'Geçersiz kategori')
    .refine((arr) => arr.some((c) => TRAVEL_CATS.has(c)),
      'En az bir tatil kategorisi seçmelisin (tatil-otelleri / sehir-otelleri / turlar)'),
  cover_image: z.string().url('Kapak görseli URL\'si geçersiz'),
  images: z.array(z.string().url()).max(7),
  original_price: z.coerce.number().min(0),
  discounted_price: z.coerce.number().min(0),
  city: z.string().trim().min(2).max(50),
  district: z.string().trim().max(50).optional().transform((v) => (v && v.length > 0 ? v : null)),
  valid_from: z.string().min(1),
  valid_until: z.string().min(1),
  max_per_user: z.coerce.number().int().min(1).max(50).default(4),
  tags: z.array(z.string()).default([])
    .refine((arr) => arr.every((t) => TAG_SET.has(t)), 'Geçersiz etiket'),
  audience: z.array(z.string()).default([])
    .refine((arr) => arr.every((a) => AUDIENCE_SET.has(a)), 'Geçersiz kitle'),
  highlights: z.string().trim().max(2000).optional()
    .transform((v) => (v ? v.split('\n').map((s) => s.trim()).filter(Boolean) : [])),
  is_featured: checkbox.default(false),
  is_active: checkbox.default(true),
  published_now: checkbox.default(false),
  star_rating: z.coerce.number().int().min(0).max(5).optional()
    .transform((n) => (n && n >= 1 && n <= 5 ? n : null)),
  check_in_time: z.string().regex(/^\d{2}:\d{2}$/).default('14:00'),
  check_out_time: z.string().regex(/^\d{2}:\d{2}$/).default('12:00'),
  concept: z.enum(CONCEPTS).optional().or(z.literal('').transform(() => undefined)),
  pet_friendly: checkbox.default(false),
  smoking_allowed: checkbox.default(false),
  cancellation_policy: optionalText,
  child_policy: optionalText,
  pet_policy: optionalText,
  extra_bed_available: checkbox.default(false),
  extra_bed_price: optionalNum,
  distance_to_beach_m: optionalInt,
  distance_to_center_m: optionalInt,
  distance_to_airport_km: optionalNum,
  tourism_tax_per_night: z.coerce.number().min(0).default(0),
  total_rooms: optionalInt,
  rooms_json: z.string().default('[]'),
}).refine((d) => d.discounted_price <= d.original_price, {
  path: ['discounted_price'],
  message: 'İndirimli fiyat orijinalden büyük olamaz',
}).refine((d) => new Date(d.valid_until) > new Date(d.valid_from), {
  path: ['valid_until'],
  message: 'Bitiş başlangıçtan sonra olmalı',
});

export type HotelFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function parseAmenities(formData: FormData): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const key of AMENITY_KEYS) {
    out[key] = formData.get(key) === 'on';
  }
  return out;
}

function parseRooms(json: string): z.infer<typeof roomSchema>[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    const parsed: z.infer<typeof roomSchema>[] = [];
    for (const r of arr) {
      const result = roomSchema.safeParse(r);
      if (result.success) parsed.push(result.data);
    }
    return parsed;
  } catch {
    return [];
  }
}

function buildDealPayload(d: z.infer<typeof hotelFormSchema>) {
  return {
    title: d.title,
    subtitle: d.subtitle,
    description: d.description,
    merchant_id: d.merchant_id,
    cover_image: d.cover_image,
    images: [d.cover_image, ...d.images.filter((u) => u !== d.cover_image)],
    original_price: d.original_price,
    discounted_price: d.discounted_price,
    city: d.city,
    district: d.district,
    valid_from: new Date(d.valid_from).toISOString(),
    valid_until: new Date(d.valid_until).toISOString(),
    max_per_user: d.max_per_user,
    tags: d.tags,
    audience: d.audience,
    highlights: d.highlights,
    is_active: d.is_active,
    is_featured: d.is_featured,
    published_at: d.published_now ? new Date().toISOString() : null,
  };
}

function buildHotelMetaPayload(
  dealId: string,
  d: z.infer<typeof hotelFormSchema>,
  amenities: Record<string, boolean>,
) {
  return {
    deal_id: dealId,
    star_rating: d.star_rating,
    check_in_time: d.check_in_time,
    check_out_time: d.check_out_time,
    concept: d.concept ?? null,
    pet_friendly: d.pet_friendly,
    smoking_allowed: d.smoking_allowed,
    cancellation_policy: d.cancellation_policy,
    child_policy: d.child_policy,
    pet_policy: d.pet_policy,
    extra_bed_available: d.extra_bed_available,
    extra_bed_price: d.extra_bed_price,
    distance_to_beach_m: d.distance_to_beach_m,
    distance_to_center_m: d.distance_to_center_m,
    distance_to_airport_km: d.distance_to_airport_km,
    tourism_tax_per_night: d.tourism_tax_per_night,
    total_rooms: d.total_rooms,
    ...amenities,
  };
}

async function maybeEmbed(text: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const vec = await embed(text);
    return toPgVector(vec);
  } catch (err) {
    console.error('hotel embed error', err);
    return null;
  }
}

function readFormArrays(fd: FormData) {
  return {
    categories: fd.getAll('categories[]').map(String).filter(Boolean),
    images: fd.getAll('images[]').map(String).filter(Boolean),
    tags: fd.getAll('tags[]').map(String).filter(Boolean),
    audience: fd.getAll('audience[]').map(String).filter(Boolean),
  };
}

// ----------------------------------------------------------------------------
// Core executor
// ----------------------------------------------------------------------------
export interface SaveHotelOptions {
  /**
   * Eğer dolu ise:
   *  - form'daki merchant_id bu değerle ezilir
   *  - UPDATE'te mevcut deal.merchant_id bu değerle eşleşmezse yetki hatası
   * null ise admin modu (caller `requireAdmin()` etmiş varsayılır)
   */
  scopedMerchantId: string | null;
  /** Yönlendirme path'i — örn. '/admin/oteller' veya '/isletme/oteller' */
  redirectBase: string;
}

export async function executeHotelSave(
  formData: FormData,
  opts: SaveHotelOptions,
): Promise<HotelFormState> {
  const raw = Object.fromEntries(formData) as Record<string, FormDataEntryValue>;
  const arrays = readFormArrays(formData);

  // Merchant scope'u varsa form'daki merchant_id'yi ez
  const scopedRaw = opts.scopedMerchantId
    ? { ...raw, merchant_id: opts.scopedMerchantId }
    : raw;

  const parsed = hotelFormSchema.safeParse({ ...scopedRaw, ...arrays });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'Form geçersiz — alanları kontrol et',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const d = parsed.data;
  const amenities = parseAmenities(formData);
  const rooms = parseRooms(d.rooms_json);

  const supabase = getServiceClient();

  // Merchant mode'da UPDATE: mevcut deal sahipliği kontrolü
  if (d.id && opts.scopedMerchantId) {
    const { data: existing } = await supabase
      .from('deals')
      .select('merchant_id')
      .eq('id', d.id)
      .maybeSingle();
    if (!existing) {
      return { ok: false, error: 'Deal bulunamadı' };
    }
    if (existing.merchant_id !== opts.scopedMerchantId) {
      return { ok: false, error: 'Bu deal sizin işletmenize ait değil' };
    }
  }

  const dealPayload = buildDealPayload(d);
  const embedText = dealEmbeddingText({
    title: d.title,
    subtitle: d.subtitle,
    description: d.description,
    tags: d.tags,
    audience: d.audience,
    city: d.city,
    district: d.district,
    venue_name: null,
  });
  const embedding = await maybeEmbed(embedText);

  let dealId = d.id;
  let dealSlug = d.slug;

  if (dealId) {
    const { error } = await supabase
      .from('deals')
      .update({ ...dealPayload, ...(embedding ? { embedding } : {}) })
      .eq('id', dealId);
    if (error) {
      return { ok: false, error: `Deal güncellenemedi: ${error.message}` };
    }
  } else {
    const baseSlug = d.slug ?? slugify(d.title);
    const candidate = baseSlug.slice(0, 110);
    let finalSlug = candidate;
    for (let i = 1; i <= 10; i++) {
      const { data: existing } = await supabase
        .from('deals')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();
      if (!existing) break;
      finalSlug = `${candidate}-${i}`;
    }
    const { data: created, error } = await supabase
      .from('deals')
      .insert({ ...dealPayload, slug: finalSlug, embedding })
      .select('id, slug')
      .single();
    if (error || !created) {
      return { ok: false, error: `Deal oluşturulamadı: ${error?.message ?? 'bilinmeyen hata'}` };
    }
    dealId = created.id;
    dealSlug = created.slug;
  }

  // Junction
  const { data: cats } = await supabase.from('categories').select('id, slug').in('slug', d.categories);
  const catIds = (cats ?? []).map((c) => c.id);
  if (catIds.length > 0) {
    await supabase.from('deal_categories').delete().eq('deal_id', dealId);
    const { error: catErr } = await supabase
      .from('deal_categories')
      .insert(catIds.map((cid) => ({ deal_id: dealId!, category_id: cid })));
    if (catErr) {
      return { ok: false, error: `Kategori bağlanamadı: ${catErr.message}` };
    }
  }

  if (!dealId) {
    return { ok: false, error: 'Deal id alınamadı' };
  }

  // Hotel meta upsert
  const metaPayload = buildHotelMetaPayload(dealId, d, amenities);
  const { error: metaErr } = await supabase
    .from('deal_hotel_meta')
    .upsert(metaPayload, { onConflict: 'deal_id' });
  if (metaErr) {
    return { ok: false, error: `Otel meta yazılamadı: ${metaErr.message}` };
  }

  // Oda tipleri diff
  const incomingIds = rooms.map((r) => r.id).filter(Boolean) as string[];
  const { data: existingRooms } = await supabase
    .from('deal_room_types')
    .select('id')
    .eq('deal_id', dealId);
  const toDelete = (existingRooms ?? [])
    .map((r) => r.id)
    .filter((id) => !incomingIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('deal_room_types').delete().in('id', toDelete);
  }

  if (rooms.length > 0) {
    const roomRows = rooms.map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      deal_id: dealId,
      name: r.name,
      description: r.description,
      capacity_adults: r.capacity_adults,
      capacity_children: r.capacity_children,
      bed_setup: r.bed_setup,
      size_sqm: r.size_sqm,
      view_type: r.view_type ?? null,
      base_price_per_night: r.base_price_per_night,
      board_basis: r.board_basis,
      total_units: r.total_units,
      cover_image: r.cover_image,
      sort_order: r.sort_order,
      is_active: r.is_active,
      has_balcony: r.has_balcony,
      has_jacuzzi: r.has_jacuzzi,
      has_kitchenette: r.has_kitchenette,
      has_minibar: r.has_minibar,
      has_safe: r.has_safe,
      has_tv: r.has_tv,
    }));
    const { error: roomErr } = await supabase
      .from('deal_room_types')
      .upsert(roomRows, { onConflict: 'id' });
    if (roomErr) {
      return { ok: false, error: `Oda tipleri yazılamadı: ${roomErr.message}` };
    }
  }

  revalidatePath(opts.redirectBase);
  revalidatePath('/tatil');
  if (dealSlug) revalidatePath(`/f/${dealSlug}`);
  redirect(`${opts.redirectBase}/${dealId}?saved=1`);
}

/** Admin/merchant delete — ortak. Caller auth/scope check yapmalı. */
export async function executeHotelDelete(dealId: string, opts: { redirectBase: string }): Promise<void> {
  const supabase = getServiceClient();
  await supabase.from('deals').delete().eq('id', dealId);
  revalidatePath(opts.redirectBase);
  redirect(opts.redirectBase);
}
