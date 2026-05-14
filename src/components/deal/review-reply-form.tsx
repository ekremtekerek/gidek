'use client';

import { useActionState, useEffect, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createReviewReplyAction,
  type ReviewReplyState,
} from '@/app/f/[slug]/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Props {
  reviewId: string;
  /** Anonim kullanıcı için login linki olsun mu — false ise "Cevap yaz" butonu gizlenir */
  authenticated: boolean;
  dealSlug: string;
}

/**
 * Toggle-açılır cevap formu — yorumun altında "Cevap yaz" butonu, basınca
 * textarea açılır. Anon kullanıcı için giriş linki gösterir.
 */
export function ReviewReplyForm({ reviewId, authenticated, dealSlug }: Props) {
  const [state, formAction, pending] = useActionState<ReviewReplyState, FormData>(
    createReviewReplyAction,
    null,
  );
  const [open, setOpen] = useState(false);
  const [bodyLen, setBodyLen] = useState(0);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success('Cevabın yayında.');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      setBodyLen(0);
    } else {
      toast.error(state.error);
    }
  }, [state]);

  if (!authenticated) {
    return (
      <a
        href={`/giris?next=/f/${dealSlug}#yorumlar`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
      >
        <MessageCircle className="size-3" aria-hidden="true" />
        Cevap yazmak için giriş yap
      </a>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
      >
        <MessageCircle className="size-3" aria-hidden="true" />
        Cevap yaz
      </button>
    );
  }

  return (
    <form action={formAction} className="border-border bg-muted/30 mt-2 flex flex-col gap-2 rounded-lg border p-3">
      <input type="hidden" name="reviewId" value={reviewId} />
      <textarea
        name="body"
        rows={2}
        minLength={2}
        maxLength={500}
        autoFocus
        required
        placeholder="Cevabını yaz…"
        onChange={(e) => setBodyLen(e.target.value.length)}
        className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[64px] w-full rounded-md border p-2.5 text-sm transition-colors focus:ring-2 focus:outline-none"
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'text-[10px] tabular-nums',
            bodyLen > 450 ? 'text-amber-600' : 'text-muted-foreground',
          )}
        >
          {bodyLen} / 500
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setBodyLen(0);
            }}
            aria-label="Vazgeç"
            className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-md"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending || bodyLen < 2}
            className="gap-1.5"
          >
            {pending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Gönderiliyor…
              </>
            ) : (
              <>
                <Send className="size-3.5" aria-hidden="true" />
                Cevapla
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
