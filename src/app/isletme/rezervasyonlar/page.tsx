import Link from 'next/link';
import { Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { listMerchantBookings } from '@/lib/db/queries/merchant-portal';
import { requireMerchant } from '@/lib/security/auth';
import { BOOKING_STATUS_BADGE, BOOKING_STATUS_LABEL } from '@/lib/utils/booking-status';
import { formatDate, formatTRY } from '@/lib/utils/format';

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function MerchantBookingsPage() {
  const { merchantId } = await requireMerchant();
  const bookings = await listMerchantBookings(merchantId, 100);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          İşletme paneli
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Rezervasyonlar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Son {bookings.length} kayıt — yeni → eski
        </p>
      </header>

      {bookings.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Henüz rezervasyon yok. Fırsatın onaylanıp yayına girdikten sonra burada
          görünmeye başlar.
        </p>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
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
                <Link
                  href={`/f/${b.dealSlug}`}
                  target="_blank"
                  className="line-clamp-1 text-sm font-semibold hover:underline underline-offset-2"
                >
                  {b.dealTitle}
                </Link>
                <p className="text-muted-foreground inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" aria-hidden="true" />
                    {b.customerName ?? 'İsimsiz müşteri'}
                  </span>
                  {b.customerPhone ? (
                    <a
                      href={`tel:${b.customerPhone}`}
                      className="text-foreground hover:underline inline-flex items-center gap-1 underline-offset-2"
                    >
                      <Phone className="size-3" aria-hidden="true" />
                      {b.customerPhone}
                    </a>
                  ) : null}
                </p>
                <p className="text-muted-foreground text-xs">
                  {b.quantity} adet · {formatTRY(b.totalAmount)}
                  {b.selectedDate ? ` · ${formatDate(b.selectedDate)}` : ''}
                  {b.selectedTime ? ` ${b.selectedTime.slice(0, 5)}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
