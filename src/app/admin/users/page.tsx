import type { Metadata } from 'next';
import { Heart, MailCheck, MailWarning, ShieldAlert, Ticket } from 'lucide-react';
import { MerchantAssignSelect } from '@/components/admin/merchant-assign-select';
import { UserBanToggle } from '@/components/admin/user-ban-toggle';
import { Badge } from '@/components/ui/badge';
import { getServiceClient } from '@/lib/db/service';
import { listAdminUsers } from '@/lib/db/queries/users';

export const metadata: Metadata = {
  title: 'Kullanıcılar · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const REL_FORMATTER = new Intl.RelativeTimeFormat('tr-TR', { numeric: 'auto' });

function relTime(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'az önce';
  if (min < 60) return REL_FORMATTER.format(-min, 'minute');
  const hour = Math.round(min / 60);
  if (hour < 24) return REL_FORMATTER.format(-hour, 'hour');
  const day = Math.round(hour / 24);
  if (day < 30) return REL_FORMATTER.format(-day, 'day');
  return DATE_FORMATTER.format(new Date(iso));
}

export default async function AdminUsersPage() {
  const supabase = getServiceClient();
  const [users, { data: merchantOptions }] = await Promise.all([
    listAdminUsers(200),
    supabase.from('merchants').select('id, name').eq('is_active', true).order('name'),
  ]);
  const merchants = merchantOptions ?? [];

  const total = users.length;
  const banned = users.filter((u) => u.bannedUntil && new Date(u.bannedUntil) > new Date()).length;
  const unconfirmed = users.filter((u) => !u.emailConfirmed).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
          Yönetim
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Kullanıcılar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {total} kayıt · {banned} banlı · {unconfirmed} e-posta onaylanmamış
        </p>
      </header>

      {users.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Kullanıcı yok.
        </p>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {users.map((u) => {
            const isBanned = Boolean(u.bannedUntil && new Date(u.bannedUntil) > new Date());
            const initials =
              (u.displayName ?? u.email ?? '?')
                .split(/[\s@.]+/)
                .map((p) => p[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || '?';

            return (
              <li
                key={u.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="bg-muted text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {u.displayName ?? u.email?.split('@')[0] ?? 'İsimsiz'}
                    </p>
                    {isBanned ? (
                      <Badge variant="warning" size="sm" className="inline-flex items-center gap-1">
                        <ShieldAlert className="size-3" aria-hidden="true" />
                        Banlı
                      </Badge>
                    ) : null}
                    {u.emailConfirmed ? (
                      <Badge variant="outline" size="sm" className="inline-flex items-center gap-1">
                        <MailCheck className="size-3" aria-hidden="true" />
                        Onaylı
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm" className="inline-flex items-center gap-1">
                        <MailWarning className="size-3" aria-hidden="true" />
                        Onaysız
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {u.email ?? '—'}
                    {u.phone ? ` · ${u.phone}` : ''}
                  </p>
                  <p className="text-muted-foreground mt-1 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Ticket className="size-3" aria-hidden="true" />
                      {u.bookingCount} rezervasyon
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" aria-hidden="true" />
                      {u.favoriteCount} favori
                    </span>
                    <span>kayıt {DATE_FORMATTER.format(new Date(u.createdAt))}</span>
                    <span>son giriş {relTime(u.lastSignInAt)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <MerchantAssignSelect
                    userId={u.id}
                    currentMerchantId={u.merchantId}
                    merchants={merchants}
                  />
                  <UserBanToggle id={u.id} banned={isBanned} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
