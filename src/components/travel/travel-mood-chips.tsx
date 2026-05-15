'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface TravelMood {
  emoji: string;
  label: string;
  prompt: string;
}

const MOODS: TravelMood[] = [
  { emoji: '💕', label: 'Romantik kaçamak', prompt: 'Çiftler için romantik bir kaçamak tatili öner' },
  { emoji: '👨‍👩‍👧', label: 'Aile tatili', prompt: 'Çocuklarla gidebileceğimiz, her şey dahil bir aile tatili öner' },
  { emoji: '🏖️', label: 'Deniz keyfi', prompt: 'Deniz manzaralı, plaja yakın bir otel öner' },
  { emoji: '🏔️', label: 'Doğa & yayla', prompt: 'Karadeniz yaylaları, doğayla iç içe tatil öner' },
  { emoji: '⛵', label: 'Ege kaçamağı', prompt: 'Bodrum, Çeşme veya Alaçatı için 2-3 günlük plan' },
  { emoji: '🌅', label: 'Bayram tatili', prompt: 'Yaklaşan bayram için her şey dahil tatil paketi' },
  { emoji: '🧖', label: 'Spa & wellness', prompt: 'Termal otel veya spa odaklı dinlendirici bir tatil' },
  { emoji: '🌍', label: 'Kültür turu', prompt: 'Kapadokya, Efes veya Sümela gibi kültür turu öner' },
];

export function TravelMoodChips() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MOODS.map((m) => (
        <Link
          key={m.label}
          href={`/tatil/kesfet?q=${encodeURIComponent(m.prompt)}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-all hover:scale-105 hover:bg-white/25 sm:text-sm',
          )}
        >
          <span className="text-sm sm:text-base" aria-hidden="true">
            {m.emoji}
          </span>
          <span>{m.label}</span>
        </Link>
      ))}
    </div>
  );
}
