import Link from 'next/link';
import {
  Accessibility,
  ArrowRight,
  Baby,
  BedDouble,
  Briefcase,
  Car,
  Cigarette,
  CircleSlash,
  Coffee,
  Dog,
  Dumbbell,
  Eye,
  Flame,
  Flower2,
  Gem,
  HandPlatter,
  KeyRound,
  LogIn,
  LogOut,
  MapPin,
  ParkingCircle,
  Plane,
  Snowflake,
  Sparkles,
  Star,
  Umbrella,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react';
import { RoomImageLightbox } from '@/components/travel/room-image-lightbox';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import type { HotelMeta, HotelRoom } from '@/lib/db/queries/hotel';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  slug: string;
  meta: HotelMeta;
  rooms: HotelRoom[];
}

const BOARD_LABELS: Record<string, string> = {
  'oda': 'Sadece oda',
  'oda-kahvalti': 'Oda + Kahvaltı',
  'yarim-pansiyon': 'Yarım Pansiyon',
  'tam-pansiyon': 'Tam Pansiyon',
  'her-sey-dahil': 'Her Şey Dahil',
  'ultra-her-sey-dahil': 'Ultra Her Şey Dahil',
};

const VIEW_LABELS: Record<string, string> = {
  deniz: 'Deniz manzarası',
  bahce: 'Bahçe manzarası',
  havuz: 'Havuz manzarası',
  dag: 'Dağ manzarası',
  sehir: 'Şehir manzarası',
  park: 'Park manzarası',
  'ic-bahce': 'İç bahçe manzarası',
  'manzara-yok': 'Manzarasız',
};

const CONCEPT_LABELS: Record<string, string> = {
  'her-sey-dahil': 'Her Şey Dahil',
  'ultra-her-sey-dahil': 'Ultra Her Şey Dahil',
  'butik': 'Butik Otel',
  'tasarim-otel': 'Tasarım Otel',
  'aile-resort': 'Aile Resort',
  'spa-otel': 'Spa & Wellness',
  'plaj-resort': 'Plaj Resort',
  'doga-ici': 'Doğa İçi',
  'eko-otel': 'Eko Otel',
  'bungalov': 'Bungalov',
  'yayla-evi': 'Yayla Evi',
  'magara-otel': 'Mağara Otel',
  'kayak-otel': 'Kayak Otel',
  'dag-evi': 'Dağ Evi',
  'aqua-park': 'Aquaparklı',
  'gourmet': 'Gourmet',
  'ekonomik': 'Ekonomik',
  'ruzgar-sorfu': 'Sörf Konseptli',
  'balon-manzarali': 'Balon Manzaralı',
  'marina': 'Marina Konseptli',
};

interface AmenityGroup {
  label: string;
  items: { key: keyof HotelMeta; label: string; Icon: React.ComponentType<{ className?: string }> }[];
}

const AMENITY_GROUPS: AmenityGroup[] = [
  {
    label: 'Plaj & havuz',
    items: [
      { key: 'has_beach_access', label: 'Plaja erişim', Icon: Umbrella },
      { key: 'has_private_beach', label: 'Özel plaj', Icon: Waves },
      { key: 'has_pool', label: 'Açık havuz', Icon: Waves },
      { key: 'has_indoor_pool', label: 'Kapalı havuz', Icon: Waves },
      { key: 'has_aquapark', label: 'Aquapark', Icon: Waves },
      { key: 'has_kids_pool', label: 'Çocuk havuzu', Icon: Baby },
    ],
  },
  {
    label: 'Spa & wellness',
    items: [
      { key: 'has_spa', label: 'Spa', Icon: Flower2 },
      { key: 'has_hamam', label: 'Hamam', Icon: Flame },
      { key: 'has_sauna', label: 'Sauna', Icon: Flame },
      { key: 'has_gym', label: 'Fitness', Icon: Dumbbell },
    ],
  },
  {
    label: 'Yeme-içme',
    items: [
      { key: 'has_restaurant', label: 'Restoran', Icon: UtensilsCrossed },
      { key: 'has_bar', label: 'Bar', Icon: Wine },
      { key: 'has_room_service', label: 'Oda servisi', Icon: HandPlatter },
      { key: 'has_breakfast', label: 'Kahvaltı', Icon: Coffee },
    ],
  },
  {
    label: 'Aile',
    items: [
      { key: 'has_kids_club', label: 'Çocuk kulübü', Icon: Baby },
    ],
  },
  {
    label: 'Hizmet & ulaşım',
    items: [
      { key: 'has_parking', label: 'Otopark', Icon: ParkingCircle },
      { key: 'has_valet', label: 'Vale', Icon: Car },
      { key: 'has_transfer', label: 'Havalimanı transferi', Icon: Plane },
      { key: 'has_laundry', label: 'Çamaşırhane', Icon: Sparkles },
    ],
  },
  {
    label: 'İş',
    items: [
      { key: 'has_business_center', label: 'Business center', Icon: Briefcase },
      { key: 'has_meeting_room', label: 'Toplantı salonu', Icon: Users },
    ],
  },
  {
    label: 'Genel',
    items: [
      { key: 'has_wifi', label: 'Wi-Fi', Icon: Wifi },
      { key: 'has_aircon', label: 'Klima', Icon: Snowflake },
      { key: 'has_disabled_access', label: 'Engelli erişimi', Icon: Accessibility },
    ],
  },
];

