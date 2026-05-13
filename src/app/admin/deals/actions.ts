'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dealEmbeddingText, embed, toPgVector } from '@/lib/ai/embeddings';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';
import {
  AUDIENCE,
  DEAL_TAGS,
  KIDS_AGE_GROUPS,
  MAIN_CATEGORIES,
} from '@/lib/utils/constants';
import { slugify } from '@/lib/utils/format';

// Widened to plain string so .has(string) typechecks; runtime guarantees
// only known slugs reach here because the form chips emit those exact values.
const AUDIENCE_SET = new Set<string>(AUDIENCE.map((a) => a.slug));
const TAG_SET = new Set<string>(DEAL_TAGS.map((t) => t.slug));
const CATEGORY_SLUGS = new Set<string>(MAIN_CATEGORIES.map((c) => c.slug));

void KIDS_AGE_GROUPS;

const dealFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, 'Slug en az 3 karakter')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug yalnızca küçük harf, rakam ve tire içerebilir')
    .optional(),
  title: z.string().trim().min(3, 'Başlık zorunlu').max(200),
  subtitle: z.string().trim().max(200).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
  description: z.string().trim().min(20, 'Açıklama en az 20 karakter').max(5000),
  merchant_id: z.string().uuid('Tedarikçi seç'),
  categories: z.array(z.string()).min(1, 'En az bir kategori seç').refine((arr) => arr.every((c) => CATEGORY_SLUGS.has(c)), 'Geçersiz kategori'),
  cover_image: z.string().url('Kapak resmi URL’si geçersiz'),
  images: z.array(z.string().url()).max(7, 'En fazla 7 ek görsel'),
  original_price: z.coerce.number().min(0, 'Fiyat 0\'dan büyük olmalı'),
  discounted_price: z.coerce.number().min(0),
  city: z.string().trim().min(2, 'Şehir zorunlu').max(50),
  district: z.string().trim().max(50).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
  venue_name: z.string().trim().max(120).optional().transform((v) => (v && v.length > 0 ? v : undefined)),
  duration_minutes: z.coerce.number().int().min(0).max(10080).optional()
    .transform((n) => (n && n > 0 ? n : undefined)),
  valid_from: z.string().min(1),
  valid_until: z.string().min(1),
  max_per_user: z.coerce.number().int().min(1).max(50).default(4),
  tags: z.array(z.string()).default([])
    .refine((arr) => arr.every((t) => TAG_SET.has(t)), 'Geçersiz etiket'),
  audience: z.array(z.string()).default([])
    .refine((arr) => arr.every((a) => AUDIENCE_SET.has(a)), 'Geçersiz kitle'),
  highlights: z.string().trim().max(2000).optional()
    .transform((v) => (v ? v.split('\n').map((s) => s.trim()).filter(Boolean) : [])),
  is_featured: z.string().optional().transform((v) => v === 'on'),
  is_active: z.string().optional().transform((v) => v === 'on'),
  published_now: z.string().optional().transform((v) => v === 'on'),
}).refine((data) => data.discounted_price <= data.original_price, {
  path: ['discounted_price'],
  message: 'İndirimli fiyat orijinalden büyük olamaz',
}).refine((data) => new Date(data.valid_until) > new Date(data.valid_from), {
  path: ['valid_until'],
  message: 'Bitiş başlangıçtan sonra olmalı',
});

export type DealFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

function buildPayload(d: z.infer<typeof dealFormSchema>) {
  return {
    title: d.title,
    subtitle: d.subtitle ?? null,
    description: d.description,
    merchant_id: d.merchant_id,
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
    is_active: d.is_active,
    is_featured: d.is_featured,
    published_at: d.published_now ? new Date().toISOString() : null,
  };
}

async function maybeEmbed(
  text: string,
): Promise<{ embedding: string | null; warning?: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      embedding: null,
      warning: 'GEMINI_API_KEY yok — embedding üretilmedi. AI önerilerinde görünmez.',
    };
  }
  try {
    const vec = await embed(text);
    return { embedding: toPgVector(vec) };
  } catch (err) {
    console.error('admin maybeEmbed failed:', err);
    return { embedding: null, warning: 'Embedding üretilemedi — sonra `npm run ai:backfill` çalıştır.' };
  }
}

function parse(formData: FormData) {
  return dealFormSchema.safeParse({
    slug: formData.get('slug'),
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    description: formData.get('description'),
    merchant_id: formData.get('merchant_id'),
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
    is_featured: formData.get('is_featured'),
    is_active: formData.get('is_active'),
    published_now: formData.get('published_now'),
  });
}

export async function createDealAction(
  _prev: DealFormState,
  formData: FormData,
): Promise<DealFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;
  const supabase = getServiceClient();

  const slug = d.slug ?? slugify(`${d.title}-${d.city}`);
  const embedRes = await maybeEmbed(
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
    .insert({ slug, ...buildPayload(d), embedding: embedRes.embedding })
    .select('id, slug')
    .single();
  if (insErr || !inserted) {
    return { ok: false, error: `Kaydedilemedi: ${insErr?.message ?? 'bilinmeyen hata'}` };
  }

  // Wire categories junction
  const cats = d.categories;
  const { data: catRows } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', cats);
  if (catRows && catRows.length > 0) {
    await supabase
      .from('deal_categories')
      .upsert(catRows.map((c) => ({ deal_id: inserted.id, category_id: c.id })), {
        onConflict: 'deal_id,category_id',
      });
  }

  revalidatePath('/admin/deals');
  revalidatePath('/');
  revalidatePath(`/k/${cats[0]}`);
  redirect(`/admin/deals/${inserted.id}`);
}

export async function updateDealAction(
  dealId: string,
  _prev: DealFormState,
  formData: FormData,
): Promise<DealFormState> {
  await requireAdmin();
  const parsed = parse(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const d = parsed.data;
  const supabase = getServiceClient();

  const slug = d.slug ?? slugify(`${d.title}-${d.city}`);
  const embedRes = await maybeEmbed(
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

  const { error: updErr } = await supabase
    .from('deals')
    .update({ slug, ...buildPayload(d), embedding: embedRes.embedding ?? undefined })
    .eq('id', dealId);
  if (updErr) return { ok: false, error: `Güncellenemedi: ${updErr.message}` };

  // Re-sync categories
  await supabase.from('deal_categories').delete().eq('deal_id', dealId);
  const { data: catRows } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', d.categories);
  if (catRows && catRows.length > 0) {
    await supabase
      .from('deal_categories')
      .insert(catRows.map((c) => ({ deal_id: dealId, category_id: c.id })));
  }

  revalidatePath('/admin/deals');
  revalidatePath('/');
  revalidatePath(`/f/${slug}`);
  return { ok: false, error: embedRes.warning ?? undefined };
}

export async function toggleDealActiveAction(dealId: string, currentActive: boolean) {
  await requireAdmin();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('deals')
    .update({ is_active: !currentActive })
    .eq('id', dealId);
  if (error) return { error: error.message };
  revalidatePath('/admin/deals');
  revalidatePath('/');
  return { ok: true };
}
