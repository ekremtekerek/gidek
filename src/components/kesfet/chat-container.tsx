'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/components/kesfet/chat-message';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const QUICK_PROMPTS = [
  { label: 'Kadıköy pazar kahvaltı', text: 'Kadıköy çevresinde pazar sabahı kahvaltı önerir misin?' },
  { label: 'Cumartesi romantik akşam', text: 'Cumartesi akşamı eşimle romantik bir akşam yemeği' },
  { label: 'Ailecek bir gün planı', text: 'Pazar günü ailecek baştan sona bir gün planı kurar mısın?' },
  { label: 'Yorgunum, rahatlatıcı', text: 'Yorgunum, pazar günü rahatlatıcı bir şey öner — masaj ya da huzurlu' },
  { label: 'Çocukla hafta sonu', text: 'Çocuğumla hafta sonu birlikte yapabileceğimiz bir aktivite' },
  { label: 'Bodrum hafta sonu', text: "Bodrum'da hafta sonu için tatil oteli ve aktivite" },
];

export function ChatContainer() {
  const params = useSearchParams();
  const initialQ = params?.get('q')?.trim() ?? '';

  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-send query string on first mount only — React StrictMode runs effects
  // twice in dev, so guard with a ref to avoid duplicate sends.
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (initialQ && !autoSentRef.current && messages.length === 0) {
      autoSentRef.current = true;
      void sendMessage({ text: initialQ });
    }
  }, [initialQ, messages.length, sendMessage]);

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
  }

  const isEmpty = messages.length === 0;

  return (
    <section aria-label="AI keşif sohbeti" className="relative isolate overflow-hidden">
      {/* decorative glow — only when empty so it doesn't compete with chat content */}
      {isEmpty ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-300/25 via-rose-300/15 to-blue-300/25 blur-3xl dark:from-amber-500/10 dark:via-rose-500/10 dark:to-blue-500/10" />
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        {isEmpty ? <WelcomeHero /> : <MessageList messages={messages} isLoading={isLoading} />}

        {error ? <ErrorBanner error={error} /> : null}

        <ChatInputBar
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          onReset={messages.length > 0 ? reset : undefined}
          disabled={isLoading}
        />

        {isEmpty ? <QuickPrompts onPrompt={onQuickPrompt} /> : null}
      </div>
    </section>
  );
}

function WelcomeHero() {
  return (
    <header className="flex flex-col items-center gap-4 text-center sm:gap-5">
      <span className="border-border bg-background/70 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur">
        <Sparkles className="size-3.5" aria-hidden="true" />
        AI destekli plan keşfi
      </span>
      <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
        Merhaba, ne yapmak istersin?
      </h1>
      <p className="text-muted-foreground max-w-lg text-balance sm:text-lg">
        Aklındakini yaz — birkaç fırsat seçeyim ve neden uyuyor anlatayım. İstersen tüm bir gün
        planı bile kurayım.
      </p>
    </header>
  );
}

function MessageList({
  messages,
  isLoading,
}: {
  messages: ReturnType<typeof useChat>['messages'];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 pl-11 text-sm">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-current" />
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          gidek düşünüyor…
        </div>
      ) : null}
    </div>
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
      className="border-border bg-background/95 focus-within:border-foreground/50 sticky bottom-2 z-10 flex items-end gap-2 rounded-2xl border-2 p-2 shadow-md backdrop-blur transition-colors sm:bottom-4"
      role="search"
    >
      <label htmlFor="chat-input" className="sr-only">
        Ne yapmak istersin?
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
        placeholder="Ne yapmak istersin? Örn. 'Cumartesi eşimle romantik akşam yemeği'"
        rows={1}
        maxLength={500}
        disabled={disabled}
        className="placeholder:text-muted-foreground/80 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none disabled:opacity-60 sm:text-base"
      />
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="hover:bg-muted text-muted-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl"
          aria-label="Yeni sohbet"
          title="Yeni sohbet"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      ) : null}
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-50"
        aria-label="Gönder"
      >
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

function QuickPrompts({ onPrompt }: { onPrompt: (t: string) => void }) {
  return (
    <ul aria-label="Hızlı başlangıç" className="flex w-full flex-wrap justify-center gap-2">
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
      <div className="border-amber-500/30 bg-amber-500/10 flex flex-col items-start gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
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
    <div role="alert" className="border-rose-500/30 bg-rose-500/10 rounded-lg border p-4 text-sm">
      {isRate
        ? 'Günlük sorgu limitin doldu. Yarın tekrar dene.'
        : 'Bir şeyler ters gitti — tekrar denemek ister misin?'}
    </div>
  );
}
