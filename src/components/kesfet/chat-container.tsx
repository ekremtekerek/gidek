'use client';

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Camera, RotateCcw, Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/components/kesfet/chat-message';
import { FollowupChips } from '@/components/kesfet/followup-chips';
import { NearbyCarousel } from '@/components/kesfet/nearby-carousel';
import { VoiceInputButton } from '@/components/kesfet/voice-input-button';
import { useHomeStage } from '@/components/home/home-stage-context';
import { SaveSearchButton } from '@/components/saved-searches/save-search-button';
import { TurnstileWidget } from '@/components/security/turnstile-widget';
import { buttonVariants } from '@/components/ui/button';
import type { DealShape } from '@/lib/ai/tools';
import { enrichForLocation, type WelcomeContent } from '@/lib/ai/welcome';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { cn } from '@/lib/utils/cn';

interface ChatContainerProps {
  welcomeDeals?: DealWithMerchant[];
  city?: string;
  /** Server'dan gelen dinamik karşılama içeriği (saat/gün/fırsat odaklı). */
  welcomeContent?: WelcomeContent;
  /** Server'dan gelen geçmiş sohbet — varsa o id ile mount olur. */
  initialConversationId?: string;
  initialMessages?: UIMessage[];
  /** Caller giriş yapmışsa true; persist endpoint sadece auth'ta yazar. */
  isAuthenticated?: boolean;
}

const FALLBACK_WELCOME: WelcomeContent = {
  greeting: 'Merhaba!',
  subtitle: 'Aklındakini yaz — birkaç fırsat seçeyim, neden uyduğunu anlatayım.',
  chips: [
    { label: 'Bugün için bir şey öner', text: 'Bugün için keyifli bir şey önerir misin?' },
    { label: 'Hafta sonu plan', text: 'Hafta sonu için baştan sona bir gün planı kurar mısın?' },
    { label: 'Çift için romantik', text: 'Eşimle romantik bir akşam yemeği önerir misin?' },
  ],
};

function newConversationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback (SSR veya çok eski tarayıcı) — sadece istemcide gerçek random gelir.
  return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function ChatContainer({
  welcomeDeals = [],
  city,
  welcomeContent = FALLBACK_WELCOME,
  initialConversationId,
  initialMessages,
  isAuthenticated = false,
}: ChatContainerProps = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialQ = params?.get('q')?.trim() ?? '';

  const [conversationId, setConversationId] = useState<string>(
    () => initialConversationId ?? newConversationId(),
  );
  const [input, setInput] = useState('');

  // Chat → harita coupling: en son AI tool sonuçlarını (searchDeals veya
  // createDayPlan içindeki deal'lar) HomeStage context'e ilet. Hero dışında
  // mount edildiyse stage null gelir, no-op.
  const stage = useHomeStage();

  // /kesfet gibi harita olmayan sayfalarda da konum alalım — stage yoksa
  // ChatContainer kendi başına bir kez izin ister, sessiz başarısız olur.
  const [standaloneLocation, setStandaloneLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  useEffect(() => {
    if (stage) return; // map zaten konum alıyor, çift istek yapma
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    let cancelled = false;
    (async () => {
      try {
        if ('permissions' in navigator) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) {
              setStandaloneLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            }
          },
          () => {
            /* sessiz */
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
        );
      } catch {
        /* Permissions API problemi — sessizce geç */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stage]);

  const effectiveLocation = stage?.userLocation ?? standaloneLocation;

  // Konumu ref'te tutuyoruz ki transport her konum tick'inde yeniden kurulup
  // mevcut chat session'ını sıfırlamasın. prepareSendMessagesRequest her POST
  // anında ref'ten okur — anlık değer her zaman taze gelir.
  const userLocationRef = useRef(effectiveLocation);
  userLocationRef.current = effectiveLocation;

  // Turnstile token — anon kullanıcılar için. Widget callback bunu set eder;
  // transport her POST anında ref'ten okur ve bir kez kullanır.
  const turnstileTokenRef = useRef<string>('');

  // Konum → semt çevirisi: WelcomeHero "Yakınımda (Maltepe)" chip'i göstersin
  // diye Mapbox reverse'ü server'dan iste. Aynı koordinat tekrar gelirse
  // bu endpoint LRU'da cache'liyor, bedava.
  const [userDistrict, setUserDistrict] = useState<string | null>(null);
  useEffect(() => {
    if (!effectiveLocation) {
      setUserDistrict(null);
      return;
    }
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/geo/reverse?lat=${effectiveLocation.lat}&lng=${effectiveLocation.lng}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { district: string | null };
        setUserDistrict(data.district);
      } catch {
        // sessiz — chip yine de generic kalır
      }
    })();
    return () => ctrl.abort();
  }, [effectiveLocation]);

  const liveWelcome = useMemo(
    () => enrichForLocation(welcomeContent, userDistrict),
    [welcomeContent, userDistrict],
  );

  // Transport conversationId değişince yeniden kurulur — body params güncel olsun.
  // prepareSendMessagesRequest her POST anında çağırılır → lat/lng'yi ref'ten
  // okuyarak transport'u yeniden kurmadan taze konum gönderiyoruz.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/ai/chat',
        prepareSendMessagesRequest: ({ messages }) => {
          const loc = userLocationRef.current;
          const turnstileToken = turnstileTokenRef.current;
          return {
            body: {
              messages,
              conversationId,
              ...(loc ? { lat: loc.lat, lng: loc.lng } : null),
              ...(turnstileToken ? { turnstileToken } : null),
            },
          };
        },
      }),
    [conversationId],
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: ({ message }) => {
      // Stream tamamlanınca assistant mesajının final halini DB'ye yaz.
      if (message.role === 'assistant') {
        persistMessage('assistant', message.parts as unknown[]);
      }
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const isEmpty = messages.length === 0;

  // Yardımcı — auth ise persist endpoint'e fire-and-forget POST atar.
  function persistMessage(role: 'user' | 'assistant', parts: unknown[]) {
    if (!isAuthenticated) return;
    const firstUserText = role === 'user' && isEmpty ? extractText(parts).slice(0, 60) : undefined;
    void fetch('/api/ai/conversations/persist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        title: firstUserText,
        message: { role, parts },
      }),
    }).catch(() => {
      // ignore — persistence başarısız olursa chat akışı kesilmesin
    });
  }

  // stage'i ref'le tutuyoruz, aksi halde context value her güncellendiğinde
  // effect tekrar tetiklenir → loop.
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
      persistMessage('user', [{ type: 'text', text: initialQ }]);
      void sendMessage({ text: initialQ });
    }
    // persistMessage stable değil; sendMessage / isEmpty / initialQ değişimine güveniyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function dispatchUserMessage(text: string) {
    persistMessage('user', [{ type: 'text', text }]);
    void sendMessage({ text });
  }

  function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    dispatchUserMessage(text);
    setInput('');
  }

  function onQuickPrompt(text: string) {
    if (isLoading) return;
    setInput('');
    dispatchUserMessage(text);
  }

  function reset() {
    setMessages([]);
    setInput('');
    autoSentRef.current = false;
    stage?.setAiSuggestedDeals(null);
    setConversationId(newConversationId());
    // URL'de ?c= varsa temizle.
    if (params?.get('c')) {
      router.replace(pathname, { scroll: false });
    }
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

  // En son AI mesajı text içeriyor mu? Follow-up chip'leri sadece akış
  // tamamlandıktan sonra ve cevap geldiğinde gösteriyoruz.
  const lastAssistantHasContent = (() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'assistant') return false;
    return last.parts.some(
      (p) => (p.type === 'text' && 'text' in p && p.text.trim().length > 0) ||
        p.type === 'tool-searchDeals' ||
        p.type === 'tool-createDayPlan',
    );
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
        // overflow-y-auto: küçük ekranda hero büyük gelirse hero scroll'lansın,
        // dış kabuk + alttaki input bar her zaman görünür kalsın.
        // min-h-full + items-center: hero küçükse dikey olarak ortalanır.
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="flex min-h-full items-center justify-center px-4 py-4 sm:px-6 sm:py-8">
            <WelcomeHero
              welcomeDeals={welcomeDeals}
              city={city}
              welcome={liveWelcome}
              onMoodSelect={onQuickPrompt}
            />
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
            {(() => {
              // Her assistant mesajına kendinden önceki son user mesajının
              // metnini iliştiriyoruz — "Neden bu öneri?" rationale'i bağlam
              // için kullanır.
              let prevUserText = '';
              return messages.map((m) => {
                if (m.role === 'user') {
                  prevUserText = m.parts
                    .filter((p) => p.type === 'text')
                    .map((p) => ('text' in p ? p.text : ''))
                    .join(' ')
                    .trim();
                  return <ChatMessage key={m.id} message={m} />;
                }
                return <ChatMessage key={m.id} message={m} userQuery={prevUserText} />;
              });
            })()}
            {isLoading ? <TypingIndicator /> : null}
          </div>
        </div>
      )}

      {/* Bottom dock: error + quick prompts (empty only) + chat input.
          shrink-0 — flex parent içinde alttan kaybolmaz.
          pb [max(0.75rem,...)] iOS home indicator çakışmasını engeller. */}
      <div className="mx-auto w-full max-w-3xl shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
        {error ? <ErrorBanner error={error} /> : null}

        {isEmpty ? (
          <div className="mb-3">
            <QuickPrompts chips={liveWelcome.chips} onPrompt={onQuickPrompt} />
          </div>
        ) : null}

        {!isEmpty && !isLoading && lastAssistantHasContent ? (
          <div className="mb-2">
            <FollowupChips
              onPick={(text) => {
                if (isLoading) return;
                dispatchUserMessage(text);
              }}
              disabled={isLoading}
            />
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

        {/* Anon kullanıcılar için Turnstile — managed mode, çoğu kullanıcı
            hiçbir şey görmez; bot/şüpheli trafikte challenge çıkar. Site key
            yoksa widget null döner ve API anon erişimine izin verir. */}
        {!isAuthenticated ? (
          <div className="mt-2 flex justify-center">
            <TurnstileWidget
              onToken={(t) => {
                turnstileTokenRef.current = t;
              }}
            />
          </div>
        ) : null}

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
  welcome,
  onMoodSelect,
}: {
  welcomeDeals: DealWithMerchant[];
  city?: string;
  welcome: WelcomeContent;
  onMoodSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center sm:gap-5">
      {welcomeDeals.length > 0 && city ? (
        <NearbyCarousel deals={welcomeDeals} city={city} />
      ) : null}
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
          {welcome.greeting}
        </h1>
        <PhotoSearchCta />
      </div>
      <MoodChips onSelect={onMoodSelect} />
    </div>
  );
}

