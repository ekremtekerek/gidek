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
    return { ok: false, error: 'E-posta veya şifre yanlış.' };
  }

  revalidatePath('/', 'layout');
  redirect(withToast(safeNext(formData.get('next')), TOAST_KEYS.loginSuccess));
}
