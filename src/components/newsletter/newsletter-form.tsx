'use client';

import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  subscribeNewsletterAction,
  type NewsletterFormState,
} from '@/app/newsletter/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  source?: string;
}

/**
 * Footer'da kullanıcı email yakalama formu. Server action upsert; aynı email
 * yeniden yazılsa toast "Zaten abonesin" demez (idempotent başarılı görünür).
 * V1'de gönderim yok — sadece toplama.
 */
export function NewsletterForm({ source = 'footer' }: Props) {
  const [state, formAction, pending] = useActionState<NewsletterFormState, FormData>(
    subscribeNewsletterAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success('Listeye eklendin — haftada bir öne çıkanları yollayacağız.');
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:gap-2">
      <input type="hidden" name="source" value={source} />
      <label htmlFor="newsletter-email" className="sr-only">
        E-posta
      </label>
      <Input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="e-posta adresin"
        autoComplete="email"
        disabled={pending}
        className="flex-1 bg-background"
      />
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={pending}
        className="shrink-0"
      >
        {pending ? 'Yazılıyor…' : 'Abone ol'}
      </Button>
    </form>
  );
}
