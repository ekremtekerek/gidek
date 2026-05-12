'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Mouse-wheel'i dikey → yatay'a çevirir. Container'ın scroll edebileceği
 * mesafe varsa wheel'i yutar; sınırına ulaşmışsa sayfa scroll'una izin
 * verir (preventDefault yok). Trackpad'in zaten yatay deltaX'ı geliyorsa
 * dokunmaz. `passive: false` zorunlu, aksi halde preventDefault çalışmaz.
 */
export function useWheelToHorizontal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaY;
      if (dy === 0) return;
      // Trackpad zaten yatay scroll yapıyorsa müdahale etme.
      if (Math.abs(e.deltaX) > Math.abs(dy)) return;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const atStart = el.scrollLeft <= 0;
      if ((dy > 0 && atEnd) || (dy < 0 && atStart)) return;

      e.preventDefault();
      el.scrollLeft += dy;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [ref]);
}
