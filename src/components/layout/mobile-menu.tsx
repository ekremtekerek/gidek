'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, Sparkles, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';
import { SITE } from '@/lib/utils/site-config';

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // No mounted guard needed: `open` starts false on both server and client,
  // so the portal renders `null` on first paint; portal mounts only after a
  // client interaction sets `open` true.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const close = () => setOpen(false);

  const sheet = (
    <div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Mobil menü"
      className="fixed inset-0 z-[100] md:hidden"
    >
      {/* opaque backdrop — clicking closes */}
      <button
        type="button"
        aria-label="Menüyü kapat"
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 bg-black/60"
      />

      {/* sliding panel — fully opaque background */}
      <div className="bg-background absolute inset-y-0 right-0 flex w-full max-w-sm flex-col shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <span className="text-lg font-semibold tracking-tight">
            {SITE.name}
            <span className="text-muted-foreground ms-0.5">.</span>
          </span>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={close}
            className="hover:bg-muted inline-flex size-10 items-center justify-center rounded-md"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav
          aria-label="Mobil ana menü"
          className="flex flex-1 flex-col overflow-y-auto px-5 py-6"
        >
          <Link
            href="/kesfet"
            onClick={close}
            className="bg-foreground text-background hover:bg-foreground/90 mb-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            AI ile keşfet
          </Link>

          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Kategoriler
          </p>
          <ul className="space-y-1">
            {MAIN_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/k/${c.slug}`}
                  onClick={close}
                  className="hover:bg-muted flex items-center rounded-md px-3 py-2.5 text-sm font-medium"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-border flex flex-col gap-2 border-t px-5 py-4">
          <Link
            href="/giris"
            onClick={close}
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
          >
            Giriş
          </Link>
          <Link
            href="/kayit"
            onClick={close}
            className={cn(buttonVariants({ variant: 'primary' }), 'w-full')}
          >
            Üye Ol
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü aç"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="hover:bg-muted inline-flex size-10 items-center justify-center rounded-md md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {open ? createPortal(sheet, document.body) : null}
    </>
  );
}
