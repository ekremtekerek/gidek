'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link2, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface Props {
  title: string;
  text: string;
  url: string;
  className?: string;
}

/**
 * Web Share API destekliyse tek "Paylaş" buton → native sheet.
 * Desteklemiyorsa popover'da WhatsApp, X, "Bağlantıyı kopyala".
 */
export function ShareButtons({ title, text, url, className }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Popover kapanınca trigger'a focus geri dön.
  useEffect(() => {
    if (wasOpenRef.current && !open) triggerRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // İptal edilirse sessizce geç.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Bağlantı kopyalandı');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Bağlantı kopyalanamadı');
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  if (hasNativeShare) {
    return (
      <button
        type="button"
        onClick={nativeShare}
        className={cn(
          'border-border bg-background hover:border-foreground/40 hover:bg-muted inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
          className,
        )}
      >
        <Share2 className="size-4" aria-hidden="true" />
        Paylaş
      </button>
    );
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'border-border bg-background hover:border-foreground/40 hover:bg-muted inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors',
          open && 'border-foreground bg-muted',
        )}
      >
        <Share2 className="size-4" aria-hidden="true" />
        Paylaş
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Paylaş"
          className="border-border bg-background absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border shadow-xl"
        >
          <header className="border-border flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">Paylaş</p>
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setOpen(false)}
              className="hover:bg-muted inline-flex size-7 items-center justify-center rounded-md"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </header>
          <div className="flex flex-col p-1">
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500 text-white text-[12px] font-bold">
                W
              </span>
              WhatsApp
            </a>
            <a
              href={x}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-foreground text-background text-[12px] font-bold">
                X
              </span>
              X (Twitter)
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2.5 text-sm"
            >
              <span className="bg-muted text-foreground inline-flex size-7 items-center justify-center rounded-full">
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Link2 className="size-3.5" aria-hidden="true" />
                )}
              </span>
              {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
              {!copied ? (
                <Copy className="text-muted-foreground ml-auto size-3.5" aria-hidden="true" />
              ) : null}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
