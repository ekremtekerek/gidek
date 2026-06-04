import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { ALL_FAQ_ITEMS, FAQ_SECTIONS } from '@/lib/seo/faq';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular',
  description:
    'gidek nasıl çalışır, AI asistanı nedir, ödeme ve rezervasyon nasıl yapılır, hangi şehir ve kategoriler var? gidek hakkında merak edilen her şey.',
  alternates: { canonical: '/sss' },
  openGraph: {
    title: `Sıkça Sorulan Sorular · ${SITE.name}`,
    description: 'gidek hakkında merak edilen her şey — AI, fırsatlar, ödeme, üyelik.',
    url: `${SITE.url}/sss`,
    type: 'website',
  },
};

export default function SssPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: ALL_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'Sıkça Sorulan Sorular', item: `${SITE.url}/sss` },
    ],
  };

  return (
    <>
      <Container className="pt-8 pb-16">
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-4 text-sm">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Ana sayfa
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground" aria-current="page">
              SSS
            </li>
          </ol>
        </nav>

        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-muted-foreground mt-3 leading-relaxed">
            gidek’in nasıl çalıştığı, AI asistanı, fırsatlar, ödeme ve üyelik hakkında merak
            edilenler. Aradığını bulamazsan{' '}
            <Link href="/kesfet" className="text-foreground underline-offset-4 hover:underline">
              AI asistanına
            </Link>{' '}
            sorabilirsin.
          </p>
        </header>

        <div className="flex max-w-3xl flex-col gap-10">
          {FAQ_SECTIONS.map((section) => (
            <section key={section.title} aria-labelledby={`faq-${section.title}`}>
              <h2
                id={`faq-${section.title}`}
                className="border-border mb-3 border-b pb-2 text-lg font-semibold tracking-tight"
              >
                {section.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.q}>
                    <details className="group border-border bg-background rounded-xl border px-4 open:shadow-sm">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <ChevronDown
                          className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <p className="text-muted-foreground pb-4 text-sm leading-relaxed">{item.a}</p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>

      <JsonLd data={faqLd} />
      <JsonLd data={breadcrumbLd} />
    </>
  );
}
