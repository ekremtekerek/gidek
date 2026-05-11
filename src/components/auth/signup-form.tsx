'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUpAction, type SignUpState } from '@/app/kayit/actions';

interface Props {
  next?: string;
}

const INITIAL: SignUpState = null;

export function SignUpForm({ next }: Props) {
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL);

  if (state?.ok && state.emailConfirmation) {
    return (
      <div
        role="status"
        className="border-emerald-500/30 bg-emerald-500/10 flex flex-col items-center gap-3 rounded-lg border p-6 text-center"
      >
        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 size-8" aria-hidden="true" />
        <p className="font-medium">E-postanı kontrol et</p>
        <p className="text-muted-foreground text-sm">
          Hesabını onaylamak için sana bir doğrulama bağlantısı gönderdik.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? '/'} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">İsim (opsiyonel)</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={50}
          placeholder="Ne diye seslenelim?"
          aria-invalid={state?.fieldErrors?.displayName ? 'true' : undefined}
          aria-describedby={state?.fieldErrors?.displayName ? 'name-error' : undefined}
        />
        {state?.fieldErrors?.displayName ? (
          <p id="name-error" className="text-sm text-rose-600 dark:text-rose-400">
            {state.fieldErrors.displayName[0]}
          </p>
        ) : null}
      </div>

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
          aria-describedby={state?.fieldErrors?.email ? 'email-error' : undefined}
        />
        {state?.fieldErrors?.email ? (
          <p id="email-error" className="text-sm text-rose-600 dark:text-rose-400">
            {state.fieldErrors.email[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="En az 8 karakter"
          aria-invalid={state?.fieldErrors?.password ? 'true' : undefined}
          aria-describedby={state?.fieldErrors?.password ? 'password-error' : undefined}
        />
        {state?.fieldErrors?.password ? (
          <p id="password-error" className="text-sm text-rose-600 dark:text-rose-400">
            {state.fieldErrors.password[0]}
          </p>
        ) : null}
      </div>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" full disabled={pending}>
        {pending ? 'Hesap oluşturuluyor…' : 'Üye ol'}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Üye olarak{' '}
        <Link
          href="/yasal/kullanim-kosullari"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Kullanım Koşulları
        </Link>
        {' '}ve{' '}
        <Link href="/yasal/gizlilik" className="text-foreground underline-offset-4 hover:underline">
          Gizlilik Politikası
        </Link>
        {' '}kabul edilmiş sayılır.
      </p>

      <p className="text-muted-foreground text-center text-sm">
        Hesabın var mı?{' '}
        <Link href="/giris" className="text-foreground font-medium underline-offset-4 hover:underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
