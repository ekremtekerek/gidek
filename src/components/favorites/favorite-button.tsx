'use client';

import { useEffect, useOptimistic, useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { toggleFavoriteAction } from '@/app/favorilerim/actions';
import { Button } from '@/components/ui/button';

interface Props {
  dealId: string;
  /**
   * SSR/ISR'da auth state bilinmeyebilir (statik render). Belirtilmezse
   * component mount'ta /api/favorites/check ile mevcut durumu öğrenir.
   */
  initialFavorited?: boolean;
}

export function FavoriteButton({ dealId, initialFavorited = false }: Props) {
  const [optimisticFavorited, setOptimisticFavorited] = useOptimistic(
    initialFavorited,
    (_current, next: boolean) => next,
  );
  const [serverFavorited, setServerFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  // Static/ISR render edilen sayfa anon olarak gönderilir; mount'ta gerçek
  // durumu çek. AbortController route değişimlerinde stale set'i engeller.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/favorites/check?id=${encodeURIComponent(dealId)}`, {
      signal: ctrl.signal,
      credentials: 'same-origin',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.favorited === 'boolean') {
          setServerFavorited(data.favorited);
        }
      })
      .catch(() => {
        /* ignore — anon kullanıcı / network hatası */
      });
    return () => ctrl.abort();
  }, [dealId]);

  // serverFavorited değişince optimistic state'i de senkronla (mount fetch'i
  // sonrası gerçek durumu yansıt).
  const displayed = pending ? optimisticFavorited : serverFavorited;

  function onClick() {
    const next = !displayed;
    startTransition(async () => {
      setOptimisticFavorited(next);
      const result = await toggleFavoriteAction(dealId);
      if ('error' in result) {
        setOptimisticFavorited(!next);
        toast.error(result.error);
        return;
      }
      setServerFavorited(result.favorited);
      if (result.favorited) {
        toast.success('Favorilere eklendi');
      } else {
        toast('Favorilerden çıkarıldı');
      }
    });
  }

  return (
    <Button
      type="button"
      variant={displayed ? 'primary' : 'outline'}
      size="md"
      full
      onClick={onClick}
      disabled={pending}
      aria-pressed={displayed}
    >
      <Heart
        className="size-4"
        fill={displayed ? 'currentColor' : 'transparent'}
        aria-hidden="true"
      />
      {displayed ? 'Favorilerden çıkar' : 'Favorilere ekle'}
    </Button>
  );
}
