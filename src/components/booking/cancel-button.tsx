'use client';

import { useState, useTransition } from 'react';
import { X } from 'lucide-react';
import { cancelBookingAction } from '@/app/rezervasyonlarim/[code]/actions';
import { Button } from '@/components/ui/button';

interface Props {
  bookingId: string;
}

export function CancelButton({ bookingId }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function onCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={() => setConfirming(true)}
        disabled={pending}
      >
        <X className="size-4" aria-hidden="true" />
        Rezervasyonu iptal et
      </Button>
    );
  }

  return (
    <div className="border-rose-500/30 bg-rose-500/10 flex flex-col gap-3 rounded-lg border p-4">
      <p className="text-sm font-medium">Rezervasyonu iptal etmek istediğine emin misin?</p>
      <p className="text-muted-foreground text-xs">Bu işlem geri alınamaz.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onCancel}
          disabled={pending}
          className="sm:flex-1"
        >
          {pending ? 'İptal ediliyor…' : 'Evet, iptal et'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="sm:flex-1"
        >
          Vazgeç
        </Button>
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
