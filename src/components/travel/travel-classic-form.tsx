'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, Filter, MapPin, Search, Users } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { DateField } from '@/components/ui/date-field';
import { Select, type SelectOption } from '@/components/ui/select';
import { CONCEPT_LABEL, type Concept } from '@/lib/travel/enrich';
import { searchPlaces } from '@/lib/travel/geocoding';

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

const ROOM_OPTIONS: SelectOption<string>[] = [1, 2, 3].map((n) => ({
  value: String(n),
  label: `${n} oda`,
}));

const KID_AGE_OPTIONS: SelectOption<string>[] = Array.from({ length: 18 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? '<1 yaş' : `${i} yaş`,
}));

/**
 * Sağ kolon — klasik filtre/arama formu (alternatif yol).
 * Tüm field'lar custom UI primitives: Combobox (destinasyon), DateField
 * (tarihler), Select (yetişkin/çocuk/konsept). Native tarayıcı widget'ları yok.
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
  const [kidAges, setKidAges] = useState<string[]>([]);
  const [rooms, setRooms] = useState('1');
  const [concept, setConcept] = useState<Concept | ''>('');

  // kids değişince yaş array'i otomatik boyutlanır (default 5 yaş)
  const kidCount = Number(kids);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKidAges((prev) => {
      if (prev.length === kidCount) return prev;
      if (prev.length < kidCount) {
        return [...prev, ...Array(kidCount - prev.length).fill('5')];
      }
      return prev.slice(0, kidCount);
    });
  }, [kidCount]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (dest) params.set('dest', dest);
    if (kidAges.length > 0) params.set('kidAges', kidAges.join(','));
    if (rooms !== '1') params.set('rooms', rooms);
    if (checkin) params.set('checkin', checkin);
    if (checkout) params.set('checkout', checkout);
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
        {/* Destinasyon — Combobox */}
        <FieldLabel icon={<MapPin className="size-3" />} label="Nereye">
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
        </FieldLabel>

        {/* Tarih — DateField (react-day-picker custom popup) */}
        <div className="grid grid-cols-2 gap-2">
          <FieldLabel icon={<Calendar className="size-3" />} label="Giriş">
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
              placeholder="Tarih seç"
            />
          </FieldLabel>
          <FieldLabel icon={<Calendar className="size-3" />} label="Çıkış">
            <DateField
              name="checkout"
              value={checkout}
              onChange={setCheckout}
              min={checkin || defaults.today}
              placeholder="Tarih seç"
            />
          </FieldLabel>
        </div>

        {/* Kişi — Select */}
        <div className="grid grid-cols-2 gap-2">
          <FieldLabel icon={<Users className="size-3" />} label="Yetişkin">
            <Select
              value={adults}
              onChange={setAdults}
              options={ADULT_OPTIONS}
              label="Yetişkin sayısı"
            />
          </FieldLabel>
          <FieldLabel icon={<Users className="size-3" />} label="Çocuk">
            <Select
              value={kids}
              onChange={setKids}
              options={KID_OPTIONS}
              label="Çocuk sayısı"
            />
          </FieldLabel>
        </div>

        {/* Çocuk yaşları — sadece çocuk seçildiyse */}
        {kidCount > 0 ? (
          <FieldLabel label={`${kidCount} çocuğun yaşı`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: kidCount }).map((_, i) => (
                <Select
                  key={i}
                  value={kidAges[i] ?? '5'}
                  onChange={(v) =>
                    setKidAges((prev) => {
                      const next = [...prev];
                      next[i] = v;
                      return next;
                    })
                  }
                  options={KID_AGE_OPTIONS}
                  label={`${i + 1}. çocuk yaşı`}
                />
              ))}
            </div>
          </FieldLabel>
        ) : null}

        {/* Oda sayısı */}
        <FieldLabel label="Oda sayısı">
          <Select value={rooms} onChange={setRooms} options={ROOM_OPTIONS} label="Oda sayısı" />
        </FieldLabel>

        {/* Konsept — Select */}
        <FieldLabel label="Konsept">
          <Select<Concept | ''>
            value={concept}
            onChange={setConcept}
            options={CONCEPT_OPTIONS}
            label="Tatil konsepti"
          />
        </FieldLabel>

        {/* Submit */}
        <button
          type="submit"
          className="border-border bg-foreground text-background hover:bg-foreground/90 mt-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
        >
          <Search className="size-4" aria-hidden="true" />
          Filtreyle ara
        </button>
      </form>
    </div>
  );
}

function FieldLabel({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}
