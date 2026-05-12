'use client';

import { useActionState } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { saveSearchAction, type SaveSearchState } from '@/app/profil/aramalar/actions';
import { cn } from '@/lib/utils/cn';

interface Props {
  query: string;
  /** Auth değilse buton görüntülemeyiz; parent kontrol etmeli. */
  disabled?: boolean;
}

const INITIAL: SaveSearchState = null;

/**
 * Chat'in son sorgusunu kaydeden tek-tık buton. Server action sonrası
 * /profil/aramalar'a yönlendirir, toast'la onaylar.
 */
export function SaveSearchButton({ query, disabled }: Props) {
  const [, formAction, pending] = useActionState(saveSearchAction, INITIAL);

  return (
    <form action={formAction}>
      <input type="hidden" name="query" value={query} />
      <button
        type="submit"
        disabled={disabled || pending || !query}
        aria-label="Bu aramayı kaydet"
        className={cn(
          'border-border bg-background hover:border-foreground/40 hover:bg-muted inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors disabled:opacity-50',
        )}
      >
        {pending ? (
          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        ) : (
          <Bookmark className="size-3" aria-hidden="true" />
        )}
        Kaydet
      </button>
    </form>
  );
}