interface MoodChip {
  emoji: string;
  label: string;
  prompt: string;
  /** Tailwind background — varsayılan muted; vurgulu için belirt. */
  accent?: string;
}

const MOOD_CHIPS: MoodChip[] = [
  {
    emoji: '😌',
    label: 'Sakinleşmek istiyorum',
    prompt: 'Stresliyim, beni rahatlatacak sakin bir aktivite veya mekan öner',
    accent: 'from-sky-500/15 to-blue-500/15 border-sky-500/30',
  },
  {
    emoji: '💕',
    label: 'Romantik bir akşam',
    prompt: 'Çiftler için romantik bir akşam yemeği veya etkinlik öner',
    accent: 'from-rose-500/15 to-pink-500/15 border-rose-500/30',
  },
  {
    emoji: '👨‍👩‍👧',
    label: 'Aile vakti',
    prompt: 'Ailecek çocuklarla yapabileceğimiz bir aktivite öner',
    accent: 'from-amber-500/15 to-orange-500/15 border-amber-500/30',
  },
  {
    emoji: '🥗',
    label: 'Brunch arıyorum',
    prompt: 'Bu hafta sonu için güzel bir brunch mekanı öner',
    accent: 'from-emerald-500/15 to-teal-500/15 border-emerald-500/30',
  },
  {
    emoji: '🎂',
    label: 'Kutlama yapıyorum',
    prompt: 'Bir doğum günü/kutlama için özel bir mekan öner',
    accent: 'from-violet-500/15 to-fuchsia-500/15 border-violet-500/30',
  },
  {
    emoji: '🌃',
    label: 'Gece hayatı',
    prompt: 'Bu akşam için canlı ve eğlenceli bir mekan öner',
    accent: 'from-indigo-500/15 to-purple-500/15 border-indigo-500/30',
  },
  {
    emoji: '🧘',
    label: 'Kendime zaman',
    prompt: 'Tek başıma keyifli vakit geçirebileceğim huzurlu bir yer öner',
    accent: 'from-teal-500/15 to-cyan-500/15 border-teal-500/30',
  },
  {
    emoji: '🎭',
    label: 'Sahne / etkinlik',
    prompt: 'Bu hafta için bir tiyatro, konser veya stand-up önerir misin',
    accent: 'from-orange-500/15 to-red-500/15 border-orange-500/30',
  },
];

