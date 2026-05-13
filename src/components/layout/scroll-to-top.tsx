'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Gidek temalı scroll-to-top butonu.
 *
 * Konsept: Dikey pill içinde bir "yolculuk" hikayesi —
 *  - Üstte amber/rose MapPin (hedef şehir/sayfanın başı)
 *  - Ortada dashed track + scroll progress'iyle yukarı doğru dolan gradient
 *  - Altta "g" brand markası + nefes alan traveler noktası
 *
 * Etkileşim:
 *  - scrollY > 400 → fade-in olarak belirir
 *  - Idle'da pin pulse + traveler nefes alır
 *  - Click → traveler track boyunca üstte fırlar, pin "geldim" zıplar,
 *           window.scrollTo({ top: 0, behavior: 'smooth' }) ile sayfa scrolllanır
 *
 * Erişilebilirlik: `prefers-reduced-motion` saygılı, klavye odaklanabilir,
 * aria-label "Sayfa başına git". Tab'e takılır.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [fill, setFill] = useState(0);
  const [shooting, setShooting] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const compute = () => {
      const sy = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? Math.min(1, Math.max(0, sy / docH)) : 0;
      setFill(progress);
      setVisible(sy > 400);
    };
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        compute();
      });
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleClick() {
    setShooting(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Animasyon süresi (700ms) + biraz buffer ile state reset.
    window.setTimeout(() => setShooting(false), 900);
  }

  return (
    <button
      type="button"
      aria-label="Sayfa başına git"
      onClick={handleClick}
      style={{ ['--gidek-fill' as never]: fill }}
      className={cn(
        // Konum: BottomNav (md altı h-16) üzerinde, sağ kenar.
        'fixed right-4 z-40 bottom-[88px] md:right-6 md:bottom-6',
        // Görünürlük geçişi.
        'transition-all duration-300',
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-3 opacity-0 pointer-events-none',
        // Pill kabı.
        'border-border bg-background/85 hover:bg-background',
        'shadow-lg shadow-black/10 dark:shadow-black/40 backdrop-blur',
        'group relative flex h-32 w-12 flex-col items-center justify-between rounded-full border py-2.5',
        // Hover'da hafif kalk.
        'hover:-translate-y-0.5',
      )}
    >
      {/* Hedef pini — amber/rose gradient, idle pulse / click land. */}
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex size-7 items-center justify-center rounded-full',
          'bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-rose-500/30',
          shooting ? 'gidek-fab-pin-landed' : 'gidek-fab-pin',
        )}
      >
        <MapPin className="size-3.5 fill-current" aria-hidden="true" />
        {/* Pin'in alt ucundan çıkan minik gölge halkası — derinlik hissi. */}
        <span className="bg-foreground/15 absolute -bottom-1 h-1 w-3 rounded-full blur-[2px]" />
      </span>

      {/* Track — dashed background + scroll progress fill. */}
      <span
        aria-hidden="true"
        className="relative my-1 flex h-12 w-px items-start justify-center"
      >
        {/* Dashed background (sürekli) */}
        <span
          className="border-foreground/25 absolute inset-y-0 left-1/2 w-px -translate-x-1/2 border-l border-dashed"
        />
        {/* Gradient fill — bottom-to-top, scroll progress'le scale-Y. */}
        <span
          className={cn(
            'absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full',
            'bg-gradient-to-t from-amber-400 via-rose-400 to-rose-500',
            shooting ? 'gidek-fab-track-rushing' : 'gidek-fab-track-fill',
          )}
        />
        {/* Traveler — track üstünde idle, click'te fırlar. */}
        <span
          className={cn(
            'absolute left-1/2 size-2 -translate-x-1/2 rounded-full',
            'bg-foreground shadow-[0_0_0_2px_var(--background)]',
            shooting
              ? 'gidek-fab-traveler-shooting'
              : 'gidek-fab-traveler',
          )}
          style={
            shooting
              ? undefined
              : { top: `calc(100% - ${Math.max(8, fill * 100)}% - 4px)` }
          }
        />
      </span>

      {/* Brand mark — küçük "g.". Aslında hedef kullanıcının çıkış noktası. */}
      <span
        aria-hidden="true"
        className="text-foreground/75 font-semibold text-[11px] leading-none tracking-tight"
      >
        gidek
      </span>
    </button>
  );
}
