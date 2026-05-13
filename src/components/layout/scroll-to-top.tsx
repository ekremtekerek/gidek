'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Gidek temalı scroll progress + sayfa başına dön.
 *
 * Tasarım: GPS rotası gibi. Sağ kenarda fixed dikey track (dashed bg).
 * Scroll ilerledikçe track'in TOP'undan başlayan amber→rose gradient
 * aşağı doğru çizilir; trail'in ucunda yukarı-arrow butonu durur. Click'te
 * window smooth-scroll yapar; bu sırada fill geriye doğru "sarılır" ve
 * arrow yukarı çıkar — başlangıca dönüş animasyonu doğal olarak oluşur.
 *
 * Konum: header altından başlar, mobile'da BottomNav üstünde biter.
 */
export function ScrollToTop() {
  const [fill, setFill] = useState(0); // 0..1 scroll progress
  const [isMd, setIsMd] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Scroll → fill progress.
  useEffect(() => {
    const compute = () => {
      const sy = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? Math.min(1, Math.max(0, sy / docH)) : 0;
      setFill(progress);
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

  // Breakpoint state.
  useEffect(() => {
    const compute = () => setIsMd(window.innerWidth >= 768);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // En tepedeyken trail görünmez (anlamsız). Hafif bir threshold sonra fade-in.
  // 5% scroll progress ~= viewport yarısı kadar; anasayfada chat hero
  // bittiğinde geçilir.
  const fillPct = fill * 100;
  const visible = fill > 0.01;

  // Track'in dikey alanı — fixed positioned, header altı + bottom nav üstü.
  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    right: isMd ? 20 : 12,
    top: 96, // header (h-16 = 64px) altı + biraz nefes
    bottom: isMd ? 80 : 96, // mobile BottomNav (~64px) üstünde, desktop footer'a nefes
    width: 36, // line + button hit zone
    zIndex: 40,
    pointerEvents: 'none',
    opacity: visible ? 1 : 0,
    transition: 'opacity 320ms ease',
  };

  return (
    <div aria-hidden={!visible} style={wrapperStyle}>
      <div className="relative h-full w-full">
        {/* Dashed background — sayfanın tamamı boyunca rota şeması */}
        <span
          aria-hidden="true"
          className="border-foreground/20 absolute top-0 left-1/2 h-full w-px -translate-x-1/2 border-l border-dashed"
        />

        {/* Trail — scroll progress'iyle top'tan aşağı doğru dolar */}
        <span
          aria-hidden="true"
          className="absolute top-0 left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-400 via-rose-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.35)]"
          style={{
            height: `${fillPct}%`,
            transition: 'height 90ms linear',
          }}
        />

        {/* Trail başlangıç noktası (top dot — origin marker) */}
        <span
          aria-hidden="true"
          className="border-background absolute top-0 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-amber-400 shadow-sm"
        />

        {/* "You are here" indicator + yukarı arrow butonu — trail ucunda */}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Sayfa başına git"
          title="Sayfa başına git"
          className="border-background pointer-events-auto absolute left-1/2 inline-flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/40 transition-all hover:scale-110 hover:shadow-rose-500/60 focus-visible:scale-110 focus-visible:outline-none"
          style={{
            top: `${fillPct}%`,
            transition: 'top 90ms linear, transform 200ms ease, box-shadow 200ms ease',
          }}
        >
          {/* Hafif pulse halkası */}
          <span
            aria-hidden="true"
            className="absolute inset-0 -m-1 rounded-full bg-rose-500/30 animate-ping"
          />
          <ArrowUp className="relative size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
