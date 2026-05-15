'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Palmtree, Sparkles } from 'lucide-react';

/**
 * Context-aware header butonu.
 * - Tatil sayfalarında (/tatil veya /tatil/*) → "Fırsatlar" gösterir, ana
 *   fırsatlar dünyasına yönlendirir (/). Turuncu/amber gradient.
 * - Diğer sayfalarda → "Tatil" gösterir, /tatil'a yönlendirir. Mavi gradient.
 *
 * Aynı slot, içerik akıllı.
 */
export function ContextToggleButton({
  variant = 'desktop',
  onClick,
}: {
  variant?: 'desktop' | 'mobile';
  onClick?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const isTatil = pathname === '/tatil' || pathname.startsWith('/tatil/');

  const href = isTatil ? '/' : '/tatil';
  const label = isTatil ? 'Fırsatlar' : 'Tatil';
  const Icon = isTatil ? Sparkles : Palmtree;

  const gradient = isTatil
    ? 'from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
    : 'from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600';

  if (variant === 'mobile') {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-md bg-gradient-to-r px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-all ${gradient}`}
      >
        <Icon className="size-4" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p>{isTatil ? 'Fırsatlar — AI ile keşfet' : 'Tatil — AI ile planla'}</p>
          <p className="text-[11px] font-normal opacity-90">
            {isTatil
              ? 'Tiyatro, konser, masaj, aktivite ve daha fazlası'
              : 'Otel, paket tur, yurtiçi & yurtdışı'}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`hidden h-9 items-center gap-1.5 rounded-full bg-gradient-to-r px-3 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md md:inline-flex ${gradient}`}
      aria-label={isTatil ? 'Fırsatlar ana sayfasına dön' : 'Tatil — AI ile planla'}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </Link>
  );
}
