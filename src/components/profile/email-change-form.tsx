'use client';

import { useActionState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { changeEmailAction, type AccountActionState } from '@/app/profil/hesap/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EmailChangeForm({ currentEmail }: { currentEmail: string | null }) {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(
    changeEmailAction,
    null,
  );
  const err = state && 'fieldErrors' in state ? state.fieldErrors : undefined;
  const topError = state && !state.ok ? state.error : undefined;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="border-border bg-muted/30 rounded-md border p-3 text-sm">
        <span className="text-muted-foreground text-xs">Mevcut e-posta</span>
        <p className="mt-0.5 truncate font-medium">{currentEmail ?? '—'}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newEmail">Yeni e-posta</Label>
        <Input
          id="newEmail"
          name="newEmail"
          type="email"
          autoComplete="email"
          required
          aria-invalid={err?.newEmail ? 'true' : undefined}
        />
        {err?.newEmail ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.newEmail[0]}</p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          Yeni adresine bir onay bağlantısı yollayacağız. Linke tıklayana kadar
          giriş yine eski adresle yapılır.
        </p>
      </div>

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
          <Mail className="size-4" aria-hidden="true" />
        )}
        Onay e-postası gönder
      </Button>
    </form>
  );
}
