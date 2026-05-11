import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';
import { FOOTER_LEGAL_LINKS, SITE } from '@/lib/utils/site-config';

export function Footer() {
  return (
    <footer className="border-border mt-16 border-t">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            {SITE.name}
            <span className="text-muted-foreground ms-0.5">.</span>
          </Link>
          <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
            {SITE.description}
          </p>
        </div>

        <nav aria-label="Kategoriler">
          <h2 className="text-foreground mb-3 text-sm font-semibold">Kategoriler</h2>
          <ul className="space-y-2 text-sm">
            {MAIN_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/k/${c.slug}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Yasal">
          <h2 className="text-foreground mb-3 text-sm font-semibold">Yasal</h2>
          <ul className="space-y-2 text-sm">
            {FOOTER_LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-border border-t">
        <Container className="text-muted-foreground flex flex-col items-center justify-between gap-2 py-4 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tüm hakları saklıdır.
          </p>
          <p>{SITE.domain}</p>
        </Container>
      </div>
    </footer>
  );
}
