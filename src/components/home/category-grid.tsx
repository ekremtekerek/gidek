import Link from 'next/link';
import {
  type LucideIcon,
  BedDouble,
  Coffee,
  Compass,
  GraduationCap,
  Hand,
  Map,
  Mic,
  Music,
  Sparkles,
  Theater,
  UtensilsCrossed,
  Waves,
  Wrench,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';

type CategoryStyle = { Icon: LucideIcon; bg: string; fg: string };

const STYLE_BY_SLUG: Record<string, CategoryStyle> = {
  tiyatro: { Icon: Theater, bg: 'bg-purple-500/10', fg: 'text-purple-600 dark:text-purple-300' },
  konser: { Icon: Music, bg: 'bg-indigo-500/10', fg: 'text-indigo-600 dark:text-indigo-300' },
  'stand-up': { Icon: Mic, bg: 'bg-yellow-500/10', fg: 'text-yellow-700 dark:text-yellow-300' },
  aktivite: { Icon: Compass, bg: 'bg-teal-500/10', fg: 'text-teal-600 dark:text-teal-300' },
  masaj: { Icon: Hand, bg: 'bg-emerald-500/10', fg: 'text-emerald-600 dark:text-emerald-300' },
  guzellik: { Icon: Sparkles, bg: 'bg-pink-500/10', fg: 'text-pink-600 dark:text-pink-300' },
  kahvalti: { Icon: Coffee, bg: 'bg-amber-500/10', fg: 'text-amber-700 dark:text-amber-300' },
  yemek: { Icon: UtensilsCrossed, bg: 'bg-rose-500/10', fg: 'text-rose-600 dark:text-rose-300' },
  turlar: { Icon: Map, bg: 'bg-sky-500/10', fg: 'text-sky-600 dark:text-sky-300' },
  'sehir-otelleri': {
    Icon: BedDouble,
    bg: 'bg-slate-500/10',
    fg: 'text-slate-700 dark:text-slate-300',
  },
  'tatil-otelleri': { Icon: Waves, bg: 'bg-cyan-500/10', fg: 'text-cyan-600 dark:text-cyan-300' },
  kurs: {
    Icon: GraduationCap,
    bg: 'bg-violet-500/10',
    fg: 'text-violet-600 dark:text-violet-300',
  },
  hizmet: { Icon: Wrench, bg: 'bg-zinc-500/10', fg: 'text-zinc-700 dark:text-zinc-300' },
};

export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="py-12">
      <Container>
        <div className="mb-6 flex flex-col gap-1">
          <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight">
            Ya da kategorilerden keşfet
          </h2>
          <p className="text-muted-foreground text-sm">
            AI’ı atla, doğrudan ilgilendiğin kategoriye dal.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {MAIN_CATEGORIES.map((c) => {
            const style = STYLE_BY_SLUG[c.slug];
            if (!style) return null;
            const { Icon, bg, fg } = style;
            return (
              <li key={c.slug}>
                <Link
                  href={`/k/${c.slug}`}
                  className="border-border bg-background hover:border-foreground/30 group flex h-full flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <span
                    className={`${bg} ${fg} inline-flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-110`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium tracking-tight">{c.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
