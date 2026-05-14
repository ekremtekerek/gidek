<div align="center">

# gidek

### Türkiye'nin AI destekli fırsat keşif platformu

Doğal dille konuş. Gemini RAG ile **961 fırsat** arasından 3-5 öneri.
Gamification + sosyal + iptal sigortası + cüzdan + adil komisyon.

[Demo scripti](./DEMO.md) · [Mimari](./ARCHITECTURE.md) · gidek.net

</div>

---

## 🎯 30 saniyede gidek

**Problem.** 1.000+ kupon, 50+ filtre. Kullanıcı *"Beşiktaş'ta çiftler için romantik bir akşam, bütçe 1500 TL"* yazamaz — tıkla-filtre-kaydır döngüsünde kaybolur. İşletme tarafında ise %30 komisyon, sıfır kişiselleştirme, müşteri verisi işletmeye dönmüyor.

**Çözüm.** Doğal dil → **Gemini 2.5 Flash + pgvector RAG** → kişiselleştirilmiş öneri + "neden bu" açıklaması. Üstüne gamification (rozet, streak, şehir bingosu, daily spin), sosyal katman (takip, akış, etkinlik chat odası), iptal sigortası ve cüzdan. **Adil komisyon, dürüst pricing, KVKK uyumlu.**

**Durum.** 22 büyük özellik canlı (Paket A-F), 13 migration, 961 fırsat envanter, 4 demo persona. Build temiz, RLS açık. Yeni Next.js 16 (RSC + Turbopack), Supabase, Gemini, Mapbox, Cloudinary.

---

## 📦 22 özellik · 6 paket · tek ekosistem

| Paket | Özellikler | Tech |
|---|---|---|
| **A** Konuşturucu AI | Mood chips · Negatif tercihler · Anti-overlap booking | onboarding zod + chat container |
| **B** Sosyal yorumlar | Fotoğraflı yorumlar · Yorum cevapları · Lightbox | Cloudinary + Sharp + createPortal |
| **C** Gamification | Rozetler · Streak · Şehir bingosu · Daily spin · Liderlik tabs | 4 migration + conic-gradient çark |
| **D** Sosyal | Takip · Activity feed · Aynı etkinliktekiler · Etkinlik chat | follows + Realtime broadcast |
| **E** Finansal | Loyalty → otomatik kupon · İade kuponu · Cüzdan | coupons + user_refund_coupons + RPC |
| **F** Lokasyon + niş | Şu an açık · Last-minute · Trafik ETA · Walk-in baskı · Hediye PDF · Sigorta · +1 kişi | working_hours JSONB + Mapbox Directions |

> Tek tek liste için ↓ **Öne çıkan özellikler** bölümüne bak. Tıklama-tıklama demo akışı için **[DEMO.md](./DEMO.md)**.

---

## 💰 İş modeli

| Aşama | Gelir kaynağı | Komisyon |
|---|---|---|
| **V1** (şimdi) | Kendi merchant'larımız | %10-15 (sektör %30, biz dürüst) |
| **V2** | Affiliate (FırsatBuFırsat API hazır) | Tıklama/satış başı komisyon |
| **V3** | İşletmelere SaaS dashboard | Aylık SaaS abonelik |
| Ekstra | İptal sigortası primi (%5), öne çıkarma | Marjı yüksek katma değer |

---

## Öne çıkan özellikler

### ✨ Bu hackathon turunda eklenenler (Paket A-F)

> **Gamification & Sosyal & Finansal & Lokasyon** — kullanıcıyı geri getiren, viral değer üreten, ek gelir kalemleri açan 22 özellik.

**🎮 Gamification (C)**
- **Rozet sistemi** — 13 rozet (ilk-rezervasyon, kategori ustası, koleksiyoner, gezgin, streak-3...), tier-renkli grid
- **Streak (haftalık seri)** — ISO hafta tag'i, Flame badge, booking + review tetikler
- **Şehir bingosu** — aynı şehirde 5 farklı ilçe → özel %15 indirim kuponu
- **Daily spin (`/cark`)** — conic-gradient çark, 7 dilim, animasyonlu modal ödül
- **Liderlik tablosu sekmeleri** — haftalık / aylık / yıllık (podium UI)

**👥 Sosyal (D)**
- **Takip sistemi** — `/u/<slug>` profilinde Twitter-tipi tek yönlü follow, optimistic UI
- **Activity feed (`/akis`)** — takip ettiklerinin yorum / booking / favori / rozet timeline'ı
- **Aynı etkinliktekiler** — opt-in attendee list, booking detayında public profiller
- **Etkinlik chat odası** — Supabase Realtime broadcast, RLS sadece onaylı katılımcılara açık

**💰 Finansal (E)**
- **Loyalty → otomatik kupon** — 100/250/500/1000 puan eşik → %10/15/20/25 kupon
- **İade kuponu** — confirmed iptal → ödenen tutarın %50'si fixed kupon (sigortalıda %100)
- **Cüzdan (`/cuzdan`)** — bingo + spin + loyalty + refund kuponları tek ekranda

