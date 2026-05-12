'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { passwordSchema } from '@/lib/security/validators';

const updateSchema = z.object({ password: passwordSchema });

export type UpdatePasswordState =
  | { ok: false; fieldErrors?: { password?: string[] }; error?: string }
  | null;

export async function updatePasswordAction(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = updateSchema.safeParse({ password: formData.get('password') });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as { password?: string[] },
    };
  }

  const supabase = await getServerClient();

  // updateUser requires an active session — for recovery flow the browser
  // client establishes one from the magic-link hash on /sifre-yenile load.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: 'Oturum bulunamadı. Sıfırlama bağlantısının süresi dolmuş olabilir.',
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: 'Şifre güncellenemedi. Lütfen tekrar dene.' };
  }

  revalidatePath('/', 'layout');
  redirect('/profil');
}
