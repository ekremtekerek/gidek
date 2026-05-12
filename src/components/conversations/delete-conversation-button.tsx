'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

export function DeleteConversationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function onClick() {
    if (busy) return;
    setBusy(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
        if (!res.ok && res.status !== 204) throw new Error('failed');
        toast.success('Sohbet silindi');
        router.refresh();
      } catch {
        toast.error('Silinemedi');
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending || busy}
      aria-label="Sohbeti sil"
      className={cn(
        'border-border bg-background hover:bg-muted text-muted-foreground hover:text-rose-600 inline-flex size-9 items-center justify-center rounded-md border transition-colors disabled:opacity-60',
      )}
    >
      {pending || busy ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
