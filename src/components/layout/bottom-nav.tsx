'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, Home, Ticket, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const ITEMS = [
  { href: '/', label: 'Ana', icon: Home, match: (p: string) => p === '/' },
  { href: '/k/yemek', label: 'Keşfet', icon: Compass, match: (p: string) => p.startsWith('/k/') },
  { href: '/favorilerim', label: 'Favori', icon: Heart, match: (p: string) => p.startsWith('/favorilerim') },
  {
    href: '/rezervasyonlarim',
    label: 'Rezervasyon',
    icon: Ticket,
    match: (p: string) => p.startsWith('/rezervasyon'),
  },
  { href: '/profil', label: 'Profil', icon: User, match: (p: string) => p.startsWith('/profil') },
] as const;

/**
 * Mobile alt navigasyon. Sadece md altı görünür; üst nav ile çakışmaz.
 * Sayfa içinde fixed bottom; PWA install bar varken yine de görünür çünkü
 * z-30 ile alt katmanda — InstallPrompt z-50 üstte kalır.
 *
 * Site sıçrama (toolbar gizlenip görünmesi) iOS'ta sıkıntı; max-w + center
 * + safe-area-inset-bottom padding ile tutuyoruz.
 */
export function BottomNav() {
  const pathname = usePathname() ?? '/';

  // Bazı sayfalarda alt-nav görünmeli mi?
  // Auth ekranlarında (giris/kayit/sifre-yenile) ve admin'de gizle.
  if (
    pathname.startsWith('/giris') ||
    pathname.startsWith('/kayit') ||
    pathname.startsWith('/sifre-') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/odeme/') ||
    pathname.startsWith('/onboarding')
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Alt navigasyon"
      className="bg-background/95 border-border fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
                    active ? 'fill-foreground/10' : '',
                  )}
                  aria-hidden="true"
                />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
