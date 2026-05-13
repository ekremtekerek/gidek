'use server';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta yaz.').max(180),
  source: z.string().trim().min(1).max(40).default('footer'),
});

export type NewsletterFormState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

export async function subscribeNewsletterAction(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const parsed = emailSchema.safeParse({
    email: formData.get('email'),
    source: formData.get('source') ?? 'footer',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz e-posta.' };
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('newsletter_subscribers').upsert(
    {
      email: parsed.data.email,
      source: parsed.data.source,
      // Daha önce abone olmuşsa unsubscribed'ı sıfırla.
      unsubscribed_at: null,
    },
    { onConflict: 'email' },
  );
  if (error) {
    console.error('newsletter subscribe failed:', error);
    return { ok: false, error: 'Kaydedilemedi, sonra tekrar dener misin?' };
  }
  return { ok: true };
}
