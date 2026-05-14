'use client';

import { useActionState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import { changePasswordAction, type AccountActionState } from '@/app/profil/hesap/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(
    changePasswordAction,
    null,
  );
  const err = state && 'fieldErrors' in state ? state.fieldErrors : undefined;
  const topError = state && !state.ok ? state.error : undefined;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        label="Mevcut şifre"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={err?.currentPassword}
      />
      <Field
        label="Yeni şifre"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={err?.newPassword}
      />
      <Field
        label="Yeni şifre (tekrar)"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={err?.confirmPassword}
      />
      {topError ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {topError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" size="md" disabled={pending} className="self-start gap-2">
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <KeyRound className="size-4" aria-hidden="true" />
        )}
        Şifreyi güncelle
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  ...rest
}: {
  label: string;
  name: string;
  error?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={error ? 'true' : undefined} {...rest} />
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error[0]}</p> : null}
    </div>
  );
}
