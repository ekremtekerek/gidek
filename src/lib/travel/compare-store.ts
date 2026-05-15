'use client';

import { useEffect, useState } from 'react';

/**
 * Karşılaştırma sepetinin localStorage'da tutulması.
 * Max 3 deal id; aşıldığında ilk eklenenler silinir.
 * Hook her render'da sync olur; window storage event ile sekme arası sync.
 */

const KEY = 'gidek:travel-compare-v1';
const MAX = 3;

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)));
    window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
  } catch {
    // ignore quota errors
  }
}

export function getCompareIds(): string[] {
  return read();
}

export function useCompareStore() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(read());
    function onChange(e: StorageEvent) {
      if (e.key === KEY || e.key === null) setIds(read());
    }
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, []);

  function toggle(id: string) {
    const current = read();
    let next: string[];
    if (current.includes(id)) {
      next = current.filter((x) => x !== id);
    } else if (current.length >= MAX) {
      next = [...current.slice(1), id]; // FIFO
    } else {
      next = [...current, id];
    }
    write(next);
    setIds(next);
  }

  function clear() {
    write([]);
    setIds([]);
  }

  return { ids, toggle, clear, max: MAX };
}
