'use client';

import { useEffect, useState } from 'react';

/**
 * Fiyat alarmı kayıtları — V1 mock. localStorage tabanlı; gerçek email
 * gönderimi yok. UX validate için. Production'da Supabase'e taşınacak.
 */

const KEY = 'gidek:travel-price-alerts-v1';

export interface PriceAlert {
  dealId: string;
  dealSlug: string;
  dealTitle: string;
  coverImage: string;
  city: string;
  currentPrice: number;
  targetPrice: number;
  createdAt: string;
}

function read(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(alerts: PriceAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(alerts));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  } catch {
    // ignore quota errors
  }
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts(read());
    function onChange(e: StorageEvent) {
      if (e.key === KEY || e.key === null) setAlerts(read());
    }
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, []);

  function add(alert: PriceAlert) {
    const current = read();
    const filtered = current.filter((a) => a.dealId !== alert.dealId);
    const next = [alert, ...filtered].slice(0, 30);
    write(next);
    setAlerts(next);
  }

  function remove(dealId: string) {
    const next = read().filter((a) => a.dealId !== dealId);
    write(next);
    setAlerts(next);
  }

  function find(dealId: string) {
    return alerts.find((a) => a.dealId === dealId);
  }

  function clear() {
    write([]);
    setAlerts([]);
  }

  return { alerts, add, remove, find, clear };
}
