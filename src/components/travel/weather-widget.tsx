'use client';

import { useEffect, useState } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Loader2,
  Sun,
  Wind,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  lat: number;
  lng: number;
  /** Konum etiketi (örn. "Bodrum") */
  label?: string;
}

interface Forecast {
  date: string;
  weekday: string;
  tMax: number;
  tMin: number;
  code: number;
  precipMm: number;
}

interface ApiResponse {
  current?: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

/**
 * WMO weather code → ikon + label.
 * Open-Meteo standart kodları kullanır.
 */
function codeToInfo(code: number): { icon: typeof Sun; label: string; cls: string } {
  if (code === 0) return { icon: Sun, label: 'Güneşli', cls: 'text-amber-500' };
  if (code <= 3) return { icon: Cloud, label: 'Parçalı bulutlu', cls: 'text-sky-500' };
  if (code >= 51 && code <= 67) return { icon: CloudRain, label: 'Yağmurlu', cls: 'text-sky-600' };
  if (code >= 71 && code <= 77) return { icon: CloudSnow, label: 'Karlı', cls: 'text-slate-400' };
  if (code >= 80 && code <= 82) return { icon: CloudRain, label: 'Sağanak', cls: 'text-sky-600' };
  if (code >= 95) return { icon: CloudRain, label: 'Fırtınalı', cls: 'text-violet-600' };
  return { icon: Cloud, label: 'Bulutlu', cls: 'text-muted-foreground' };
}

const TR_WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function WeatherWidget({ lat, lng, label }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
    url.searchParams.set(
      'daily',
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    );
    url.searchParams.set('timezone', 'Europe/Istanbul');
    url.searchParams.set('forecast_days', '5');

    fetch(url.toString(), { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((json) => setData(json))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Hava bilgisi alınamadı');
      });

    return () => controller.abort();
  }, [lat, lng]);

  if (error) {
    return null; // Sessizce başarısız ol
  }

  if (!data || !data.current || !data.daily) {
    return (
      <div className="border-border bg-muted/30 flex items-center gap-2 rounded-xl border p-3 text-sm">
        <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden="true" />
        <span className="text-muted-foreground">Hava durumu yükleniyor...</span>
      </div>
    );
  }

  const currentInfo = codeToInfo(data.current.weather_code);
  const CurrentIcon = currentInfo.icon;

  const forecast: Forecast[] = data.daily.time.map((iso, i) => {
    const d = new Date(iso);
    return {
      date: iso,
      weekday: TR_WEEKDAYS[d.getDay()],
      tMax: Math.round(data.daily!.temperature_2m_max[i]),
      tMin: Math.round(data.daily!.temperature_2m_min[i]),
      code: data.daily!.weather_code[i],
      precipMm: data.daily!.precipitation_sum[i] ?? 0,
    };
  });

  return (
    <section
      aria-label="Hava durumu"
      className="border-border bg-background overflow-hidden rounded-2xl border shadow-sm"
    >
      {/* Şu anki durum */}
      <header className="from-sky-50 via-background to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20 flex items-center gap-4 bg-gradient-to-r p-4 sm:p-5">
        <CurrentIcon className={cn('size-12 shrink-0', currentInfo.cls)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest">
            {label ? `${label} · ` : ''}Şimdi
          </p>
          <p className="mt-0.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">
              {Math.round(data.current.temperature_2m)}°
            </span>
            <span className="text-foreground/80 text-sm">{currentInfo.label}</span>
          </p>
          <p className="text-muted-foreground mt-0.5 inline-flex items-center gap-1 text-[11px]">
            <Wind className="size-3" aria-hidden="true" />
            {Math.round(data.current.wind_speed_10m)} km/s rüzgar
          </p>
        </div>
      </header>

      {/* 5 günlük tahmin */}
      <ul className="grid grid-cols-5 divide-x divide-border border-t border-border">
        {forecast.map((f, i) => {
          const info = codeToInfo(f.code);
          const Icon = info.icon;
          return (
            <li key={f.date} className="p-2 text-center sm:p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                {i === 0 ? 'Bugün' : f.weekday}
              </p>
              <Icon className={cn('mx-auto mt-1 size-5', info.cls)} aria-hidden="true" />
              <p className="mt-1 text-xs">
                <strong className="text-foreground tabular-nums">{f.tMax}°</strong>{' '}
                <span className="text-muted-foreground tabular-nums">{f.tMin}°</span>
              </p>
              {f.precipMm > 0.5 ? (
                <p className="text-sky-600 mt-0.5 inline-flex items-center gap-0.5 text-[10px]">
                  <CloudRain className="size-2.5" aria-hidden="true" />
                  {Math.round(f.precipMm)}mm
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
