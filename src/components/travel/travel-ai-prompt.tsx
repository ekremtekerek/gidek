'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const QUICK_PROMPTS = [
  '4 gece Bodrum, çift için her şey dahil',
  'Aileyle Antalya, çocuklu, deniz manzaralı',
  'Romantik Kapadokya kaçamağı, balon dahil',
  'Bayram tatili Uzungöl, doğa odaklı',
];

/**
 * Sol kolon — büyük AI prompt input + "AI farkımız" vurgusu.
 * Submit edilince /tatil/kesfet'e ?q= ile gider.
 */
export function TravelAIPrompt() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push('/tatil/kesfet');
      return;
    }
    router.push(`/tatil/kesfet?q=${encodeURIComponent(q)}`);
  }

  function quickPick(prompt: string) {
    setValue(prompt);
    router.push(`/tatil/kesfet?q=${encodeURIComponent(prompt)}`);
  }

  return (
    <div className="relative flex h-full flex-col gap-4 sm:gap-5">
      {/* Üst etiket — AI vurgusu */}
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">
        <Sparkles className="size-3.5" aria-hidden="true" />
        AI farkımız
      </div>

      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
          Tatilini{' '}
          <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
            doğal dille
          </span>{' '}
          anlat
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/90 sm:text-base">
          Filtre tıklama bitti. Bodrum, Antalya, Kapadokya — Gemini destekli AI
          sana özel <strong className="text-white">3 paket</strong> çıkarsın.
        </p>
      </div>

      {/* AI prompt input — büyük */}
      <form
        onSubmit={submit}
        className={cn(
          'group/prompt relative flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-2xl transition-all sm:gap-3 sm:p-4',
          focused && 'ring-foreground/30 ring-4',
        )}
      >
        <label htmlFor="travel-ai-input" className="sr-only">
          AI tatil sorgusu
        </label>
        <div className="flex items-start gap-2">
          <span className="from-sky-600 to-cyan-500 mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-md">
            <Wand2 className="size-4 text-white" aria-hidden="true" />
          </span>
          <textarea
            id="travel-ai-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Nereye, ne zaman, kaç kişi, bütçe? Doğal dille yaz..."
            rows={2}
            maxLength={500}
            className="text-foreground placeholder:text-muted-foreground min-h-[58px] flex-1 resize-none bg-transparent text-base outline-none sm:text-lg"
          />
        </div>

        <button
          type="submit"
          className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] sm:h-12"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          AI ile keşfet
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </button>
      </form>

      {/* Hızlı promptlar */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
          Hızlı başlangıçlar
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => quickPick(p)}
                className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/20"
              >
                <Sparkles className="size-3 shrink-0 opacity-70" aria-hidden="true" />
                <span className="truncate">{p}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
