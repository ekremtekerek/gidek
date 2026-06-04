'use client';

import { useActionState, useState } from 'react';
import { CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmPaymentAction, type PaymentState } from '@/app/odeme/[code]/actions';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  bookingCode: string;
  total: number;
}

const INITIAL: PaymentState = null;

/**
 * Mock kart ödeme formu — gerçek tahsilat yapılmaz, kart bilgileri DB'ye
 * yazılmaz. Sadece UI smithcraft: 4'lü gruplama, AA / YY auto-slash, CVV
 * numerik. Submit → server action 1.2sn yapay gecikme + status confirm.
 */
export function PaymentForm({ bookingCode, total }: Props) {
  const [state, formAction, pending] = useActionState(confirmPaymentAction, INITIAL);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const err = state?.fieldErrors;

  return (
    <form
      action={formAction}
      className="border-border bg-background flex flex-col gap-5 rounded-xl border p-5 shadow-sm sm:p-6"
    >
      <input type="hidden" name="bookingCode" value={bookingCode} />

      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <CreditCard className="size-4" aria-hidden="true" />
          Kart bilgileri
        </h2>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
          <Lock className="size-3" aria-hidden="true" />
          256-bit SSL
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cardHolder">Kart üzerindeki isim</Label>
        <Input
          id="cardHolder"
          name="cardHolder"
          autoComplete="cc-name"
          placeholder="Ad Soyad"
          required
          minLength={2}
          maxLength={60}
          aria-invalid={err?.cardHolder ? 'true' : undefined}
        />
        {err?.cardHolder ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.cardHolder[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cardNumber">Kart numarası</Label>
        <Input
          id="cardNumber"
          name="cardNumber"
          autoComplete="cc-number"
          inputMode="numeric"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          required
          maxLength={23}
          aria-invalid={err?.cardNumber ? 'true' : undefined}
        />
        {err?.cardNumber ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.cardNumber[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiry">Son kullanım</Label>
          <Input
            id="expiry"
            name="expiry"
            autoComplete="cc-exp"
            inputMode="numeric"
            placeholder="AA / YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            required
            maxLength={7}
            aria-invalid={err?.expiry ? 'true' : undefined}
          />
          {err?.expiry ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.expiry[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            name="cvv"
            autoComplete="cc-csc"
            inputMode="numeric"
            placeholder="123"
            required
            maxLength={4}
            pattern="[0-9]{3,4}"
            aria-invalid={err?.cvv ? 'true' : undefined}
          />
          {err?.cvv ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.cvv[0]}</p>
          ) : null}
        </div>
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
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Ödeme işleniyor…
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" aria-hidden="true" />
            {formatTRY(total)} öde
          </>
        )}
      </Button>

      <p className="text-muted-foreground text-center text-[11px]">
        Kart bilgilerin 256-bit SSL ile şifrelenir ve saklanmaz.
      </p>
    </form>
  );
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}
