'use client';

import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Görsel boyutu — aspect ratio class */
  aspect?: 'square' | '4/3' | '16/9';
  label?: string;
  className?: string;
}

const ALLOWED = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Tek-dosyalık controlled görsel uploader. Cloudinary'e webp olarak gider
 * (server tarafı `/api/admin/upload` halleder), value/onChange ile React
 * state'ine bağlanır. Otel oda tipi kapağı, profil resmi vb. tek görsel
 * gereken yerlerde kullanılır. Çoklu için `ImageUploader` kullan.
 */
export function SingleImageUpload({
  value,
  onChange,
  aspect = '4/3',
  label,
  className,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === '16/9' ? 'aspect-video' : 'aspect-[4/3]';

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

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} 8MB üzerinde.`);
      return;
    }
    if (file.type && !ALLOWED.split(',').includes(file.type.toLowerCase())) {
      toast.error(`${file.name} desteklenmeyen format.`);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadOne(file);
      onChange(url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium">
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          'group bg-muted relative overflow-hidden rounded-lg border',
          aspectClass,
          value ? 'border-border' : 'border-border border-dashed',
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt={label ?? 'görsel'}
              fill
              sizes="200px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Görseli kaldır"
              className="bg-foreground/70 text-background hover:bg-foreground absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </>
        ) : uploading ? (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Yükleniyor…
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="hover:bg-muted/60 text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-xs transition-colors"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            Görsel ekle
          </button>
        )}
      </div>

      {value && !uploading ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-muted-foreground hover:text-foreground self-start text-xs underline-offset-2 hover:underline"
        >
          Değiştir
        </button>
      ) : null}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ALLOWED}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />
    </div>
  );
}
