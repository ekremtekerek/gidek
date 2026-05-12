'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import {
  requestPasswordResetAction,
  type ResetRequestState,
} from '@/app/sifre-sifirla/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INITIAL: ResetRequestState = null;

export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, INITIAL);

  if (state?.ok) {
    return (
      <div
        role="status"
        className="border-emerald-500/30 bg-emerald-500/10 flex flex-col items-center gap-3 rounded-lg border p-6 text-center"
      >
        <CheckCircle2
          className="text-emerald-600 dark:text-emerald-400 size-8"
          aria-hidden="true"
        />
        <p className="font-medium">E-postanı kontrol et</p>
        <p className="text-muted-foreground text-sm">
          Hesap mevcutsa, şifreni yenilemek için sana bir bağlantı gönderdik. Birkaç dakika içinde
          gelmezse spam klasörüne de bakmayı unutma.
        </p>
        <Link
          href="/giris"
          className="text-foreground mt-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="sen@ornek.com"
          aria-invalid={state?.fieldErrors?.email ? 'true' : undefined}
        />
        {state?.fieldErrors?.email ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      {state && !state.ok && state.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" full disabled={pending}>
        {pending ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Hatırladın mı?{' '}
        <Link
          href="/giris"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Girişe dön
        </Link>
      </p>
    </form>
  );
}
