'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { RotateCcw, Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/components/kesfet/chat-message';
import { NearbyCarousel } from '@/components/kesfet/nearby-carousel';
import { useHomeStage } from '@/components/home/home-stage-context';
import { SaveSearchButton } from '@/components/saved-searches/save-search-button';
import { buttonVariants } from '@/components/ui/button';
import type { DealShape } from '@/lib/ai/tools';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { cn } from '@/lib/utils/cn';

const QUICK_PROMPTS = [
  { label: 'Kadıköy pazar kahvaltı', text: 'Kadıköy çevresinde pazar sabahı kahvaltı önerir misin?' },
  { label: 'Cumartesi romantik akşam', text: 'Cumartesi akşamı eşimle romantik bir akşam yemeği' },
  { label: 'Ailecek bir gün planı', text: 'Pazar günü ailecek baştan sona bir gün planı kurar mısın?' },
  { label: 'Yorgunum, rahatlatıcı', text: 'Yorgunum, pazar günü rahatlatıcı bir şey öner — masaj ya da huzurlu' },
  { label: 'Çocukla hafta sonu', text: 'Çocuğumla hafta sonu birlikte yapabileceğimiz bir aktivite' },
  { label: 'Bodrum hafta sonu', text: "Bodrum'da hafta sonu için tatil oteli ve aktivite" },
];

interface ChatContainerProps {
  welcomeDeals?: DealWithMerchant[];
  city?: string;
}

export function ChatContainer({ welcomeDeals = [], city }: ChatContainerProps = {}) {
  const params = useSearchParams();
  const initialQ = params?.get('q')?.trim() ?? '';

  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const isEmpty = messages.length === 0;

  // Chat → harita coupling: en son AI tool sonuçlarını (searchDeals veya
  // createDayPlan içindeki deal'lar) HomeStage context'e ilet. Hero dışında
  // mount edildiyse stage null gelir, no-op. stage'i ref'le tutuyoruz, aksi
  // halde context value her güncellendiğinde effect tekrar tetiklenir → loop.
  const stage = useHomeStage();
  const stageRef = useRef(stage);
  stageRef.current = stage;
  useEffect(() => {
    const latest = extractLatestSuggestedDeals(messages);
    stageRef.current?.setAiSuggestedDeals(latest);
  }, [messages]);

  // Auto-send ?q= once on mount (StrictMode-safe via ref).
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (initialQ && !autoSentRef.current && isEmpty) {
      autoSentRef.current = true;
      void sendMessage({ text: initialQ });
    }
  }, [initialQ, isEmpty, sendMessage]);

  // Auto-scroll the messages container to the bottom whenever new content
  // arrives. Skipped while empty (no scroll container yet).
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isEmpty) return;
    const el = scrollRef.current;
    if (!el) return;
    // Scroll to the absolute bottom in a microtask so the new DOM is in place.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages, isLoading, isEmpty]);

  function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    void sendMessage({ text });
    setInput('');
  }

  function onQuickPrompt(text: string) {
    if (isLoading) return;
    setInput('');
    void sendMessage({ text });
  }

  function reset() {
    setMessages([]);
    setInput('');
    autoSentRef.current = false;
    stage?.setAiSuggestedDeals(null);
  }

  // Aramayı kaydet butonu için en son user mesajının text'i.
  const lastUserQuery = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== 'user') continue;
      const text = m.parts
        .filter((p) => p.type === 'text')
        .map((p) => ('text' in p ? p.text : ''))
        .join(' ')
        .trim();
      if (text.length >= 3 && text.length <= 300) return text;
    }
    return '';
  })();

  return (
    <section
      aria-label="AI sohbet"
      // Fixed height (not min-h) so the inner scroll is the ONLY scroll —
      // long conversations no longer push the carousel/categories below.
      // 100svh keeps the box stable when iOS toolbars hide/show.
      className="relative isolate flex h-[calc(100svh-4rem)] flex-col"
    >
      {/* Decorative radial glow — only in empty state */}
      {isEmpty ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-300/25 via-rose-300/15 to-blue-300/25 blur-3xl dark:from-amber-500/10 dark:via-rose-500/10 dark:to-blue-500/10" />
        </div>
      ) : null}

      {/* Main area — welcome (empty) or scrollable message list (active) */}
      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
          <WelcomeHero welcomeDeals={welcomeDeals} city={city} />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {isLoading ? <TypingIndicator /> : null}
          </div>
        </div>
      )}

      {/* Bottom dock: error + quick prompts (empty only) + chat input */}
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 sm:px-6 sm:pb-6">
        {error ? <ErrorBanner error={error} /> : null}

        {isEmpty ? (
          <div className="mb-3">
            <QuickPrompts onPrompt={onQuickPrompt} />
          </div>
        ) : null}

        {!isEmpty && lastUserQuery ? (
          <div className="mb-2 flex justify-end">
            <SaveSearchButton query={lastUserQuery} />
          </div>
        ) : null}

        <ChatInputBar
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onReset={messages.length > 0 ? reset : undefined}
          disabled={isLoading}
        />

        <p className="text-muted-foreground/70 mt-2 text-center text-[11px]">
          gidek AI{' '}
          {isLoading
            ? 'düşünüyor…'
            : 'yanıltıcı olabilir; önemli kararlar için ilgili işletmeye doğrula.'}
        </p>
      </div>
    </section>
  );
}

