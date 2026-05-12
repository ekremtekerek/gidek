'use client';

import { useActionState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteSearchAction, type DeleteSearchState } from '@/app/profil/aramalar/actions';
import { cn } from '@/lib/utils/cn';

const INITIAL: DeleteSearchState = null;

export function DeleteSearchButton({ id }: { id: string }) {
  const [, formAction, pending] = useActionState(deleteSearchAction, INITIAL);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        aria-label="Aramayı sil"
        className={cn(
          'border-border bg-background hover:bg-muted text-muted-foreground hover:text-rose-600 inline-flex size-9 items-center justify-center rounded-md border transition-colors disabled:opacity-60',
        )}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 className="size-4" aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
