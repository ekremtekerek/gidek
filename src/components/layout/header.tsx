import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils/cn';
import { SITE } from '@/lib/utils/site-config';

const NAV_LINKS = [
  { href: '/k/kahvalti', label: 'Kahvaltı' },
  { href: '/k/yemek', label: 'Yemek' },
  { href: '/k/tiyatro', label: 'Tiyatro' },
  { href: '/k/aktivite', label: 'Aktivite' },
] as const;

export function Header() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-xl font-semibold tracking-tight" aria-label={SITE.name}>
          {SITE.name}
          <span className="text-muted-foreground ms-0.5">.</span>
        </Link>

        <nav aria-label="Birincil" className="hidden items-center gap-1 md:flex">
          <Link
            href="/kesfet"
            className="hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            AI ile keşfet
          </Link>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/giris"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
          >
            Giriş
          </Link>
          <Link href="/kayit" className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>
            Üye Ol
          </Link>
        </div>
      </Container>
    </header>
  );
}
