import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { HeroSearch } from '@/components/home/hero-search';

const QUICK_PROMPTS = [
  { label: 'Cumartesi belli değil', q: 'Cumartesi akşamı eşimle ne yapabilirim 800 TL bütçeyle' },
  { label: 'Pazar ailecek', q: 'Pazar günü ailecek kahvaltı veya aktivite' },
  { label: 'Bu gece çıkacak yer', q: 'Bu gece eğlenceli bir mekan, müzik veya stand-up' },
  { label: 'Yorgunum, rahatlatıcı', q: 'Yorgunum, pazar günü huzurlu bir şey — masaj veya doğa' },
  { label: 'Doğum günü', q: 'Doğum günü için özel bir akşam yemeği veya aktivite' },
] as const;

export function HeroSection() {
  return (
    <section aria-label="Plan keşfi" className="relative isolate overflow-hidden">
      {/* decorative glow — pointer-events-none so it never blocks clicks */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 size-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-300/30 via-rose-300/20 to-blue-300/30 blur-3xl dark:from-amber-500/10 dark:via-rose-500/10 dark:to-blue-500/10" />
      </div>

      <Container className="flex flex-col items-center gap-6 px-4 py-16 text-center sm:py-20 md:py-28">
        <span className="border-border bg-background/70 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI destekli plan keşfi
        </span>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
          Plan kurmak zaman alır. <br className="hidden sm:block" />
          Yaz, biz <span className="text-foreground/60">hallederiz.</span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-base text-balance sm:text-lg">
          Hangi günde, kiminle, ne için… Anlat, gidek sana özel önerileri 5 saniyede çıkarsın.
        </p>

        <HeroSearch />

        <ul
          aria-label="Hızlı başlangıç önerileri"
          className="flex w-full max-w-3xl flex-wrap justify-center gap-2 pt-1"
        >
          {QUICK_PROMPTS.map((p) => (
            <li key={p.label}>
              <Link
                href={`/kesfet?q=${encodeURIComponent(p.q)}`}
                className="border-border bg-background/80 hover:border-foreground/40 hover:bg-background inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition-colors sm:text-sm"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
