import Link from 'next/link';
import { Heart, Sparkles, Ticket, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getAdminCounts } from '@/lib/db/queries/admin';
import { cn } from '@/lib/utils/cn';

export default async function AdminDashboardPage() {
  const c = await getAdminCounts();

  const cards = [
    { label: 'Toplam fırsat', value: c.totalDeals, sub: `${c.activeDeals} aktif · ${c.featuredDeals} öne çıkan`, Icon: Ticket },
    { label: 'Tedarikçiler', value: c.merchants, sub: 'Aktif merchant', Icon: Users },
    { label: 'Rezervasyonlar', value: c.bookings, sub: 'Toplam (mock dahil)', Icon: Heart },
    { label: 'AI sorgu (30g)', value: c.aiQueries30d, sub: 'Son 30 gün', Icon: Sparkles },
  ];

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

      <section className="border-border bg-muted/30 rounded-xl border p-5">
        <h2 className="text-base font-semibold tracking-tight">Hızlı işlemler</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Fırsat ekle, yayından kaldır, AI önerileri için embeddingi yenile.
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
        </div>
      </section>
    </div>
  );
}
