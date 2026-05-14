import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getAdminBookings } from '@/lib/db/queries/admin';
import { BOOKING_STATUS_BADGE, BOOKING_STATUS_LABEL } from '@/lib/utils/booking-status';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatTRY } from '@/lib/utils/format';

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookings(100);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Yönetim
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Rezervasyonlar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Son {bookings.length} kayıt — yeni → eski
        </p>
      </header>

      <div className="border-border bg-background overflow-hidden rounded-lg border">
        <ul className="divide-y divide-[var(--border)]">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={BOOKING_STATUS_BADGE[b.status]} size="sm">
                    {BOOKING_STATUS_LABEL[b.status]}
                  </Badge>
                  <span className="text-muted-foreground font-mono text-[11px] tracking-wider">
                    {b.bookingCode}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {CREATED_AT_FORMATTER.format(new Date(b.createdAt))}
                  </span>
                </div>
                <p className="line-clamp-1 text-sm font-semibold">{b.dealTitle}</p>
                <p className="text-muted-foreground text-xs">
                  {b.customerName ?? 'İsimsiz müşteri'}
                  {b.customerEmail ? ` · ${b.customerEmail}` : ''}
                  {b.customerPhone ? ` · ${b.customerPhone}` : ''}
                </p>
                <p className="text-muted-foreground text-xs">
                  {b.quantity} adet · {formatTRY(b.totalAmount)}
                  {b.selectedDate ? ` · ${formatDate(b.selectedDate)}` : ''}
                  {b.selectedTime ? ` ${b.selectedTime.slice(0, 5)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                {b.dealSlug ? (
                  <Link
                    href={`/f/${b.dealSlug}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    target="_blank"
                  >
                    Fırsat
                  </Link>
                ) : null}
                <Link
                  href={`/admin/bookings/${b.bookingCode}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Detay
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {bookings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Henüz rezervasyon yok.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
