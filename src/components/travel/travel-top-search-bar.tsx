'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Search, Users } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { DateField } from '@/components/ui/date-field';
import { Select, type SelectOption } from '@/components/ui/select';
import { CONCEPT_LABEL, type Concept } from '@/lib/travel/enrich';
import { searchPlaces } from '@/lib/travel/geocoding';

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
 * Tüm controller'lar custom UI: Combobox + DateField + Select. Native widget
 * yok — tutarlı tasarım her yerde.
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
    if (checkin) p.set('checkin', checkin);
    if (checkout) p.set('checkout', checkout);
    p.set('adults', adults);
    if (kids !== '0') p.set('kids', kids);
    if (concept) p.set('concept', concept);
    router.push(`/tatil/ara?${p.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-background rounded-xl border p-2.5 shadow-sm"
    >
      {/* Üst satır — destinasyon, tarihler */}
      <div className="grid gap-2 sm:grid-cols-3">
        <Combobox
          value={dest}
          onChange={setDest}
          options={locations}
          asyncSearch={async (q, signal) => {
            const results = await searchPlaces(q, signal);
            return results.map((r) => r.short);
          }}
          placeholder="Şehir, ilçe veya bölge yaz..."
          label="Tatil destinasyonu"
          size="md"
        />
        <DateField
          name="checkin"
          value={checkin}
          onChange={(v) => {
            setCheckin(v);
            if (v && v >= checkout) {
              const next = new Date(v);
              next.setDate(next.getDate() + 3);
              setCheckout(next.toISOString().slice(0, 10));
            }
          }}
          min={defaults.today}
          placeholder="Giriş tarihi"
        />
        <DateField
          name="checkout"
          value={checkout}
          onChange={setCheckout}
          min={checkin || defaults.today}
          placeholder="Çıkış tarihi"
        />
      </div>

      {/* Alt satır — kişi/konsept/ara */}
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
        <Select
          value={adults}
          onChange={setAdults}
          options={ADULT_OPTS}
          label="Yetişkin sayısı"
        />
        <Select
          value={kids}
          onChange={setKids}
          options={KID_OPTS}
          label="Çocuk sayısı"
        />
        <Select<Concept | ''>
          value={concept}
          onChange={setConcept}
          options={CONCEPT_OPTS}
          label="Tatil konsepti"
        />
        <button
          type="submit"
          className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r px-5 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02]"
        >
          <Search className="size-4" aria-hidden="true" />
          Ara
        </button>
      </div>

      {/* Sr-only label'lar */}
      <span className="sr-only">
        <Calendar className="size-3" aria-hidden="true" />
        <Users className="size-3" aria-hidden="true" />
      </span>
    </form>
  );
}
