'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signInAction, type SignInState } from '@/app/giris/actions';

interface Props {
  next?: string;
}

const INITIAL: SignInState = null;

export function SignInForm({ next }: Props) {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next ?? '/'} />

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
          autoComplete="current-password"
          required
          placeholder="••••••••"
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
        {pending ? 'Giriş yapılıyor…' : 'Giriş yap'}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Hesabın yok mu?{' '}
        <Link href="/kayit" className="text-foreground font-medium underline-offset-4 hover:underline">
          Hemen üye ol
        </Link>
      </p>
    </form>
  );
}
