'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, MapPin, Search, Users } from 'lucide-react';
import { Select, type SelectOption } from '@/components/ui/select';
import { CONCEPT_LABEL, type Concept } from '@/lib/travel/enrich';

interface Props {
  locations: string[];
  initial?: {
    destination?: string;
    checkin?: string;
    checkout?: string;
    adults?: number;
    kids?: number;
    concept?: Concept | '';
  };
}

const CONCEPT_OPTS: SelectOption<Concept | ''>[] = [
  { value: '', label: 'Tüm konseptler' },
  { value: 'all-inclusive', label: CONCEPT_LABEL['all-inclusive'] },
  { value: 'breakfast', label: CONCEPT_LABEL.breakfast },
  { value: 'half-board', label: CONCEPT_LABEL['half-board'] },
  { value: 'room-only', label: CONCEPT_LABEL['room-only'] },
];

const ADULT_OPTS: SelectOption<string>[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: `${n} yetişkin`,
}));
const KID_OPTS: SelectOption<string>[] = [0, 1, 2, 3, 4].map((n) => ({
  value: String(n),
  label: `${n} çocuk`,
}));

/**
 * /tatil/ara üstündeki kompakt sticky yatay arama bandı.
 * 6 alan tek satır (lg+) ya da 2x3 grid (sm).
 */
export function TravelTopSearchBar({ locations, initial }: Props) {
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

  const [dest, setDest] = useState(initial?.destination ?? '');
  const [checkin, setCheckin] = useState(initial?.checkin ?? defaults.tomorrow);
  const [checkout, setCheckout] = useState(initial?.checkout ?? defaults.week);
  const [adults, setAdults] = useState(String(initial?.adults ?? 2));
  const [kids, setKids] = useState(String(initial?.kids ?? 0));
  const [concept, setConcept] = useState<Concept | ''>(initial?.concept ?? '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (dest) p.set('dest', dest);
    p.set('checkin', checkin);
    p.set('checkout', checkout);
    p.set('adults', adults);
    if (kids !== '0') p.set('kids', kids);
    if (concept) p.set('concept', concept);
    router.push(`/tatil/ara?${p.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-background grid gap-2 rounded-xl border p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]"
    >
      <FieldShell icon={<MapPin className="size-3" />} label="Nereye">
        <input
          type="text"
          list="travel-top-locations"
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Şehir veya bölge"
          className="text-foreground placeholder:text-muted-foreground w-full bg-transparent text-sm font-semibold outline-none"
        />
        <datalist id="travel-top-locations">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </FieldShell>

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

      <SelectShell icon={<Users className="size-3" />} label="Yetişkin">
        <Select value={adults} onChange={setAdults} options={ADULT_OPTS} size="sm" label="Yetişkin" />
      </SelectShell>

      <SelectShell label="Çocuk">
        <Select value={kids} onChange={setKids} options={KID_OPTS} size="sm" label="Çocuk" />
      </SelectShell>

      <button
        type="submit"
        className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 col-span-full inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r px-5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] lg:col-span-1"
      >
        <Search className="size-4" aria-hidden="true" />
        Ara
      </button>

      {/* Konsept select tüm satır altında, mobile'da en altta */}
      <div className="col-span-full">
        <Select<Concept | ''>
          value={concept}
          onChange={setConcept}
          options={CONCEPT_OPTS}
          size="sm"
          label="Konsept"
        />
      </div>
    </form>
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
    <label className="border-border hover:border-foreground/30 focus-within:border-foreground/40 flex flex-col gap-0.5 rounded-md border px-3 py-1.5 transition-colors">
      <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function SelectShell({
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  // Select kendi içinde border ve label-style sağlar; wrapper sadece label
  // metni için. SR-only label primary olarak Select'in label prop'undan geliyor.
  return (
    <div className="flex flex-col gap-0.5">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
