import Link from 'next/link';
import {
  Activity,
  CalendarCheck,
  LayoutDashboard,
  ListTree,
  Mail,
  MessageSquare,
  Sparkles,
  Store,
  Tag,
  Ticket,
  Users,
} from 'lucide-react';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/deals', label: 'Fırsatlar', Icon: Ticket },
  { href: '/admin/categories', label: 'Kategoriler', Icon: ListTree },
  { href: '/admin/bookings', label: 'Rezervasyonlar', Icon: CalendarCheck },
  { href: '/admin/coupons', label: 'Kuponlar', Icon: Tag },
  { href: '/admin/merchants', label: 'İşletmeler', Icon: Store },
  { href: '/admin/reviews', label: 'Yorumlar', Icon: MessageSquare },
  { href: '/admin/users', label: 'Kullanıcılar', Icon: Users },
  { href: '/admin/newsletter', label: 'Newsletter', Icon: Mail },
  { href: '/admin/ai-logs', label: 'AI sorguları', Icon: Activity },
] as const;

export function AdminNav() {
  return (
    <nav aria-label="Admin menüsü" className="flex flex-col gap-1">
      <div className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 px-3 text-xs font-semibold tracking-wide uppercase">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Admin
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
