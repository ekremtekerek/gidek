'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

const slugRe = /^[a-z0-9-]+$/;

const toOptional = (v: FormDataEntryValue | null) => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
};

const toOptionalNumber = (v: FormDataEntryValue | null) => {
  if (typeof v !== 'string' || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const merchantSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(slugRe, "Slug yalnızca küçük harf, rakam ve '-' içerebilir"),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().optional(),
  website: z.string().trim().url().optional(),
  address: z.string().trim().max(300).optional(),
  city: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  logo_url: z.string().trim().url().optional(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
});

export type MerchantFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

function parseForm(formData: FormData) {
  return merchantSchema.safeParse({
    slug: toOptional(formData.get('slug')) ?? '',
    name: toOptional(formData.get('name')) ?? '',
    description: toOptional(formData.get('description')),
    phone: toOptional(formData.get('phone')),
    email: toOptional(formData.get('email')),
    website: toOptional(formData.get('website')),
    address: toOptional(formData.get('address')),
    city: toOptional(formData.get('city')),
    district: toOptional(formData.get('district')),
    lat: toOptionalNumber(formData.get('lat')),
    lng: toOptionalNumber(formData.get('lng')),
    logo_url: toOptional(formData.get('logo_url')),
    is_active: formData.get('is_active') === 'on',
    is_verified: formData.get('is_verified') === 'on',
  });
}

export async function createMerchantAction(
  _prev: MerchantFormState,
  formData: FormData,
): Promise<MerchantFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('merchants').insert(parsed.data);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu slug zaten kullanılıyor.' };
    return { ok: false, error: 'İşletme oluşturulamadı.' };
  }

  revalidatePath('/admin/merchants');
  redirect(`/admin/merchants?created=${parsed.data.slug}`);
}

export async function updateMerchantAction(
  id: string,
  _prev: MerchantFormState,
  formData: FormData,
): Promise<MerchantFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('merchants').update(parsed.data).eq('id', id);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu slug zaten kullanılıyor.' };
    return { ok: false, error: 'Güncellenemedi.' };
  }

  revalidatePath('/admin/merchants');
  revalidatePath(`/admin/merchants/${id}`);
  redirect(`/admin/merchants?updated=${parsed.data.slug}`);
}

export async function toggleMerchantActiveAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();
  const { data, error: rErr } = await supabase
    .from('merchants')
    .select('is_active')
    .eq('id', id)
    .maybeSingle();
  if (rErr || !data) return { ok: false, error: 'İşletme bulunamadı.' };

  const { error } = await supabase
    .from('merchants')
    .update({ is_active: !data.is_active })
    .eq('id', id);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/merchants');
  return { ok: true };
}
