'use client';

import { useActionState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteCouponAction,
  toggleCouponActiveAction,
} from '@/app/admin/coupons/actions';

export function CouponRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleCouponActiveAction,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCouponAction, null);

  useEffect(() => {
    if (toggleState && !toggleState.ok) toast.error(toggleState.error);
  }, [toggleState]);
  useEffect(() => {
    if (deleteState && !deleteState.ok) toast.error(deleteState.error);
    else if (deleteState && deleteState.ok) toast.success('Kupon silindi.');
  }, [deleteState]);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <form action={toggleAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={togglePending}
          aria-label={isActive ? 'Pasifleştir' : 'Aktifleştir'}
          title={isActive ? 'Pasifleştir' : 'Aktifleştir'}
          className="border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-60"
        >
          {togglePending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : isActive ? (
            <EyeOff className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {isActive ? 'Pasifleştir' : 'Aktifleştir'}
        </button>
      </form>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!window.confirm('Bu kuponu silmek istediğine emin misin?')) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={deletePending}
          aria-label="Sil"
          title="Sil"
          className="border-border bg-background hover:border-rose-500 hover:text-rose-600 text-muted-foreground inline-flex size-8 items-center justify-center rounded-md border transition-colors disabled:opacity-60"
        >
          {deletePending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
