'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Route geçişlerinde ekranın üst kenarında ince bir progress şeridi
 * gösterir. usePathname/useSearchParams değiştiğinde 700ms görünür, sonra
 * fade out. Pathname değişimi navigation tamamlandığında tetiklenir;
 * dolayısıyla bu bar "az önce yüklendi" işaretidir (tam başlangıç değil).
 * Yine de kullanıcı için iyi bir görsel onaylama.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [key, setKey] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setKey((k) => k + 1);
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 750);
    return () => window.clearTimeout(t);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[150] h-[2px] overflow-hidden"
    >
      <div
        key={key}
        className="gidek-nav-progress from-foreground via-foreground to-foreground/40 h-full w-full bg-gradient-to-r"
      />
    </div>
  );
}
