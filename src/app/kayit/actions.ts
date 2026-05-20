'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { signUpSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

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

  // If the Supabase project has email confirmation enabled, signUp returns no
  // session. For V1 we skip email verification entirely: confirm the user
  // server-side (service role) and sign them in so signup === instant login.
  if (!data.session) {
    if (data.user) {
      try {
        await getServiceClient().auth.admin.updateUserById(data.user.id, {
          email_confirm: true,
        });
      } catch {
        // Confirmation failed (e.g. obfuscated duplicate-email response).
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    // Could not auto-confirm/sign in — fall back to the email-check screen.
    if (signInError) {
      return { ok: true, emailConfirmation: true };
    }
  }

  revalidatePath('/', 'layout');
  // New signups go to onboarding by default; an explicit `next` overrides.
  const next = formData.get('next');
  const target =
    next && typeof next === 'string' && next !== '/' ? safeNext(next) : '/onboarding';
  redirect(withToast(target, TOAST_KEYS.signupSuccess));
}
