'use client';

import { useActionState, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  applyCouponAction,
  removeCouponAction,
  type CouponState,
} from '@/app/odeme/[code]/actions';

interface Props {
  bookingCode: string;
  /** Mevcut uygulanmış kupon kodu (varsa). */
  appliedCode: string | null;
}

/**
 * Ödeme sayfası kupon alanı. Hiç kupon yoksa collapsed "Promo kod ekle"
 * link'i, açılınca input + Uygula butonu. Uygulanmış kupon varsa kodu
 * gösterip "Kaldır" butonu sunar. revalidatePath ile total recalculate edilir.
 */
export function CouponInput({ bookingCode, appliedCode }: Props) {
  const [applyState, applyAction, applyPending] = useActionState<CouponState, FormData>(
    applyCouponAction,
    null,
  );
  const [removeState, removeAction, removePending] = useActionState<CouponState, FormData>(
    removeCouponAction,
    null,
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!applyState) return;
    if (applyState.ok) {
      toast.success(applyState.message ?? 'Kupon uygulandı.');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    } else {
      toast.error(applyState.error);
    }
  }, [applyState]);

  useEffect(() => {
    if (!removeState) return;
    if (removeState.ok) toast.success(removeState.message ?? 'Kupon kaldırıldı.');
    else toast.error(removeState.error);
  }, [removeState]);

  // Kupon uygulanmış görünüm — kod + kaldır
  if (appliedCode) {
    return (
      <div className="border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Uygulanmış kupon</p>
          <p className="font-mono text-sm font-semibold tracking-wider">{appliedCode}</p>
        </div>
        <form action={removeAction}>
          <input type="hidden" name="bookingCode" value={bookingCode} />
          <button
            type="submit"
            disabled={removePending}
            aria-label="Kuponu kaldır"
            title="Kuponu kaldır"
            className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-60"
          >
            {removePending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <X className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </form>
      </div>
    );
  }

  // Collapsed durum — "Promo kod ekle" link'i
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-foreground inline-flex items-center gap-1.5 self-start text-sm font-medium underline-offset-2 hover:underline"
      >
        <Tag className="size-4" aria-hidden="true" />
        Promo kodun var mı?
      </button>
    );
  }

  // Açılmış input
  return (
    <form action={applyAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="bookingCode" value={bookingCode} />
      <div className="flex items-stretch gap-2">
        <input
          name="code"
          type="text"
          maxLength={40}
          required
          autoFocus
          placeholder="HOSGELDIN10"
          autoComplete="off"
          autoCapitalize="characters"
          className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-10 w-full rounded-md border px-3 text-sm uppercase tracking-wider transition-colors focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={applyPending}
          className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md px-4 text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {applyPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            'Uygula'
          )}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-muted-foreground hover:text-foreground self-start text-[11px] underline-offset-2 hover:underline"
      >
        Vazgeç
      </button>
    </form>
  );
}
