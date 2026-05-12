'use client';

import { useActionState, useState } from 'react';
import { Calendar, Clock, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBookingAction, type CreateBookingState } from '@/app/rezervasyon/[slug]/actions';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  dealId: string;
  unitPrice: number;
  maxPerUser: number;
  validUntilDate: string;
}

const INITIAL: CreateBookingState = null;

export function BookingForm({ dealId, unitPrice, maxPerUser, validUntilDate }: Props) {
  const [state, formAction, pending] = useActionState(createBookingAction, INITIAL);
  const [quantity, setQuantity] = useState(1);
  const total = unitPrice * quantity;
  const err = state?.fieldErrors;

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="dealId" value={dealId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quantity" className="inline-flex items-center gap-1.5">
          <Users className="size-4" aria-hidden="true" />
          Adet
        </Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxPerUser}
          step={1}
          required
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(maxPerUser, Number(e.target.value))))}
          aria-invalid={err?.quantity ? 'true' : undefined}
        />
        {err?.quantity ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.quantity[0]}</p>
        ) : (
          <p className="text-muted-foreground text-xs">En fazla {maxPerUser} adet alabilirsin.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="selected_date" className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden="true" />
            Tarih
          </Label>
          <Input
            id="selected_date"
            name="selected_date"
            type="date"
            min={todayIso}
            max={validUntilDate}
            required
            aria-invalid={err?.selected_date ? 'true' : undefined}
          />
          {err?.selected_date ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.selected_date[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="selected_time" className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            Saat (opsiyonel)
          </Label>
          <Input
            id="selected_time"
            name="selected_time"
            type="time"
            aria-invalid={err?.selected_time ? 'true' : undefined}
          />
          {err?.selected_time ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.selected_time[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes" className="inline-flex items-center gap-1.5">
          <MessageSquare className="size-4" aria-hidden="true" />
          Not (opsiyonel)
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Özel istek, alerji, ulaşım vb."
          className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[88px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border p-4">
        <span className="text-muted-foreground text-sm">Toplam tutar</span>
        <span className="text-2xl font-semibold">{formatTRY(total)}</span>
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
        {pending ? 'Rezervasyon oluşturuluyor…' : 'Rezervasyonu Tamamla'}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Bu sürüm <strong className="text-foreground">mock</strong> rezervasyondur — ödeme alınmaz.
        Onay kodun e-posta gibi davranır, demoda saklanır.
      </p>
    </form>
  );
}
