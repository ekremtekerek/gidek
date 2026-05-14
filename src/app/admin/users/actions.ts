'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

/**
 * Kullanıcıyı süresiz banla / banını kaldır. Supabase auth `banned_until`
 * alanını uzak gelecekteki bir tarihe set ederek banlar; null = açık.
 * Ban edilmiş kullanıcı oturum açamaz ve mevcut JWT'leri reddedilir.
 */
const assignSchema = z.object({
  userId: z.string().uuid(),
  merchantId: z
    .string()
    .uuid()
    .nullable()
    .or(z.literal('').transform(() => null)),
});

/**
 * Bir kullanıcıyı bir merchant'a ata (veya bağlantısını kaldır). Atandığında
 * kullanıcı /isletme/* portal'ına erişebilir. Bir merchant'ı birden fazla
 * kullanıcıya atamak şu an engellenmiyor — sonra N:M tabloya geçilirse
 * unique kısıtı eklenebilir.
 */
export async function assignMerchantToUserAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();

  const parsed = assignSchema.safeParse({
    userId: formData.get('userId'),
    merchantId: formData.get('merchantId') || null,
  });
  if (!parsed.success) return { ok: false, error: 'Geçersiz değer.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('profiles')
    .update({ merchant_id: parsed.data.merchantId })
    .eq('id', parsed.data.userId);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/users');
  return { ok: true };
}

export async function toggleUserBanAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true; banned: boolean } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };
  if (id === admin.id) return { ok: false, error: 'Kendini banlayamazsın.' };

  const supabase = getServiceClient();
  const { data: u } = await supabase.auth.admin.getUserById(id);
  if (!u?.user) return { ok: false, error: 'Kullanıcı bulunamadı.' };

  const banned = Boolean(
    (u.user as { banned_until?: string | null }).banned_until &&
      new Date((u.user as { banned_until: string }).banned_until) > new Date(),
  );

  // 'none' Supabase'in ban'ı kaldırmak için kabul ettiği sentinel değer.
  const nextDuration = banned ? 'none' : '876000h'; // ~100 yıl
  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: nextDuration,
  });
  if (error) return { ok: false, error: 'Ban durumu güncellenemedi.' };

  revalidatePath('/admin/users');
  return { ok: true, banned: !banned };
}
