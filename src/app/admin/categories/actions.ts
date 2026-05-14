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

const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(slugRe, "Slug yalnızca küçük harf, rakam ve '-' içerebilir"),
  name: z.string().trim().min(2).max(80),
  parent_id: z.string().uuid().optional(),
  icon: z.string().trim().max(40).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999),
  description: z.string().trim().max(500).optional(),
  meta_title: z.string().trim().max(120).optional(),
  meta_description: z.string().trim().max(300).optional(),
  is_active: z.boolean(),
});

export type CategoryFormState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

function parseForm(formData: FormData) {
  return categorySchema.safeParse({
    slug: toOptional(formData.get('slug')) ?? '',
    name: toOptional(formData.get('name')) ?? '',
    parent_id: toOptional(formData.get('parent_id')),
    icon: toOptional(formData.get('icon')),
    sort_order: formData.get('sort_order') ?? '0',
    description: toOptional(formData.get('description')),
    meta_title: toOptional(formData.get('meta_title')),
    meta_description: toOptional(formData.get('meta_description')),
    is_active: formData.get('is_active') === 'on',
  });
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('categories').insert(parsed.data);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu slug zaten kullanılıyor.' };
    return { ok: false, error: 'Kategori oluşturulamadı.' };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
  redirect(`/admin/categories?created=${parsed.data.slug}`);
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Bir kategori kendi parent'ı olamaz.
  if (parsed.data.parent_id === id) {
    return { ok: false, error: 'Bir kategori kendisini üst kategori olarak seçemez.' };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('categories').update(parsed.data).eq('id', id);
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu slug zaten kullanılıyor.' };
    return { ok: false, error: 'Güncellenemedi.' };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/');
  revalidatePath(`/k/${parsed.data.slug}`);
  redirect(`/admin/categories?updated=${parsed.data.slug}`);
}

export async function toggleCategoryActiveAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();
  const { data, error: rErr } = await supabase
    .from('categories')
    .select('is_active')
    .eq('id', id)
    .maybeSingle();
  if (rErr || !data) return { ok: false, error: 'Kategori bulunamadı.' };

  const { error } = await supabase
    .from('categories')
    .update({ is_active: !data.is_active })
    .eq('id', id);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/categories');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteCategoryAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();

  // Bağımlılık kontrolü: alt kategori veya bağlı deal varsa silme.
  const [{ count: childCount }, { count: dealCount }] = await Promise.all([
    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('parent_id', id),
    supabase.from('deal_categories').select('deal_id', { count: 'exact', head: true }).eq('category_id', id),
  ]);

  if (childCount && childCount > 0) {
    return { ok: false, error: `Bu kategorinin ${childCount} alt kategorisi var — önce onları sil.` };
  }
  if (dealCount && dealCount > 0) {
    return { ok: false, error: `Bu kategoriye bağlı ${dealCount} fırsat var — önce ilişkilerini kaldır.` };
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { ok: false, error: 'Silinemedi.' };

  revalidatePath('/admin/categories');
  revalidatePath('/');
  return { ok: true };
}
