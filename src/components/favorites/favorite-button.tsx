'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { toggleFavoriteAction } from '@/app/favorilerim/actions';
import { Button } from '@/components/ui/button';

interface Props {
  dealId: string;
  initialFavorited: boolean;
}

export function FavoriteButton({ dealId, initialFavorited }: Props) {
  const [optimisticFavorited, setOptimisticFavorited] = useOptimistic(
    initialFavorited,
    (_current, next: boolean) => next,
  );
  const [pending, startTransition] = useTransition();

  function onClick() {
    const next = !optimisticFavorited;
    startTransition(async () => {
      setOptimisticFavorited(next);
      const result = await toggleFavoriteAction(dealId);
      if ('error' in result) {
        setOptimisticFavorited(!next);
        toast.error(result.error);
        return;
      }
      if (result.favorited !== next) {
        setOptimisticFavorited(result.favorited);
      }
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
      variant={optimisticFavorited ? 'primary' : 'outline'}
      size="md"
      full
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimisticFavorited}
    >
      <Heart
        className="size-4"
        fill={optimisticFavorited ? 'currentColor' : 'transparent'}
        aria-hidden="true"
      />
      {optimisticFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
    </Button>
  );
}
