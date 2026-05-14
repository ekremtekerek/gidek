'use client';

import { useState, useTransition } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { extendBookingAction } from '@/app/rezervasyonlarim/[code]/actions';
import { Button } from '@/components/ui/button';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  bookingId: string;
  currentQuantity: number;
  unitPrice: number;
  maxPerUser: number;
}

/**
 * Mevcut rezervasyona +1 kişi ekleme butonu. Confirm modal ile öder bedelini
 * gösterip kullanıcının onayını alır.
 */
export function ExtendButton({
  bookingId,
  currentQuantity,
  unitPrice,
  maxPerUser,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (currentQuantity >= maxPerUser) {
    return null;
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await extendBookingAction(bookingId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Bu rezervasyona +1 kişi ekle
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="extend-title"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Kapat"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
          />
          <div className="bg-background relative w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <Plus className="size-5" aria-hidden="true" />
            </div>
            <h2 id="extend-title" className="text-lg font-semibold tracking-tight">
              +1 kişi eklensin mi?
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Mevcut <strong className="text-foreground">{currentQuantity}</strong> kişilik
              rezervasyonun <strong className="text-foreground">{currentQuantity + 1}</strong>{' '}
              kişiliğe çıkacak.
            </p>

            <div className="border-border bg-muted/30 mt-4 flex items-center justify-between rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">Ek tutar</span>
              <span className="font-semibold tabular-nums">+{formatTRY(unitPrice)}</span>
            </div>

            {error ? (
              <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1"
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1"
              >
                {pending ? 'Ekleniyor…' : 'Onayla'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
