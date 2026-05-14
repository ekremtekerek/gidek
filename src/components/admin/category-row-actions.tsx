'use client';

import { useActionState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteCategoryAction,
  toggleCategoryActiveAction,
} from '@/app/admin/categories/actions';

export function CategoryRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const [toggleState, toggleAction, togglePending] = useActionState(
    toggleCategoryActiveAction,
    null,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategoryAction,
    null,
  );

  useEffect(() => {
    if (toggleState && !toggleState.ok) toast.error(toggleState.error);
  }, [toggleState]);

  useEffect(() => {
    if (deleteState && !deleteState.ok) toast.error(deleteState.error);
    else if (deleteState && deleteState.ok) toast.success('Kategori silindi.');
  }, [deleteState]);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <form action={toggleAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={togglePending}
          aria-label={isActive ? 'Gizle' : 'Göster'}
          title={isActive ? 'Gizle' : 'Göster'}
          className="border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors disabled:opacity-60"
        >
          {togglePending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : isActive ? (
            <EyeOff className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {isActive ? 'Gizle' : 'Göster'}
        </button>
      </form>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!window.confirm('Bu kategoriyi kalıcı olarak silmek istediğine emin misin?')) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={deletePending}
          aria-label="Sil"
          title="Kalıcı sil"
          className="border-border bg-background hover:border-rose-500 hover:text-rose-600 text-muted-foreground inline-flex size-8 items-center justify-center rounded-md border transition-colors disabled:opacity-60"
        >
          {deletePending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
}
