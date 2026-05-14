import Link from 'next/link';
import { User as UserIcon, Users } from 'lucide-react';
import { getServerClient } from '@/lib/db/server';

interface Props {
  bookingCode: string;
}

interface Attendee {
  user_id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  quantity: number;
}

/**
 * "Aynı etkinliktekiler" — booking detay sayfasında gösterilen, opt-in olmuş
 * diğer katılımcıların listesi. RPC service-definer ama auth context
 * gerektiriyor → server client kullanıyoruz.
 *
 * Kullanıcı opt-in değilse hiçbir attendee dönmez ve component görünmez.
 */
export async function AttendeesSection({ bookingCode }: Props) {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc('attendees_for_booking', {
    p_booking_code: bookingCode,
  });

  if (error) return null;

  const attendees = ((data ?? []) as unknown as Attendee[]).filter(
    (a) => a.public_slug !== null,
  );
  if (attendees.length === 0) return null;

  const totalGuests = attendees.reduce((sum, a) => sum + (a.quantity ?? 1), 0);

  return (
    <section className="border-border bg-background gidek-no-print mt-6 overflow-hidden rounded-xl border">
      <header className="border-border flex items-center gap-3 border-b p-4 sm:p-5">
        <span className="bg-sky-500/15 text-sky-700 dark:text-sky-300 inline-flex size-9 items-center justify-center rounded-full">
          <Users className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Aynı etkinlikte {attendees.length} kişi</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Toplam {totalGuests} kişilik — profillerine göz at, takip et.
          </p>
        </div>
      </header>

      <ul className="divide-border divide-y">
        {attendees.map((a) => {
          const name = a.display_name ?? a.public_slug ?? '—';
          const initials = name
            .split(/[\s@.]+/)
            .map((p) => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase();
          return (
            <li key={a.user_id}>
              <Link
                href={`/u/${a.public_slug}`}
                className="hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors sm:px-5"
              >
                <span className="bg-muted text-foreground inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold">
                  {a.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={a.avatar_url}
                      alt={name}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials || <UserIcon className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{name}</p>
                  <p className="text-muted-foreground text-[11px]">
                    @{a.public_slug} · {a.quantity} kişilik
                  </p>
                </div>
                <span aria-hidden="true" className="text-muted-foreground text-xs">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground bg-muted/30 px-4 py-2.5 text-[11px] leading-relaxed sm:px-5">
        Sen de bu listede görünmek istersen{' '}
        <Link
          href="/profil/duzenle"
          className="text-foreground underline-offset-2 hover:underline"
        >
          profil ayarlarından
        </Link>{' '}
        “katılım paylaşımı”nı aç.
      </p>
    </section>
  );
}
