'use client';

import { useEffect } from 'react';

/**
 * Service worker register'ı — sayfa load olunca tek seferlik. Dev'de SW
 * register etmiyoruz çünkü HMR ile çakışıyor; production build'de aktif.
 */
export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // SW kaydı başarısız olabilir (insecure context, izin yok vb.).
          // Sessizce geç — site temel akışı SW'ye bağımlı değil.
          console.warn('[sw] register failed:', err);
        });
    };

    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);

    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}