function WelcomeHero({
  welcomeDeals,
  city,
}: {
  welcomeDeals: DealWithMerchant[];
  city?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-6 text-center sm:gap-8">
      {welcomeDeals.length > 0 && city ? (
        <NearbyCarousel deals={welcomeDeals} city={city} />
      ) : null}
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Merhaba, ne yapmak istersin?
        </h1>
        <p className="text-muted-foreground max-w-md text-balance sm:text-lg">
          Aklındakini yaz — birkaç fırsat seçeyim, neden uyduğunu anlatayım. İstersen tüm bir
          günü baştan sona kurarım.
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <article className="flex gap-3" aria-label="gidek yazıyor">
      <span
        className="bg-violet-500/15 text-violet-600 dark:text-violet-300 inline-flex size-8 shrink-0 items-center justify-center rounded-full"
        aria-hidden="true"
      >
        <Sparkles className="size-4" />
      </span>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="bg-foreground/40 inline-block size-2 animate-bounce rounded-full [animation-delay:0ms]" />
          <span className="bg-foreground/40 inline-block size-2 animate-bounce rounded-full [animation-delay:120ms]" />
          <span className="bg-foreground/40 inline-block size-2 animate-bounce rounded-full [animation-delay:240ms]" />
        </div>
      </div>
    </article>
  );
}

function ChatInputBar({
  value,
  onChange,
  onSubmit,
  onReset,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onReset?: () => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="border-border bg-background/95 focus-within:border-foreground/40 hover:border-foreground/30 flex items-end gap-2 rounded-3xl border p-1.5 shadow-sm backdrop-blur transition-colors"
    >
      <label htmlFor="chat-input" className="sr-only">
        Aklında ne var?
      </label>
      <textarea
        id="chat-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Aklında ne var? — gerisini bana bırak."
        rows={1}
        maxLength={500}
        disabled={disabled}
        className="placeholder:text-muted-foreground/70 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-60 sm:text-base"
      />

      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          aria-label="Yeni sohbet"
          title="Yeni sohbet"
          className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      ) : null}

      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        aria-label="Gönder"
        className="bg-foreground text-background hover:bg-foreground/90 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40"
      >
        <Send className="size-4 -translate-x-px translate-y-px" aria-hidden="true" />
      </button>
    </form>
  );
}

function QuickPrompts({ onPrompt }: { onPrompt: (t: string) => void }) {
  return (
    <ul
      aria-label="Hızlı başlangıç"
      className="flex w-full flex-wrap justify-center gap-2"
    >
      {QUICK_PROMPTS.map((p) => (
        <li key={p.label}>
          <button
            type="button"
            onClick={() => onPrompt(p.text)}
            className="border-border bg-background hover:border-foreground/40 hover:bg-muted/30 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5 sm:text-sm"
          >
            {p.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ErrorBanner({ error }: { error: Error }) {
  const text = error.message;
  const isSignup = /SIGNUP_REQUIRED|sınırsız öneri|ücretsiz sorgu/i.test(text);
  const isRate = /RATE_LIMITED|limitin doldu/i.test(text);

  if (isSignup) {
    return (
      <div className="border-amber-500/30 bg-amber-500/10 mb-3 flex flex-col items-start gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-sm font-medium">Ücretsiz sorgu hakkın bugünlük doldu</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Üyelerin günde 30 sorgu hakkı var.
          </p>
        </div>
        <Link
          href="/kayit?next=/"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'shrink-0')}
        >
          Ücretsiz üye ol
        </Link>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="border-rose-500/30 bg-rose-500/10 mb-3 rounded-lg border p-4 text-sm"
    >
      {isRate
        ? 'Günlük sorgu limitin doldu. Yarın tekrar dene.'
        : 'Bir şeyler ters gitti — tekrar denemek ister misin?'}
    </div>
  );
}

/**
 * Mesaj listesinde en son AI tool sonucundan deal listesini çıkar. Hem
 * searchDeals (output.results) hem createDayPlan (output.plan.steps[].deal)
 * destekli. Null lat/lng olanlar yine de döner — filtreyi map yapar.
 */
function extractLatestSuggestedDeals(
  messages: ReturnType<typeof useChat>['messages'],
): DealShape[] | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'assistant') continue;
    for (let j = m.parts.length - 1; j >= 0; j--) {
      const part = m.parts[j] as {
        type: string;
        state?: string;
        output?: unknown;
      };
      if (part.state !== 'output-available') continue;

      if (part.type === 'tool-searchDeals') {
        const out = part.output as { results?: DealShape[] } | null;
        if (out?.results?.length) return out.results;
      }

      if (part.type === 'tool-createDayPlan') {
        const out = part.output as {
          plan?: { steps?: Array<{ deal: DealShape | null }> };
        } | null;
        const deals = (out?.plan?.steps ?? [])
          .map((s) => s.deal)
          .filter((d): d is DealShape => d !== null);
        if (deals.length > 0) return deals;
      }
    }
  }
  return null;
}
