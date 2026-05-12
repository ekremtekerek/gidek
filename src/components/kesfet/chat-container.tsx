'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
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
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

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
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {messages.length === 0 ? (
        <WelcomeState onPrompt={onQuickPrompt} />
      ) : (
        <div className="flex flex-col gap-5">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-current" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
              gidek düşünüyor…
            </div>
          ) : null}
        </div>
      )}

      {error ? <ErrorBanner error={error} /> : null}

      <form
        onSubmit={onSubmit}
        className="border-border bg-background/90 focus-within:border-foreground/50 sticky bottom-4 flex items-end gap-2 rounded-2xl border-2 p-2 shadow-sm transition-colors"
        role="search"
      >
        <label htmlFor="chat-input" className="sr-only">
          Ne yapmak istersin?
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Ne yapmak istersin? Örn. 'Cumartesi eşimle romantik akşam yemeği'"
          rows={1}
          maxLength={500}
          disabled={isLoading}
          className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none disabled:opacity-60 sm:text-base"
        />
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={reset}
            disabled={isLoading}
            className="hover:bg-muted text-muted-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-xl"
            aria-label="Yeni sohbet"
            title="Yeni sohbet"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex size-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-50"
          aria-label="Gönder"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}

function WelcomeState({ onPrompt }: { onPrompt: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center sm:py-14">
      <span className="bg-violet-500/15 text-violet-600 dark:text-violet-300 inline-flex size-14 items-center justify-center rounded-full">
        <Sparkles className="size-6" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Merhaba, ne yapmak istersin?
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-base">
          Bir şey aklında varsa anlat — fırsatları sıralayıp yorum yapayım. Ya da baştan sona bir
          gün planı kurayım.
        </p>
      </div>

      <ul className="flex w-full max-w-2xl flex-wrap justify-center gap-2">
        {QUICK_PROMPTS.map((p) => (
          <li key={p.label}>
            <button
              type="button"
              onClick={() => onPrompt(p.text)}
              className="border-border bg-background hover:border-foreground/40 hover:bg-muted/30 inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors sm:text-sm"
            >
              {p.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorBanner({ error }: { error: Error }) {
  // useChat surfaces 401/429/503 as Errors with the response body in message.
  // Detect known codes from the message text to render a tailored CTA.
  const text = error.message;
  const isSignup = /SIGNUP_REQUIRED|sınırsız öneri/i.test(text);
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
          href="/kayit?next=/kesfet"
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
      className="border-rose-500/30 bg-rose-500/10 rounded-lg border p-4 text-sm"
    >
      {isRate
        ? 'Günlük sorgu limitin doldu. Yarın tekrar dene.'
        : 'Bir şeyler ters gitti — tekrar denemek ister misin?'}
    </div>
  );
}
