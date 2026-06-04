import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, Sparkles } from 'lucide-react';
import { getOrCreateReferral } from '@/app/davet/actions';
import { ShareReferralCard } from '@/components/davet/share-referral-card';
import { Container } from '@/components/ui/container';
import { requireUser } from '@/lib/security/auth';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Arkadaşını davet et',
  description: 'Arkadaşını davet et, ikiniz de 100 TL kupon kazanın.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const REWARD_TL = 100;

export default async function DavetPage() {
  await requireUser();
  const summary = await getOrCreateReferral();
  const link = `${SITE.url}/?ref=${summary.code}`;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold tracking-wide text-amber-600 uppercase dark:text-amber-400">
            <Gift className="size-3.5" aria-hidden="true" />
            Davet & kazan
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Arkadaşını davet et,{' '}
            <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
              ikinize de {REWARD_TL} TL kupon
            </span>
          </h1>
          <p className="text-muted-foreground mt-3">
            Linkinizi paylaşın. Arkadaşınız kaydolup ilk rezervasyonunu yapınca ikiniz de bir
            sonraki fırsatınızda {REWARD_TL} TL indirim kazanır.
          </p>
        </header>

        <ShareReferralCard code={summary.code} link={link} />

        <section className="border-border bg-muted/30 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold tracking-tight">Şu ana kadar</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold">{summary.claimCount}</span>
            <span className="text-muted-foreground text-sm">arkadaş katıldı</span>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            Hak edilen kupon karşılığı: {summary.claimCount * REWARD_TL} TL
          </p>
        </section>

        <section className="flex items-start gap-3 text-sm">
          <Sparkles className="text-foreground/70 mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="text-muted-foreground">
            Kuralları kısaca: Davet kodu sahibi yalnızca yeni hesaplara verilebilir. Aynı kullanıcı
            yalnızca bir kez davet kullanabilir.{' '}
            <Link
              href="/yasal/kullanim-kosullari"
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              Detaylı koşullar
            </Link>
            .
          </p>
        </section>
      </div>
    </Container>
  );
}
