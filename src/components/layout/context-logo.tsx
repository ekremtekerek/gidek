'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE } from '@/lib/utils/site-config';

/**
 * Header logosu — context-aware.
 * - /tatil veya /tatil/* sayfalardayken /tatil'a (tatil ana sayfası)
 * - Diğer sayfalarda /'a (ana fırsatlar)
 *
 * Mantık: kullanıcı bir vertical (tatil) içindeyse, logo tıklayınca o
 * vertical'in ana sayfasına dönmesi daha doğal. Header'daki Tatil/Fırsatlar
 * butonu ile birlikte tutarlı navigasyon.
 */
export function ContextLogo() {
  const pathname = usePathname() ?? '';
  const isTatil = pathname === '/tatil' || pathname.startsWith('/tatil/');
  const href = isTatil ? '/tatil' : '/';

  return (
    <Link
      href={href}
      className="text-2xl font-bold tracking-tight shrink-0 sm:text-3xl"
      aria-label={isTatil ? 'gidek Tatil ana sayfası' : SITE.name}
    >
      {SITE.name}
      {isTatil ? (
        <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
          .tatil
        </span>
      ) : (
        <span className="text-muted-foreground ms-0.5">.</span>
      )}
    </Link>
  );
}
