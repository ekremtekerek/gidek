import {
  BedDouble,
  CalendarDays,
  Crown,
  Eye,
  LogIn,
  LogOut,
  Moon,
  Users,
  UserSquare,
} from 'lucide-react';
import type { BookingGuest, BookingRoomInfo } from '@/lib/db/queries/hotel';
import { cn } from '@/lib/utils/cn';
import { formatDate, formatTRY } from '@/lib/utils/format';

const BOARD_LABELS: Record<string, string> = {
  'oda': 'Sadece oda',
  'oda-kahvalti': 'Oda + Kahvaltı',
  'yarim-pansiyon': 'Yarım Pansiyon',
  'tam-pansiyon': 'Tam Pansiyon',
  'her-sey-dahil': 'Her Şey Dahil',
  'ultra-her-sey-dahil': 'Ultra Her Şey Dahil',
};

const VIEW_LABELS: Record<string, string> = {
  deniz: 'deniz manzaralı',
  bahce: 'bahçe manzaralı',
  havuz: 'havuz manzaralı',
  dag: 'dağ manzaralı',
  sehir: 'şehir manzaralı',
  park: 'park manzaralı',
};

interface BookingHotelData {
  check_in_date: string | null;
  check_out_date: string | null;
  nights: number | null;
  adult_count: number | null;
  child_count: number | null;
  board_basis: string | null;
  tourism_tax_total: number;
  unit_price: number;
  total_amount: number;
}

interface Props {
  booking: BookingHotelData;
  room: BookingRoomInfo | null;
  guests: BookingGuest[];
  /** "compact" sadece tarih + oda + fiyat (ödeme aside için);
   *  "full" tam misafir listesi + fiyat dökümü (rezervasyon detayı için) */
  variant?: 'compact' | 'full';
}

export function HotelBookingSummary({
  booking,
  room,
  guests,
  variant = 'full',
}: Props) {
  const nights = booking.nights ?? 0;
  const adults = booking.adult_count ?? 0;
  const kids = booking.child_count ?? 0;
  const roomSubtotal = nights > 0 ? Number(booking.unit_price) * nights : 0;
  const tourismTax = Number(booking.tourism_tax_total) || 0;
  const total = Number(booking.total_amount);
  const lead = guests.find((g) => g.is_lead);
  const others = guests.filter((g) => !g.is_lead);
  const board = room?.board_basis ?? booking.board_basis;

  return (
    <div className="flex flex-col gap-4">
      {/* Tarih & kişi */}
      <div className="border-border bg-muted/20 grid grid-cols-2 gap-2 rounded-lg border p-4 text-sm sm:grid-cols-4">
        <Cell Icon={LogIn} label="Giriş" value={booking.check_in_date ? formatDate(booking.check_in_date) : '—'} />
        <Cell Icon={LogOut} label="Çıkış" value={booking.check_out_date ? formatDate(booking.check_out_date) : '—'} />
        <Cell Icon={Moon} label="Gece" value={`${nights}`} />
        <Cell
          Icon={Users}
          label="Misafir"
          value={`${adults} yetişkin${kids > 0 ? ` + ${kids} çocuk` : ''}`}
        />
      </div>

      {/* Oda */}
      {room ? (
        <div className="border-border rounded-lg border p-4">
          <p className="text-muted-foreground mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <BedDouble className="size-3.5" aria-hidden="true" />
            Seçilen oda
          </p>
          <p className="text-base font-semibold tracking-tight">{room.name}</p>
          <p className="text-muted-foreground mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {room.bed_setup ? <span>{room.bed_setup}</span> : null}
            {room.size_sqm ? <span>· {room.size_sqm} m²</span> : null}
            {room.view_type ? (
              <span className="inline-flex items-center gap-1">
                · <Eye className="size-3" aria-hidden="true" /> {VIEW_LABELS[room.view_type] ?? room.view_type}
              </span>
            ) : null}
            <span className="bg-muted ms-auto rounded-full px-2 py-0.5">
              {BOARD_LABELS[board ?? ''] ?? board ?? '—'}
            </span>
          </p>
        </div>
      ) : null}

      {/* Misafir listesi — sadece full variant */}
      {variant === 'full' && guests.length > 0 ? (
        <div className="border-border rounded-lg border p-4">
          <p className="text-muted-foreground mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <UserSquare className="size-3.5" aria-hidden="true" />
            Misafirler ({guests.length})
          </p>
          <ul className="flex flex-col divide-y divide-[var(--border)]">
            {lead ? <GuestRow g={lead} /> : null}
            {others.map((g) => (
              <GuestRow key={g.id} g={g} />
            ))}
          </ul>
        </div>
      ) : null}

      {/* Fiyat dökümü — sadece full variant; compact'te aside içindeki
          subtotal/kupon/toplam bölgesi bu işi üstlenir */}
      {variant === 'full' && nights > 0 ? (
        <div className="border-border bg-muted/20 flex flex-col gap-2 rounded-lg border p-4 text-sm">
          <PriceRow
            label={`Oda (${nights} gece × ${formatTRY(Number(booking.unit_price))})`}
            value={formatTRY(roomSubtotal)}
          />
          {tourismTax > 0 ? (
            <PriceRow
              label={`Konaklama vergisi (${adults} kişi × ${nights} gece)`}
              value={formatTRY(tourismTax)}
            />
          ) : null}
          <div className="border-border mt-1 flex items-baseline justify-between border-t pt-2">
            <span className="text-sm font-medium">Toplam</span>
            <span className="text-xl font-semibold tabular-nums">{formatTRY(total)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Cell({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px]">{label}</p>
        <p className="text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function GuestRow({ g }: { g: BookingGuest }) {
  const isAdult = g.guest_type === 'adult';
  const idShort = g.national_id
    ? `${g.national_id.slice(0, 3)}•••••${g.national_id.slice(-2)}`
    : g.passport_no
      ? `${g.passport_no.slice(0, 2)}•••${g.passport_no.slice(-2)}`
      : null;

  return (
    <li className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <span
        className={cn(
          'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          g.is_lead ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground',
        )}
        aria-hidden="true"
      >
        {g.is_lead ? <Crown className="size-4" aria-hidden="true" /> : g.first_name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">
          {g.first_name} {g.last_name}
          {g.is_lead ? (
            <span className="text-muted-foreground ms-2 text-[10px] font-normal uppercase tracking-wider">
              · sahip
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground mt-0.5 inline-flex flex-wrap items-center gap-x-2 text-[11px]">
          <span>{isAdult ? 'Yetişkin' : 'Çocuk'}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-0.5">
            <CalendarDays className="size-3" aria-hidden="true" />
            {formatDate(g.birth_date)}
          </span>
          {idShort ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{idShort}</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{g.nationality}</span>
        </p>
      </div>
    </li>
  );
}
