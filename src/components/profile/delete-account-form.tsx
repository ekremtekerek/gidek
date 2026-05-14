'use client';

import { useActionState, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteAccountAction, type AccountActionState } from '@/app/profil/hesap/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<AccountActionState, FormData>(
    deleteAccountAction,
    null,
  );
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const err = state && 'fieldErrors' in state ? state.fieldErrors : undefined;
  const topError = state && !state.ok ? state.error : undefined;

  return (
    <div className="border-rose-500/30 bg-rose-500/5 flex flex-col gap-4 rounded-xl border p-5">
      <header className="flex items-start gap-3">
        <AlertTriangle className="size-5 shrink-0 text-rose-600" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">Hesabımı sil</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Bu işlem geri alınamaz. Profilin, favorilerin, AI sohbet geçmişin ve
            kaydedilmiş aramaların kalıcı olarak silinir. Geçmiş rezervasyon
            kayıtların kişisel bilgiden arındırılarak operasyon kaydı olarak
            tutulur.
          </p>
        </div>
      </header>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start inline-flex h-10 items-center gap-2 rounded-md border border-rose-500/50 bg-background px-4 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/10 dark:text-rose-300"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Hesabımı silmek istiyorum
        </button>
      ) : (
        <form action={action} className="flex flex-col gap-3" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmation">
              Onaylamak için aşağıya <strong>SİL</strong> yaz
            </Label>
            <Input
              id="confirmation"
              name="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
              autoComplete="off"
              aria-invalid={err?.confirmation ? 'true' : undefined}
              required
            />
            {err?.confirmation ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.confirmation[0]}</p>
            ) : null}
          </div>

          {topError ? (
            <p
              role="alert"
              className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
            >
              {topError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending || confirmation !== 'SİL'}
              className="bg-rose-600 text-white hover:bg-rose-700 inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              Hesabı kalıcı olarak sil
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmation('');
              }}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              İptal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
