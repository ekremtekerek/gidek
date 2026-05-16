import { getServiceClient } from '@/lib/db/service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Otel oda müsaitlik sorgusu.
 *
 *   GET /api/hotel/availability?deal=<uuid>&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD
 *
 * Her oda tipi için: { id, total_units, booked, available }
 * - booked: aktif (pending/confirmed) booking'lerden tarih aralığı çakışan sayı
 * - total_units null ise limitsiz sayılır (booked=0, available=null)
 *
 * Public endpoint — RLS bypass için service client kullanıyor ama yalnızca
 * yayında olan deal'ların oda envanterini döndürür (deal_room_types RLS
 * select_public policy'siyle aynı).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const dealId = url.searchParams.get('deal');
  const checkin = url.searchParams.get('checkin');
  const checkout = url.searchParams.get('checkout');

  if (!dealId || !/^[0-9a-f-]{36}$/i.test(dealId)) {
    return Response.json({ error: 'deal query param geçersiz' }, { status: 400 });
  }
  if (!checkin || !/^\d{4}-\d{2}-\d{2}$/.test(checkin)) {
    return Response.json({ error: 'checkin geçersiz' }, { status: 400 });
  }
  if (!checkout || !/^\d{4}-\d{2}-\d{2}$/.test(checkout)) {
    return Response.json({ error: 'checkout geçersiz' }, { status: 400 });
  }
  if (new Date(checkout) <= new Date(checkin)) {
    return Response.json({ error: 'checkout > checkin olmalı' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Yayında olan deal mı?
  const { data: deal } = await supabase
    .from('deals')
    .select('id, published_at')
    .eq('id', dealId)
    .maybeSingle();
  if (!deal || !deal.published_at) {
    return Response.json({ error: 'deal bulunamadı' }, { status: 404 });
  }

  // Aktif oda tipleri
  const { data: rooms } = await supabase
    .from('deal_room_types')
    .select('id, total_units')
    .eq('deal_id', dealId)
    .eq('is_active', true);

  const roomList = rooms ?? [];
  const ids = roomList.map((r) => r.id);

  // Tek query ile her oda için çakışan booking sayısını çek
  const bookedByRoom = new Map<string, number>();
  if (ids.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('room_type_id')
      .in('room_type_id', ids)
      .in('status', ['pending', 'confirmed'])
      .lt('check_in_date', checkout)
      .gt('check_out_date', checkin);
    for (const b of bookings ?? []) {
      if (!b.room_type_id) continue;
      bookedByRoom.set(b.room_type_id, (bookedByRoom.get(b.room_type_id) ?? 0) + 1);
    }
  }

  const result = roomList.map((r) => {
    const total = r.total_units;
    const booked = bookedByRoom.get(r.id) ?? 0;
    return {
      id: r.id,
      total_units: total,
      booked,
      available: total === null ? null : Math.max(0, total - booked),
    };
  });

  return Response.json(
    { rooms: result },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
