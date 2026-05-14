import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { SpinPrize } from '@/app/cark/actions';
import { SpinWheel } from '@/components/cark/spin-wheel';
import { Container } from '@/components/ui/container';
import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Günlük çark',
  description: 'Günde bir kez çevir, puan ve kupon kazan.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface SpinRow {
  spin_date: string;
  prize_kind: string;
  label: string;
  points: number | null;
  coupon_code: string | null;
  coupon_value: number | null;
}

function rowToPrize(r: SpinRow): SpinPrize {
  if (r.prize_kind === 'points') {
    return { kind: 'points', label: r.label, points: r.points ?? 0 };
  }
  if (r.prize_kind === 'coupon') {
    return {
      kind: 'coupon',
      label: r.label,
      couponCode: r.coupon_code ?? '',
      couponValue: r.coupon_value ?? 0,
    };
  }
  return { kind: 'none', label: r.label };
}

export default async function CarkPage() {
  const user = await requireUser();

  const supabase = getServiceClient();
  // Bugünün spin'i + son 7 günün geçmişi
  const todayStr = new Date().toISOString().slice(0, 10);
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: rows } = await supabase
    .from('user_daily_spins')
    .select('spin_date, prize_kind, label, points, coupon_code, coupon_value')
    .eq('user_id', user.id)
    .gte('spin_date', sinceStr)
    .order('spin_date', { ascending: false });

  const all = (rows ?? []) as SpinRow[];
  const today = all.find((r) => r.spin_date === todayStr) ?? null;
  const past = all.filter((r) => r.spin_date !== todayStr);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl">
        <Link
          href="/profil"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Profile dön
        </Link>

        <header className="mt-4 mb-8 text-center">
          <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Günlük çark
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Çevir, kazan
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
            Günde bir kez çevirme hakkın var — puan, kupon ya da boş çıkabilir.
            Her sabah yeniden yenilenir.
          </p>
        </header>

        <SpinWheel
          alreadySpunToday={today !== null}
          todayPrize={today ? rowToPrize(today) : null}
        />

        {past.length > 0 ? (
          <section className="mt-12">
            <h2 className="mb-3 text-sm font-semibold tracking-tight">
              Son 7 gün
            </h2>
            <ul className="divide-border bg-background divide-y rounded-lg border">
              {past.map((r) => (
                <li
                  key={r.spin_date}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="text-muted-foreground text-xs">
                    {formatDate(r.spin_date)}
                  </span>
                  <span
                    className={
                      r.prize_kind === 'none'
                        ? 'text-muted-foreground text-xs'
                        : 'text-sm font-medium'
                    }
                  >
                    {r.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
