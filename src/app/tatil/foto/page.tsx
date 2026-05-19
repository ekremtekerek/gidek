import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Camera, Image as ImageIcon, Sparkles, Wand2 } from 'lucide-react';
import { PhotoSearchUploader } from '@/components/travel/photo-search-uploader';
import { Container } from '@/components/ui/container';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Foto ile Tatil Ara · gidek',
  description:
    'Bali, Maldivler, Mykonos… Beğendiğin tatil fotosunu yükle, AI Türkiye\'den benzer atmosfere sahip destinasyonlar önersin.',
  alternates: { canonical: '/tatil/foto' },
  openGraph: {
    title: 'gidek — Foto ile tatil ara',
    description:
      'Yurtdışı tatil fotosunu yükle, AI Türkiye\'den benzerini bulsun.',
    url: `${SITE.url}/tatil/foto`,
  },
};

export const dynamic = 'force-dynamic';

export default function TatilFotoPage() {
  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/tatil"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Tatil ana sayfa
      </Link>

      <header className="mt-4 mb-8 text-center">
        <span className="bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 inline-flex size-14 items-center justify-center rounded-full shadow-lg">
          <Camera className="size-7 text-white" aria-hidden="true" />
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Tatil fotosu yükle,{' '}
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
            Türkiye&apos;den benzerini
          </span>{' '}
          bulalım
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
          Bali, Maldivler, Mykonos, İsviçre Alpleri… Beğendiğin tatil
          fotoğrafını yükle. AI atmosferi analiz edip{' '}
          <strong className="text-foreground">aynı vibe&apos;a sahip Türkiye destinasyonlarını</strong>{' '}
          önerir.
        </p>
      </header>

      <div className="mx-auto max-w-4xl">
        <PhotoSearchUploader />
      </div>

      {/* Örnekler — kullanıcı ne yapabileceğini görsün */}
      <section className="mx-auto mt-12 max-w-4xl">
        <h2 className="text-center text-sm font-bold tracking-widest uppercase text-muted-foreground mb-5">
          Örnek dönüşümler
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <ExampleCard
            from="Bali tropikal plaj"
            to="Antalya Side, Çıralı, Kaş"
            why="Turkuaz lagün + palm gölgesi"
          />
          <ExampleCard
            from="Mykonos beyaz mimari"
            to="Bozcaada, Cunda, Alaçatı"
            why="Egeli kireç-beyazı sokaklar"
          />
          <ExampleCard
            from="İsviçre dağ kabini"
            to="Uludağ, Kaçkar, Abant"
            why="Çam ormanı + göl + sis"
          />
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
        <FeatureCard
          icon={<Wand2 className="size-5" />}
          title="Gemini Vision"
          text="Görseli analiz eder — vibe, ortam, renk paleti, öğeler"
        />
        <FeatureCard
          icon={<ImageIcon className="size-5" />}
          title="Türkiye coğrafyası"
          text="80+ destinasyon bilgisi — Ege, Akdeniz, Karadeniz, Kapadokya"
        />
        <FeatureCard
          icon={<Sparkles className="size-5" />}
          title="Hemen fırsat"
          text="Önerilen destinasyondan gidek envanterine 1 tıkla"
        />
      </section>
    </Container>
  );
}

function ExampleCard({
  from,
  to,
  why,
}: {
  from: string;
  to: string;
  why: string;
}) {
  return (
    <div className="border-border bg-background flex flex-col gap-1.5 rounded-xl border p-4 shadow-sm">
      <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
        Foto: {from}
      </p>
      <p className="text-base font-bold tracking-tight">{to}</p>
      <p className="text-muted-foreground text-xs leading-relaxed">{why}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-border bg-background flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
      <span className="bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 inline-flex size-9 items-center justify-center rounded-full">
        {icon}
      </span>
      <p className="text-sm font-bold">{title}</p>
      <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
    </div>
  );
}
