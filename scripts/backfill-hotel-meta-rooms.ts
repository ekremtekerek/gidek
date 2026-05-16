/**
 * Tatil seed'inde üretilmiş 1000 deal için hotel_meta + 2-3 oda tipi
 * otomatik üretir. Slug pattern'inden concept ve gece sayısı çıkarır,
 * concept'e göre amenities + room types kombinasyonu seçer.
 *
 *   npm run seed:hotel-backfill
 *
 * Idempotent: aynı slug için tekrar koşunca upsert eder.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env.');
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ----------------------------------------------------------------------------
// Concept profiles
// ----------------------------------------------------------------------------
type Concept = string;
type Board = 'oda' | 'oda-kahvalti' | 'yarim-pansiyon' | 'tam-pansiyon' | 'her-sey-dahil' | 'ultra-her-sey-dahil';

interface RoomTemplate {
  name: string;
  capacity_adults: number;
  capacity_children: number;
  bed_setup: string;
  size_sqm: number;
  view_type: string;
  board_basis: Board;
  /** discount fraction (1.0 = base price; >1 = premium) */
  priceMultiplier: number;
  has_balcony: boolean;
  has_jacuzzi: boolean;
  has_kitchenette: boolean;
  has_minibar: boolean;
  has_safe: boolean;
}

const ROOM_BASE = {
  name: 'Standart Oda',
  capacity_adults: 2,
  capacity_children: 0,
  bed_setup: 'Fransız yatak',
  size_sqm: 28,
  view_type: 'bahce',
  board_basis: 'oda-kahvalti' as Board,
  priceMultiplier: 1.0,
  has_balcony: true,
  has_jacuzzi: false,
  has_kitchenette: false,
  has_minibar: true,
  has_safe: true,
};

