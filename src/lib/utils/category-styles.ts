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

/**
 * Kategori başına ikon + renk paleti. Hem anasayfa CategoryGrid hem harita
 * filtre chip'leri buradan beslenir; rengin görsel hafızası tutarlı kalır.
 */
export interface CategoryStyle {
  Icon: LucideIcon;
  /** Tailwind background (subtle, color-tinted) */
  bg: string;
  /** Tailwind foreground (dark + light variant) */
  fg: string;
  /** Aktif chip için yoğun background (tek renk doygunluğu) */
  activeBg: string;
}

export const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  tiyatro: {
    Icon: Theater,
    bg: 'bg-purple-500/10',
    fg: 'text-purple-600 dark:text-purple-300',
    activeBg: 'bg-purple-500',
  },
  konser: {
    Icon: Music,
    bg: 'bg-indigo-500/10',
    fg: 'text-indigo-600 dark:text-indigo-300',
    activeBg: 'bg-indigo-500',
  },
  'stand-up': {
    Icon: Mic,
    bg: 'bg-yellow-500/10',
    fg: 'text-yellow-700 dark:text-yellow-300',
    activeBg: 'bg-yellow-500',
  },
  aktivite: {
    Icon: Compass,
    bg: 'bg-teal-500/10',
    fg: 'text-teal-600 dark:text-teal-300',
    activeBg: 'bg-teal-500',
  },
  masaj: {
    Icon: Hand,
    bg: 'bg-emerald-500/10',
    fg: 'text-emerald-600 dark:text-emerald-300',
    activeBg: 'bg-emerald-500',
  },
  guzellik: {
    Icon: Sparkles,
    bg: 'bg-pink-500/10',
    fg: 'text-pink-600 dark:text-pink-300',
    activeBg: 'bg-pink-500',
  },
  kahvalti: {
    Icon: Coffee,
    bg: 'bg-amber-500/10',
    fg: 'text-amber-700 dark:text-amber-300',
    activeBg: 'bg-amber-500',
  },
  yemek: {
    Icon: UtensilsCrossed,
    bg: 'bg-rose-500/10',
    fg: 'text-rose-600 dark:text-rose-300',
    activeBg: 'bg-rose-500',
  },
  turlar: {
    Icon: Map,
    bg: 'bg-sky-500/10',
    fg: 'text-sky-600 dark:text-sky-300',
    activeBg: 'bg-sky-500',
  },
  'sehir-otelleri': {
    Icon: BedDouble,
    bg: 'bg-slate-500/10',
    fg: 'text-slate-700 dark:text-slate-300',
    activeBg: 'bg-slate-600',
  },
  'tatil-otelleri': {
    Icon: Waves,
    bg: 'bg-cyan-500/10',
    fg: 'text-cyan-600 dark:text-cyan-300',
    activeBg: 'bg-cyan-500',
  },
  kurs: {
    Icon: GraduationCap,
    bg: 'bg-violet-500/10',
    fg: 'text-violet-600 dark:text-violet-300',
    activeBg: 'bg-violet-500',
  },
  hizmet: {
    Icon: Wrench,
    bg: 'bg-zinc-500/10',
    fg: 'text-zinc-700 dark:text-zinc-300',
    activeBg: 'bg-zinc-600',
  },
};
