import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { GuestEditForm } from '@/components/booking/guest-edit-form';
import { Container } from '@/components/ui/container';
import { getBookingByCode } from '@/lib/db/queries/bookings';
import { getHotelExtrasForBooking } from '@/lib/db/queries/hotel';
import { requireUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Misafir bilgilerini düzenle',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function GuestEditPage({ params }: PageProps) {
  const { code } = await params;
  await requireUser();
  const booking = await getBookingByCode(code);
  if (!booking) notFound();
  if (!booking.room_type_id) notFound(); // sadece otel rezervasyonu

  const status = booking.status as string;
  if (status !== 'pending' && status !== 'confirmed') {
    notFound();
  }

  const { guests } = await getHotelExtrasForBooking(booking.id, booking.room_type_id);

  // GuestEditForm'a uygun shape'e dönüştür
  const initialGuests = guests.map((g) => ({
    id: g.id,
    guest_type: g.guest_type,
    guest_index: g.guest_index,
    first_name: g.first_name,
    last_name: g.last_name,
    nationality: g.nationality,
    national_id: g.national_id ?? '',
    passport_no: g.passport_no ?? '',
    birth_date: g.birth_date,
    gender: (g.gender ?? '') as '' | 'M' | 'F' | 'other',
    phone: g.phone ?? '',
    email: g.email ?? '',
    is_lead: g.is_lead,
  }));

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/rezervasyonlarim/${code}`}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Rezervasyon detayı
        </Link>

        <header className="mb-6">
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Otel rezervasyonu · {code}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Misafir bilgilerini düzenle
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Check-in öncesinde isim, kimlik veya iletişim bilgisini güncelle. Değişiklikler
            otele yansıtılır. <strong className="text-foreground">Misafir sayısı</strong> ve{' '}
            <strong className="text-foreground">oda tipi</strong> bu sayfadan değiştirilemez —
            bunlar için rezervasyonu iptal edip yeniden yapman gerekir.
          </p>
        </header>

        <GuestEditForm bookingCode={code} initialGuests={initialGuests} />
      </div>
    </Container>
  );
}
