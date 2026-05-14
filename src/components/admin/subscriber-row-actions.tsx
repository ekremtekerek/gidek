'use client';

import { useActionState, useEffect } from 'react';
import { Loader2, MailX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteSubscriberAction,
  unsubscribeFromAdminAction,
} from '@/app/admin/newsletter/actions';

export function SubscriberRowActions({ id, unsubscribed }: { id: number; unsubscribed: boolean }) {
  const [unsubState, unsubAction, unsubPending] = useActionState(
    unsubscribeFromAdminAction,
    null,
  );
  const [delState, delAction, delPending] = useActionState(deleteSubscriberAction, null);

  useEffect(() => {
    if (!unsubState) return;
    if (!unsubState.ok) toast.error(unsubState.error);
    else toast.success('Abonelik durduruldu.');
  }, [unsubState]);
  useEffect(() => {
    if (!delState) return;
    if (!delState.ok) toast.error(delState.error);
    else toast.success('Kayıt silindi.');
  }, [delState]);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {!unsubscribed ? (
        <form action={unsubAction}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={unsubPending}
            aria-label="Aboneliği durdur"
            title="Aboneliği durdur"
            className="border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-60"
          >
            {unsubPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <MailX className="size-3.5" aria-hidden="true" />
            )}
            Durdur
          </button>
        </form>
      ) : null}

      <form
        action={delAction}
        onSubmit={(e) => {
          if (!window.confirm('Bu kaydı silmek istediğine emin misin?')) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={delPending}
          aria-label="Sil"
          title="Sil"
          className="border-border bg-background hover:border-rose-500 hover:text-rose-600 text-muted-foreground inline-flex size-8 items-center justify-center rounded-md border transition-colors disabled:opacity-60"
        >
          {delPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
