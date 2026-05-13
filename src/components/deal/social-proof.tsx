import { Flame, Users } from 'lucide-react';

interface Props {
  /** Toplam satış adedi (DB sold_count). */
  soldCount: number;
  /** Toplam görüntülenme (view_count). */
  viewCount?: number;
  className?: string;
}

/**
 * Deal detayda kullanılan sosyal kanıt şeritleri. Sayılar gerçek DB
 * değerleridir — pazarlama amaçlı uydurma yok. Eğer ne satış ne görüntülenme
 * varsa render etmiyor (yeni eklenmiş deal'da boş bir rozet zarar verir).
 */
export function SocialProof({ soldCount, viewCount, className }: Props) {
  const items: { icon: typeof Flame; label: string; tone: 'fire' | 'muted' }[] = [];

  if (soldCount > 0) {
    items.push({
      icon: Flame,
      label:
        soldCount >= 50
          ? `Bu hafta çok talep var · ${soldCount.toLocaleString('tr-TR')} kez satıldı`
          : soldCount >= 10
          ? `${soldCount.toLocaleString('tr-TR')} kez satıldı`
          : `Yeni · ${soldCount.toLocaleString('tr-TR')} kişi rezerve etti`,
      tone: soldCount >= 10 ? 'fire' : 'muted',
    });
  }

  if (viewCount && viewCount >= 100) {
    items.push({
      icon: Users,
      label: `${viewCount.toLocaleString('tr-TR')} kişi inceledi`,
      tone: 'muted',
    });
  }

  if (items.length === 0) return null;

  return (
    <ul className={className}>
      {items.map((it, i) => (
        <li
          key={i}
          className={
            it.tone === 'fire'
              ? 'inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400'
              : 'inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-muted-foreground text-xs font-medium'
          }
        >
          <it.icon className="size-3.5" aria-hidden="true" />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
