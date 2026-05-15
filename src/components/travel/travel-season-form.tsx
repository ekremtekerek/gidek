'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarRange, Wand2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { searchPlaces } from '@/lib/travel/geocoding';

interface Props {
  locations: string[];
}

const POPULAR = ['Bodrum', 'Antalya', 'Kapadokya', 'Çeşme', 'Fethiye', 'Uzungöl'];

export function TravelSeasonForm({ locations }: Props) {
  const router = useRouter();
  const [dest, setDest] = useState('');
  const [pending, setPending] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dest.trim()) return;
    setPending(true);
    router.push(`/tatil/sezon?dest=${encodeURIComponent(dest.trim())}`);
  }

  function quickPick(d: string) {
    setPending(true);
    router.push(`/tatil/sezon?dest=${encodeURIComponent(d)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-background flex flex-col gap-4 rounded-2xl border p-5 shadow-xl sm:p-6"
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wide">
          Nereye gitmek istiyorsun?
        </span>
        <Combobox
          value={dest}
          onChange={setDest}
          options={locations}
          asyncSearch={async (q, signal) => {
            const results = await searchPlaces(q, signal);
            return results.map((r) => r.short);
          }}
          placeholder="Bodrum, Kapadokya, Antalya..."
          label="Destinasyon"
          size="md"
        />
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-wide">
          Popüler
        </p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => quickPick(p)}
              className="border-border hover:border-amber-500/40 hover:bg-amber-500/5 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-105"
            >
              <CalendarRange className="size-3 text-amber-600" aria-hidden="true" />
              {p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!dest.trim() || pending}
        className="from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-muted disabled:to-muted disabled:text-muted-foreground inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r text-base font-bold text-white shadow-md transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Wand2 className="size-5" aria-hidden="true" />
        {pending ? 'AI analiz ediyor…' : 'AI sezon tavsiyesi al'}
      </button>

      <p className="text-muted-foreground text-center text-[11px]">
        Gemini 2.5 Flash · Hava + fiyat + kalabalık + festival
      </p>
    </form>
  );
}
