'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** İlk dosya kapak; diğer 7 fotograf galeri. */
  name?: { cover: string; images: string };
  initialCover?: string;
  initialImages?: string[];
  maxFiles?: number;
}

interface Item {
  url: string;
  uploading?: boolean;
  /** Local tempId — upload bitince url ile değişir. */
  key: string;
}

const ALLOWED = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const MAX_BYTES = 8 * 1024 * 1024;

export function ImageUploader({
  name = { cover: 'cover_image', images: 'images' },
  initialCover,
  initialImages = [],
  maxFiles = 8,
}: Props) {
  const inputId = useId();
  const [items, setItems] = useState<Item[]>(() => {
    const list: Item[] = [];
    if (initialCover) list.push({ url: initialCover, key: 'init-cover' });
    for (let i = 0; i < initialImages.length; i++) {
      if (initialImages[i] !== initialCover) {
        list.push({ url: initialImages[i], key: `init-${i}` });
      }
    }
    return list;
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form alanları için derive — hidden inputs senkronize kalır.
  const cover = items[0]?.url ?? '';
  const gallery = items.slice(1).map((i) => i.url);

  async function uploadOne(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? `Yükleme başarısız (${res.status})`);
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const slots = maxFiles - items.length;
    if (slots <= 0) {
      toast.error(`En fazla ${maxFiles} fotoğraf yükleyebilirsin.`);
      return;
    }
    const accepted = files.slice(0, slots);
    const overflow = files.length - accepted.length;
    if (overflow > 0) toast(`${overflow} dosya eklenmedi: maksimum ${maxFiles}.`);

    // Validasyon + placeholder ekle
    const placeholders: Item[] = [];
    for (const f of accepted) {
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name} 8MB üzerinde, atlandı.`);
        continue;
      }
      if (f.type && !ALLOWED.split(',').includes(f.type.toLowerCase())) {
        toast.error(`${f.name} desteklenmeyen format.`);
        continue;
      }
      placeholders.push({
        url: URL.createObjectURL(f),
        uploading: true,
        key: `tmp-${crypto.randomUUID()}`,
      });
    }
    if (placeholders.length === 0) return;
    setItems((prev) => [...prev, ...placeholders]);

    // Yükleme paralel; her birinin sonunda placeholder'ı güncelle.
    await Promise.all(
      accepted.map(async (f, i) => {
        const ph = placeholders[i];
        if (!ph) return;
        try {
          const url = await uploadOne(f);
          setItems((prev) =>
            prev.map((it) => (it.key === ph.key ? { url, key: ph.key } : it)),
          );
        } catch (err) {
          toast.error((err as Error).message);
          setItems((prev) => prev.filter((it) => it.key !== ph.key));
        } finally {
          URL.revokeObjectURL(ph.url);
        }
      }),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function makeCover(key: string) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
  }

  // Cleanup blob URL'leri unmount'ta
  useEffect(() => {
    return () => {
      items.forEach((i) => {
        if (i.url.startsWith('blob:')) URL.revokeObjectURL(i.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reachedMax = items.length >= maxFiles;
  const anyUploading = items.some((i) => i.uploading);

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden form inputs */}
      <input type="hidden" name={name.cover} value={cover} />
      {gallery.map((u, i) => (
        <input key={`img-${i}`} type="hidden" name={`${name.images}[]`} value={u} />
      ))}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, idx) => (
          <div
            key={it.key}
            className={cn(
              'group bg-muted relative aspect-[4/3] overflow-hidden rounded-lg border',
              idx === 0 ? 'border-foreground ring-foreground/30 ring-2' : 'border-border',
            )}
          >
            <Image
              src={it.url}
              alt={idx === 0 ? 'Kapak' : `Galeri ${idx}`}
              fill
              sizes="200px"
              className="object-cover"
              unoptimized={it.url.startsWith('blob:')}
            />
            {it.uploading ? (
              <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-foreground size-6 animate-spin" aria-hidden="true" />
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-2 text-white">
              {idx === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Kapak
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => makeCover(it.key)}
                  className="hover:bg-white/15 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium opacity-0 transition group-hover:opacity-100"
                >
                  <Star className="size-3" aria-hidden="true" />
                  Kapak yap
                </button>
              )}
              <button
                type="button"
                onClick={() => removeItem(it.key)}
                aria-label="Kaldır"
                className="hover:bg-white/15 inline-flex size-6 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}

        {!reachedMax ? (
          <label
            htmlFor={inputId}
            className={cn(
              'border-border text-muted-foreground hover:border-foreground/40 hover:bg-muted flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-xs font-medium transition-colors',
              anyUploading && 'pointer-events-none opacity-60',
            )}
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            <span>{items.length === 0 ? 'Fotoğraf ekle' : `+ Ekle (${items.length}/${maxFiles})`}</span>
          </label>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept={ALLOWED}
        multiple
        className="hidden"
        onChange={(e) => {
          const fl = e.target.files;
          if (fl) void handleFiles(fl);
          // input'u sıfırla — aynı dosyayı tekrar seçebilsin
          e.target.value = '';
        }}
      />

      <p className="text-muted-foreground text-xs">
        İlki kapak fotoğrafı, kalanı galeride. JPG / PNG / WebP / HEIC kabul edilir; her dosya
        max 8MB. Sunucuda otomatik WebP&apos;ye dönüştürülür ve Cloudinary&apos;de saklanır.
      </p>
    </div>
  );
}
