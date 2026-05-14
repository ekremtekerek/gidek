'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';
import { emailSchema, passwordSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export type AccountActionState =
  | { ok: true; message?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

// ---------------------------------------------------------------------------
// Şifre değiştirme
// ---------------------------------------------------------------------------

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Şifreler uyuşmuyor',
      });
    }
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: 'Yeni şifre mevcut şifreden farklı olmalı',
      });
    }
  });

export async function changePasswordAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();
  if (!user.email) return { ok: false, error: 'E-postan tanımlı değil.' };

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Mevcut şifreyi doğrulamak için ayrı, cookie yazmayan bir client kullan
  // — yoksa signInWithPassword aktif session'ı bozar.
  const verifier = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
  const { error: vErr } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (vErr) {
    return {
      ok: false,
      fieldErrors: { currentPassword: ['Mevcut şifre hatalı'] },
    };
  }

  // Şifreyi gerçek session client'ı ile güncelle.
  const supabase = await getServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { ok: false, error: 'Şifre güncellenemedi.' };

  redirect(withToast('/profil/hesap', TOAST_KEYS.passwordUpdated));
}

// ---------------------------------------------------------------------------
// E-posta değiştirme — Supabase yeni adrese confirmation e-postası yollar,
// kullanıcı linke tıklayınca değişiklik tamamlanır. updateUser çağrısı
// sadece talebi başlatır.
// ---------------------------------------------------------------------------

const emailChangeSchema = z.object({
  newEmail: emailSchema,
});

export async function changeEmailAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();

  const parsed = emailChangeSchema.safeParse({ newEmail: formData.get('newEmail') });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (parsed.data.newEmail === user.email) {
    return { ok: false, fieldErrors: { newEmail: ['Bu zaten mevcut e-posta adresin'] } };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data.newEmail });
  if (error) {
    if (error.message?.includes('already')) {
      return { ok: false, fieldErrors: { newEmail: ['Bu e-posta başka bir hesapta kullanılıyor'] } };
    }
    return { ok: false, error: 'E-posta değişikliği başlatılamadı.' };
  }

  revalidatePath('/profil');
  redirect(withToast('/profil/hesap', TOAST_KEYS.emailChangeRequested));
}

// ---------------------------------------------------------------------------
// Hesap silme — KVKK gereği geri dönüşsüz. Onay kelimesi tip-to-confirm.
// auth.users delete cascade ile public.profiles ve diğer FK'leri temizler.
// ---------------------------------------------------------------------------

const deleteSchema = z.object({
  confirmation: z.literal('SİL', { message: '"SİL" yazmalısın' }),
});

export async function deleteAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await requireUser();

  const parsed = deleteSchema.safeParse({ confirmation: formData.get('confirmation') });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const admin = getServiceClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: 'Hesap silinemedi.' };

  // Session'ı temizle.
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect(withToast('/', TOAST_KEYS.accountDeleted));
}
