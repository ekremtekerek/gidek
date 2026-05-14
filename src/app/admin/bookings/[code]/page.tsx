import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, ShieldAlert, User } from 'lucide-react';
import { BookingAdminActions } from '@/components/admin/booking-admin-actions';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getAdminBookingByCode } from '@/lib/db/queries/admin';
import { BOOKING_STATUS_BADGE, BOOKING_STATUS_LABEL } from '@/lib/utils/booking-status';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Rezervasyon detayı · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const TS_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const b = await getAdminBookingByCode(code);
  if (!b) notFound();

  const refunded = Boolean(b.refundedAt);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href="/admin/bookings"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Rezervasyonlar
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-wider">{b.bookingCode}</h1>
          <Badge variant={BOOKING_STATUS_BADGE[b.status]} size="md">
            {BOOKING_STATUS_LABEL[b.status]}
          </Badge>
          {refunded ? (
            <Badge variant="outline" size="md" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
              İade işaretli
            </Badge>
          ) : null}
          {b.cancelledByAdminAt ? (
            <Badge variant="outline" size="md" className="inline-flex items-center gap-1">
              <ShieldAlert className="size-3" aria-hidden="true" />
              Admin iptali
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="border-border bg-background flex flex-col gap-5 rounded-xl border p-5">
          <h2 className="text-base font-semibold tracking-tight">Rezervasyon</h2>

          <dl className="divide-border divide-y">
            <Row label="Fırsat">
              <Link
                href={`/f/${b.dealSlug}`}
                target="_blank"
                className="hover:underline underline-offset-2"
              >
                {b.dealTitle}
              </Link>
            </Row>
            <Row label="Kişi">{b.quantity} adet</Row>
            <Row label="Birim fiyat">{formatTRY(b.unitPrice)}</Row>
            {b.discountAmount > 0 ? (
              <>
                <Row label="Ara toplam">{formatTRY(b.totalAmount + b.discountAmount)}</Row>
                <Row label={`Kupon${b.couponCode ? ` · ${b.couponCode}` : ''}`}>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    −{formatTRY(b.discountAmount)}
                  </span>
                </Row>
              </>
            ) : null}
            <Row label="Toplam">{formatTRY(b.totalAmount)}</Row>
            {b.selectedDate ? (
              <Row label="Tarih">
                {formatDate(b.selectedDate)}
                {b.selectedTime ? ` · ${b.selectedTime.slice(0, 5)}` : ''}
              </Row>
            ) : null}
            <Row label="Oluşturma">{TS_FORMATTER.format(new Date(b.createdAt))}</Row>
            {b.cancelledByAdminAt ? (
              <Row label="Admin iptali">{TS_FORMATTER.format(new Date(b.cancelledByAdminAt))}</Row>
            ) : null}
            {b.refundedAt ? (
              <Row label="İade işareti">{TS_FORMATTER.format(new Date(b.refundedAt))}</Row>
            ) : null}
          </dl>

          {b.notes ? (
            <div className="border-border rounded-md border bg-muted/30 p-3">
              <p className="text-muted-foreground mb-1 text-[11px] font-semibold tracking-wide uppercase">
                Müşteri notu
              </p>
              <p className="text-sm whitespace-pre-line">{b.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="flex flex-col gap-5">
          <section className="border-border bg-background flex flex-col gap-3 rounded-xl border p-5">
            <h2 className="text-base font-semibold tracking-tight">Müşteri</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              <li className="inline-flex items-center gap-2">
                <User className="text-muted-foreground size-4" aria-hidden="true" />
                {b.customerName ?? 'İsimsiz'}
              </li>
              {b.customerEmail ? (
                <li className="inline-flex items-center gap-2">
                  <Mail className="text-muted-foreground size-4" aria-hidden="true" />
                  <a
                    href={`mailto:${b.customerEmail}`}
                    className="text-foreground hover:underline underline-offset-2"
                  >
                    {b.customerEmail}
                  </a>
                </li>
              ) : null}
              {b.customerPhone ? (
                <li className="inline-flex items-center gap-2">
                  <Phone className="text-muted-foreground size-4" aria-hidden="true" />
                  <a
                    href={`tel:${b.customerPhone}`}
                    className="text-foreground hover:underline underline-offset-2"
                  >
                    {b.customerPhone}
                  </a>
                </li>
              ) : null}
            </ul>
            {b.userId ? (
              <Link
                href="/admin/users"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'self-start')}
              >
                Kullanıcılarda gör
              </Link>
            ) : null}
          </section>

          <section className="border-border bg-background flex flex-col gap-3 rounded-xl border p-5">
            <h2 className="text-base font-semibold tracking-tight">Aksiyon</h2>
            <BookingAdminActions
              bookingCode={b.bookingCode}
              status={b.status}
              refundedAt={b.refundedAt}
              adminNotes={b.adminNotes}
            />
          </section>

          <p className="text-muted-foreground text-center text-[11px]">
            Müşteri sayfası:{' '}
            <Link
              href={`/rezervasyonlarim/${b.bookingCode}`}
              target="_blank"
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              /rezervasyonlarim/{b.bookingCode}
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}
