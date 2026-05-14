'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronDown, MessageCircle, Send, Trash2 } from 'lucide-react';
import {
  deleteEventMessageAction,
  postEventMessageAction,
  type ChatPostState,
} from '@/app/rezervasyonlarim/[code]/chat-actions';
import { Button } from '@/components/ui/button';
import { getBrowserClient } from '@/lib/db/browser';
import { cn } from '@/lib/utils/cn';

interface InitialSender {
  id: string;
  display_name: string | null;
  public_slug: string | null;
  avatar_url: string | null;
}

interface InitialMessage {
  id: string;
  body: string;
  created_at: string;
  sender: InitialSender;
}

interface Props {
  bookingCode: string;
  roomKey: string;
  currentUserId: string;
  initialMessages: InitialMessage[];
  /** Bu odaya başka katılımcılar var mı — sadece UI eyebrow için */
  participantHint: number;
}

type ChatMessage = InitialMessage;

/**
 * Etkinlik sohbet odası — collapsable. Default kapalı (CLS azaltma).
 * Açılınca son mesajları gösterir, realtime channel'a subscribe olur.
 *
 * Insert pattern: form submit ile server action → DB → realtime broadcast.
 * Optimistic update yapmıyoruz çünkü realtime zaten ~200ms içinde geri döner.
 */
export function EventChat({
  bookingCode,
  roomKey,
  currentUserId,
  initialMessages,
  participantHint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Realtime subscription — yalnız panel açıkken aktif olsun
  useEffect(() => {
    if (!open) return;
    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`event-chat:${roomKey}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `room_key=eq.${roomKey}`,
        },
        async (payload) => {
          const m = payload.new as {
            id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };
          // Sender bilgisini ayrıca çek (profiles tablosu)
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, display_name, public_slug, avatar_url')
            .eq('id', m.sender_id)
            .maybeSingle();
          setMessages((cur) => {
            if (cur.some((c) => c.id === m.id)) return cur;
            return [
              ...cur,
              {
                id: m.id,
                body: m.body,
                created_at: m.created_at,
                sender: {
                  id: m.sender_id,
                  display_name: sender?.display_name ?? null,
                  public_slug: sender?.public_slug ?? null,
                  avatar_url: sender?.avatar_url ?? null,
                },
              },
            ];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_messages',
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setMessages((cur) => cur.filter((m) => m.id !== deletedId));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, roomKey]);

  // Auto-scroll alta
  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || !body.trim()) return;
    setError(null);

    const fd = new FormData();
    fd.set('bookingCode', bookingCode);
    fd.set('body', body.trim());

    startTransition(async () => {
      const res: ChatPostState = await postEventMessageAction(null, fd);
      if (!res || !res.ok) {
        setError(res?.error ?? 'Mesaj gönderilemedi.');
        return;
      }
      setBody('');
    });
  }

  async function handleDelete(messageId: string) {
    if (!window.confirm('Mesajı silmek istiyor musun?')) return;
    const res = await deleteEventMessageAction(messageId);
    if (res.ok) {
      setMessages((cur) => cur.filter((m) => m.id !== messageId));
    }
  }

  return (
    <section className="border-border bg-background gidek-no-print mt-6 overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="event-chat-panel"
        className="hover:bg-muted/40 flex w-full items-center gap-3 p-4 text-left transition-colors sm:p-5"
      >
        <span className="bg-violet-500/15 text-violet-700 dark:text-violet-300 inline-flex size-9 items-center justify-center rounded-full">
          <MessageCircle className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Etkinlik sohbet odası</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {participantHint > 0
              ? `${participantHint} kişi katılıyor — tanışın, anlaşın`
              : 'Aynı saatte gelenlerle tanış'}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div id="event-chat-panel" className="border-border border-t">
          <div
            ref={listRef}
            className="bg-muted/10 max-h-80 overflow-y-auto px-4 py-3 sm:px-5"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Henüz mesaj yok — ilk yazan sen ol.
              </p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => {
                  const isMine = m.sender.id === currentUserId;
                  return (
                    <li key={m.id} className={cn('flex gap-2', isMine && 'flex-row-reverse')}>
                      {!isMine ? (
                        <Avatar sender={m.sender} />
                      ) : null}
                      <div className={cn('flex max-w-[80%] flex-col', isMine && 'items-end')}>
                        {!isMine ? (
                          <p className="text-muted-foreground mb-0.5 text-[11px]">
                            {m.sender.public_slug ? (
                              <Link
                                href={`/u/${m.sender.public_slug}`}
                                className="hover:text-foreground hover:underline underline-offset-2"
                              >
                                {m.sender.display_name ?? m.sender.public_slug}
                              </Link>
                            ) : (
                              <span>{m.sender.display_name ?? '—'}</span>
                            )}{' '}
                            · {timeShort(m.created_at)}
                          </p>
                        ) : null}
                        <div
                          className={cn(
                            'group relative rounded-2xl px-3 py-2 text-sm leading-snug',
                            isMine
                              ? 'bg-violet-500 text-white'
                              : 'border-border bg-background border',
                          )}
                        >
                          {m.body}
                          {isMine ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(m.id)}
                              className="absolute -left-7 top-1/2 -translate-y-1/2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
                              aria-label="Mesajı sil"
                            >
                              <Trash2 className="text-muted-foreground size-3.5" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                        {isMine ? (
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {timeShort(m.created_at)}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-border bg-background flex items-end gap-2 border-t px-4 py-3 sm:px-5"
          >
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Mesajını yaz…"
              maxLength={500}
              rows={1}
              className="border-border placeholder:text-muted-foreground bg-background focus:ring-foreground/20 max-h-32 min-h-[40px] flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <Button
              type="submit"
              size="md"
              variant="primary"
              disabled={pending || !body.trim()}
              aria-label="Gönder"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>

          {error ? (
            <p className="border-border bg-rose-50 px-4 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 sm:px-5">
              {error}
            </p>
          ) : null}

          <p className="text-muted-foreground bg-muted/30 px-4 py-2 text-[11px] sm:px-5">
            Sohbet sadece bu etkinliğin onaylı katılımcılarına açıktır.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Avatar({ sender }: { sender: InitialSender }) {
  const name = sender.display_name ?? sender.public_slug ?? '—';
  const initials = name
    .split(/[\s@.]+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="bg-muted text-foreground inline-flex size-7 shrink-0 items-center justify-center self-end overflow-hidden rounded-full text-[10px] font-semibold">
      {sender.avatar_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={sender.avatar_url} alt={name} className="size-full object-cover" />
      ) : (
        initials || '—'
      )}
    </span>
  );
}

function timeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
