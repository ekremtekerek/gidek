'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Filter, MapPin, Search, Users } from 'lucide-react';
import { Select, type SelectOption } from '@/components/ui/select';
import { CONCEPT_LABEL, type Concept } from '@/lib/travel/enrich';

interface Props {
  locations: string[];
}

const CONCEPT_OPTIONS: SelectOption<Concept | ''>[] = [
  { value: '', label: 'Tüm konseptler' },
  { value: 'all-inclusive', label: CONCEPT_LABEL['all-inclusive'] },
  { value: 'breakfast', label: CONCEPT_LABEL.breakfast },
  { value: 'half-board', label: CONCEPT_LABEL['half-board'] },
  { value: 'room-only', label: CONCEPT_LABEL['room-only'] },
];

const ADULT_OPTIONS: SelectOption<string>[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: `${n} yetişkin`,
}));

const KID_OPTIONS: SelectOption<string>[] = [0, 1, 2, 3, 4].map((n) => ({
  value: String(n),
  label: `${n} çocuk`,
}));

/**
 * Sağ kolon — klasik filtre/arama formu (alternatif yol).
 * AI ile sohbet etmek istemeyen kullanıcılar için.
 */
export function TravelClassicForm({ locations }: Props) {
  const router = useRouter();
  const [defaults] = useState(() => {
    const now = Date.now();
    const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
    return {
      today: fmt(now),
      tomorrow: fmt(now + 86400000),
      week: fmt(now + 7 * 86400000),
    };
  });

  const [dest, setDest] = useState('');
  const [checkin, setCheckin] = useState(defaults.tomorrow);
  const [checkout, setCheckout] = useState(defaults.week);
  const [adults, setAdults] = useState('2');
  const [kids, setKids] = useState('0');
  const [concept, setConcept] = useState<Concept | ''>('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (dest) params.set('dest', dest);
    params.set('checkin', checkin);
    params.set('checkout', checkout);
    params.set('adults', adults);
    if (kids !== '0') params.set('kids', kids);
    if (concept) params.set('concept', concept);
    router.push(`/tatil/ara?${params.toString()}`);
  }

  return (
    <div className="bg-background flex h-full w-full flex-col gap-3 rounded-2xl border border-white/20 p-4 shadow-2xl sm:gap-4 sm:p-5">
      <div className="text-foreground">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest">
          <Filter className="text-muted-foreground size-3.5" aria-hidden="true" />
          Klasik arama
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Filtrele, harita üzerinde gör.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        {/* Destinasyon */}
        <FieldShell icon={<MapPin className="size-3" />} label="Nereye">
          <input
            type="text"
            list="travel-dest-list"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="Bodrum, Antalya..."
            className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm font-semibold outline-none"
          />
          <datalist id="travel-dest-list">
            {locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </FieldShell>

        {/* Tarih */}
        <div className="grid grid-cols-2 gap-2">
          <FieldShell icon={<Calendar className="size-3" />} label="Giriş">
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
              className="text-foreground w-full bg-transparent text-sm font-semibold outline-none"
            />
          </FieldShell>
          <FieldShell icon={<Calendar className="size-3" />} label="Çıkış">
            <input
              type="date"
              value={checkout}
              min={checkin}
              onChange={(e) => setCheckout(e.target.value)}
              className="text-foreground w-full bg-transparent text-sm font-semibold outline-none"
            />
          </FieldShell>
        </div>

        {/* Kişi */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={adults}
            onChange={setAdults}
            options={ADULT_OPTIONS}
            label="Yetişkin"
            size="sm"
          />
          <Select
            value={kids}
            onChange={setKids}
            options={KID_OPTIONS}
            label="Çocuk"
            size="sm"
          />
        </div>

        {/* Konsept */}
        <Select<Concept | ''>
          value={concept}
          onChange={setConcept}
          options={CONCEPT_OPTIONS}
          label="Konsept"
        />

        {/* Submit */}
        <button
          type="submit"
          className="border-border bg-foreground text-background hover:bg-foreground/90 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
        >
          <Search className="size-4" aria-hidden="true" />
          Filtreyle ara
        </button>
      </form>
    </div>
  );
}

function FieldShell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="border-border bg-background hover:border-foreground/30 flex flex-col gap-0.5 rounded-md border px-3 py-2 transition-colors focus-within:border-foreground/40">
      <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

// Users ikonu için import (yetişkin/çocuk için generic ikon — şu an Select'te kullanmıyoruz)
export const _USERS_ICON_USED = Users;
