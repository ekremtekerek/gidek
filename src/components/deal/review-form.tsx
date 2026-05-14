'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Send, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { createReviewAction, type ReviewState } from '@/app/f/[slug]/actions';
import { Button } from '@/components/ui/button';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';

interface Props {
  dealId: string;
  defaultName: string;
}

const MIN_BODY = 5;
const MAX_BODY = 1000;
const MAX_PHOTOS = 4;

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success('Yorumun yayında — paylaştığın için teşekkürler.');
      // Form state'i başarılı submit sonrası sıfırla — eligibility gate
      // ikinci yorum açmayı engelleyecek ama görsel reset doğru hissettirir.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRating(0);
      setBodyLen(0);
      setPhotos([]);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`En fazla ${MAX_PHOTOS} foto ekleyebilirsin.`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload/review-photo', { method: 'POST', body: fd });
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          throw new Error(`Sunucu hatası (${res.status})`);
        }
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error ?? 'Yükleme başarısız.');
        }
        uploaded.push(data.url as string);
      }
      setPhotos((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} foto eklendi.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Yükleme başarısız.';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Fotoğraflar (opsiyonel)</span>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            {photos.length} / {MAX_PHOTOS}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {photos.map((url) => (
            <div
              key={url}
              className="border-border bg-muted relative size-20 overflow-hidden rounded-md border"
            >
              <Image
                src={url}
                alt="Yorum fotoğrafı"
                fill
                sizes="80px"
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
              <input type="hidden" name="photoUrls[]" value={url} />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                aria-label="Fotoğrafı kaldır"
                className="bg-background/95 hover:bg-rose-500 hover:text-white absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full shadow"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <label
              className={cn(
                'border-border bg-background hover:bg-muted/30 flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-[10px] font-medium transition-colors',
                uploading ? 'pointer-events-none opacity-60' : null,
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
                className="sr-only"
              />
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <ImagePlus className="size-4" aria-hidden="true" />
                  <span>Foto ekle</span>
                </>
              )}
            </label>
          ) : null}
        </div>
        <p className="text-muted-foreground text-[11px]">
          JPG/PNG/WebP · max 6 MB. Fotolar gidek üzerinde paylaşılır.
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={pending || rating === 0 || bodyLen < MIN_BODY || uploading}
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
