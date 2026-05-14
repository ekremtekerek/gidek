'use client';

import { useActionState, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Receipt, Save, XOctagon } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminCancelBookingAction,
  adminMarkRefundedAction,
  adminMarkUsedAction,
  updateAdminNotesAction,
  type AdminBookingState,
} from '@/app/admin/bookings/actions';
import { Button } from '@/components/ui/button';

interface Props {
  bookingCode: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'used';
  refundedAt: string | null;
  adminNotes: string | null;
}

export function BookingAdminActions({ bookingCode, status, refundedAt, adminNotes }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <ActionRow>
        {status === 'pending' || status === 'confirmed' ? (
          <CancelForm bookingCode={bookingCode} />
        ) : null}
        {status === 'confirmed' ? <MarkUsedForm bookingCode={bookingCode} /> : null}
        {status === 'cancelled' && !refundedAt ? (
          <MarkRefundedForm bookingCode={bookingCode} />
        ) : null}
      </ActionRow>

      <NotesForm bookingCode={bookingCode} initial={adminNotes} />
    </div>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-stretch gap-3">{children}</div>;
}

function useActionToast(state: AdminBookingState) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? 'İşlem tamamlandı.');
    else toast.error(state.error);
  }, [state]);
}

function CancelForm({ bookingCode }: { bookingCode: string }) {
  const [state, action, pending] = useActionState(adminCancelBookingAction, null);
  const [showNote, setShowNote] = useState(false);
  useActionToast(state);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm('Bu rezervasyonu iptal etmek istediğine emin misin?')) {
          e.preventDefault();
        }
      }}
      className="border-rose-500/30 bg-rose-500/5 flex w-full flex-col gap-2 rounded-md border p-3 sm:w-auto"
    >
      <input type="hidden" name="code" value={bookingCode} />
      {showNote ? (
        <textarea
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="İptal nedeni (opsiyonel)…"
          className="border-border bg-background min-h-[44px] w-full rounded-md border p-2 text-xs"
        />
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowNote((v) => !v)}
          className="text-muted-foreground hover:text-foreground text-[11px] underline-offset-2 hover:underline"
        >
          {showNote ? 'Notu gizle' : 'Not ekle'}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-rose-600 text-white hover:bg-rose-700 ms-auto inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <XOctagon className="size-3.5" aria-hidden="true" />
          )}
          Rezervasyonu iptal et
        </button>
      </div>
    </form>
  );
}

function MarkUsedForm({ bookingCode }: { bookingCode: string }) {
  const [state, action, pending] = useActionState(adminMarkUsedAction, null);
  useActionToast(state);
  return (
    <form action={action}>
      <input type="hidden" name="code" value={bookingCode} />
      <Button type="submit" variant="primary" size="sm" disabled={pending} className="gap-1.5">
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
        )}
        Kullanıldı işaretle
      </Button>
    </form>
  );
}

function MarkRefundedForm({ bookingCode }: { bookingCode: string }) {
  const [state, action, pending] = useActionState(adminMarkRefundedAction, null);
  useActionToast(state);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm('İadeyi tamamladığını işaretleyeyim mi? (V1 mock — sadece etiket)')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="code" value={bookingCode} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} className="gap-1.5">
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Receipt className="size-3.5" aria-hidden="true" />
        )}
        İadeyi işaretle
      </Button>
    </form>
  );
}

function NotesForm({
  bookingCode,
  initial,
}: {
  bookingCode: string;
  initial: string | null;
}) {
  const [state, action, pending] = useActionState(updateAdminNotesAction, null);
  useActionToast(state);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="code" value={bookingCode} />
      <label htmlFor="admin_notes" className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
        Operasyon notu
      </label>
      <textarea
        id="admin_notes"
        name="admin_notes"
        rows={3}
        maxLength={1000}
        defaultValue={initial ?? ''}
        placeholder="İç ekibe bırakılan not (müşteri görmez)…"
        className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 min-h-[80px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
      />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        className="self-end gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="size-3.5" aria-hidden="true" />
        )}
        Notu kaydet
      </Button>
    </form>
  );
}
