'use client';

import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** Form alanı adı — hidden input bu adla submit edilir. */
  name: string;
  initialUrl?: string | null;
  /** Boş alanın görsel etiketi (örn. "Logo", "Banner"). */
  label?: string;
}

const ALLOWED = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Tek resimlik upload alanı — merchant logo gibi yerlerde kullanılır.
 * ImageUploader (multi-image) ile aynı /api/admin/upload endpoint'ini
 * paylaşır; farklı sadece UI: tek slot, "Kapak" rozeti yok.
 */
export function SingleImageUploader({ name, initialUrl, label = 'Görsel' }: Props) {
  const inputId = useId();
  const [url, setUrl] = useState<string>(initialUrl ?? '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
    const file = fileList[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} 8MB üzerinde.`);
      return;
    }
    if (file.type && !ALLOWED.split(',').includes(file.type.toLowerCase())) {
      toast.error('Desteklenmeyen format. JPG / PNG / WebP / HEIC kabul edilir.');
      return;
    }
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploading(true);
    try {
      const remote = await uploadOne(file);
      setUrl(remote);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(preview);
      setPreviewUrl(null);
    }
  }

  function clear() {
    setUrl('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl = previewUrl ?? url;
  const isExternal = url && !url.startsWith('blob:');

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name={name} value={url} />
      <div
        className={cn(
          'border-border bg-muted relative aspect-[3/1] w-full max-w-sm overflow-hidden rounded-lg border',
          !displayUrl && 'border-dashed',
        )}
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt={label}
              fill
              sizes="384px"
              className="object-cover"
              unoptimized={displayUrl.startsWith('blob:')}
            />
            {uploading ? (
              <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              </div>
            ) : null}
            {isExternal && !uploading ? (
              <button
                type="button"
                onClick={clear}
                aria-label="Kaldır"
                className="bg-background/80 hover:bg-background absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full backdrop-blur transition-colors"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </>
        ) : (
          <label
            htmlFor={inputId}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/60 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
            <span>{label} ekle</span>
          </label>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        accept={ALLOWED}
        className="hidden"
        onChange={(e) => {
          const fl = e.target.files;
          if (fl) void handleFiles(fl);
          e.target.value = '';
        }}
      />
      <p className="text-muted-foreground text-xs">
        JPG / PNG / WebP / HEIC. Max 8MB. Sunucuda WebP'ye dönüştürülür.
      </p>
    </div>
  );
}
