'use server';

import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { emailSchema } from '@/lib/security/validators';
import { SITE } from '@/lib/utils/site-config';

const requestSchema = z.object({ email: emailSchema });

export type ResetRequestState =
  | { ok: true }
  | { ok: false; fieldErrors?: { email?: string[] }; error?: string }
  | null;

/**
 * Always returns `ok: true` if input parses — never reveal whether an
 * account exists for the given e-mail (account enumeration defense).
 * Real failure inside Supabase is silently logged server-side.
 */
export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = requestSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as { email?: string[] },
    };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE.url}/sifre-yenile`,
  });
  if (error) {
    console.error('resetPasswordForEmail failed:', error);
  }

  return { ok: true };
}
