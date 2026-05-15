'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Send, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const QUICK_PROMPTS = [
  '4 gece Bodrum, çift için her şey dahil',
  'Aileyle Antalya, çocuklu, deniz manzaralı',
  'Romantik Kapadokya kaçamağı, balon dahil',
  'Bayram tatili Uzungöl, doğa odaklı',
];

const ROTATING_PLACEHOLDERS = [
  'Tatilini bana anlat...',
  'Örn. "Eylül başı 3 gece Antalya"',
  'Bütçen ne kadar? Kaç kişi?',
  'Doğa, deniz, kültür — hangisi?',
  'Yaz: "her şey dahil 5 yıldız" yeter',
];

/**
 * Sol kolon — AI tatil sohbeti. Chat-bot konuşmasını taklit eder:
 * - Üstte AI'ın selam mesajı (avatar + balon + typing pulse)
 * - Quick prompts AI'ın önerdiği cevaplar gibi pill chip
 * - Altta kullanıcının cevap input'u (messenger tarzı, yuvarlak send)
 * - Placeholder her 3.5 sn döner — canlı sohbet hissi
 */
export function TravelAIPrompt() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Placeholder rotation — sadece input boş VE focus yokken
  useEffect(() => {
    if (value.length > 0 || focused) return;
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3500);
    return () => window.clearInterval(id);
  }, [value, focused]);

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
    router.push(`/tatil/kesfet?q=${encodeURIComponent(prompt)}`);
  }

  return (
    <div className="relative flex h-full flex-col gap-5">
      {/* AI farkımız etiketi */}
      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur">
        <Sparkles className="size-3.5" aria-hidden="true" />
        AI farkımız
      </div>

      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
          Tatilini{' '}
          <span className="bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">
            doğal dille
          </span>{' '}
          anlat
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          Filtre tıklama bitti. Gemini destekli AI sana özel{' '}
          <strong className="text-white">3 paket</strong> çıkarsın.
        </p>
      </div>

      {/* CHAT KART */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/85 relative flex flex-col gap-3 rounded-3xl border border-white/20 p-4 shadow-2xl backdrop-blur sm:p-5">
        {/* AI'ın açılış mesajı */}
        <div className="flex items-start gap-2.5">
          {/* AI avatar */}
          <div className="from-sky-600 via-cyan-500 to-teal-400 relative inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-md">
            <Wand2 className="size-4 text-white" aria-hidden="true" />
            {/* Online göstergesi */}
            <span
              aria-hidden="true"
              className="border-background absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 bg-emerald-500"
            />
          </div>

          {/* AI mesaj balonu */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="bg-muted/80 inline-flex max-w-fit items-baseline gap-2 rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm">
              <span className="text-foreground">
                Merhaba! 👋 Sana nasıl bir tatil planlayayım?
              </span>
            </div>
            <p className="text-muted-foreground inline-flex items-center gap-1.5 px-1.5 text-[11px]">
              <span aria-hidden="true" className="inline-flex items-center gap-0.5">
                <span className="size-1 animate-pulse rounded-full bg-emerald-500" />
                <span
                  className="size-1 animate-pulse rounded-full bg-emerald-500"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="size-1 animate-pulse rounded-full bg-emerald-500"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
              gidek AI · şimdi aktif
            </p>
          </div>
        </div>

        {/* Quick prompt önerileri — AI'ın sunduğu hızlı cevaplar */}
        <ul className="grid grid-cols-1 gap-1.5 ps-11 sm:grid-cols-2">
          {QUICK_PROMPTS.map((p) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => quickPick(p)}
                className="border-border bg-background hover:border-sky-500/40 hover:bg-sky-500/5 group/q inline-flex w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all hover:scale-[1.01]"
              >
                <Sparkles
                  className="size-3 shrink-0 text-sky-600 group-hover/q:scale-110 transition-transform"
                  aria-hidden="true"
                />
                <span className="text-foreground/80 group-hover/q:text-foreground line-clamp-1 text-left">
                  {p}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Kullanıcı cevap input'u — messenger tarzı */}
        <form
          onSubmit={submit}
          className={cn(
            'mt-2 flex items-end gap-2 rounded-2xl border bg-background p-1.5 shadow-sm transition-all',
            focused
              ? 'border-sky-500/50 ring-4 ring-sky-500/15'
              : 'border-border',
          )}
        >
          <label htmlFor="travel-ai-input" className="sr-only">
            Tatil sorgusu yaz
          </label>
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
            placeholder={ROTATING_PLACEHOLDERS[placeholderIdx]}
            rows={1}
            maxLength={500}
            className="text-foreground placeholder:text-muted-foreground/70 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none sm:text-base"
          />

          <button
            type="submit"
            disabled={value.trim().length === 0}
            aria-label="Gönder"
            className={cn(
              'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-all',
              value.trim().length === 0
                ? 'bg-muted text-muted-foreground'
                : 'from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 bg-gradient-to-br text-white shadow-md hover:scale-110',
            )}
          >
            <Send className="size-4 -translate-x-px translate-y-px" aria-hidden="true" />
          </button>
        </form>

        {/* Alt mini etiket */}
        <p className="text-muted-foreground/70 text-center text-[10px]">
          Enter ile gönder · Shift+Enter yeni satır
        </p>
      </div>
    </div>
  );
}
