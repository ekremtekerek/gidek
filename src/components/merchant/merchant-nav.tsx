import Link from 'next/link';
import { CalendarCheck, LayoutDashboard, Store, Ticket } from 'lucide-react';

const ITEMS = [
  { href: '/isletme', label: 'Genel', Icon: LayoutDashboard },
  { href: '/isletme/firsatlar', label: 'Fırsatlarım', Icon: Ticket },
  { href: '/isletme/rezervasyonlar', label: 'Rezervasyonlar', Icon: CalendarCheck },
] as const;

export function MerchantNav() {
  return (
    <nav aria-label="İşletme menüsü" className="flex flex-col gap-1">
      <div className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 px-3 text-xs font-semibold tracking-wide uppercase">
        <Store className="size-3.5" aria-hidden="true" />
        İşletme
      </div>
      {ITEMS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="text-foreground hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
