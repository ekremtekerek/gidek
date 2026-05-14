'use client';

import { useEffect, useState } from 'react';
import { Car, Loader2, MapPin } from 'lucide-react';

interface Props {
  toLat: number;
  toLng: number;
}

type State =
  | { phase: 'idle' }
  | { phase: 'asking' }
  | { phase: 'fetching' }
  | { phase: 'ok'; minutes: number; km: number }
  | { phase: 'denied' }
  | { phase: 'error'; message: string };

const STORAGE_KEY = 'gidek:geolocation-permission';

/**
 * Trafik tahmini rozeti — kullanıcının konumundan fırsata kaç dakika.
 * Konum izni opt-in: ilk tıklamada navigator.geolocation çağrısı yapılır.
 * Verdiği yanıtı localStorage'de hatırlar; sonraki ziyarette otomatik tahmin.
 */
export function EtaBadge({ toLat, toLng }: Props) {
  const [state, setState] = useState<State>({ phase: 'idle' });

  useEffect(() => {
    // Daha önce konum izni verdiyse otomatik tahmini al
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'granted') {
        void request();
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function request() {
    if (!('geolocation' in navigator)) {
      setState({ phase: 'error', message: 'Tarayıcın konum desteklemiyor.' });
      return;
    }
    setState({ phase: 'asking' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, 'granted');
        } catch {
          // ignore
        }
        setState({ phase: 'fetching' });
        try {
          const r = await fetch(
            `/api/eta?fromLat=${pos.coords.latitude}&fromLng=${pos.coords.longitude}&toLat=${toLat}&toLng=${toLng}`,
          );
          const j = (await r.json()) as
            | { durationMinutes: number; distanceKm: number }
            | { error: string };
          if (!r.ok || 'error' in j) {
            setState({ phase: 'error', message: 'Süre hesaplanamadı.' });
            return;
          }
          setState({ phase: 'ok', minutes: j.durationMinutes, km: j.distanceKm });
        } catch {
          setState({ phase: 'error', message: 'Sunucu yanıt vermedi.' });
        }
      },
      () => {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
        setState({ phase: 'denied' });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60 * 60 * 1000 },
    );
  }

  if (state.phase === 'idle') {
    return (
      <button
        type="button"
        onClick={request}
        className="border-border bg-background hover:border-foreground/30 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors"
      >
        <MapPin className="size-3.5" aria-hidden="true" />
        Konumumdan ne kadar?
      </button>
    );
  }

  if (state.phase === 'asking' || state.phase === 'fetching') {
    return (
      <span className="text-muted-foreground inline-flex h-8 items-center gap-1.5 px-3 text-xs">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        {state.phase === 'asking' ? 'Konum izni…' : 'Trafik hesaplanıyor…'}
      </span>
    );
  }

  if (state.phase === 'ok') {
    const urgent = state.minutes <= 15;
    return (
      <span
        className={
          urgent
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium'
            : 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium'
        }
      >
        <Car className="size-3.5" aria-hidden="true" />
        {urgent ? 'Yakın · ' : 'Senden '}
        <strong className="tabular-nums">{state.minutes} dk</strong>
        <span className="opacity-70">· {state.km} km</span>
      </span>
    );
  }

  if (state.phase === 'denied') {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        Konum reddedildi
      </span>
    );
  }

  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
      {state.message}
    </span>
  );
}
