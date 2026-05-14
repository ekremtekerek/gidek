'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

const codeRe = /^[A-Z0-9_-]+$/;

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

const toOptionalDate = (v: FormDataEntryValue | null) => {
  const s = toOptional(v);
  if (!s) return undefined;
  // datetime-local: "2026-05-14T10:00"
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(40)
      .transform((s) => s.toUpperCase())
      .pipe(z.string().regex(codeRe, 'Kod yalnızca büyük harf, rakam, "_" ve "-"')),
    description: z.string().trim().max(300).optional(),
    discount_type: z.enum(['percent', 'fixed']),
    discount_value: z.coerce.number().min(0.01).max(100000),
    min_order_amount: z.coerce.number().min(0).max(100000).default(0),
    max_uses: z.coerce.number().int().min(1).max(1_000_000).optional(),
    valid_from: z.string().optional(),
    valid_until: z.string().optional(),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === 'percent' && data.discount_value > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['discount_value'],
        message: 'Yüzde indirim 100\'ü geçemez',
      });
    }
    if (data.valid_from && data.valid_until && data.valid_until <= data.valid_from) {
      ctx.addIssue({
        code: 'custom',
        path: ['valid_until'],
        message: 'Bitiş başlangıçtan sonra olmalı',
      });
    }
  });

export type CouponFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

function parseForm(formData: FormData) {
  return couponSchema.safeParse({
    code: toOptional(formData.get('code')) ?? '',
    description: toOptional(formData.get('description')),
    discount_type: toOptional(formData.get('discount_type')) ?? 'percent',
    discount_value: formData.get('discount_value') ?? '0',
    min_order_amount: formData.get('min_order_amount') ?? '0',
    max_uses: toOptionalNumber(formData.get('max_uses')),
    valid_from: toOptionalDate(formData.get('valid_from')),
    valid_until: toOptionalDate(formData.get('valid_until')),
    is_active: formData.get('is_active') === 'on',
  });
}

export async function createCouponAction(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('coupons').insert({
    code: parsed.data.code,
    description: parsed.data.description ?? null,
    discount_type: parsed.data.discount_type,
    discount_value: parsed.data.discount_value,
    min_order_amount: parsed.data.min_order_amount,
    max_uses: parsed.data.max_uses ?? null,
    valid_from: parsed.data.valid_from ?? new Date().toISOString(),
    valid_until: parsed.data.valid_until ?? null,
    is_active: parsed.data.is_active,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu kod zaten kullanılıyor.' };
    return { ok: false, error: 'Kupon oluşturulamadı.' };
  }

  revalidatePath('/admin/coupons');
  redirect(`/admin/coupons?created=${parsed.data.code}`);
}

export async function updateCouponAction(
  id: string,
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('coupons')
    .update({
      code: parsed.data.code,
      description: parsed.data.description ?? null,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      min_order_amount: parsed.data.min_order_amount,
      max_uses: parsed.data.max_uses ?? null,
      valid_from: parsed.data.valid_from ?? new Date().toISOString(),
      valid_until: parsed.data.valid_until ?? null,
      is_active: parsed.data.is_active,
    })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu kod zaten kullanılıyor.' };
    return { ok: false, error: 'Güncellenemedi.' };
  }

  revalidatePath('/admin/coupons');
  revalidatePath(`/admin/coupons/${id}`);
  redirect(`/admin/coupons?updated=${parsed.data.code}`);
}

export async function toggleCouponActiveAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();
  const { data, error: rErr } = await supabase
    .from('coupons')
    .select('is_active')
    .eq('id', id)
    .maybeSingle();
  if (rErr || !data) return { ok: false, error: 'Kupon bulunamadı.' };

  const { error } = await supabase
    .from('coupons')
    .update({ is_active: !data.is_active })
    .eq('id', id);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/coupons');
  return { ok: true };
}

export async function deleteCouponAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();
  // Eğer kupon kullanılmışsa silmek yerine pasifleştirmeyi öneriyoruz.
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', id);
  if (count && count > 0) {
    return {
      ok: false,
      error: `Bu kupon ${count} rezervasyonda kullanılmış — silmek yerine pasifleştir.`,
    };
  }

  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return { ok: false, error: 'Silinemedi.' };

  revalidatePath('/admin/coupons');
  return { ok: true };
}
