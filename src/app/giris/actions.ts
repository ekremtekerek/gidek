'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { signInSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export type SignInState = {
  ok: boolean;
  fieldErrors?: { email?: string[]; password?: string[] };
  error?: string;
} | null;

function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/';
  // Prevent open-redirect: only allow same-origin paths
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

/** Map a Supabase auth error to a specific, user-facing Turkish message. */
function signInErrorMessage(error: { code?: string; status?: number }): string {
  switch (error.code) {
    case 'email_not_confirmed':
      return 'E-posta adresin henüz onaylanmamış. Gelen kutunu kontrol et.';
    case 'user_banned':
      return 'Bu hesap askıya alınmış. Destek ile iletişime geç.';
    case 'over_request_rate_limit':
      return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar dene.';
  }
  if (error.status === 429) {
    return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar dene.';
  }
  return 'E-posta veya şifre yanlış.';
}

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: signInErrorMessage(error) };
  }

  revalidatePath('/', 'layout');
  redirect(withToast(safeNext(formData.get('next')), TOAST_KEYS.loginSuccess));
}
