import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/feedback/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { DeleteConversationButton } from '@/components/conversations/delete-conversation-button';
import { listConversations } from '@/lib/db/queries/conversations';
import { requireUser } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Sohbetlerim',
  description: 'Kaydedilen AI sohbetlerin.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  await requireUser();
  const conversations = await listConversations();

  return (
    <Container className="py-12 sm:py-16">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Profil
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sohbetlerim</h1>
        <p className="text-muted-foreground text-sm">
          {conversations.length === 0
            ? 'AI ile yaptığın sohbetler burada birikir.'
            : `${conversations.length} sohbet`}
        </p>
      </header>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Henüz sohbet yok"
          description="AI'a bir şey sor — konuşma otomatik kaydedilir, istediğin zaman geri dönebilirsin."
          primaryAction={{ label: 'AI ile keşfet', href: '/' }}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {conversations.map((c) => (
            <li
              key={c.id}
              className="border-border bg-background flex items-start gap-3 rounded-xl border p-4"
            >
              <MessageSquare
                className="text-muted-foreground mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{c.title}</p>
                <p className="text-muted-foreground/80 mt-1 text-[11px]">
                  Son güncelleme: {formatDate(c.updated_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  href={`/?c=${c.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Aç
                </Link>
                <DeleteConversationButton id={c.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
