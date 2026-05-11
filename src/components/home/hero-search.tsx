'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';

const PLACEHOLDER_EXAMPLES = [
  'Cumartesi 19:00 eşimle 600 TL’ye…',
  'Pazar sabahı ailecek kahvaltı',
  'Çocuğumla pazar günü bir aktivite',
  'Yorgunum — huzurlu bir şey',
  'Doğum günümde özel bir akşam',
];

export function HeroSearch() {
  const [value, setValue] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length),
      2800,
    );
    return () => clearInterval(id);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (value.trim() || PLACEHOLDER_EXAMPLES[placeholderIdx]).trim();
    router.push(`/kesfet?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-background/90 hover:border-foreground/30 focus-within:border-foreground/50 flex w-full max-w-2xl items-center gap-2 rounded-2xl border-2 p-2 shadow-sm transition-colors sm:p-2.5"
      role="search"
    >
      <label htmlFor="hero-search" className="sr-only">
        Ne yapmak istediğini yaz
      </label>
      <Search className="text-muted-foreground ms-2 size-5 shrink-0" aria-hidden="true" />
      <input
        id="hero-search"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
        autoComplete="off"
        maxLength={500}
        className="placeholder:text-muted-foreground/80 min-w-0 flex-1 bg-transparent text-base outline-none sm:text-lg"
      />
      <button
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors sm:px-5"
      >
        Keşfet
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}
