'use client';

import { useOptimistic, useTransition } from 'react';
import { Heart } from 'lucide-react';
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
      // If the server disagrees, rollback by reading the truth from the
      // returned value. revalidatePath will refresh the page-level prop too.
      if ('error' in result) {
        setOptimisticFavorited(!next);
      } else if (result.favorited !== next) {
        setOptimisticFavorited(result.favorited);
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
