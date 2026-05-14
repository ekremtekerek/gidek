'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dealEmbeddingText, embed, toPgVector } from '@/lib/ai/embeddings';
import { getServiceClient } from '@/lib/db/service';
import { requireMerchant } from '@/lib/security/auth';
import { AUDIENCE, DEAL_TAGS, MAIN_CATEGORIES } from '@/lib/utils/constants';
import { slugify } from '@/lib/utils/format';

const AUDIENCE_SET = new Set<string>(AUDIENCE.map((a) => a.slug));
const TAG_SET = new Set<string>(DEAL_TAGS.map((t) => t.slug));
const CATEGORY_SLUGS = new Set<string>(MAIN_CATEGORIES.map((c) => c.slug));

const merchantDealSchema = z
  .object({
    title: z.string().trim().min(3, 'Başlık zorunlu').max(200),
    subtitle: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    description: z
      .string()
      .trim()
      .min(20, 'Açıklama en az 20 karakter')
      .max(5000),
    categories: z
      .array(z.string())
      .min(1, 'En az bir kategori seç')
      .refine((arr) => arr.every((c) => CATEGORY_SLUGS.has(c)), 'Geçersiz kategori'),
    cover_image: z.string().url('Kapak görseli gerekli'),
    images: z.array(z.string().url()).max(7, 'En fazla 7 ek görsel').default([]),
    original_price: z.coerce.number().min(0),
    discounted_price: z.coerce.number().min(0),
    city: z.string().trim().min(2, 'Şehir zorunlu').max(50),
    district: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    venue_name: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    duration_minutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(10080)
      .optional()
      .transform((n) => (n && n > 0 ? n : undefined)),
    valid_from: z.string().min(1),
    valid_until: z.string().min(1),
    max_per_user: z.coerce.number().int().min(1).max(50).default(4),
    tags: z
      .array(z.string())
      .default([])
      .refine((arr) => arr.every((t) => TAG_SET.has(t)), 'Geçersiz etiket'),
    audience: z
      .array(z.string())
      .default([])
      .refine((arr) => arr.every((a) => AUDIENCE_SET.has(a)), 'Geçersiz kitle'),
    highlights: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) =>
        v
          ? v
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      ),
  })
  .refine((data) => data.discounted_price <= data.original_price, {
    path: ['discounted_price'],
    message: 'İndirimli fiyat orijinalden büyük olamaz',
  })
  .refine((data) => new Date(data.valid_until) > new Date(data.valid_from), {
    path: ['valid_until'],
    message: 'Bitiş başlangıçtan sonra olmalı',
  });

export type MerchantDealFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

function parse(formData: FormData) {
  return merchantDealSchema.safeParse({
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    description: formData.get('description'),
    categories: formData.getAll('categories'),
    cover_image: formData.get('cover_image'),
    images: formData.getAll('images[]'),
    original_price: formData.get('original_price'),
    discounted_price: formData.get('discounted_price'),
    city: formData.get('city'),
    district: formData.get('district'),
    venue_name: formData.get('venue_name'),
    duration_minutes: formData.get('duration_minutes'),
    valid_from: formData.get('valid_from'),
    valid_until: formData.get('valid_until'),
    max_per_user: formData.get('max_per_user'),
    tags: formData.getAll('tags'),
    audience: formData.getAll('audience'),
    highlights: formData.get('highlights'),
  });
}

async function maybeEmbed(text: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const vec = await embed(text);
    return toPgVector(vec);
  } catch (err) {
    console.error('merchant maybeEmbed failed:', err);
    return null;
  }
}

/**
 * Merchant kullanıcısı yeni fırsat BAŞVURUSU yapar. Kayıt is_active=false,
 * published_at=null durumunda DB'ye düşer — admin onayı bekler. Onay öncesi
 * /f/<slug> public listingde görünmez (deals_select_public policy zaten
 * is_active + published_at şartı koşuyor).
 */
