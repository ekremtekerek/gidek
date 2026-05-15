'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { Select, type SelectOption } from '@/components/ui/select';
import { searchPlaces } from '@/lib/travel/geocoding';

interface Props {
  locations: string[];
}

const NIGHTS_OPTIONS: SelectOption<string>[] = [1, 2, 3, 4, 5, 6, 7, 10].map((n) => ({
  value: String(n),
  label: `${n} gece`,
}));
const ADULT_OPTIONS: SelectOption<string>[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  value: String(n),
  label: `${n} yetişkin`,
}));
const KID_OPTIONS: SelectOption<string>[] = [0, 1, 2, 3, 4].map((n) => ({
  value: String(n),
  label: `${n} çocuk`,
}));

const PRESET_PREFS = [
  'Romantik, sessiz, sakin',
  'Aile odaklı, çocuk dostu',
  'Doğa ve aktivite ağırlıklı',
  'Şehir + kültür gezisi',
];

/**
 * AI plan formu — destinasyon + gün + kişi + ek tercih.
 * Submit edilince /tatil/plan?dest=...&nights=... ile aynı sayfada plan üretilir.
 */
export function TravelPlanForm({ locations }: Props) {
  const router = useRouter();
  const [dest, setDest] = useState('');
  const [nights, setNights] = useState('4');
  const [adults, setAdults] = useState('2');
  const [kids, setKids] = useState('0');
  const [pref, setPref] = useState('');
  const [pending, setPending] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dest.trim()) return;
    setPending(true);
    const params = new URLSearchParams();
    params.set('dest', dest.trim());
    params.set('nights', nights);
    params.set('adults', adults);
    if (kids !== '0') params.set('kids', kids);
    if (pref.trim()) params.set('pref', pref.trim());
    router.push(`/tatil/plan?${params.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="border-border bg-background flex flex-col gap-4 rounded-2xl border p-5 shadow-xl sm:p-6"
    >
      {/* Destinasyon */}
      <FieldLabel label="Nereye gideceksin?">
        <Combobox
          value={dest}
          onChange={setDest}
          options={locations}
          asyncSearch={async (q, signal) => {
            const results = await searchPlaces(q, signal);
            return results.map((r) => r.short);
          }}
          placeholder="Bodrum, Antalya, Kapadokya..."
          label="Tatil destinasyonu"
          size="md"
        />
      </FieldLabel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <FieldLabel label="Süre">
          <Select value={nights} onChange={setNights} options={NIGHTS_OPTIONS} label="Gece" />
        </FieldLabel>
        <FieldLabel label="Yetişkin">
          <Select value={adults} onChange={setAdults} options={ADULT_OPTIONS} label="Yetişkin" />
        </FieldLabel>
        <FieldLabel label="Çocuk">
          <Select value={kids} onChange={setKids} options={KID_OPTIONS} label="Çocuk" />
        </FieldLabel>
      </div>

      {/* Ek tercih */}
      <FieldLabel label="Ek tercih (opsiyonel)">
        <input
          type="text"
          value={pref}
          onChange={(e) => setPref(e.target.value)}
          placeholder="Romantik, çocuk dostu, doğa, kültür..."
          maxLength={120}
          className="border-border bg-background hover:border-foreground/30 focus:border-foreground/50 placeholder:text-muted-foreground h-11 w-full rounded-md border px-3.5 text-sm outline-none transition-colors"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESET_PREFS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPref(p)}
              className="border-border hover:border-sky-500/40 hover:bg-sky-500/5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-all"
            >
              <Sparkles className="size-3 text-sky-600" aria-hidden="true" />
              {p}
            </button>
          ))}
        </div>
      </FieldLabel>

      {/* Submit */}
      <button
        type="submit"
        disabled={!dest.trim() || pending}
        className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 disabled:from-muted disabled:to-muted disabled:text-muted-foreground inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r text-base font-bold text-white shadow-md transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Wand2 className="size-5" aria-hidden="true" />
        {pending ? 'AI plan kuruyor…' : 'AI plan kur'}
      </button>

      <p className="text-muted-foreground text-center text-[11px]">
        Gemini 2.5 Flash · Tahmini 4-8 saniyede plan
      </p>
    </form>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}
