import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { BookingForm } from '@/components/booking/booking-form';
import {
  HotelBookingWizard,
  type HotelDealForWizard,
  type HotelMetaForWizard,
  type RoomTypeOption,
} from '@/components/booking/hotel-booking-wizard';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { getDealBySlug, isDealExpired } from '@/lib/db/queries/deals';
import { getServiceClient } from '@/lib/db/service';
import { getCurrentUser } from '@/lib/security/auth';
import { formatTRY } from '@/lib/utils/format';

const HOTEL_CATEGORY_SLUGS = new Set(['tatil-otelleri', 'sehir-otelleri']);

async function loadHotelData(dealId: string): Promise<{
  isHotel: boolean;
  rooms: RoomTypeOption[];
  meta: HotelMetaForWizard | null;
}> {
  const supabase = getServiceClient();
  const [{ data: cats }, { data: rooms }, { data: meta }] = await Promise.all([
    supabase.from('deal_categories').select('category:categories(slug)').eq('deal_id', dealId),
    supabase
      .from('deal_room_types')
      .select(
        'id, name, description, capacity_adults, capacity_children, bed_setup, size_sqm, view_type, base_price_per_night, board_basis, cover_image, has_balcony, has_jacuzzi',
      )
      .eq('deal_id', dealId)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('deal_hotel_meta')
      .select(
        'star_rating, check_in_time, check_out_time, tourism_tax_per_night, cancellation_policy, child_policy, pet_policy',
      )
      .eq('deal_id', dealId)
      .maybeSingle(),
  ]);

  const isHotel = (cats ?? []).some((c) => {
    const cat = c.category as { slug: string } | { slug: string }[] | null;
    if (!cat) return false;
    const slug = Array.isArray(cat) ? cat[0]?.slug : cat.slug;
    return slug ? HOTEL_CATEGORY_SLUGS.has(slug) : false;
  });

  return {
    isHotel,
    rooms: (rooms ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      capacity_adults: r.capacity_adults,
      capacity_children: r.capacity_children,
      bed_setup: r.bed_setup,
      size_sqm: r.size_sqm,
      view_type: r.view_type,
      base_price_per_night: Number(r.base_price_per_night),
      board_basis: r.board_basis,
      cover_image: r.cover_image,
      has_balcony: r.has_balcony,
      has_jacuzzi: r.has_jacuzzi,
    })),
    meta: meta
      ? {
          star_rating: meta.star_rating,
          check_in_time: meta.check_in_time,
          check_out_time: meta.check_out_time,
          tourism_tax_per_night: Number(meta.tourism_tax_per_night),
          cancellation_policy: meta.cancellation_policy,
          child_policy: meta.child_policy,
          pet_policy: meta.pet_policy,
        }
      : null,
  };
}

export const metadata: Metadata = {
  title: 'Rezervasyon',
  description: 'Fırsat rezervasyonunu tamamla.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Params = { slug: string };
type SearchParams = { room?: string };

export default async function RezervasyonPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const { room: initialRoomId } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect(`/giris?next=/rezervasyon/${slug}`);

  const deal = await getDealBySlug(slug);
  if (!deal) notFound();
  // Sona ermiş fırsata rezervasyon yapılamaz — kullanıcı doğrudan URL'le
  // gelse bile detail sayfasına geri at, banner orada gösterilir.
  if (isDealExpired(deal)) redirect(`/f/${deal.slug}`);

  const location = [deal.district, deal.city].filter(Boolean).join(', ');
  const validUntilDate = new Date(deal.valid_until).toISOString().slice(0, 10);
  const unitPrice = Number(deal.discounted_price);
  const showDiscount = (deal.discount_percent ?? 0) > 0 && unitPrice < Number(deal.original_price);

  const hotelData = await loadHotelData(deal.id);
  const useHotelWizard = hotelData.isHotel && hotelData.rooms.length > 0;
  const hotelDealForWizard: HotelDealForWizard = {
    id: deal.id,
    slug: deal.slug,
    title: deal.title,
    city: deal.city,
    district: deal.district,
  };

  // Lead misafir auto-fill için profile + auth email — user zaten giriş yapmış
  const svc = getServiceClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('display_name, phone')
    .eq('id', user.id)
    .maybeSingle();
  const displayName = profile?.display_name?.trim() ?? '';
  const nameParts = displayName.split(/\s+/);
  const initialLead = {
    first_name: nameParts[0] ?? '',
    last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : '',
    phone: profile?.phone ?? '',
    email: user.email ?? '',
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: deal summary */}
        <aside className="border-border bg-background flex h-fit flex-col gap-4 rounded-xl border p-5 sm:p-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <Image
              src={deal.cover_image}
              alt={deal.title}
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              className="object-cover"
            />
            {showDiscount ? (
              <div className="absolute top-3 left-3">
                <Badge variant="discount" size="md">
                  %{deal.discount_percent} indirim
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <Link href={`/f/${deal.slug}`} className="hover:underline">
              <h2 className="text-lg leading-snug font-semibold">{deal.title}</h2>
            </Link>
            {deal.merchant ? (
              <p className="text-muted-foreground text-sm">{deal.merchant.name}</p>
            ) : null}
            {location ? (
              <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <MapPin className="size-3.5" aria-hidden="true" />
                {location}
              </p>
            ) : null}
          </div>

          <div className="border-border border-t pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-xs">Adet başı</span>
              <div className="flex items-baseline gap-2">
                {showDiscount ? (
                  <span className="text-muted-foreground text-xs line-through">
                    {formatTRY(deal.original_price)}
                  </span>
                ) : null}
                <span className="text-base font-semibold">{formatTRY(unitPrice)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: form */}
        <section>
          <header className="mb-6">
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Rezervasyon
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {useHotelWizard ? 'Tatil rezervasyonu' : 'Detayları gir, hazır'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {useHotelWizard
                ? 'Tarihleri ve misafirleri seç, adım adım tamamla.'
                : 'Bilgilerini doğrula ve rezervasyonu tamamla.'}
            </p>
          </header>

          {useHotelWizard ? (
            <HotelBookingWizard
              deal={hotelDealForWizard}
              rooms={hotelData.rooms}
              meta={hotelData.meta}
              initialRoomId={initialRoomId}
              initialLead={initialLead}
            />
          ) : (
            <BookingForm
              dealId={deal.id}
              unitPrice={unitPrice}
              maxPerUser={deal.max_per_user}
              validUntilDate={validUntilDate}
            />
          )}
        </section>
      </div>
    </Container>
  );
}
