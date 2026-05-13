'use client';

import { useEffect, useRef } from 'react';

interface Props {
  /**
   * Token alındığında çağrılır. Boş string + onExpire benzeri durumlar için
   * onChange yine boş değerle çağrılır.
   */
  onToken: (token: string) => void;
  /** Görsel mod — varsayılan 'managed' (Cloudflare karar verir). */
  appearance?: 'managed' | 'always' | 'invisible';
  /** Karanlık tema ile uyum. */
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileGlobal = {
  ready: (cb: () => void) => void;
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      'error-callback'?: () => void;
      'expired-callback'?: () => void;
      'timeout-callback'?: () => void;
      theme?: 'light' | 'dark' | 'auto';
      appearance?: 'always' | 'execute' | 'interaction-only';
    },
  ) => string | undefined;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileGlobal;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC.split('?')[0]}"]`);
    if (existing) {
      const checkReady = () => {
        if (window.turnstile) resolve();
        else setTimeout(checkReady, 50);
      };
      checkReady();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('turnstile script failed'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget — site key yoksa görünmez (no-op). Token
 * elde edildiğinde onToken çağrılır; expiry/error durumlarında boş string.
 *
 * "Managed" mode default'u Cloudflare'in challenge gerekliliğine karar
 * vermesini sağlar; çoğu kullanıcı hiçbir şey görmez.
 */
export function TurnstileWidget({
  onToken,
  appearance = 'managed',
  theme = 'auto',
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    (async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !ref.current || !window.turnstile) return;
        await new Promise<void>((resolve) =>
          window.turnstile!.ready(() => resolve()),
        );
        if (cancelled || !ref.current) return;
        const id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          theme,
          appearance:
            appearance === 'invisible'
              ? 'execute'
              : appearance === 'always'
              ? 'always'
              : 'interaction-only',
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(''),
          'error-callback': () => onTokenRef.current(''),
          'timeout-callback': () => onTokenRef.current(''),
        });
        if (id) widgetIdRef.current = id;
      } catch {
        // Script yüklenemedi — pass: token boş kalır, server side missing
        // input olarak değerlendirir.
      }
    })();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
      widgetIdRef.current = null;
    };
  }, [appearance, theme]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className={className} />;
}
