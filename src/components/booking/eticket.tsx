import Image from 'next/image';
import { CalendarDays, MapPin, Ticket, Users } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { generateQrDataUrl } from '@/lib/utils/qr';
import { formatDate, formatTRY } from '@/lib/utils/format';

interface Props {
  bookingCode: string;
  dealTitle: string;
  dealCover: string;
  merchantName?: string;
  location?: string;
  selectedDate?: string | null;
  selectedTime?: string | null;
  quantity: number;
  totalAmount: number | string;
}

/**
 * E-bilet seti — quantity kadar ayrı bilet basar. Her biri kendi QR + alt
 * koduna sahiptir (`{bookingCode}-T01`, `-T02`, …). Tek kişilikse alt kod
 * yerine ana booking_code görünür. Print: ikinci bilettekn itibaren her bilet
 * yeni sayfada.
 */
export async function ETicket({
  bookingCode,
  dealTitle,
  dealCover,
  merchantName,
  location,
  selectedDate,
  selectedTime,
  quantity,
  totalAmount,
}: Props) {
  const safeQty = Math.max(1, quantity);
  const unitPrice = Number(totalAmount) / safeQty;

  const tickets = await Promise.all(
    Array.from({ length: safeQty }, (_, i) => i + 1).map(async (idx) => {
      const code =
        safeQty === 1 ? bookingCode : `${bookingCode}-T${String(idx).padStart(2, '0')}`;
      const qr = await generateQrDataUrl(code);
      return { idx, code, qr };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      {tickets.map(({ idx, code, qr }) => (
        <article
          key={code}
          aria-label={
            safeQty === 1 ? 'E-bilet' : `E-bilet ${idx} / ${safeQty}`
          }
          className={cn(
            'gidek-eticket border-border bg-background relative overflow-hidden rounded-2xl border shadow-sm print:border-2 print:shadow-none',
            idx > 1 ? 'print:break-before-page' : null,
          )}
        >
          <header className="relative">
            <div className="bg-muted relative aspect-[3/1] w-full overflow-hidden sm:aspect-[16/4]">
              <Image
                src={dealCover}
                alt={dealTitle}
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
                priority={idx === 1}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 text-white sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase opacity-80">
                  E-bilet{safeQty > 1 ? ` · ${idx} / ${safeQty}` : ''}
                </p>
                <h2 className="line-clamp-2 text-lg leading-tight font-semibold sm:text-xl">
                  {dealTitle}
                </h2>
                {merchantName ? (
                  <p className="mt-0.5 text-xs opacity-90">{merchantName}</p>
                ) : null}
              </div>
            </div>
          </header>

          <div aria-hidden="true" className="relative h-6">
            <div className="absolute top-0 left-0 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)] border border-border" />
            <div className="absolute top-0 right-0 size-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)] border border-border" />
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 border-t border-dashed border-border" />
          </div>

          <div className="grid gap-5 p-4 pt-1 sm:grid-cols-[1fr_auto] sm:p-6 sm:pt-2">
            <dl className="divide-border divide-y">
              {selectedDate ? (
                <Row
                  icon={<CalendarDays className="size-4" aria-hidden="true" />}
                  label="Tarih"
                  value={`${formatDate(selectedDate)}${
                    selectedTime ? ` · ${selectedTime.slice(0, 5)}` : ''
                  }`}
                />
              ) : null}
              {location ? (
                <Row
                  icon={<MapPin className="size-4" aria-hidden="true" />}
                  label="Konum"
                  value={location}
                />
              ) : null}
              <Row
                icon={<Users className="size-4" aria-hidden="true" />}
                label={safeQty > 1 ? 'Bilet' : 'Kişi'}
                value={safeQty > 1 ? `${idx} / ${safeQty}` : '1 adet'}
              />
              <Row
                icon={<Ticket className="size-4" aria-hidden="true" />}
                label={safeQty > 1 ? 'Tutar (bilet başı)' : 'Toplam'}
                value={formatTRY(safeQty > 1 ? unitPrice : Number(totalAmount))}
              />
            </dl>

            <div className="flex flex-col items-center gap-2 sm:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`Bilet kodu QR: ${code}`}
                className="border-border rounded-lg border bg-white p-1 size-32 sm:size-36"
              />
              <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                Bilet kodu
              </p>
              <p className="font-mono text-sm font-semibold tracking-wider">{code}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
        <dt className="text-muted-foreground text-xs">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
