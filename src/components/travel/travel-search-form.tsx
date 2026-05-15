'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Calendar, MapPin, Search, Users } from 'lucide-react';
import { CONCEPT_LABEL, type Concept } from '@/lib/travel/enrich';
import { cn } from '@/lib/utils/cn';

interface Props {
  locations: string[];
  /** Form inline (hero için kompakt) ya da panelle (ara sayfası başlığı) */
  variant?: 'inline' | 'panel';
  /** Mevcut değerler — sayfa yüklendiğinde URL'den gelen */
  initial?: {
    destination?: string;
    checkin?: string;
    checkout?: string;
    adults?: number;
    kids?: number;
    concept?: Concept | '';
  };
}

const CONCEPTS: Array<{ value: Concept | ''; label: string }> = [
  { value: '', label: 'Konsept (tümü)' },
  { value: 'all-inclusive', label: CONCEPT_LABEL['all-inclusive'] },
  { value: 'breakfast', label: CONCEPT_LABEL.breakfast },
  { value: 'half-board', label: CONCEPT_LABEL['half-board'] },
  { value: 'room-only', label: CONCEPT_LABEL['room-only'] },
];

export function TravelSearchForm({ locations, variant = 'panel', initial }: Props) {
  const router = useRouter();
  const formId = useId();
  // Date.now() impure — useState lazy initializer ile bir kez hesapla (render
  // dışında). React purity rule'unu memnun eder.
  const [defaults] = useState(() => {
    const now = Date.now();
    const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    return {
      today: fmt(now),
      tomorrow: fmt(now + 86400000),
      week: fmt(now + 7 * 86400000),
    };
  });

  const [dest, setDest] = useState(initial?.destination ?? '');
  const [checkin, setCheckin] = useState(initial?.checkin ?? defaults.tomorrow);
  const [checkout, setCheckout] = useState(initial?.checkout ?? defaults.week);
  const [adults, setAdults] = useState(initial?.adults ?? 2);
  const [kids, setKids] = useState(initial?.kids ?? 0);
  const [concept, setConcept] = useState<Concept | ''>(initial?.concept ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (dest) params.set('dest', dest);
    if (checkin) params.set('checkin', checkin);
    if (checkout) params.set('checkout', checkout);
    if (adults > 0) params.set('adults', String(adults));
    if (kids > 0) params.set('kids', String(kids));
    if (concept) params.set('concept', concept);
    router.push(`/tatil/ara?${params.toString()}`);
  }

  const isInline = variant === 'inline';

  return (
    <form
      onSubmit={submit}
      className={cn(
        'flex flex-col gap-3 sm:grid sm:gap-2',
        isInline
          ? 'sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] rounded-2xl bg-white p-2 shadow-2xl'
          : 'sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] rounded-xl border border-border bg-background p-3 shadow-sm',
      )}
    >
      {/* Destinasyon */}
      <label className="flex flex-col gap-0.5 px-2 py-1.5 sm:py-2">
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
          <MapPin className="size-3" aria-hidden="true" />
          Nereye
        </span>
        <input
          type="text"
          list={`${formId}-dest`}
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Bodrum, Antalya..."
          className="text-foreground placeholder:text-muted-foreground bg-transparent text-sm font-semibold outline-none sm:text-base"
        />
        <datalist id={`${formId}-dest`}>
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </label>

      {/* Tarih giriş */}
      <label className="flex flex-col gap-0.5 px-2 py-1.5 sm:py-2 border-t border-border sm:border-l sm:border-t-0">
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
          <Calendar className="size-3" aria-hidden="true" />
          Giriş
        </span>
        <input
          type="date"
          value={checkin}
          min={defaults.today}
          onChange={(e) => {
            setCheckin(e.target.value);
            if (e.target.value >= checkout) {
              const next = new Date(e.target.value);
              next.setDate(next.getDate() + 3);
              setCheckout(next.toISOString().slice(0, 10));
            }
          }}
          className="text-foreground bg-transparent text-sm font-semibold outline-none sm:text-base"
        />
      </label>

      {/* Tarih çıkış */}
      <label className="flex flex-col gap-0.5 px-2 py-1.5 sm:py-2 border-t border-border sm:border-l sm:border-t-0">
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
          <Calendar className="size-3" aria-hidden="true" />
          Çıkış
        </span>
        <input
          type="date"
          value={checkout}
          min={checkin}
          onChange={(e) => setCheckout(e.target.value)}
          className="text-foreground bg-transparent text-sm font-semibold outline-none sm:text-base"
        />
      </label>

      {/* Kişi */}
      <label className="flex flex-col gap-0.5 px-2 py-1.5 sm:py-2 border-t border-border sm:border-l sm:border-t-0">
        <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
          <Users className="size-3" aria-hidden="true" />
          Kişi
        </span>
        <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            aria-label="Yetişkin sayısı"
            className="bg-transparent outline-none"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} yetişkin</option>
            ))}
          </select>
          <span className="text-muted-foreground">+</span>
          <select
            value={kids}
            onChange={(e) => setKids(Number(e.target.value))}
            aria-label="Çocuk sayısı"
            className="bg-transparent outline-none"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} çocuk</option>
            ))}
          </select>
        </div>
      </label>

      {/* Konsept — sadece panel variant'ında, inline'da yok */}
      {!isInline ? (
        <label className="flex flex-col gap-0.5 px-2 py-1.5 sm:py-2 border-t border-border sm:border-l sm:border-t-0">
          <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">
            Konsept
          </span>
          <select
            value={concept}
            onChange={(e) => setConcept(e.target.value as Concept | '')}
            className="text-foreground bg-transparent text-sm font-semibold outline-none sm:text-base"
          >
            {CONCEPTS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
      ) : null}

      {/* Submit */}
      <button
        type="submit"
        className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r px-5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 sm:h-auto"
      >
        <Search className="size-4" aria-hidden="true" />
        Tatil ara
      </button>
    </form>
  );
}
