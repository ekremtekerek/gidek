'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { searchPlaces } from '@/lib/travel/geocoding';

interface Props {
  locations: string[];
}

/**
 * Header'a yerleşen kompakt tatil arama. Trigger button DEĞİL — gerçek
 * Combobox; kullanıcı doğrudan yazmaya başlayabilir, Mapbox autocomplete
 * dropdown'u inline açılır. Tarih/kişi default'larla geçer; ileri seçenek
 * için /tatil/ara'daki tam form (TravelTopSearchBar) "Detaylı arama"
 * ikonuyla erişilebilir.
 */
export function TravelHeaderSearch({ locations }: Props) {
  const router = useRouter();
  const [dest, setDest] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = dest.trim();
    if (!trimmed) {
      router.push('/tatil/ara');
      return;
    }
    const now = Date.now();
    const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    const tomorrow = fmt(now + 86400000);
    const week = fmt(now + 7 * 86400000);
    const params = new URLSearchParams({
      dest: trimmed,
      checkin: tomorrow,
      checkout: week,
      adults: '2',
    });
    router.push(`/tatil/ara?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-2xl items-center gap-2"
    >
      <div className="min-w-0 flex-1">
        <Combobox
          value={dest}
          onChange={setDest}
          options={locations}
          asyncSearch={async (q, signal) => {
            const results = await searchPlaces(q, signal);
            return results.map((r) => r.short);
          }}
          placeholder="Nereye gidelim? — Bodrum, Antalya…"
          label="Tatil destinasyonu"
          size="sm"
        />
      </div>

      <Link
        href="/tatil/ara"
        aria-label="Detaylı arama (tarih, kişi, oda, konsept)"
        title="Detaylı arama"
        className="text-muted-foreground hover:bg-muted border-border hover:border-foreground/30 inline-flex h-9 shrink-0 items-center justify-center rounded-md border px-2.5 transition-colors"
      >
        <SlidersHorizontal className="size-4" aria-hidden="true" />
      </Link>

      <button
        type="submit"
        className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-gradient-to-r px-4 text-xs font-bold text-white shadow transition-all hover:scale-[1.02]"
      >
        <Search className="size-3.5" aria-hidden="true" />
        Ara
      </button>
    </form>
  );
}
