@AGENTS.md

# gidek.net — project rules

AI-destekli fırsat keşif platformu. Next.js 16 (App Router, RSC) + Supabase + Gemini. Türkçe ürün, V1'de mock veri, gerçek hedef gelir kazanmak.

## Engineering standards (zorunlu)

- **SOLID + DRY**: Her component tek sorumluluk. Ortak mantık `src/lib/` altında shared util/hook/service'lerde. Yeni kod yazmadan önce var olanı kontrol et.
- **Tailwind, mobile-first**: `style={{}}` inline CSS **yasak**. Gereksiz/duplike class **yasak**. Base mobile, `md:`/`lg:` ile büyüt. Variant'lar için `cva`. Conditional class'lar için `cn()` (`src/lib/utils/cn.ts`).
- **Server Components default**. Client component sadece state/effect/event gerekirse, `'use client'` ile.
- **Security**: server-side **zod validation** her API girdisinde; Supabase **RLS açık** her public.* tabloda; `service_role` asla `NEXT_PUBLIC_` değil; `dangerouslySetInnerHTML` **yasak** (markdown için `react-markdown` + `rehype-sanitize`); httpOnly cookie (Supabase Auth default'u); rate limit her sensitive API route'ta (`src/lib/security/rate-limit.ts`).
- **SEO**: Her public sayfada `generateMetadata`; JSON-LD (Offer/Event/LocalBusiness/Organization); `app/sitemap.ts` ve `app/robots.ts`; semantic HTML; slug URL'ler ASCII normalize.
- **Types**: zod schemas (`src/lib/security/validators.ts` veya `src/lib/ai/schema.ts`) tek doğruluk kaynağı; runtime + compile-time tip aynı yerden gelir.

## Klasör konvansiyonu

```
src/app/                  thin pages — data fetch + component compose
src/components/ui/        shadcn-style primitives (no business logic)
src/components/<feature>/ domain components (deal, ai, onboarding, …)
src/lib/db/               Supabase clients + domain query functions
src/lib/ai/               Gemini wrapper, RAG, prompts, embeddings, cache
src/lib/security/         rate-limit, validators, sanitizers, auth guards
src/lib/seo/              metadata builders, JSON-LD helpers
src/lib/utils/            cn(), constants, formatters
src/hooks/                custom React hooks
src/types/                shared domain types
```

## Supabase

- Local stack: `npm run db:start` (Docker). Studio: http://127.0.0.1:54323
- Migration ekleme: **her zaman** `npm run db:new-migration <name>` ile dosya oluştur, ardından SQL yaz. Asla dosya adını tahmin etme.
- Şema değişiklikleri: `supabase db query` ile iterate et, hazır olunca `supabase db diff` ile migration üret.
- `auth.users` doğrudan kullanılmaz; `public.profiles` arayüz.
- `user_metadata` (raw_user_meta_data) **JWT authorization** için kullanılmaz — user-editable. Yetki için `app_metadata`.
- Views Postgres 15+'ta `WITH (security_invoker = true)`.
- Booking mutasyonları için RLS UPDATE yerine `public.cancel_booking()` security-definer fonksiyonu.

## Komut hatırlatıcı

```
npm run dev           # Next dev (Turbopack)
npm run build         # production build
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run format        # prettier --write .
npm run db:start      # local Supabase up
npm run db:reset      # wipe & re-apply migrations + seed
npm run db:diff       # generate migration from local DB state
```

## V1 kapsamı

- Hedef: çiftler + aileler + fırsat avcıları (İstanbul ağırlıklı, tüm Türkiye)
- 13 ana kategori (tiyatro, konser, stand-up, aktivite, masaj, güzellik, kahvaltı, yemek, turlar, şehir-otelleri, tatil-otelleri, kurs, hizmet)
- AI: Gemini 2.5 Flash + RAG (pgvector top-30 → Gemini ranks 3-5)
- Anon: 2 ücretsiz AI sorgu; sonra üyelik zorunlu. Auth: 30/gün.
- Ödeme: V1 mock
