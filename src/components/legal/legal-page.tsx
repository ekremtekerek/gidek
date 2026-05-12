import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { formatDate } from '@/lib/utils/format';

interface Props {
  title: string;
  /** ISO date string for the latest revision of this document. */
  lastUpdated: string;
  /** When true, render the amber "this is a draft" notice. Default true while
   *  the texts haven't been reviewed by a lawyer. */
  draft?: boolean;
  children: ReactNode;
}

/**
 * Shared layout for /yasal/* documents. Child elements are styled via
 * descendant Tailwind selectors so each page can write plain semantic HTML
 * without per-element className noise.
 */
export function LegalPage({ title, lastUpdated, draft = true, children }: Props) {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <article>
        <header className="border-border mb-8 border-b pb-6">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
            Yasal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">
            Son güncelleme: {formatDate(lastUpdated)}
          </p>

          {draft ? (
            <div
              role="note"
              className="border-amber-500/30 bg-amber-500/10 mt-5 flex items-start gap-3 rounded-md border p-3 text-amber-700 dark:text-amber-300"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="text-sm">
                <strong>Taslak metin.</strong> Bu içerik MVP demosu içindir; üretime almadan önce
                hukuki danışmandan onay al ve şirket bilgilerini doldur.
              </p>
            </div>
          ) : null}
        </header>

        <div
          className={[
            'flex flex-col gap-4',
            // headings
            '[&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight',
            '[&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-1 [&_h3]:text-base [&_h3]:font-semibold',
            // body
            '[&_p]:text-foreground/85 [&_p]:text-sm [&_p]:leading-relaxed',
            // lists
            '[&_ul]:text-foreground/85 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_ul]:text-sm',
            '[&_ol]:text-foreground/85 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6 [&_ol]:text-sm',
            // links
            '[&_a]:text-foreground [&_a]:font-medium [&_a]:underline-offset-4 hover:[&_a]:underline',
            // strong / em
            '[&_strong]:text-foreground [&_strong]:font-semibold',
          ].join(' ')}
        >
          {children}
        </div>
      </article>
    </Container>
  );
}
