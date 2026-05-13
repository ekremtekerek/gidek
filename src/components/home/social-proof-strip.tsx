import { Building2, MapPin, Sparkles, Star } from 'lucide-react';
import { Container } from '@/components/ui/container';
import type { PlatformStats } from '@/lib/db/queries/stats';

interface Props {
  stats: PlatformStats;
}

/**
 * Anasayfada güven kazandıran sosyal kanıt şeridi. Tüm sayılar gerçek
 * DB sayımlarından gelir; "1000+" gibi yuvarlamalar yapmıyoruz.
 */
export function SocialProofStrip({ stats }: Props) {
  const items = [
    {
      icon: Sparkles,
      value: stats.activeDeals.toLocaleString('tr-TR'),
      label: 'aktif fırsat',
    },
    {
      icon: Building2,
      value: stats.merchants.toLocaleString('tr-TR'),
      label: 'işletme',
    },
    {
      icon: MapPin,
      value: stats.cities.toLocaleString('tr-TR'),
      label: 'şehirde',
    },
    {
      icon: Star,
      value:
        stats.ratingAvg && stats.reviews > 0
          ? `${stats.ratingAvg.toFixed(1)} / 5`
          : '—',
      label:
        stats.reviews > 0
          ? `${stats.reviews.toLocaleString('tr-TR')} değerlendirme`
          : 'değerlendirme',
    },
  ];

  return (
    <section
      aria-label="Platform özeti"
      className="bg-muted/40 border-border border-y py-8 sm:py-10"
    >
      <Container>
        <ul className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {items.map((it) => (
            <li key={it.label} className="flex flex-col items-center gap-1.5 text-center">
              <span className="bg-background text-foreground/80 inline-flex size-10 items-center justify-center rounded-full shadow-sm">
                <it.icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-2xl font-semibold sm:text-3xl tabular-nums">
                {it.value}
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm">{it.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
