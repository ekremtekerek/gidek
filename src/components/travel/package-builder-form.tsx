'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Baby,
  Banknote,
  CalendarDays,
  CookingPot,
  Heart,
  Loader2,
  MapPin,
  Mountain,
  Palette,
  PartyPopper,
  Send,
  Sparkles,
  Sun,
  User,
  Waves,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Combobox } from '@/components/ui/combobox';

interface Theme {
  slug: string;
  label: string;
  icon: React.ReactNode;
}

const THEMES: Theme[] = [
  { slug: 'deniz', label: 'Deniz & sahil', icon: <Waves className="size-4" /> },
  { slug: 'romantik', label: 'Romantik', icon: <Heart className="size-4" /> },
  { slug: 'aile', label: 'Aile', icon: <Baby className="size-4" /> },
  { slug: 'kultur', label: 'Kültür & tarih', icon: <Palette className="size-4" /> },
  { slug: 'yemek', label: 'Yemek', icon: <CookingPot className="size-4" /> },
  { slug: 'spa', label: 'Spa & wellness', icon: <Sparkles className="size-4" /> },
  { slug: 'doga', label: 'Doğa & hiking', icon: <Mountain className="size-4" /> },
  { slug: 'eglence', label: 'Gece eğlence', icon: <PartyPopper className="size-4" /> },
];

interface Props {
  locations: string[];
}

export function PackageBuilderForm({ locations }: Props) {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState(20000);
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [days, setDays] = useState(4);
  const [themes, setThemes] = useState<string[]>(['deniz']);
  const [submitting, setSubmitting] = useState(false);

  const toggleTheme = (slug: string) => {
    setThemes((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setSubmitting(true);
    const params = new URLSearchParams();
    params.set('dest', destination);
    params.set('budget', String(budget));
    params.set('adults', String(adults));
    if (kids > 0) params.set('kids', String(kids));
    params.set('days', String(days));
    if (themes.length > 0) params.set('themes', themes.join(','));
    router.push(`/tatil/paket?${params.toString()}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-background space-y-5 rounded-2xl border p-5 shadow-md sm:p-6"
    >
      {/* Destinasyon */}
      <div className="space-y-1.5">
        <label
          htmlFor="dest"
          className="text-foreground/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
        >
          <MapPin className="size-3.5" aria-hidden="true" />
          Nereye?
        </label>
        <Combobox
          options={locations}
          value={destination}
          onChange={setDestination}
          placeholder="Bodrum, Antalya, Kapadokya…"
          label="Destinasyon seç"
        />
      </div>

      {/* Bütçe + Süre */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="budget"
            className="text-foreground/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
          >
            <Banknote className="size-3.5" aria-hidden="true" />
            Toplam bütçe (₺)
          </label>
          <input
            id="budget"
            type="number"
            min={3000}
            max={500000}
            step={1000}
            required
            value={budget}
            onChange={(e) => setBudget(Math.max(3000, Number(e.target.value) || 0))}
            className="border-border bg-background focus:ring-sky-500/30 focus:border-sky-500 h-11 w-full rounded-xl border px-3 text-sm font-semibold transition-all focus:ring-2"
          />
          <p className="text-muted-foreground text-[11px]">Otel + yemek + aktivite hepsi dahil</p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="days"
            className="text-foreground/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
          >
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Kaç gün?
          </label>
          <input
            id="days"
            type="number"
            min={1}
            max={14}
            required
            value={days}
            onChange={(e) =>
              setDays(Math.max(1, Math.min(14, Number(e.target.value) || 1)))
            }
            className="border-border bg-background focus:ring-sky-500/30 focus:border-sky-500 h-11 w-full rounded-xl border px-3 text-sm font-semibold transition-all focus:ring-2"
          />
        </div>
      </div>

      {/* Yolcu */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="adults"
            className="text-foreground/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
          >
            <User className="size-3.5" aria-hidden="true" />
            Yetişkin
          </label>
          <input
            id="adults"
            type="number"
            min={1}
            max={8}
            required
            value={adults}
            onChange={(e) =>
              setAdults(Math.max(1, Math.min(8, Number(e.target.value) || 1)))
            }
            className="border-border bg-background focus:ring-sky-500/30 focus:border-sky-500 h-11 w-full rounded-xl border px-3 text-sm font-semibold transition-all focus:ring-2"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="kids"
            className="text-foreground/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase"
          >
            <Baby className="size-3.5" aria-hidden="true" />
            Çocuk
          </label>
          <input
            id="kids"
            type="number"
            min={0}
            max={6}
            value={kids}
            onChange={(e) =>
              setKids(Math.max(0, Math.min(6, Number(e.target.value) || 0)))
            }
            className="border-border bg-background focus:ring-sky-500/30 focus:border-sky-500 h-11 w-full rounded-xl border px-3 text-sm font-semibold transition-all focus:ring-2"
          />
        </div>
      </div>

      {/* Tarz */}
      <div className="space-y-2">
        <label className="text-foreground/80 inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
          <Sun className="size-3.5" aria-hidden="true" />
          Tarz (birden çok seç)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => {
            const active = themes.includes(t.slug);
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggleTheme(t.slug)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  active
                    ? 'bg-foreground text-background shadow-md scale-[1.02]'
                    : 'border border-border bg-muted hover:bg-foreground/10',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!destination.trim() || submitting}
        className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl"
      >
        {submitting ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            AI paketini kuruyor…
          </>
        ) : (
          <>
            <Send className="size-5" aria-hidden="true" />
            AI tatil paketi tasarla
          </>
        )}
      </button>
    </form>
  );
}
