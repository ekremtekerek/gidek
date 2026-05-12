'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'gidek_consent_v1';

/**
 * Sticky alt-banner — KVKK kapsamında çerez kullanım onayı. Tercih
 * localStorage'a kaydedilir; bir kere etkileşim sonrası geri görünmez.
 * SSR'da render olmaz (hydration mismatch'i önlemek için).
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== '1') {
        setVisible(true);
      }
    } catch {
      // private mode vb. — banner'ı gösterme
    }
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez onayı"
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-2xl border p-4 shadow-2xl backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="bg-amber-500/15 text-amber-600 dark:text-amber-300 inline-flex size-10 shrink-0 items-center justify-center rounded-full">
          <Cookie className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium">Çerez kullanıyoruz</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            Daha iyi bir deneyim için zorunlu çerezleri kullanıyoruz. Kişisel verilerin işlenmesi
            hakkında detay için{' '}
            <Link
              href="/yasal/kvkk"
              className="text-foreground underline underline-offset-2"
            >
              KVKK Aydınlatma Metni
            </Link>{' '}
            ve{' '}
            <Link
              href="/yasal/cerezler"
              className="text-foreground underline underline-offset-2"
            >
              Çerez Politikası
            </Link>{' '}
            sayfalarına göz at.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={accept}>
            Kabul ediyorum
          </Button>
          <button
            type="button"
            onClick={accept}
            aria-label="Kapat"
            className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-full transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
