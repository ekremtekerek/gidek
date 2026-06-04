'use client';

import { useEffect, useState } from 'react';
import { Laptop, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const STORAGE_KEY = 'gidek-theme';

type Theme = 'light' | 'dark' | 'auto';

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.classList.remove('light', 'dark');
  if (theme === 'light') html.classList.add('light');
  else if (theme === 'dark') html.classList.add('dark');
  // auto → hiçbir class, prefers-color-scheme devreye girer.
}

function readStored(): Theme {
  // Marka varsayılanı aydınlık — kayıtlı seçim yoksa 'light'. No-flash script
  // (layout.tsx) ile aynı mantık; aksi halde toggle yanlış seçeneği işaretler.
  if (typeof window === 'undefined') return 'light';
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'auto') return v;
  return 'light';
}

/**
 * Tema seçici — light / dark / auto. localStorage'a yazar, ilk render'da
 * <head>'deki no-flash script CSS class'ını zaten ayarladığı için flash yok.
 *
 * Auto modu sistem tema değişikliklerini izler (matchMedia).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mount detection + localStorage sync (SSR'da window yok)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setTheme(readStored());
  }, []);

  function setAndStore(next: Theme) {
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
  }

  // Hidrasyon farkı oluşmasın diye mount olmadan render etmiyoruz.
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className="border-border bg-background inline-flex h-9 w-[7.5rem] rounded-full border"
      />
    );
  }

  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: 'Aydınlık', Icon: Sun },
    { value: 'auto', label: 'Otomatik', Icon: Laptop },
    { value: 'dark', label: 'Karanlık', Icon: Moon },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="border-border bg-background inline-flex rounded-full border p-0.5"
    >
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setAndStore(value)}
          title={label}
          aria-label={label}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-full transition-colors',
            theme === value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
