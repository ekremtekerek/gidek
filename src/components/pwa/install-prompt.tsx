'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISSED_KEY = 'gidek_install_dismissed';

// Chrome'un global'inde standartlaşmayan beforeinstallprompt eventi.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Ana ekrana yükle" prompt'u. Chrome/Edge/Samsung Browser beforeinstallprompt
 * event'i yakalıyoruz; uygunsa hafif bir alt bant ile sunuyoruz. iOS Safari
 * native bir prompt değil — bu komponent Safari'de görünmez (event hiç gelmez).
 */
export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (window.localStorage.getItem(DISMISSED_KEY) === '1') return;
    } catch {
      // localStorage erişimi yoksa devam et
    }

    const onPrompt = (e: Event) => {
      // Default browser banner'ı engelle
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
  }

  async function install() {
    if (!event) return;
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      if (outcome === 'accepted') setVisible(false);
      else dismiss();
    } catch {
      dismiss();
    } finally {
      setEvent(null);
    }
  }

  if (!visible || !event) return null;

  return (
    <div
      role="dialog"
      aria-label="Uygulamayı yükle"
      className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <span className="bg-foreground text-background inline-flex size-10 shrink-0 items-center justify-center rounded-full">
          <Download className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">gidek&apos;i yükle</p>
          <p className="text-muted-foreground text-xs">
            Ana ekrana ekle, çevrimdışı bile temel sayfalara erişebil.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="primary" size="sm" onClick={install}>
            Yükle
          </Button>
          <button
            type="button"
            aria-label="Kapat"
            onClick={dismiss}
            className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-full"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