/**
 * Hero altında 8 mood chip'i — kullanıcı kelime yazmadan tek tıkla AI'a
 * hazır niyet iletebilsin. Her chip kendi gradient'i + emoji + Türkçe
 * etiket; tıklayınca onQuickPrompt çağırılır → AI hemen yanıt verir.
 */
function MoodChips({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-3">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        Bugün için hazır başlangıçlar
      </p>
      <ul className="flex flex-wrap justify-center gap-2">
        {MOOD_CHIPS.map((m) => (
          <li key={m.label}>
            <button
              type="button"
              onClick={() => onSelect(m.prompt)}
              className={cn(
                'group/mood inline-flex items-center gap-2 rounded-full border bg-gradient-to-br px-3.5 py-2 text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:outline-none',
                m.accent ?? 'from-muted to-muted border-border',
              )}
            >
              <span
                className="text-base transition-transform duration-300 group-hover/mood:scale-110"
                aria-hidden="true"
              >
                {m.emoji}
              </span>
              <span>{m.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Hero altında diskret bir "Fotoğrafla ara" CTA + hover tooltip. AI
 * sohbete alternatif yol — kullanıcı kelime yerine görsel ile niyet
 * iletebilsin.
 */
function PhotoSearchCta() {
  return (
    <div className="group relative inline-flex">
      <Link
        href="/foto-arama"
        className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition-all hover:scale-105 hover:border-violet-500/60 hover:shadow-md hover:shadow-violet-500/20 focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:outline-none dark:text-violet-300"
      >
        <Camera className="size-4" aria-hidden="true" />
        Fotoğrafla ara
        <span className="bg-violet-500/15 text-violet-700 dark:text-violet-300 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          AI
        </span>
      </Link>
      <span
        role="tooltip"
        className="bg-foreground text-background pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden -translate-x-1/2 whitespace-normal rounded-lg px-3 py-2 text-[11px] font-medium leading-relaxed shadow-xl group-hover:block sm:w-[260px]"
      >
        Beğendiğin bir atmosferin fotosunu yükle — Gemini Vision görseldeki
        temaları çıkarıp benzer fırsatları önersin.
        <span
          aria-hidden="true"
          className="bg-foreground absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45"
        />
      </span>
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
      className="border-border bg-background/95 focus-within:border-foreground/40 hover:border-foreground/30 gidek-input-attention flex items-end gap-2 rounded-3xl border p-1.5 backdrop-blur transition-colors"
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
        className="placeholder:text-muted-foreground/70 gidek-no-focus-ring min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-60 sm:text-base"
      />

      <VoiceInputButton
        onTranscript={(text) => onChange(text)}
        disabled={disabled}
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

function QuickPrompts({
  chips,
  onPrompt,
}: {
  chips: WelcomeContent['chips'];
  onPrompt: (t: string) => void;
}) {
  return (
    <ul
      aria-label="Hızlı başlangıç"
      className="flex w-full flex-wrap justify-center gap-2"
    >
      {chips.map((p) => (
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

/** UIMessage parts dizisinden saf metin birleştir. Persist için kullanılır. */
function extractText(parts: unknown[]): string {
  const out: string[] = [];
  for (const p of parts) {
    if (typeof p === 'object' && p !== null && 'type' in p && (p as { type: string }).type === 'text') {
      const t = (p as { text?: unknown }).text;
      if (typeof t === 'string') out.push(t);
    }
  }
  return out.join(' ').trim();
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
