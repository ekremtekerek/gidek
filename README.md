<div align="center">

# gidek

**AI ile sana özel fırsatlar**

Türkiye için fırsat keşif platformu. Tiyatro, konser, kahvaltı, tatil, masaj, aktivite — ne yapmak istediğini doğal dilde yaz, Gemini destekli sohbet asistanı semantik aramayla 3-5 fırsatı önersin.

[Canlı demo](https://gidek.net) · [Mimari](./ARCHITECTURE.md) · [Katkı sağla](#geliştirme)

</div>

---

## Neden gidek?

Türkiye'deki fırsat ekosisteminde iki kronik sorun var:

1. **Kullanıcı tarafı**: 1.000+ kupon, 50+ kategori, statik filtreler. Kullanıcı "cumartesi akşam çiftler için romantik bir yer" yazamaz; tıkla-filtre-kaydır döngüsünde kaybolur.
2. **İşletme tarafı**: Mevcut deal siteleri ortalama **%30 komisyon** alıyor, kişiselleştirme yapmıyor, müşteri datası işletmeye geri dönmüyor.

gidek bunların **ikisini birden** çözmek üzere kuruldu:

- **AI sohbet + semantik arama** — kullanıcı bağlamı (şehir, hane, bütçe, diyet, ilgi) ile sorguyu anlayan RAG pipeline
- **Adil komisyon + işletmeye veri** — düşük komisyon + dashboard'ta gerçek müşteri sinyalleri
- **KVKK uyumlu, ölçeklenebilir altyapı** — kullanıcı KVKK haklarını uygulayabilir (silme, e-posta değişimi, indirilebilir veri)

---

## Öne çıkan özellikler

### Kullanıcı

- **AI sohbet asistanı** — Gemini 2.5 Flash + RAG (pgvector top-30 → re-rank 3-5)
- **Kişiselleştirme** — onboarding profili (şehir, hane tipi, çocuk yaş grubu, bütçe, diyet, ilgi alanları)
- **Harita keşfi** — Mapbox + canlı yakındaki fırsatlar + filtreli klastering
- **Verified-buyer yorumlar** — yalnızca onaylanmış rezervasyon sahipleri yorum yazabilir
- **Favoriler + kayıtlı aramalar** — geri dön, takip et, AI'ın seni hatırlamasını sağla
- **Rezervasyon → e-bilet** — quantity adet ayrı QR kod + yazdırılabilir bilet
- **Promo kod sistemi** — ödeme sayfasında yüzde/sabit indirim, geçerlilik penceresi, kullanım limiti
- **Hesap yönetimi** — şifre/e-posta değiştir, KVKK uyumlu hesap silme

### Admin paneli

- **Fırsat CRUD** — başlık, fiyat, kategori, etiket, kitle, AI embedding'i otomatik
- **Kategori CRUD** — hiyerarşi, ikon, SEO meta
- **Rezervasyon yönetimi** — detay, iptal/iade, kullanıldı işaretle, operasyon notu
- **İşletme yönetimi** — adres autocomplete (Mapbox), logo, doğrulama
- **Kullanıcı yönetimi** — ban/unban, booking sayısı, son aktivite
- **Yorum moderasyonu** — gizle/sil, deal'a göre gruplama
- **Kupon CRUD** — yüzde/sabit, min sepet, max kullanım
- **Newsletter** — abone listesi, CSV export, kaynak dağılımı
- **AI sorgu logları** — maliyet, başarı oranı, kullanım istatistiği

### SEO + GEO (AI engine optimization)

- **ISR** — `/f/[slug]` 5 dk, `/m/[slug]` 10 dk revalidate
- **JSON-LD** — Organization, WebSite, SearchAction, Offer, AggregateRating, BreadcrumbList, ItemList, LocalBusiness, **Event** (tiyatro/konser/stand-up)
- **Dynamic sitemap** — fırsat, kategori, işletme slug'ları DB'den
- **llms.txt** — Perplexity, Claude.ai, ChatGPT search için site özeti

---

## Tech stack

| Katman | Tercih | Neden |
|--------|--------|-------|
| Framework | **Next.js 16** (App Router, RSC, Server Actions, Turbopack) | Server-first, ISR ile SEO + dynamic island'lar ile auth-aware UI, server actions ile gereksiz API endpoint kaçınması |
| DB + Auth + Storage | **Supabase** | Postgres + Auth + RLS + pgvector + Storage **tek paket**; self-host opsiyonu açık |
| AI | **Google Gemini 2.5 Flash** | TR dilinde güçlü, ucuz (Claude/GPT-4'e göre ~1/10 maliyet), structured output desteği, tool use |
| Embeddings | `text-embedding-004` (Gemini) | 768 boyut, ucuz, pgvector ile uyumlu |
| UI | **Tailwind CSS v4** + CVA + shadcn-style primitives | Mobile-first, design token tutarlılığı, JIT bundle |
| Tip güvenliği | TypeScript + **Zod** | Compile + runtime tek doğruluk kaynağı (validator + tip aynı yerden) |
| Harita | **Mapbox GL JS** | Türkçe yerel destek, custom marker, dynamic import ile lazy load |
| E-posta | **Resend** | DKIM, deliverability, mock template'lerle dev ergonomisi |
| QR kod | `qrcode` | Server-side SVG/PNG üretimi |
| Hata izleme | **Sentry** | Source map, performance trace, KVKK uyumlu |

Detaylı rasyonal: [ARCHITECTURE.md](./ARCHITECTURE.md#tech-stack-rasyonali)

---

## Hızlı başlangıç

### Önkoşullar

- Node 20+
- Docker (Supabase local için)
- Supabase CLI (`npm i -g supabase`)
- Bir `GEMINI_API_KEY` ([Google AI Studio](https://aistudio.google.com))

### Kurulum

```powershell
# Repo
git clone https://github.com/<you>/gidek.git
cd gidek

# Bağımlılıklar
npm install

# Env (kopyala + doldur)
cp .env.example .env.local
# → NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, GEMINI_API_KEY, MAPBOX_TOKEN

# Supabase local (Docker)
npm run db:start

# Migrasyonlar otomatik uygulanır; mock veriyi yükle
npm run seed                # 100+ deal + işletme + kategori
npm run ai:backfill         # embedding üret

# Demo persona'ları (hackathon/pitch için zengin profiller)
npm run seed:personas

# Dev server
npm run dev                 # http://localhost:3000
```

İlk çalıştırmada Supabase Studio için: `http://127.0.0.1:54323`

### Admin yetkisi

```powershell
npm run admin:create -- info@example.com
```

`ADMIN_EMAILS` env'inde virgülle ayrılmış e-postalar admin sayılır.

---

## Klasör yapısı

```
src/
├── app/                    Next.js App Router
│   ├── (public sayfalar)   /, /f/[slug], /k/[kategori], /m/[slug]
│   ├── admin/              Admin paneli (gated by ADMIN_EMAILS)
│   ├── api/                Route handlers (favorites/check, newsletter/export, ai/*)
│   ├── demo/               Hackathon demo route'ları (klasik vs AI, persona)
│   └── ...
├── components/
│   ├── ui/                 shadcn-style primitives (Button, Badge, Input)
│   ├── deal/               Deal kart, harita, yorum, sticky CTA
│   ├── booking/            E-bilet, booking formu, iptal
│   ├── payment/            Mock kart formu, kupon input
│   ├── home/               Homepage compose'u (hero, kategoriler, AI chat)
│   ├── admin/              Admin form'lar, row aksiyonları
│   └── ...
├── lib/
│   ├── ai/                 Gemini wrapper, RAG, prompt'lar, cache, budget
│   ├── db/                 Supabase client (server/service/public)
│   ├── security/           Auth guard'ları, rate limit, zod validator'lar
│   ├── seo/                Metadata builder, JSON-LD helper'lar
│   └── utils/              cn(), formatlar, sabitler
├── hooks/                  Custom React hook'ları
└── types/
    └── supabase.ts         DB tipleri (auto-generated)

supabase/
├── migrations/             15+ SQL migration — sıralı çalışır
└── seed.sql                statik referans veri

scripts/
├── seed.ts                 100+ deal + merchant + category
├── seed-demo-personas.ts   3 zengin demo profili
├── backfill-embeddings.ts  AI embedding'leri (re)hesapla
└── create-admin.ts         Admin yetkisi ver
```

---

## Geliştirme

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Next dev (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:start` | Supabase local up |
| `npm run db:reset` | DB sıfırla + migration + seed |
| `npm run db:new-migration <name>` | Yeni migration dosyası |
| `npm run db:gen-types` | TS tipleri yeniden üret |
| `npm run seed` | Mock deal/merchant/category seed |
| `npm run seed:personas` | Demo persona seed |
| `npm run ai:backfill` | Embedding'leri (re)hesapla |
| `npm run admin:create -- <email>` | Admin yetkisi |

### Engineering rules

Repo'daki standartlar (CLAUDE.md'de detayı):

- **SOLID + DRY** — her component tek sorumluluk; ortak mantık `src/lib/`'de
- **Server Components default** — `'use client'` sadece state/effect/event gerekirse
- **Tailwind mobile-first** — `style={{}}` inline CSS **yasak**; variant'lar için `cva`, conditional için `cn()`
- **Zod validator** her API girdisinde — runtime + compile-time tip tek doğruluk kaynağı
- **Supabase RLS açık** her public.* tabloda — UPDATE policy yoksa security-definer RPC üzerinden
- **`service_role` asla `NEXT_PUBLIC_`** değil
- **`dangerouslySetInnerHTML` yasak** — markdown için `react-markdown` + `rehype-sanitize`
- **SEO**: her public sayfada `generateMetadata` + JSON-LD; ASCII slug; semantic HTML

---

## Demo (hackathon)

Pitch sırasında kullanılacak hidden route'lar:

- **`/demo/persona`** — 3 zengin demo hesabıyla tek tıkla giriş (Aslı çift, Mehmet aile, Zeynep solo)
- **`/demo`** — klasik keyword search vs gidek AI ranker **yan yana** karşılaştırma; aynı sorgu, iki dünya

Persona'ları aktif et: `npm run seed:personas` (idempotent). Şifreler: `demo123!`.

---

## Deployment

| Bileşen | Önerilen |
|---------|----------|
| Web | Vercel (otomatik Next.js + ISR + Edge runtime) |
| DB | Supabase Cloud |
| Worker (gelecek: scraping, e-posta queue) | Railway / Fly.io |
| Storage | Supabase Storage (deal cover + merchant logo) |
| CDN | Cloudinary (image transformation) |
| Monitoring | Sentry |
| Analytics | Plausible (KVKK uyumlu) |

`vercel.json` ve env değişkenleri için [ARCHITECTURE.md → Deployment](./ARCHITECTURE.md#deployment).

---

## Yol haritası

**V1 (mevcut)** — Mock ödeme, marketplace + kullanıcı + admin temel akışları, AI sohbet  
**V1.5** — iyzico entegrasyonu, merchant self-service portal, real-time bildirimler, AI ile içerik üretimi (admin)  
**V2** — Mobil app, B2B kurumsal hesaplar, fiyat tarihçesi (Akakçe benzeri), gelişmiş analitik

---

## License

MIT
