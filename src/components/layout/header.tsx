import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { UserMenu } from '@/components/layout/user-menu';
import { getServerClient } from '@/lib/db/server';
import { getCurrentUser } from '@/lib/security/auth';
import { SITE } from '@/lib/utils/site-config';

const NAV_LINKS = [
  { href: '/k/kahvalti', label: 'Kahvaltı' },
  { href: '/k/yemek', label: 'Yemek' },
  { href: '/k/tiyatro', label: 'Tiyatro' },
  { href: '/k/aktivite', label: 'Aktivite' },
] as const;

// Async server component: one getCurrentUser() per request feeds both the
// desktop UserMenu and the mobile sheet. Server actions that mutate auth
// (signIn/signUp/signOut) revalidate the layout, so the very next render
// already shows the correct state — no client-side staleness, no need for
// onAuthStateChange to chase server cookie writes.
export async function Header() {
  const user = await getCurrentUser();

  // Pull just the columns the chrome needs so layout queries stay cheap.
  let avatarUrl: string | null = null;
  if (user) {
    const supabase = await getServerClient();
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    avatarUrl = data?.avatar_url ?? null;
  }

  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="text-xl font-semibold tracking-tight" aria-label={SITE.name}>
          {SITE.name}
          <span className="text-muted-foreground ms-0.5">.</span>
        </Link>

        <nav aria-label="Birincil" className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
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
          <UserMenu user={user} avatarUrl={avatarUrl} />
          <MobileMenu user={user} avatarUrl={avatarUrl} />
        </div>
      </Container>
    </header>
  );
}
