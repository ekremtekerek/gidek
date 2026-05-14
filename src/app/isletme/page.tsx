import Link from 'next/link';
import { CalendarCheck, CircleDollarSign, ShieldCheck, Sparkles, Star, Ticket } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  getMerchantInfo,
  getMerchantStats,
} from '@/lib/db/queries/merchant-portal';
import { requireMerchant } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export default async function MerchantDashboardPage() {
  const { merchantId } = await requireMerchant();
  const [info, stats] = await Promise.all([
    getMerchantInfo(merchantId),
    getMerchantStats(merchantId),
  ]);

  if (!info) {
    return (
      <div className="text-muted-foreground border-border bg-muted/30 rounded-xl border p-8 text-center text-sm">
        İşletme bulunamadı. Lütfen yöneticiyle iletişime geç.
      </div>
    );
  }

  const cards = [
    {
      label: 'Toplam fırsat',
      value: stats.totalDeals,
      sub: `${stats.publishedDeals} yayında · ${stats.pendingDeals} onay bekliyor`,
      Icon: Ticket,
    },
    {
      label: 'Rezervasyon',
      value: stats.totalBookings,
      sub: 'Onaylanmış + kullanılmış',
      Icon: CalendarCheck,
    },
    {
      label: 'Toplam ciro',
      value: formatTRY(stats.totalRevenue),
      sub: 'Brüt — komisyon hariç',
      Icon: CircleDollarSign,
      isString: true,
    },
    {
      label: 'Ortalama puan',
      value: stats.avgRating !== null ? stats.avgRating.toFixed(2) : '—',
      sub: stats.avgRating !== null ? 'Aktif fırsatlar' : 'Henüz yorum yok',
      Icon: Star,
      isString: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            İşletme paneli
            {info.is_verified ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-300">
                · <ShieldCheck className="size-3" aria-hidden="true" /> doğrulanmış
              </span>
            ) : null}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{info.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {[info.district, info.city].filter(Boolean).join(', ') || '—'} ·{' '}
            <Link
              href={`/m/${info.slug}`}
              target="_blank"
              className="text-foreground hover:underline underline-offset-2"
            >
              gidek.net/m/{info.slug} →
            </Link>
          </p>
        </div>
        <Link
          href="/isletme/firsatlar/yeni"
          className={cn(buttonVariants({ variant: 'primary' }), 'gap-2')}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Yeni fırsat başvurusu
        </Link>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, sub, Icon }) => (
          <li
            key={label}
            className="border-border bg-background flex flex-col gap-3 rounded-xl border p-4 sm:p-5"
          >
            <span className="bg-foreground/5 inline-flex size-9 items-center justify-center rounded-md">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="border-border bg-muted/30 rounded-xl border p-5">
        <h2 className="text-base font-semibold tracking-tight">İşletme akışı</h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Yeni fırsat oluşturduğunda admin ekibimiz inceler ve uygunsa yayınlar.
          Onaylanan fırsatın anında gidek arama + AI öneri sistemine girer. Bu
          arada düzenleme yapabilir, fiyat/açıklama güncelleyebilirsin.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/isletme/firsatlar"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Fırsatlarımı yönet
          </Link>
          <Link
            href="/isletme/rezervasyonlar"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Rezervasyonları gör
          </Link>
        </div>
      </section>
    </div>
  );
}
