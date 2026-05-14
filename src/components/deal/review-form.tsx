'use client';

import { useActionState, useEffect, useState } from 'react';
import { Loader2, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import { createReviewAction, type ReviewState } from '@/app/f/[slug]/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Props {
  dealId: string;
  defaultName: string;
}

const MIN_BODY = 5;
const MAX_BODY = 1000;

/**
 * Verified-buyer'a açık yorum formu. 1-5 yıldız seçici (klavye dostu) +
 * 5-1000 karakter gövde. display_name profilden otomatik gelir, kullanıcı
 * ister değiştirir.
 */
export function ReviewForm({ dealId, defaultName }: Props) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    createReviewAction,
    null,
  );
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [bodyLen, setBodyLen] = useState(0);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success('Yorumun yayında — paylaştığın için teşekkürler.');
      // Form state'i başarılı submit sonrası sıfırla — eligibility gate
      // ikinci yorum açmayı engelleyecek ama görsel reset doğru hissettirir.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(0);
      setBodyLen(0);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const displayed = hoverRating || rating;

  return (
    <form
      action={formAction}
      className="border-border bg-background mb-6 flex flex-col gap-4 rounded-xl border p-5"
    >
      <input type="hidden" name="dealId" value={dealId} />
      <input type="hidden" name="rating" value={rating} />

      <header>
        <h3 className="text-base font-semibold tracking-tight">Yorumunu yaz</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Bu fırsatı rezerve ettin — deneyimini başkalarıyla paylaş.
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium">Puanın</span>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-label="Yıldız puanı"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((i) => {
            const active = i <= displayed;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={i === rating}
                aria-label={`${i} yıldız`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHoverRating(i)}
                onFocus={() => setHoverRating(i)}
                onBlur={() => setHoverRating(0)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') setRating(Math.min(5, rating + 1));
                  if (e.key === 'ArrowLeft') setRating(Math.max(1, rating - 1));
                }}
                className="focus:ring-foreground/40 -m-0.5 inline-flex p-0.5 transition-transform hover:scale-110 focus:rounded focus:ring-2 focus:outline-none"
              >
                <Star
                  className={cn(
                    'size-7 transition-colors',
                    active
                      ? 'fill-amber-500 text-amber-500'
                      : 'fill-transparent text-amber-500/40',
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
          <span className="text-muted-foreground ml-2 text-xs tabular-nums">
            {rating > 0 ? `${rating} / 5` : 'Yıldız seç'}
          </span>
        </div>
        {fieldErrors?.rating?.[0] ? (
          <p className="text-rose-600 text-xs">{fieldErrors.rating[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-name" className="text-xs font-medium">
          İsmin
        </label>
        <input
          id="review-name"
          name="displayName"
          type="text"
          maxLength={50}
          defaultValue={defaultName}
          required
          className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-10 w-full rounded-md border px-3 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
        {fieldErrors?.displayName?.[0] ? (
          <p className="text-rose-600 text-xs">{fieldErrors.displayName[0]}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-body" className="text-xs font-medium">
          Yorumun
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={4}
          minLength={MIN_BODY}
          maxLength={MAX_BODY}
          required
          placeholder="Neyi sevdin, kimlere öneririsin, küçük bir ipucu…"
          onChange={(e) => setBodyLen(e.target.value.length)}
          className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[100px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
        <div className="flex items-center justify-between">
          {fieldErrors?.body?.[0] ? (
            <p className="text-rose-600 text-xs">{fieldErrors.body[0]}</p>
          ) : (
            <span className="text-muted-foreground text-[11px]">
              En az {MIN_BODY} karakter
            </span>
          )}
          <span
            className={cn(
              'text-[11px] tabular-nums',
              bodyLen > MAX_BODY - 50 ? 'text-amber-600' : 'text-muted-foreground',
            )}
          >
            {bodyLen} / {MAX_BODY}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={pending || rating === 0 || bodyLen < MIN_BODY}
        className="self-end gap-2"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Gönderiliyor…
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Yorumu paylaş
          </>
        )}
      </Button>
    </form>
  );
}