export async function createMerchantDealApplicationAction(
  _prev: MerchantDealFormState,
  formData: FormData,
): Promise<MerchantDealFormState> {
  const { merchantId } = await requireMerchant();
  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;

  const supabase = getServiceClient();
  const slug = slugify(`${d.title}-${d.city}-${Date.now().toString(36).slice(-4)}`);

  const embedding = await maybeEmbed(
    dealEmbeddingText({
      title: d.title,
      subtitle: d.subtitle,
      description: d.description,
      tags: d.tags,
      audience: d.audience,
      city: d.city,
      district: d.district,
      venue_name: d.venue_name,
    }),
  );

  const { data: inserted, error: insErr } = await supabase
    .from('deals')
    .insert({
      slug,
      title: d.title,
      subtitle: d.subtitle ?? null,
      description: d.description,
      merchant_id: merchantId,
      cover_image: d.cover_image,
      images: [d.cover_image, ...d.images.filter((u) => u !== d.cover_image)],
      original_price: d.original_price,
      discounted_price: d.discounted_price,
      city: d.city,
      district: d.district ?? null,
      venue_name: d.venue_name ?? null,
      duration_minutes: d.duration_minutes ?? null,
      valid_from: new Date(d.valid_from).toISOString(),
      valid_until: new Date(d.valid_until).toISOString(),
      max_per_user: d.max_per_user,
      tags: d.tags,
      audience: d.audience,
      highlights: d.highlights,
      is_active: false, // admin onayı bekliyor
      is_featured: false,
      published_at: null,
      embedding,
    })
    .select('id')
    .single();

  if (insErr || !inserted) {
    return {
      ok: false,
      error: `Başvuru gönderilemedi: ${insErr?.message ?? 'bilinmeyen hata'}`,
    };
  }

  // Kategori ilişkilerini ekle — categories.slug → id lookup gerekiyor.
  const { data: cats } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', d.categories);
  if (cats && cats.length > 0) {
    await supabase
      .from('deal_categories')
      .insert(cats.map((c) => ({ deal_id: inserted.id, category_id: c.id })));
  }

  revalidatePath('/isletme/firsatlar');
  revalidatePath('/admin/deals');
  redirect(`/isletme/firsatlar?submitted=${inserted.id}`);
}

/**
 * Merchant kendi deal'ini günceller. Yetkili alanlar: subtitle, description,
 * fiyat, görsel, etiket, audience, highlight, süre. **Yayın kontrolü
 * (is_active, is_featured, published_at) burada DEĞİŞTİRİLMEZ** — admin
 * onay kapısı bizde.
 */
export async function updateMerchantDealAction(
  dealId: string,
  _prev: MerchantDealFormState,
  formData: FormData,
): Promise<MerchantDealFormState> {
  const { merchantId } = await requireMerchant();
  const parsed = parse(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const d = parsed.data;
  const supabase = getServiceClient();

  // Sahiplik kontrolü
  const { data: existing } = await supabase
    .from('deals')
    .select('id, merchant_id')
    .eq('id', dealId)
    .maybeSingle();
  if (!existing || existing.merchant_id !== merchantId) {
    return { ok: false, error: 'Bu fırsat üzerinde yetkin yok.' };
  }

  const embedding = await maybeEmbed(
    dealEmbeddingText({
      title: d.title,
      subtitle: d.subtitle,
      description: d.description,
      tags: d.tags,
      audience: d.audience,
      city: d.city,
      district: d.district,
      venue_name: d.venue_name,
    }),
  );

  const { error: uErr } = await supabase
    .from('deals')
    .update({
      title: d.title,
      subtitle: d.subtitle ?? null,
      description: d.description,
      cover_image: d.cover_image,
      images: [d.cover_image, ...d.images.filter((u) => u !== d.cover_image)],
      original_price: d.original_price,
      discounted_price: d.discounted_price,
      city: d.city,
      district: d.district ?? null,
      venue_name: d.venue_name ?? null,
      duration_minutes: d.duration_minutes ?? null,
      valid_from: new Date(d.valid_from).toISOString(),
      valid_until: new Date(d.valid_until).toISOString(),
      max_per_user: d.max_per_user,
      tags: d.tags,
      audience: d.audience,
      highlights: d.highlights,
      embedding: embedding ?? undefined,
    })
    .eq('id', dealId);

  if (uErr) return { ok: false, error: 'Güncellenemedi.' };

  // Kategorileri yeniden senkronla
  const { data: cats } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', d.categories);
  if (cats && cats.length > 0) {
    await supabase.from('deal_categories').delete().eq('deal_id', dealId);
    await supabase
      .from('deal_categories')
      .insert(cats.map((c) => ({ deal_id: dealId, category_id: c.id })));
  }

  revalidatePath('/isletme/firsatlar');
  revalidatePath(`/isletme/firsatlar/${dealId}`);
  redirect(`/isletme/firsatlar?updated=${dealId}`);
}
