'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  updatePasswordAction,
  type UpdatePasswordState,
} from '@/app/sifre-yenile/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/hooks/use-user';

const INITIAL: UpdatePasswordState = null;

export function ResetPasswordForm() {
  const { user, loading } = useUser();
  const [state, formAction, pending] = useActionState(updatePasswordAction, INITIAL);

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="bg-muted h-11 w-full animate-pulse rounded-md" />
        <div className="bg-muted h-11 w-full animate-pulse rounded-md" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        role="alert"
        className="border-amber-500/30 bg-amber-500/10 flex flex-col items-center gap-3 rounded-lg border p-6 text-center"
      >
        <ShieldAlert
          className="size-7 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <p className="font-medium">Bağlantı geçersiz veya süresi dolmuş</p>
        <p className="text-muted-foreground text-sm">
          Lütfen yeni bir sıfırlama bağlantısı talep et.
        </p>
        <Link
          href="/sifre-sifirla"
          className="text-foreground mt-2 text-sm font-medium underline-offset-4 hover:underline"
        >
          Yeni bağlantı al
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-4" noValidate>
      <p className="text-muted-foreground text-sm">
        Hesap: <span className="text-foreground font-medium">{user.email}</span>
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Yeni şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="En az 8 karakter"
          aria-invalid={state?.fieldErrors?.password ? 'true' : undefined}
        />
        {state?.fieldErrors?.password ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">
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
        {pending ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
      </Button>
    </form>
  );
}
