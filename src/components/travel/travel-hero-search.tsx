'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

/**
 * Tatil hero'daki büyük arama input'u. Submit edilince /tatil/kesfet'e
 * ?q= ile yönlendirir; orada chat-container otomatik o promptla başlar.
 */
export function TravelHeroSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push('/tatil/kesfet');
      return;
    }
    router.push(`/tatil/kesfet?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex w-full items-center gap-2 rounded-full bg-white p-1.5 shadow-2xl ring-1 ring-white/20"
    >
      <span className="text-sky-600 inline-flex size-9 shrink-0 items-center justify-center">
        <Search className="size-5" aria-hidden="true" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Nereye? Ne zaman? Kaç kişi? Bütçe?"
        className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-1 py-2 text-sm outline-none sm:text-base"
        maxLength={200}
      />
      <button
        type="submit"
        className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r px-4 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        AI ile bul
      </button>
    </form>
  );
}
