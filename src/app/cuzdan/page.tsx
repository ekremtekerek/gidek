import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Wallet } from 'lucide-react';
import { WalletCouponCard } from '@/components/wallet/wallet-coupon-card';
import { Container } from '@/components/ui/container';
import { listWalletCoupons, type WalletCoupon } from '@/lib/db/queries/wallet';
import { requireUser } from '@/lib/security/auth';

export const metadata: Metadata = {
  title: 'Cüzdanım · gidek',
  description: 'Tüm kupon ve indirim kodların tek bir ekranda.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CuzdanPage() {
  const user = await requireUser();
  const coupons = await listWalletCoupons(user.id);

  const usable = coupons.filter((c) => c.status === 'usable');
  const used = coupons.filter((c) => c.status === 'used');
  const expired = coupons.filter((c) => c.status === 'expired' || c.status === 'inactive');

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/profil"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Profile dön
        </Link>

        <header className="mt-4 mb-8 text-center">
          <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Wallet className="size-3.5" aria-hidden="true" />
            Cüzdanım
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tüm kuponların burada
          </h1>
          <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Rezervasyonlar, çark, sadakat ödülleri ve iadelerden kazandığın
            tüm kuponlar — kullanılabilir, kullanılmış ve süresi geçmiş.
          </p>
        </header>

        {coupons.length === 0 ? (
          <EmptyWallet />
        ) : (
          <>
            <Section title="Kullanılabilir" coupons={usable} accent="emerald" />
            {used.length > 0 ? (
              <Section title="Kullanılmış" coupons={used} accent="slate" />
            ) : null}
            {expired.length > 0 ? (
              <Section title="Süresi geçmiş" coupons={expired} accent="slate" />
            ) : null}
          </>
        )}
      </div>
    </Container>
  );
}

function Section({
  title,
  coupons,
  accent,
}: {
  title: string;
  coupons: WalletCoupon[];
  accent: 'emerald' | 'slate';
}) {
  if (coupons.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
        {title} <span className="tabular-nums">({coupons.length})</span>
      </h2>
      <ul className="space-y-3">
        {coupons.map((c) => (
          <li key={c.code}>
            <WalletCouponCard coupon={c} dimmed={accent === 'slate'} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EmptyWallet() {
  return (
    <div className="border-border bg-muted/30 rounded-2xl border border-dashed p-10 text-center">
      <Wallet className="text-muted-foreground mx-auto mb-3 size-10" aria-hidden="true" />
      <p className="text-sm font-medium">Cüzdanın henüz boş</p>
      <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-xs leading-relaxed">
        Günlük çarkı çevir, şehir bingosunu tamamla veya rezervasyon yap — her
        biri sana özel kupon kazandırır.
      </p>
      <Link
        href="/cark"
        className="bg-foreground text-background hover:bg-foreground/90 mt-5 inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors"
      >
        Çarkı çevir
      </Link>
    </div>
  );
}
