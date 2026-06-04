import Link from 'next/link';
import { NewsletterForm } from '@/components/newsletter/newsletter-form';
import { ThemeToggle } from '@/components/layout/theme-toggle';
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
          <div className="mt-5 max-w-sm">
            <p className="text-foreground mb-2 text-sm font-semibold">
              Haftalık öne çıkan fırsatları yolla
            </p>
            <NewsletterForm source="footer" />
          </div>
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

        <nav aria-label="Keşfet">
          <h2 className="text-foreground mb-3 text-sm font-semibold">Keşfet</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/trend"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Bu haftanın trendleri
              </Link>
            </li>
            <li>
              <Link
                href="/u"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Topluluk seçkileri
              </Link>
            </li>
            <li>
              <Link
                href="/foto-arama"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Fotoğrafla ara
              </Link>
            </li>
            <li>
              <Link
                href="/gecmis-firsatlar"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Geçmiş fırsatlar
              </Link>
            </li>
            <li>
              <Link
                href="/favorilerim"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Favorilerim
              </Link>
            </li>
            <li>
              <Link
                href="/sss"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sıkça Sorulan Sorular
              </Link>
            </li>
          </ul>
          <h2 className="text-foreground mt-6 mb-3 text-sm font-semibold">Yasal</h2>
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
        <Container className="text-muted-foreground flex flex-col items-center justify-between gap-3 py-4 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <p>{SITE.domain}</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
