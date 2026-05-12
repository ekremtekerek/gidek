import Link from 'next/link';
import { Heart, Sparkles, Ticket, TrendingUp, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  getAdminCounts,
  getBookingsLast7Days,
  getTopCategoriesByBookings,
} from '@/lib/db/queries/admin';
import { CATEGORY_STYLE } from '@/lib/utils/category-styles';
import { cn } from '@/lib/utils/cn';

const WEEKDAY = ['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

export default async function AdminDashboardPage() {
  const [c, bookings7d, topCats] = await Promise.all([
    getAdminCounts(),
    getBookingsLast7Days(),
    getTopCategoriesByBookings(),
  ]);

  const cards = [
    {
      label: 'Toplam fırsat',
      value: c.totalDeals,
      sub: `${c.activeDeals} aktif · ${c.featuredDeals} öne çıkan`,
      Icon: Ticket,
    },
    { label: 'Tedarikçiler', value: c.merchants, sub: 'Aktif merchant', Icon: Users },
    { label: 'Rezervasyonlar', value: c.bookings, sub: 'Toplam (mock dahil)', Icon: Heart },
    { label: 'AI sorgu (30g)', value: c.aiQueries30d, sub: 'Son 30 gün', Icon: Sparkles },
  ];

  const maxBookings = Math.max(1, ...bookings7d.map((b) => b.count));
  const maxCatCount = Math.max(1, ...topCats.map((t) => t.count));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Genel görünüm
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        </div>
        <Link href="/admin/deals/yeni" className={cn(buttonVariants({ variant: 'primary' }))}>
          Yeni fırsat
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
              <p className="text-2xl font-semibold tracking-tight">{value}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="border-border bg-background rounded-xl border p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-1.5 text-base font-semibold tracking-tight">
              <TrendingUp className="size-4" aria-hidden="true" />
              Son 7 gün rezervasyonlar
            </h2>
            <span className="text-muted-foreground text-xs">
              Toplam {bookings7d.reduce((s, b) => s + b.count, 0)}
            </span>
          </header>
          <div className="flex h-32 items-end gap-2">
            {bookings7d.map((b) => {
              const pct = (b.count / maxBookings) * 100;
              const d = new Date(`${b.day}T00:00:00Z`);
              const dayLabel = WEEKDAY[d.getUTCDay()];
              return (
                <div key={b.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="from-foreground to-foreground/70 w-full rounded-md bg-gradient-to-t transition-all"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      aria-label={`${b.day}: ${b.count} rezervasyon`}
                    />
                  </div>
                  <span className="text-muted-foreground text-[10px] font-medium">{dayLabel}</span>
                  <span className="text-[10px] font-semibold tabular-nums">{b.count}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-border bg-background rounded-xl border p-5">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">En aktif kategoriler</h2>
            <span className="text-muted-foreground text-xs">All-time</span>
          </header>
          {topCats.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Henüz veri yok.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {topCats.map((t) => {
                const style = CATEGORY_STYLE[t.slug];
                const pct = (t.count / maxCatCount) * 100;
                return (
                  <li key={t.slug} className="flex items-center gap-3">
                    {style ? (
                      <span
                        className={cn(
                          'inline-flex size-7 shrink-0 items-center justify-center rounded-full',
                          style.bg,
                          style.fg,
                        )}
                      >
                        <style.Icon className="size-3.5" aria-hidden="true" />
                      </span>
                    ) : (
                      <span className="bg-muted size-7 shrink-0 rounded-full" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {t.count}
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-foreground h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="border-border bg-muted/30 rounded-xl border p-5">
        <h2 className="text-base font-semibold tracking-tight">Hızlı işlemler</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Fırsat ekle, yayından kaldır, yorumları modere et.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/deals"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Tüm fırsatlar
          </Link>
          <Link
            href="/admin/deals/yeni"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
          >
            Yeni fırsat oluştur
          </Link>
          <Link
            href="/admin/merchants"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            İşletmeler
          </Link>
          <Link
            href="/admin/reviews"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            Yorumlar
          </Link>
        </div>
      </section>
    </div>
  );
}