function roomsForConcept(concept: Concept): RoomTemplate[] {
  switch (concept) {
    case 'ultra-her-sey-dahil':
      return [
        { ...ROOM_BASE, name: 'Deluxe Oda', board_basis: 'ultra-her-sey-dahil', size_sqm: 32, view_type: 'deniz', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Aile Suit', capacity_adults: 2, capacity_children: 2, bed_setup: 'King + 2 çekyat', size_sqm: 52, view_type: 'deniz', board_basis: 'ultra-her-sey-dahil', priceMultiplier: 1.4 },
        { ...ROOM_BASE, name: 'Honeymoon Suit', capacity_adults: 2, bed_setup: 'King-size + jakuzi', size_sqm: 65, view_type: 'deniz', board_basis: 'ultra-her-sey-dahil', priceMultiplier: 2.0, has_jacuzzi: true },
      ];
    case 'her-sey-dahil':
      return [
        { ...ROOM_BASE, name: 'Standart Oda', board_basis: 'her-sey-dahil', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Aile Suit', capacity_adults: 2, capacity_children: 2, bed_setup: 'King + 2 çekyat', size_sqm: 45, board_basis: 'her-sey-dahil', priceMultiplier: 1.35 },
        { ...ROOM_BASE, name: 'Deniz Manzaralı Suit', size_sqm: 38, view_type: 'deniz', board_basis: 'her-sey-dahil', priceMultiplier: 1.5 },
      ];
    case 'aile-resort':
      return [
        { ...ROOM_BASE, name: 'Aile Suit', capacity_adults: 2, capacity_children: 2, bed_setup: 'King + bunk yatak', size_sqm: 50, board_basis: 'her-sey-dahil', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'King Suite', capacity_adults: 2, capacity_children: 3, bed_setup: '2 oda · King + 3 çekyat', size_sqm: 70, view_type: 'deniz', board_basis: 'her-sey-dahil', priceMultiplier: 1.6 },
      ];
    case 'aqua-park':
      return [
        { ...ROOM_BASE, name: 'Aile Standart', capacity_adults: 2, capacity_children: 2, board_basis: 'her-sey-dahil', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Aqua View Suit', capacity_adults: 2, capacity_children: 2, size_sqm: 48, view_type: 'havuz', board_basis: 'her-sey-dahil', priceMultiplier: 1.4 },
      ];
    case 'butik':
    case 'tasarim-otel':
      return [
        { ...ROOM_BASE, name: 'Butik Oda', size_sqm: 26, view_type: 'bahce', board_basis: 'oda-kahvalti', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Junior Suit', size_sqm: 42, view_type: 'bahce', board_basis: 'oda-kahvalti', priceMultiplier: 1.5, has_jacuzzi: true },
      ];
    case 'spa-otel':
      return [
        { ...ROOM_BASE, name: 'Standart Oda', size_sqm: 30, board_basis: 'yarim-pansiyon', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Spa Suit', size_sqm: 50, view_type: 'havuz', board_basis: 'yarim-pansiyon', priceMultiplier: 1.6, has_jacuzzi: true },
      ];
    case 'plaj-resort':
    case 'marina':
      return [
        { ...ROOM_BASE, name: 'Standart Oda', view_type: 'bahce', board_basis: 'oda-kahvalti', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Deniz Manzaralı Oda', size_sqm: 34, view_type: 'deniz', board_basis: 'yarim-pansiyon', priceMultiplier: 1.45 },
      ];
    case 'gourmet':
      return [
        { ...ROOM_BASE, name: 'Gourmet Oda', size_sqm: 32, board_basis: 'yarim-pansiyon', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Şef Suite', size_sqm: 55, board_basis: 'tam-pansiyon', priceMultiplier: 1.8 },
      ];
    case 'doga-ici':
    case 'eko-otel':
      return [
        { ...ROOM_BASE, name: 'Doğa Bungalov', size_sqm: 32, view_type: 'park', board_basis: 'oda-kahvalti', priceMultiplier: 1.0, has_kitchenette: true },
        { ...ROOM_BASE, name: 'Aile Bungalov', capacity_adults: 2, capacity_children: 2, size_sqm: 48, view_type: 'park', board_basis: 'oda-kahvalti', priceMultiplier: 1.4, has_kitchenette: true },
      ];
    case 'bungalov':
    case 'yayla-evi':
      return [
        { ...ROOM_BASE, name: 'Ahşap Bungalov', size_sqm: 30, view_type: 'dag', board_basis: 'oda-kahvalti', priceMultiplier: 1.0, has_kitchenette: true },
        { ...ROOM_BASE, name: 'Aile Bungalov', capacity_adults: 2, capacity_children: 2, size_sqm: 45, view_type: 'dag', board_basis: 'yarim-pansiyon', priceMultiplier: 1.5, has_kitchenette: true },
      ];
    case 'magara-otel':
      return [
        { ...ROOM_BASE, name: 'Mağara Oda', size_sqm: 24, view_type: 'sehir', board_basis: 'oda-kahvalti', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Mağara Suit', size_sqm: 42, view_type: 'sehir', board_basis: 'oda-kahvalti', priceMultiplier: 1.7, has_jacuzzi: true },
      ];
    case 'kayak-otel':
    case 'dag-evi':
      return [
        { ...ROOM_BASE, name: 'Dağ Oda', size_sqm: 28, view_type: 'dag', board_basis: 'tam-pansiyon', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Aile Dağ Suit', capacity_adults: 2, capacity_children: 2, size_sqm: 45, view_type: 'dag', board_basis: 'tam-pansiyon', priceMultiplier: 1.4 },
      ];
    case 'ekonomik':
      return [
        { ...ROOM_BASE, name: 'Ekonomik Oda', size_sqm: 22, board_basis: 'oda-kahvalti', priceMultiplier: 1.0, has_minibar: false, has_safe: false },
      ];
    case 'ruzgar-sorfu':
    case 'balon-manzarali':
      return [
        { ...ROOM_BASE, name: 'Standart Oda', size_sqm: 28, board_basis: 'oda-kahvalti', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Manzara Suit', size_sqm: 42, view_type: concept === 'balon-manzarali' ? 'sehir' : 'deniz', board_basis: 'oda-kahvalti', priceMultiplier: 1.5 },
      ];
    default:
      return [
        { ...ROOM_BASE, name: 'Standart Oda', priceMultiplier: 1.0 },
        { ...ROOM_BASE, name: 'Deluxe Oda', size_sqm: 34, board_basis: 'oda-kahvalti', priceMultiplier: 1.4 },
      ];
  }
}

// ----------------------------------------------------------------------------
// Amenity profiles per concept
// ----------------------------------------------------------------------------
function amenitiesForConcept(concept: Concept): Record<string, boolean> {
  const base: Record<string, boolean> = {
    has_beach_access: false,
    has_private_beach: false,
    has_pool: false,
    has_indoor_pool: false,
    has_spa: false,
    has_hamam: false,
    has_sauna: false,
    has_gym: false,
    has_aquapark: false,
    has_kids_club: false,
    has_kids_pool: false,
    has_restaurant: true,
    has_bar: false,
    has_room_service: false,
    has_parking: true,
    has_valet: false,
    has_wifi: true,
    has_aircon: true,
    has_breakfast: true,
    has_transfer: false,
    has_laundry: false,
    has_business_center: false,
    has_meeting_room: false,
    has_disabled_access: false,
  };

  switch (concept) {
    case 'ultra-her-sey-dahil':
      return {
        ...base, has_beach_access: true, has_private_beach: true, has_pool: true, has_indoor_pool: true,
        has_spa: true, has_hamam: true, has_sauna: true, has_gym: true, has_aquapark: true,
        has_kids_club: true, has_kids_pool: true, has_bar: true, has_room_service: true,
        has_valet: true, has_transfer: true, has_laundry: true, has_disabled_access: true,
      };
    case 'her-sey-dahil':
      return {
        ...base, has_beach_access: true, has_pool: true, has_spa: true, has_hamam: true,
        has_gym: true, has_kids_club: true, has_kids_pool: true, has_bar: true, has_room_service: true,
        has_transfer: true,
      };
    case 'aile-resort':
      return {
        ...base, has_pool: true, has_kids_club: true, has_kids_pool: true, has_aquapark: true,
        has_bar: true, has_room_service: true, has_disabled_access: true,
      };
    case 'aqua-park':
      return {
        ...base, has_pool: true, has_aquapark: true, has_kids_pool: true, has_kids_club: true,
        has_bar: true, has_beach_access: true,
      };
    case 'butik':
    case 'tasarim-otel':
      return { ...base, has_pool: true, has_bar: true, has_room_service: true };
    case 'spa-otel':
      return { ...base, has_spa: true, has_hamam: true, has_sauna: true, has_indoor_pool: true, has_gym: true };
    case 'plaj-resort':
    case 'marina':
      return { ...base, has_beach_access: true, has_private_beach: true, has_pool: true, has_bar: true };
    case 'gourmet':
      return { ...base, has_bar: true, has_room_service: true, has_meeting_room: true };
    case 'doga-ici':
    case 'eko-otel':
    case 'bungalov':
    case 'yayla-evi':
      return { ...base, has_breakfast: true, has_parking: true };
    case 'magara-otel':
      return { ...base, has_room_service: true, has_bar: true };
    case 'kayak-otel':
    case 'dag-evi':
      return { ...base, has_spa: true, has_sauna: true, has_indoor_pool: true, has_bar: true };
    case 'ekonomik':
      return { ...base, has_breakfast: true };
    default:
      return { ...base, has_pool: true };
  }
}

// ----------------------------------------------------------------------------
// Slug parser
// ----------------------------------------------------------------------------
function parseSlug(slug: string): { concept: Concept; nights: number } | null {
  // tdest-{destination}-{landmark}-{concept}-{N}g-{idx}
  const m = slug.match(/^tdest-[a-z0-9]+(?:-[a-z0-9]+)*?-(her-sey-dahil|ultra-her-sey-dahil|butik|tasarim-otel|aile-resort|spa-otel|plaj-resort|doga-ici|eko-otel|bungalov|yayla-evi|magara-otel|kayak-otel|dag-evi|aqua-park|gourmet|ekonomik|ruzgar-sorfu|balon-manzarali|marina)-(\d+)g-\d+$/);
  if (!m) return null;
  return { concept: m[1], nights: Number(m[2]) };
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
async function main() {
  console.log('Tatil deal\'lar için hotel_meta + room_types üretiliyor…');

  // Tdest deal'larını al
  const { data: deals, error } = await supabase
    .from('deals')
    .select('id, slug, discounted_price')
    .like('slug', 'tdest-%');
  if (error) throw error;

  const list = deals ?? [];
  console.log(`  ${list.length} tdest deal bulundu`);

  // Concept dağılımı
  let metaUpserted = 0;
  let roomsUpserted = 0;
  let skipped = 0;
  const metaRows: Database['public']['Tables']['deal_hotel_meta']['Insert'][] = [];
  const roomRows: Database['public']['Tables']['deal_room_types']['Insert'][] = [];

  for (const d of list) {
    const parsed = parseSlug(d.slug);
    if (!parsed) {
      skipped++;
      continue;
    }
    const { concept, nights } = parsed;
    const pricePerNight = Math.round(Number(d.discounted_price) / nights);
    if (pricePerNight < 100) {
      skipped++;
      continue;
    }

    const amenities = amenitiesForConcept(concept);

    // Star: ultra=5, her-sey-dahil/aile=4-5, butik/tasarim/gourmet=4-5, ekonomik=2-3, default=3-4
    let star = 4;
    if (concept === 'ultra-her-sey-dahil') star = 5;
    else if (concept === 'ekonomik') star = Math.random() < 0.5 ? 2 : 3;
    else if (['her-sey-dahil','aile-resort','gourmet','butik','tasarim-otel','magara-otel'].includes(concept)) {
      star = Math.random() < 0.4 ? 5 : 4;
    }

    metaRows.push({
      deal_id: d.id,
      star_rating: star,
      check_in_time: '14:00',
      check_out_time: '12:00',
      concept,
      tourism_tax_per_night: star >= 4 ? 75 : 30,
      total_rooms: 40 + Math.floor(Math.random() * 200),
      cancellation_policy: 'Konaklamadan 14 gün öncesine kadar ücretsiz iptal. 14 gün içinde %50, 3 gün içinde iade yok.',
      child_policy: '0-2 yaş ücretsiz (bebek karyolası), 3-6 yaş %50 indirimli, 7-12 yaş %25 indirimli (ebeveynle aynı odada).',
      ...amenities,
    });

    const rooms = roomsForConcept(concept);
    rooms.forEach((r, idx) => {
      roomRows.push({
        deal_id: d.id,
        name: r.name,
        description: `${r.size_sqm} m² · ${r.bed_setup} · ${r.view_type} manzaralı`,
        capacity_adults: r.capacity_adults,
        capacity_children: r.capacity_children,
        bed_setup: r.bed_setup,
        size_sqm: r.size_sqm,
        view_type: r.view_type,
        base_price_per_night: Math.max(200, Math.round((pricePerNight * r.priceMultiplier) / 10) * 10),
        board_basis: r.board_basis,
        total_units: 5 + Math.floor(Math.random() * 20),
        sort_order: idx,
        is_active: true,
        has_balcony: r.has_balcony,
        has_jacuzzi: r.has_jacuzzi,
        has_kitchenette: r.has_kitchenette,
        has_minibar: r.has_minibar,
        has_safe: r.has_safe,
        has_tv: true,
      });
    });
  }

  console.log(`  ${metaRows.length} meta, ${roomRows.length} room hazır (skipped: ${skipped})`);

  // Meta upsert (100'lük batch)
  for (let i = 0; i < metaRows.length; i += 100) {
    const batch = metaRows.slice(i, i + 100);
    const { error: e } = await supabase
      .from('deal_hotel_meta')
      .upsert(batch, { onConflict: 'deal_id' });
    if (e) throw e;
    metaUpserted += batch.length;
    if (i % 500 === 0) console.log(`  meta [${i + batch.length}/${metaRows.length}]`);
  }

  // Room types: önce delete (idempotent çalışmak için), sonra insert
  // Aksi takdirde duplicate yaratır (unique constraint yok).
  console.log('  mevcut oda tipleri temizleniyor…');
  const dealIds = list.map((d) => d.id);
  for (let i = 0; i < dealIds.length; i += 100) {
    const batch = dealIds.slice(i, i + 100);
    await supabase.from('deal_room_types').delete().in('deal_id', batch);
  }

  for (let i = 0; i < roomRows.length; i += 100) {
    const batch = roomRows.slice(i, i + 100);
    const { error: e } = await supabase.from('deal_room_types').insert(batch);
    if (e) throw e;
    roomsUpserted += batch.length;
    if (i % 500 === 0) console.log(`  rooms [${i + batch.length}/${roomRows.length}]`);
  }

  console.log(`\n✅ ${metaUpserted} meta + ${roomsUpserted} oda tipi yazıldı.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