**📍 Lokasyon + niş (F)**
- **"Şu an açık" rozeti** — merchant.working_hours JSONB, Türkiye saatine göre canlı
- **Last-minute countdown** — bitime <24 saat kala canlı sayaç banner (son 3 saatte urgent)
- **Trafik tahmini ETA** — Mapbox Directions API, konum opt-in localStorage
- **Walk-in pressure** — bugünkü onaylı booking sayısı → "şu an hareketli" sinyali
- **Hediye kartı PDF** — A5 print-ready, QR + zarif gradient tasarım
- **İptal sigortası** — %5 prim, sigortalıda %100 iade
- **+1 kişi ekleme** — mevcut booking'e ek katılımcı, max_per_user kontrolü

**🤖 AI keşfi (A) + 📸 Sosyal yorumlar (B)**
- **Mood chips** — 8 atmosfer chip'i, AI prompt'una doğrudan yansır
- **Negatif tercihler** — onboarding'de 10 chip + serbest metin, AI öneride kaçınır
- **Anti-overlap warning** — aynı gün başka booking varsa sarı uyarı + confirm bypass
- **Fotoğraflı yorumlar** — Cloudinary, max 4 görsel, Sharp/WebP processing
- **Yorum cevapları** — nested replies + merchant flag + lightbox modal

---

### Kullanıcı (genel)

- **AI sohbet asistanı** — Gemini 2.5 Flash + RAG (pgvector top-30 → re-rank 3-5)
- **Kişiselleştirme** — onboarding profili (şehir, hane tipi, çocuk yaş grubu, bütçe, diyet, ilgi alanları)
- **"Neden bu öneri?"** — her AI önerisinin yanında ⚡ rozet; tıklayınca Gemini structured output ile kişisel rationale + eşleşme faktörleri
- **Fotoğrafla arama** — bir görsel yükle, Gemini Vision atmosfer/temaları çıkarıp semantic search'e çevirsin
- **Harita keşfi** — Mapbox + canlı yakındaki fırsatlar + filtreli klastering + tek tıkla yol tarifi (Google Maps deep link)
- **AI yorum özetleyici** — deal sayfasında "X yorumdan" Gemini özeti + olumlu temalar + dikkat notları (cache'li)
- **Verified-buyer yorumlar** — yalnızca onaylanmış rezervasyon sahipleri yorum yazabilir
- **Favoriler + kayıtlı aramalar** — geri dön, takip et, AI'ın seni hatırlamasını sağla
- **Rezervasyon → e-bilet** — quantity adet ayrı QR kod + yazdırılabilir bilet
- **Takvime ekle** — booking sonrası Google Calendar deep link + .ics dosyası
- **Hediye akışı** — fırsatı arkadaşına hediye et: alıcı bilgileri + kişisel mesaj, e-bilet alıcıya gider
- **Promo kod sistemi** — ödeme sayfasında yüzde/sabit indirim, geçerlilik penceresi, kullanım limiti
- **Loyalty puan + tier** — bronz/gümüş/altın üye rozeti, +10 puan/booking, profil kartı
- **Public profil** — opt-in kullanıcı adı (`/u/<slug>`) ile favori listeni paylaş
- **Bildirimler** — yaklaşan rezervasyon, biten favori, davet kabul; tekli + toplu okundu/sil aksiyonu (localStorage)
- **Real-time** — deal sayfasında "X kişi şu an inceliyor" canlı sayaç (Supabase Presence)
- **Hesap yönetimi** — şifre/e-posta değiştir, KVKK uyumlu hesap silme

### Topluluk + Trend

- **`/trend`** — son 7 günün en çok rezerve edilen fırsatları + trending kategoriler (ISR 15 dk)
- **`/u` topluluk** — haftanın şampiyonları (podyum), ayın şampiyonları, en çok favorilenen fırsatlar, loyalty piramidi, üye seçkileri
- **`/foto-arama`** — Gemini Vision tabanlı görsel→fırsat eşleştirme

### Merchant self-service portal (`/isletme`)

- **Dashboard** — toplam fırsat, rezervasyon, ciro, ortalama puan
- **Kendi fırsatları** — başvuru, düzenleme, yayın/onay durumu
- **AI içerik yardımcısı** — başlık + ipuçlarından Gemini ile description/highlights/meta/tags üretimi
- **Canlı rezervasyonlar** — Supabase Realtime ile yeni booking anında listede

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
- **AI içerik üretimi** — admin yeni deal eklerken Gemini structured output ile description + highlights + meta + tags
- **Merchant atama** — `/admin/users` dropdown'ı ile bir kullanıcıyı işletmeye bağla
- **Canlı booking listesi** — Supabase Realtime; yeni rezervasyon anında listede + toast

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
