'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { signUpSchema } from '@/lib/security/validators';

export type SignUpState = {
  ok: boolean;
  fieldErrors?: { email?: string[]; password?: string[]; displayName?: string[] };
  error?: string;
  emailConfirmation?: boolean;
} | null;

function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await getServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.displayName
        ? { display_name: parsed.data.displayName }
        : undefined,
    },
  });

  if (error) {
    const isDuplicate = /already registered|already exists/i.test(error.message);
    return {
      ok: false,
      error: isDuplicate
        ? 'Bu e-posta ile kayıtlı bir hesap var. Giriş yapmayı dene.'
        : 'Kayıt sırasında bir sorun oluştu. Lütfen tekrar dene.',
    };
  }

  // If email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { ok: true, emailConfirmation: true };
  }

  revalidatePath('/', 'layout');
  redirect(safeNext(formData.get('next')));
}
