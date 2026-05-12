import Link from 'next/link';
import { Activity, LayoutDashboard, MessageSquare, Sparkles, Store, Ticket } from 'lucide-react';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/deals', label: 'Fırsatlar', Icon: Ticket },
  { href: '/admin/merchants', label: 'İşletmeler', Icon: Store },
  { href: '/admin/reviews', label: 'Yorumlar', Icon: MessageSquare },
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
