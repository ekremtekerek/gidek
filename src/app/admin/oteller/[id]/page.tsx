import { notFound } from 'next/navigation';
import { HotelForm } from '@/components/admin/hotel-form';
import { getServiceClient } from '@/lib/db/service';

export const metadata = {
  title: 'Otel düzenle · Admin',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function AdminHotelEditPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = getServiceClient();

  const [{ data: deal }, { data: merchants }, { data: cats }, { data: meta }, { data: rooms }] =
    await Promise.all([
      supabase
        .from('deals')
        .select(
          'id, slug, title, subtitle, description, merchant_id, cover_image, images, original_price, discounted_price, city, district, valid_from, valid_until, max_per_user, tags, audience, highlights, is_active, is_featured, published_at',
        )
        .eq('id', id)
        .maybeSingle(),
      supabase.from('merchants').select('id, name, city, district').eq('is_active', true).order('name').limit(500),
      supabase
        .from('deal_categories')
        .select('category:categories(slug)')
        .eq('deal_id', id),
      supabase.from('deal_hotel_meta').select('*').eq('deal_id', id).maybeSingle(),
      supabase.from('deal_room_types').select('*').eq('deal_id', id).order('sort_order'),
    ]);

  if (!deal) notFound();

  const categories = (cats ?? [])
    .map((c) => {
      const cat = c.category as { slug: string } | { slug: string }[] | null;
      if (!cat) return null;
      return Array.isArray(cat) ? cat[0]?.slug ?? null : cat.slug;
    })
    .filter((s): s is string => Boolean(s));

  const amenities: Record<string, boolean> = {};
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      if (k.startsWith('has_') && typeof v === 'boolean') {
        amenities[k] = v;
      }
    }
  }

  const initial = {
    ...deal,
    categories,
    star_rating: meta?.star_rating ?? null,
    check_in_time: meta?.check_in_time ?? '14:00',
    check_out_time: meta?.check_out_time ?? '12:00',
    concept: meta?.concept ?? null,
    pet_friendly: meta?.pet_friendly ?? false,
    smoking_allowed: meta?.smoking_allowed ?? false,
    cancellation_policy: meta?.cancellation_policy ?? null,
    child_policy: meta?.child_policy ?? null,
    pet_policy: meta?.pet_policy ?? null,
    extra_bed_available: meta?.extra_bed_available ?? false,
    extra_bed_price: meta?.extra_bed_price ?? null,
    distance_to_beach_m: meta?.distance_to_beach_m ?? null,
    distance_to_center_m: meta?.distance_to_center_m ?? null,
    distance_to_airport_km: meta?.distance_to_airport_km ?? null,
    tourism_tax_per_night: meta?.tourism_tax_per_night ?? 0,
    total_rooms: meta?.total_rooms ?? null,
    amenities,
    rooms: (rooms ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      capacity_adults: r.capacity_adults,
      capacity_children: r.capacity_children,
      bed_setup: r.bed_setup ?? '',
      size_sqm: r.size_sqm?.toString() ?? '',
      view_type: (r.view_type ?? '') as never,
      base_price_per_night: Number(r.base_price_per_night),
      board_basis: r.board_basis as never,
      total_units: r.total_units?.toString() ?? '',
      cover_image: r.cover_image ?? '',
      sort_order: r.sort_order,
      is_active: r.is_active,
      has_balcony: r.has_balcony,
      has_jacuzzi: r.has_jacuzzi,
      has_kitchenette: r.has_kitchenette,
      has_minibar: r.has_minibar,
      has_safe: r.has_safe,
      has_tv: r.has_tv,
    })),
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Oteller &amp; Tatil
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {deal.title}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Otel meta, oda tipleri ve politikalar.
        </p>
        {saved ? (
          <p className="mt-2 inline-block rounded-md bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            Kaydedildi.
          </p>
        ) : null}
      </header>
      <HotelForm merchants={(merchants ?? []) as never[]} initial={initial as never} />
    </div>
  );
}