export function HotelDetailSection({ slug, meta, rooms }: Props) {
  const conceptLabel = meta.concept ? CONCEPT_LABELS[meta.concept] ?? meta.concept : null;
  const star = meta.star_rating ?? 0;

  // Yalnızca true olan amenity'leri grupla
  const activeGroups = AMENITY_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => meta[i.key] === true),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* ------ OTEL ÖZET ------ */}
      <section className="border-border bg-background rounded-xl border p-5 sm:p-6">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Otel bilgileri</h2>
          {star > 0 ? (
            <span
              className="text-amber-500 inline-flex items-center gap-0.5"
              aria-label={`${star} yıldız`}
            >
              {Array.from({ length: star }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" aria-hidden="true" />
              ))}
            </span>
          ) : null}
          {conceptLabel ? (
            <Badge variant="accent" size="sm">
              <Gem className="me-1 size-3" aria-hidden="true" />
              {conceptLabel}
            </Badge>
          ) : null}
        </header>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <InfoCell Icon={LogIn} label="Giriş" value={meta.check_in_time.slice(0, 5)} />
          <InfoCell Icon={LogOut} label="Çıkış" value={meta.check_out_time.slice(0, 5)} />
          {meta.total_rooms ? (
            <InfoCell Icon={BedDouble} label="Toplam oda" value={`${meta.total_rooms}`} />
          ) : null}
          {meta.distance_to_beach_m !== null ? (
            <InfoCell
              Icon={Waves}
              label="Plaja"
              value={`${meta.distance_to_beach_m} m`}
            />
          ) : null}
          {meta.distance_to_center_m !== null ? (
            <InfoCell
              Icon={MapPin}
              label="Merkeze"
              value={`${meta.distance_to_center_m} m`}
            />
          ) : null}
          {meta.distance_to_airport_km !== null ? (
            <InfoCell
              Icon={Plane}
              label="Havalimanına"
              value={`${meta.distance_to_airport_km} km`}
            />
          ) : null}
          {meta.tourism_tax_per_night > 0 ? (
            <InfoCell
              Icon={Sparkles}
              label="Konaklama vergisi"
              value={`${formatTRY(meta.tourism_tax_per_night)}/gece`}
            />
          ) : null}
        </dl>

        {/* Pet/smoking durumu */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <PolicyChip
            ok={meta.pet_friendly}
            okLabel="Evcil hayvan kabul"
            noLabel="Evcil hayvan kabul edilmez"
            okIcon={Dog}
            noIcon={Dog}
          />
          <PolicyChip
            ok={meta.smoking_allowed}
            okLabel="Sigara içilebilir"
            noLabel="Sigara içilmez"
            okIcon={Cigarette}
            noIcon={Cigarette}
          />
          {meta.extra_bed_available ? (
            <span className="border-border bg-muted/40 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5">
              <BedDouble className="size-3" aria-hidden="true" />
              Ek yatak{' '}
              {meta.extra_bed_price ? (
                <strong className="ms-0.5">+{formatTRY(meta.extra_bed_price)}/gece</strong>
              ) : 'mevcut'}
            </span>
          ) : null}
        </div>
      </section>

      {/* ------ TESIS OZELLIKLERI ------ */}
      {activeGroups.length > 0 ? (
        <section className="border-border bg-background rounded-xl border p-5 sm:p-6">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">Tesis özellikleri</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeGroups.map((g) => (
              <div key={g.label}>
                <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                  {g.label}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {g.items.map((i) => (
                    <li key={i.key as string} className="inline-flex items-center gap-2 text-sm">
                      <i.Icon className="text-emerald-600 size-4 shrink-0" aria-hidden="true" />
                      <span>{i.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ------ ODA TIPLERI ------ */}
      {rooms.length > 0 ? (
        <section className="border-border bg-background rounded-xl border p-5 sm:p-6">
          <header className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Oda tipleri</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {rooms.length} farklı oda · fiyatlar gece başınadır
              </p>
            </div>
          </header>

          <ul className="flex flex-col gap-3">
            {rooms.map((r) => (
              <li
                key={r.id}
                className="border-border hover:border-foreground/40 flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-stretch sm:gap-4 sm:p-5"
              >
                {r.cover_image ? (
                  <RoomImageLightbox
                    src={r.cover_image}
                    alt={r.name}
                    className="aspect-[4/3] h-32 w-full shrink-0 sm:h-auto sm:w-40"
                  />
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold tracking-tight">{r.name}</h3>
                  </div>
                  {r.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {r.description}
                    </p>
                  ) : null}

                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden="true" />
                      {r.capacity_adults}+{r.capacity_children}
                    </span>
                    {r.bed_setup ? (
                      <span className="inline-flex items-center gap-1">
                        <BedDouble className="size-3.5" aria-hidden="true" />
                        {r.bed_setup}
                      </span>
                    ) : null}
                    {r.size_sqm ? <span>{r.size_sqm} m²</span> : null}
                    {r.view_type ? (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" aria-hidden="true" />
                        {VIEW_LABELS[r.view_type] ?? r.view_type}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="outline" size="sm">
                      {BOARD_LABELS[r.board_basis] ?? r.board_basis}
                    </Badge>
                    {r.has_balcony ? <RoomChip label="Balkon" /> : null}
                    {r.has_jacuzzi ? <RoomChip label="Jakuzi" /> : null}
                    {r.has_kitchenette ? <RoomChip label="Mini mutfak" /> : null}
                    {r.has_minibar ? <RoomChip label="Minibar" /> : null}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-2 sm:min-w-[180px] sm:border-l sm:border-[var(--border)] sm:ps-4">
                  <div className="text-right">
                    <p className="text-xl font-bold tracking-tight">
                      {formatTRY(r.base_price_per_night)}
                    </p>
                    <p className="text-muted-foreground text-[11px]">gece başı</p>
                  </div>
                  <Link
                    href={`/rezervasyon/${slug}?room=${r.id}`}
                    className={cn(
                      buttonVariants({ variant: 'primary', size: 'sm' }),
                      'w-full sm:w-auto',
                    )}
                  >
                    Tarihleri seç
                    <ArrowRight className="ms-1 size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* ------ POLITIKALAR ------ */}
      {meta.cancellation_policy || meta.child_policy || meta.pet_policy ? (
        <section className="border-border bg-background rounded-xl border p-5 sm:p-6">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">Politikalar</h2>
          <div className="flex flex-col divide-y divide-[var(--border)]">
            {meta.cancellation_policy ? (
              <PolicyRow Icon={KeyRound} label="İptal politikası" text={meta.cancellation_policy} />
            ) : null}
            {meta.child_policy ? (
              <PolicyRow Icon={Baby} label="Çocuk politikası" text={meta.child_policy} />
            ) : null}
            {meta.pet_policy ? (
              <PolicyRow Icon={Dog} label="Evcil hayvan politikası" text={meta.pet_policy} />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function InfoCell({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="border-border bg-muted/20 flex items-center gap-2 rounded-lg border p-3">
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-muted-foreground text-[11px]">{label}</dt>
        <dd className="text-sm font-semibold tracking-tight">{value}</dd>
      </div>
    </div>
  );
}

function PolicyChip({
  ok,
  okLabel,
  noLabel,
  okIcon: OkIcon,
}: {
  ok: boolean;
  okLabel: string;
  noLabel: string;
  okIcon: React.ComponentType<{ className?: string }>;
  noIcon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5',
        ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
           : 'border-border bg-muted/40 text-muted-foreground line-through',
      )}
    >
      {ok ? <OkIcon className="size-3" aria-hidden="true" /> : <CircleSlash className="size-3" aria-hidden="true" />}
      {ok ? okLabel : noLabel}
    </span>
  );
}

function RoomChip({ label }: { label: string }) {
  return (
    <span className="border-border bg-muted/40 text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
      {label}
    </span>
  );
}

function PolicyRow({
  Icon,
  label,
  text,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <details className="group py-3 first:pt-0 last:pb-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <Icon className="text-muted-foreground size-4" aria-hidden="true" />
          {label}
        </span>
        <ArrowRight className="text-muted-foreground size-4 rotate-90 transition-transform group-open:rotate-[270deg]" aria-hidden="true" />
      </summary>
      <p className="text-muted-foreground mt-2 ps-6 text-sm leading-relaxed">{text}</p>
    </details>
  );
}
