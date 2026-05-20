<div align="center">

# gidek - https://gidek.vercel.app/

### Türkiye'nin AI destekli fırsat keşif & tatil rezervasyon platformu

Doğal dille konuş. Gemini RAG ile fırsatlar + 1000+ otel arasından kişiselleştirilmiş öneri.
**4 adım otel rezervasyon wizard'ı**, gamification, sosyal katman, iptal sigortası, KVKK uyumu.

[Demo scripti](./DEMO.md) · [Mimari](./ARCHITECTURE.md) · [Demo girişi](#-demo-hackathon) · [gidek](https://gidek.vercel.app/)

</div>

---

> ### ℹ️ Hackathon teslim notu
>
> Bu projenin hackathon teslimi, **19 Mayıs 2026** tarihli [`101617f`](https://github.com/ekremtekerek/gidek/commit/101617f) commit'idir. Değerlendirme bu commit ve öncesi baz alınarak yapılmalıdır.
>
> `101617f`'ten **sonraki** commit'ler (**20 Mayıs 2026** ve sonrası) deadline **sonrası** yapılan geliştirmelerdir; hackathon değerlendirme kapsamı **dışındadır** ve dikkate alınmaması gerekir.
>
> Geliştirmeye, şeffaflık adına commit tarihlerini gizlemeden açıkça devam ediyoruz — git geçmişi tüm zaman damgalarıyla görünürdür.

---

## 🎯 30 saniyede gidek

**Problem.** Klasik tatil siteleri (booking.com vb.) 50+ filtre + tıkla-kaydır döngüsü. Kullanıcı *"Bodrum'da temmuz başı çiftler için sessiz bir butik otel, balayı, bütçe 25k"* yazamıyor. İşletme tarafında %30 komisyon, sıfır kişiselleştirme.

**Çözüm.** Doğal dil → **Gemini 2.5 Flash + pgvector RAG + 10+ AI tool** → kişiselleştirilmiş öneri + "neden bu" rationale. Otele odaklanınca müşteri temsilcisi gibi konuşur: oda tipleri, fiyat, taksit, politikalar, "tarihleri seç" yönlendirmesi. Üstüne 4 adım rezervasyon wizard'ı (KVKK uyumlu kimlik, envanter koruması, mock ödeme), gamification, sosyal, finansal katmanlar.

**Durum.** 22 büyük özellik canlı, **otel/tatil ürünü tam yığın** (schema + admin + işletme + wizard + AI), 18+ migration, **1000+ tatil otel envanteri + 225+ etkinlik/aktivite**, 4 demo persona. Build temiz, RLS tüm tablolarda açık. Stack: Next.js 16 (RSC + Turbopack), Supabase, Gemini, Mapbox, Cloudinary, Sentry.

---

## 📦 Ürün katmanları

| Katman | Özet | Tech |
|---|---|---|
| **🏨 Otel & Tatil (Faz A-E)** | Schema + admin/işletme CRUD + 4 adım wizard + KVKK + envanter koruması + customer-rep AI | 2 migration · `HotelForm` · `HotelBookingWizard` · `getHotelDetail` tool |
| **🤖 AI keşif** | Gemini RAG + 10+ tool · agentic chain · semantic cache · budget guard | `tools.ts` · `search-core` · `match_deals` RPC · pgvector |
| **🎮 Gamification (C)** | 13 rozet · streak · şehir bingosu · daily spin · liderlik tab'ları | 4 migration · conic-gradient çark |
| **👥 Sosyal (D)** | Takip · activity feed · aynı etkinliktekiler · etkinlik chat odası | follows + Realtime broadcast |
| **💰 Finansal (E)** | Loyalty → kupon · iade kuponu · cüzdan · sigorta primi | coupons + RPC |
| **📍 Lokasyon + niş (F)** | Şu an açık · last-minute countdown · trafik ETA · walk-in pressure · hediye PDF | working_hours JSONB + Mapbox Directions |
| **B** Sosyal yorumlar | Fotoğraflı yorumlar · cevaplar · lightbox · AI özet | Cloudinary + Sharp |
| **A** Konuşturucu AI | Mood chips · negatif tercihler · anti-overlap warning | onboarding zod |

> Adım adım demo akışı için **[DEMO.md](./DEMO.md)**.

---

## 🏨 Otel & Tatil ürünü (Faz A-E)

V1'in en büyük parçası. Booking.com tarzı bir tatil rezervasyon akışını uçtan uca — schema'dan AI'ya, admin CRUD'dan misafir kimlik bilgisine — kuruldu.

### A. Şema (2 migration)

- **`deal_hotel_meta`** — deal başına 1:1: yıldız, check-in/out saati, **20 enum konsept** (her-sey-dahil/butik/spa-otel/magara-otel vs.), **24 amenity bool** (havuz/spa/plaj/aqua/kids vs.), politikalar (cancel/child/pet), pet/smoking, ek yatak (+price), plaj/merkez/havalimanı mesafeleri, konaklama vergisi, toplam oda
- **`deal_room_types`** — deal başına N: kapasite (yetişkin/çocuk), bed_setup, m², view_type (8 enum), 6 oda amenity, fiyat/gece, board_basis (6 enum), **total_units (envanter)**, cover_image
- **`bookings`'e 8 alan**: `check_in_date`, `check_out_date`, `nights`, `adult_count`, `child_count`, `room_type_id`, `board_basis`, `tourism_tax_total`
- **`booking_guests`** — KVKK + Konaklama Tesisleri Yönetmeliği uyumlu: TC kimlik 11 hane regex, pasaport, vatandaşlık 2 hane, doğum tarihi, **lead unique index**

RLS: public read (yayında deal görünürse meta/oda da görünür), admin tüm CRUD, merchant yalnız kendi deal'larında, owner kendi booking_guests'ini düzenleyebilir.

### B. Booking wizard — 4 adım, KVKK uyumlu (`/rezervasyon/[slug]`)

`tatil-otelleri`/`sehir-otelleri` kategorisindeki deal'larda otomatik tetiklenir.

1. **Tarih & Kişi** — DayPicker (Türkçe locale), yetişkin/çocuk +/- counter, anlık "Tahmini en düşük tutar" özeti
2. **Oda Seçimi** — radio cards; kapasite uymayanlar disabled; canlı **müsaitlik rozeti** (🟢 Müsait / 🟡 Son 3 / 🔴 Dolu) — `/api/hotel/availability` overlap query
3. **Misafir Bilgileri** — yetişkin: TR ise **TC kimlik checksum** (NVI algoritması), yabancı ise pasaport; çocuk yaş aralığı min/max otomatik; lead vurgulu + telefon zorunlu; 51 ülke vatandaşlık dropdown; `?` HelpHint tooltip
4. **Özet** — politikalar collapsible + KVKK aydınlatma metni linki + onay checkbox + (mock) ödeme

**Wizard içi UX akıllıları:**
- **localStorage state persist** (24h TTL) — kullanıcı yarıda bırakırsa "Devam et / Sıfırla" banner
- **Lead auto-fill** — profil display_name/phone/email otomatik dolar
- **Step 3 hata özeti** — "3 alan eksik: Yetişkin 2: TC kimlik geçersiz, …"
- **Mobile compact progress bar** (sm+ full stepper)
- **Stepper aria-live** — ekran okuyucu için step değişikliği duyurusu

**Server-side koruma:**
- Zod schema + TC checksum, oda kapasite kontrolü, gece sayısı, **overlap (yatak envanteri) kontrolü** (aynı oda + status pending/confirmed + tarih çakışan booking ≥ total_units → reject)
- Transaction-like: booking insert fail olursa guests yazmaz; guests fail olursa booking sil

### C. Mevzuat sertleştirme

- **`src/lib/utils/tc-kimlik.ts`** — NVI algoritması: 10. hane = (oddSum×7−evenSum) mod 10, 11. hane = sum10 mod 10. Server zod superRefine + client real-time inline error
- **KVKK aydınlatma** — Step 4'te Konaklama Tesisleri Yönetmeliği uyarısı + `/yasal/kvkk` linki
- **Vatandaşlık** — 51 ülke (TR + AB + AB komşuları + ME + Türk dünyası + Asia), ISO 3166-1 alpha-2
- **KVKK uyumlu gösterim** — booking detayda TC kimlik `123•••••89` (ilk 3 + son 2 maskelenir)

### D. Detay sayfası (`/f/[slug]`) — `HotelDetailSection`

4 alt section: **Otel bilgileri** (yıldız + concept + check-in/out + mesafeler + vergi + pet/smoking chip'leri), **Tesis özellikleri** (sadece aktif amenity'ler, 7 grup), **Oda tipleri** (her oda lightbox galerili kart + "Tarihleri seç" CTA → wizard'da o oda seçili), **Politikalar** (collapsible 3 madde).

### E. Booking sonrası özet — compact + full

`HotelBookingSummary` iki variant:
- **`/odeme/[code]`** aside: tarih + oda + (fiyat aside'da)
- **`/rezervasyonlarim/[code]`**: tam misafir listesi (lead 👑) + fiyat dökümü (oda × gece + konaklama vergisi)
- **Yol tarifi** butonu (Google Maps deep link) — merchant.lat/lng varsa
- **iCal indir** — hotel için duration nights × 24 × 60 dk
- **Misafir bilgilerini düzenle** (`/rezervasyonlarim/[code]/misafir-duzenle`) — check-in öncesi reuse edilebilir form
- **`/rezervasyonlarim` liste** otel için "X→Y · N gece · A+B kişi · 🛏 Oda" formatı

### F. Admin & İşletme CRUD

**`/admin/oteller`** (sadece travel kategorisindeki deal'lar):
- Liste: yıldız + concept + oda tipi sayısı + "meta eksik" rozeti
- **Arama** (title/city/district ilike) + status filter + sıralama + **pagination** (25/sayfa, count: 'exact')

**`/isletme/oteller`** (işletme self-service):
- Aynı `HotelForm` ama `lockedMerchantId` ile dropdown gizli — sahiplik server'da da check
- `executeHotelSave` shared core ile admin/merchant DRY

**`HotelForm` — 5 section:**
1. Temel (merchant, title, açıklama, fiyat, kategori, kitle, etiket, **görseller: Cloudinary'e file upload, webp'e dönüşür**)
2. Otel meta (yıldız, check-in/out, concept, mesafeler, vergi)
3. Tesis özellikleri (24 amenity, 7 grup)
4. Politikalar (pet/smoking + 3 textarea + ek yatak)
5. Oda tipleri (repeater: add/remove, 18 alan/oda, **5 toplu şablon** — Klasik/HSD/Butik/Doğa/Spa, `confirm()` ile silme)

**AI assist** (`DealAiAssist` hotel form'unda): başlık + ipuçlarından Gemini ile subtitle/description/highlights/meta üretir.

### G. AI customer-rep modu

Yeni `getHotelDetail(slug)` tool'u — kullanıcı bir otele odaklanınca AI müşteri temsilcisi gibi konuşur:

> "Yalıkavak Butik Otel'de 3 oda var: Aile Suit'i öneririm, 4 gece × 3.500 TL = 14.000 TL. 9 taksit ile aylık ~1.555 TL. İptal koşulu 14 gün önce ücretsiz, 3-6 yaş çocuk %50. Hazırsan **Tarihleri seç** wizard'da 4 adımda tamamlarız."

System prompt'a 7 maddelik "rep tonu" rehberi: otel kimliği → tesis özellikleri → oda tavsiyesi → toplam tutar → politikalar → taksit → "Tarihleri seç" CTA.

### H. AI öneri kartları yeni sekmede

Hem fırsat (`/`) hem tatil (`/tatil/kesfet`) AI sonuçları `target="_blank"` — sohbet aktif kalır, kullanıcı detayı yeni sekmede görür, geri dönünce chat bağlamı bozulmaz. 7 component'te uygulandı.

---

## 🤖 AI keşif sistemi

### Stack

- **Gemini 2.5 Flash** chat (`gemini-2.5-flash`) — TR'de güçlü, ucuz (~Claude/GPT-4'ün 1/10'u), tool use desteği
- **`text-embedding-004`** — 768 boyut, pgvector ile uyumlu
- **pgvector RPC** (`match_deals`) — cosine + Haversine hibrit skor (0.7 anlam + 0.3 yakınlık)
- **Semantic cache** (`ai_cache`) — fuzzy match (threshold 0.92), 24 saat TTL
- **Budget guard** — günlük cost cap, dolduğunda 503

### 10+ AI tool

| Tool | Kullanım |
|---|---|
| `searchDeals` | Tek tür arama (kahvaltı, otel, masaj, tiyatro vs.) — query + city + maxResults |
| `createDayPlan` | Baştan sona gün planı (kahvaltı + aktivite + akşam yemeği) — budget dahil |
| `replaceDayPlanStep` | Plan içinde tek adımı değiştir (excludeDealIds ile tekrar önermesin) |
| `getSeasonAdvice` | "Eylül başı Bodrum mantıklı mı?" — hava + kalabalık + fiyat |
| `getWeather` | Spesifik tarih için hava (Open-Meteo API) |
| `buildTravelPackage` | Tatil paketi: otel + yemek + aktivite tek seferde |
| `compareDeals` | İki/üç deal karşılaştır — pros/cons + tavsiye |
| `findSimilarHotels` | Bu otele benzer öneriler (embedding similarity) |
| `getHotelDetail` 🆕 | Otelin TÜM detayı (oda + politika + taksit) — customer-rep modu için |

Multi-step agentic — `stepCountIs(8)` ile zincir: `getSeasonAdvice → getWeather → searchDeals → buildTravelPackage → text`.

### Akıllı şehir filtreleme

`match_deals.filter_city` `d.city ilike filter_city OR d.district ilike filter_city` — Bodrum (Muğla'nın district'i), Yalıkavak (Bodrum'un alt-koyu), Kapadokya, Göreme gibi destinasyon/landmark adları doğru eşleşir. System prompt 15+ destinasyon adı listesi ile AI'ı agresif şekilde override etmeye yönlendirir.

### Photo search (`/tatil/foto`)

Gemini Vision ile görsel → atmosfer/tema çıkarımı → semantic search. "Bali" fotosu attığında Türkiye'den benzeri otel önerir.

### AI içerik üretimi (admin/işletme)

`DealAiAssist`: başlık + kategori + ipuçlarından Gemini structured output (zod schema) ile subtitle/description/highlights/meta_title/meta_description/tags/audience üretir. Form alanlarına DOM event dispatch ile inject.

---

## ✨ Diğer öne çıkan özellikler

### 🎮 Gamification (C)

- **13 rozet** — ilk-rezervasyon, kategori ustası, koleksiyoner, gezgin, streak-3 vs. (tier-renkli grid)
- **Streak (haftalık seri)** — ISO hafta tag'i, Flame badge
- **Şehir bingosu** — aynı şehirde 5 farklı ilçe → %15 indirim kuponu
- **Daily spin (`/cark`)** — conic-gradient çark, 7 dilim, animasyonlu ödül
- **Liderlik tabs** — haftalık / aylık / yıllık podium

### 👥 Sosyal (D)

- **Takip sistemi** (Twitter-tipi tek yönlü, optimistic UI)
- **Activity feed (`/akis`)** — takip ettiklerinin yorum/booking/favori/rozet timeline'ı
- **Aynı etkinliktekiler** — opt-in attendee list
- **Etkinlik chat odası** — Supabase Realtime broadcast, RLS sadece onaylı katılımcılara

### 💰 Finansal (E)

- **Loyalty → otomatik kupon** — 100/250/500/1000 puan → %10/15/20/25 kupon
- **İade kuponu** — confirmed iptal → ödenen tutarın %50'si (sigortalıda %100)
- **Cüzdan (`/cuzdan`)** — bingo + spin + loyalty + refund kuponları tek ekranda
- **İptal sigortası** — %5 prim, sigortalıda %100 iade

### 📍 Lokasyon + niş (F)

- **"Şu an açık"** rozeti — merchant.working_hours JSONB, Türkiye saatine göre canlı
- **Last-minute countdown** — bitime <24 saat kala canlı sayaç
- **Trafik tahmini ETA** — Mapbox Directions API
- **Walk-in pressure** — bugünkü onaylı booking sayısı → "şu an hareketli"
- **Hediye kartı PDF** — A5 print-ready, QR + zarif gradient
- **+1 kişi ekleme** — mevcut booking'e ek katılımcı

### 📸 Sosyal yorumlar (B)

- **Fotoğraflı yorumlar** — Cloudinary, max 4 görsel, Sharp/WebP processing
- **Yorum cevapları** — nested + merchant flag + lightbox
- **AI yorum özetleyici** — "X yorumdan" Gemini özeti + olumlu temalar + dikkat notları (cache'li)
- **Verified-buyer** — yalnız onaylı rezervasyon sahipleri yazabilir

### 🎨 Kullanıcı UX

- **Onboarding profili** — şehir, hane tipi, çocuk yaş, bütçe, diyet, ilgi
- **"Neden bu öneri?"** — ⚡ rozet, Gemini ile kişisel rationale + eşleşme faktörleri
- **Harita keşfi** — Mapbox custom marker + cluster + yol tarifi
- **Favoriler + kayıtlı aramalar**
- **Rezervasyon → e-bilet** — quantity adet ayrı QR + yazdırılabilir
- **Takvime ekle** — Google Calendar + .ics
- **Hediye akışı** — alıcı bilgileri + kişisel mesaj
- **Promo kod** — yüzde/sabit, geçerlilik penceresi, max kullanım
- **Public profil (`/u/<slug>`)** — opt-in favori paylaşımı
- **Bildirimler** — yaklaşan rezervasyon, biten favori (localStorage)
- **Real-time** — "X kişi şu an inceliyor" (Supabase Presence)
- **Hesap silme** — KVKK uyumlu

### Topluluk + Trend

- **`/trend`** — son 7 günün en çok rezerve edilenleri + trending kategoriler (ISR 15 dk)
- **`/u`** — haftanın/ayın şampiyonları (podium), en çok favorilenenler, loyalty piramidi
- **`/foto-arama`** — Gemini Vision görsel→fırsat

### Merchant self-service (`/isletme`)

- **Dashboard** — toplam fırsat, rezervasyon, ciro, ortalama puan
- **Fırsatlarım** — başvuru, düzenleme, yayın/onay durumu
- **🆕 Otellerim** — kendi otel/tatil paketleri için HotelForm CRUD (lockedMerchantId)
- **AI içerik yardımcısı** — başlık+ipucu → description/highlights/meta/tags
- **Canlı rezervasyonlar** — Supabase Realtime, yeni booking anında listede

### Admin paneli

- **Fırsat CRUD** — başlık, fiyat, kategori, etiket, kitle, embedding otomatik
- **🆕 Oteller & Tatil CRUD** — `/admin/oteller` arama/filtre/pagination, HotelForm 5-section
- **Kategori CRUD** — hiyerarşi, ikon, SEO meta
- **Rezervasyon yönetimi** — detay, iptal/iade, kullanıldı işaretle, **🆕 otel için tam misafir listesi**
- **İşletme yönetimi** — adres autocomplete (Mapbox), logo, doğrulama
- **Kullanıcı yönetimi** — ban/unban, booking sayısı
- **Yorum moderasyonu** — gizle/sil
- **Kupon CRUD** — yüzde/sabit, min sepet, max kullanım
- **Newsletter** — CSV export, kaynak dağılımı
- **AI sorgu logları** — maliyet, başarı oranı, kullanım istatistiği
- **Canlı booking listesi** — Realtime + toast

### SEO + GEO (AI engine optimization)

- **ISR** — `/f/[slug]` 5 dk, `/m/[slug]` 10 dk, `/tatil` 30 dk
- **JSON-LD** — Organization, WebSite, SearchAction, Offer, AggregateRating, BreadcrumbList, ItemList, LocalBusiness, **Event** (tiyatro/konser/stand-up)
- **Dynamic sitemap** — fırsat/kategori/işletme/destinasyon slug'ları DB'den
- **llms.txt** — Perplexity, Claude.ai, ChatGPT search için site özeti

---

## 🛠 Tech stack

| Katman | Tercih | Neden |
|---|---|---|
| Framework | **Next.js 16** (App Router, RSC, Server Actions, Turbopack) | Server-first, ISR + dynamic islands, server actions ile API endpoint kaçınma |
| DB + Auth + Storage | **Supabase** | Postgres + Auth + RLS + pgvector + Storage tek paket; self-host opsiyonu |
| AI | **Google Gemini 2.5 Flash** | TR'de güçlü, ucuz, structured output + tool use |
| Embeddings | `text-embedding-004` (Gemini) | 768 boyut, pgvector uyumlu |
| UI | **Tailwind CSS v4** + CVA + shadcn-style primitives | Mobile-first, design token tutarlılığı |
| Tip | TypeScript + **Zod** | Compile + runtime tek doğruluk kaynağı |
| Harita | **Mapbox GL JS** | TR yerel destek, custom marker, lazy load |
| Görsel | **Cloudinary** + Sharp | Auto webp, max 1920px, CDN |
| E-posta | **Resend** | DKIM, mock template dev ergonomisi |
| QR kod | `qrcode` | Server-side SVG/PNG |
| Hata izleme | **Sentry** | Source map, performance trace, KVKK uyumlu |
| Date picker | `react-day-picker` + `date-fns` (TR locale) | Türkçe ay/gün adları, portal popup |

---

## 🚀 Hızlı başlangıç

### Önkoşullar

- Node 20+
- Docker (Supabase local için)
- Supabase CLI (`npm i -g supabase`)
- `GEMINI_API_KEY` ([Google AI Studio](https://aistudio.google.com))
- `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` (görsel upload için)
- (Opsiyonel) `MAPBOX_TOKEN` — harita + adres autocomplete

### Kurulum

```powershell
git clone https://github.com/<you>/gidek.git
cd gidek

npm install

# Env (kopyala + doldur)
cp .env.example .env.local
# → NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY,
#   GEMINI_API_KEY, CLOUDINARY_*, MAPBOX_TOKEN

# Supabase local (Docker — Postgres + Auth + Storage + Realtime)
npm run db:start

# Seed sırası (3 adım, sıralı):
npm run seed                  # curated 225+ deal + kategoriler + merchants
npm run seed:travel           # 10 destinasyon × 100 otel = 1000 (Gemini embedding ~3 dk)
npm run seed:hotel-backfill   # 1000 deal'a concept-based hotel_meta + 2049 oda tipi
npm run seed:personas         # 4 demo hesap (Aslı / Mehmet / Zeynep / Mehtap-işletme)

# Dev server
npm run dev                   # http://localhost:3000
```

İlk çalıştırmada Supabase Studio için: `http://127.0.0.1:54323`

### Admin yetkisi

```powershell
npm run admin:create -- info@example.com
# ADMIN_EMAILS env'inde virgülle ayrılmış e-postalar admin sayılır
```

### Demo persona ile tek tık giriş

`/demo/persona` rotasında 4 demo hesap kartına tek tıkla giriş yap. Şifre: `demo123!`.

---

## 📁 Klasör yapısı

```
src/
├── app/                              Next.js App Router
│   ├── (public)                      /, /f/[slug], /k/[kategori], /m/[slug], /trend, /u/[slug]
│   ├── tatil/                        Tatil dünyası — landing, ara, kesfet, foto, paket, plan, sezon, karsilastir
│   ├── rezervasyon/[slug]/           Booking wizard (otel ise HotelBookingWizard, değilse BookingForm)
│   ├── rezervasyonlarim/             Liste + detay + misafir-duzenle + hediye-karti
│   ├── odeme/[code]/                 Mock ödeme (compact hotel summary aside)
│   ├── admin/                        Admin paneli (gated by ADMIN_EMAILS)
│   │   ├── deals/                    Genel fırsat CRUD
│   │   ├── oteller/                  🆕 Otel & Tatil CRUD (arama/filtre/pagination)
│   │   ├── bookings/                 Rezervasyon yönetimi (otel için misafir listesi)
│   │   └── ...                       categories, merchants, coupons, users, ai-logs
│   ├── isletme/                      İşletme self-service
│   │   ├── firsatlar/                Genel deal başvuru
│   │   └── oteller/                  🆕 Kendi otelleri (lockedMerchantId)
│   ├── api/
│   │   ├── ai/chat/                  Gemini SSE stream + tools
│   │   ├── hotel/availability/       🆕 Oda overlap query (wizard Step 2)
│   │   ├── admin/upload/             Cloudinary webp upload (admin+merchant)
│   │   └── ...
│   ├── demo/                         Hackathon demo route'ları (klasik vs AI, persona)
│   └── yasal/                        KVKK, gizlilik, çerez, kullanım koşulları
├── components/
│   ├── ui/                           shadcn-style primitives (Button, Badge, Input, DateField)
│   ├── deal/                         Deal kart, harita, yorum, sticky CTA, ETicket
│   ├── booking/                      🆕 HotelBookingWizard (4 step), HotelBookingSummary, GuestEditForm
│   ├── travel/                       🆕 HotelDetailSection, RoomImageLightbox, package-result, plan-result, travel-card
│   ├── kesfet/                       AI chat container, deal-results, day-plan-display
│   ├── admin/                        🆕 HotelForm (5 section), SingleImageUpload, ImageUploader
│   ├── merchant/                     Merchant nav, dashboard
│   ├── payment/                      Mock kart formu, kupon input
│   └── ...                           home, favorites, share, seo, pwa, layout
├── lib/
│   ├── ai/                           Gemini wrapper, RAG, prompts, cache, budget, tools
│   ├── admin/                        🆕 hotel-save (executeHotelSave shared core)
│   ├── db/                           Supabase clients + domain queries
│   │   ├── queries/                  deals, travel, hotel, bookings, admin, preferences
│   │   ├── public.ts                 anon client
│   │   ├── server.ts                 session-aware client
│   │   └── service.ts                service_role client
│   ├── security/                     Auth guards, rate limit, zod validators, turnstile
│   ├── seo/                          Metadata builders, JSON-LD helpers
│   ├── utils/                        cn(), tc-kimlik 🆕, format, geo, constants
│   └── cloudinary/                   Upload client
├── hooks/                            Custom React hooks (useFavorite, useChat vs.)
└── types/
    └── supabase.ts                   DB tipleri (auto-generated)

supabase/
├── migrations/                       18+ SQL — sıralı çalışır (otel için 2 yeni + 1 fix)
└── seed.sql                          statik referans

scripts/
├── seed.ts                           Curated 225+ deal + kategoriler
├── seed-travel-destinations.ts       🆕 1000 procedural otel (Gemini embedding)
├── backfill-hotel-meta-rooms.ts      🆕 Concept-based meta + 2049 oda tipi
├── seed-fill-cities.ts               İstanbul/Ankara/İzmir hacim doldurma
├── seed-demo-personas.ts             4 demo profil
├── backfill-embeddings.ts            AI embedding (re)hesapla
├── backfill-badges.ts                Rozet geçmiş üret
├── create-admin.ts                   Admin yetkisi ver
└── fix-broken-images.ts              Bozuk Unsplash linklerini onar
```

---

## 🧪 Geliştirme komutları

| Komut | Açıklama |
|---|---|
| `npm run dev` | Next dev (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run db:start` | Supabase local Docker up |
| `npm run db:stop` | Supabase down |
| `npm run db:status` | Supabase status |
| `npm run db:reset` | DB sıfırla + tüm migration + base seed |
| `npm run db:new-migration <name>` | Yeni migration dosyası |
| `npm run db:diff` | Local schema'dan migration üret |
| `npm run db:gen-types` | TS tipleri yeniden üret |
| `npm run seed` | Curated 225+ deal + kategori + merchant |
| `npm run seed:travel` 🆕 | 10 destinasyon × 100 otel (~3 dk, embedding) |
| `npm run seed:hotel-backfill` 🆕 | Concept-based hotel_meta + oda tipleri |
| `npm run seed:fill` | İstanbul/Ankara/İzmir hacim |
| `npm run seed:personas` | 4 demo hesap |
| `npm run seed:badges` | Rozet backfill |
| `npm run ai:backfill` | Embedding (re)hesapla |
| `npm run admin:create -- <email>` | Admin yetkisi |
| `npm run images:fix` | Bozuk Unsplash linkleri |
| `npm run analyze` | Bundle analyze (`ANALYZE=true next build`) |

---

## 📐 Engineering rules

Repo'daki zorunlu standartlar (detaylı: [CLAUDE.md](./CLAUDE.md)):

- **SOLID + DRY** — her component tek sorumluluk; ortak mantık `src/lib/`'de
- **Server Components default** — `'use client'` sadece state/effect/event gerekirse
- **Tailwind mobile-first** — `style={{}}` inline CSS **yasak**; variant'lar için `cva`, conditional için `cn()`
- **Zod validator** her API girdisinde — runtime + compile tek doğruluk kaynağı
- **Supabase RLS açık** her public.* tabloda — UPDATE policy yoksa security-definer RPC
- **`service_role` asla `NEXT_PUBLIC_`** değil
- **`dangerouslySetInnerHTML` yasak** — markdown için `react-markdown` + `rehype-sanitize`
- **SEO** — her public sayfada `generateMetadata` + JSON-LD; ASCII slug; semantic HTML
- **'use server' dosyalar** yalnız async function export edebilir (Next 16 transformer kuralı) — type'lar ayrı dosyadan import
- **PostgREST URL limit** — `.in('id', [1000+ UUID])` URL'yi 37KB'a çıkarır ve silent fail eder; inline JOIN tercih edilir

---

## 🎭 Demo (hackathon)

Canlı: **https://gidek.vercel.app/**

### Demo hesapları

Tüm hesapların şifresi: **`demo123!`** — `/demo/persona` sayfasından tek tıkla da girilebilir.

| Persona | E-posta | Profil |
|---|---|---|
| 💑 Aslı | `demo-asli@gidek.demo` | Çift — romantik akşamlar, fırsat avcısı |
| 👨‍👩‍👧 Mehmet | `demo-mehmet@gidek.demo` | Aile + çocuklu — aktivite & kahvaltı |
| 🧍 Zeynep | `demo-zeynep@gidek.demo` | Solo — kahvaltı & güzellik |
| 🏪 Mehtap | `demo-isletme@gidek.demo` | İşletme paneli (Boğaz Kahve Evi) |

> Kendi hesabınla da kayıt olabilirsin — kayıt anında direkt giriş yapılır, e-posta onayı gerekmez.

### Demo sayfaları (hidden route'lar)

- **`/demo/persona`** — 4 zengin demo hesabıyla tek tıkla giriş (Aslı çift / Mehmet aile / Zeynep solo / Mehtap işletme)
- **`/demo`** — klasik keyword search vs gidek AI ranker yan yana karşılaştırma

Persona'ları lokalde aktif et: `npm run seed:personas` (idempotent).

**Otel akışı demo:**
1. `/tatil` → "Bodrum 4 gece" chip
2. AI Bodrum otellerini listeler → ilkine tıkla
3. `/f/[slug]` detay (yıldız + amenities + oda kartları + politikalar)
4. "Tarihleri seç" → wizard 4 adım (date → oda → misafir TC + KVKK → özet → mock ödeme)
5. `/rezervasyonlarim/[code]` → tam özet + misafir listesi + yol tarifi + iCal

---

## ☁️ Deployment

| Bileşen | Önerilen |
|---|---|
| Web | Vercel (otomatik Next.js + ISR + Edge runtime) |
| DB | Supabase Cloud |
| Worker (gelecek: cron, e-posta queue) | Railway / Fly.io / Supabase Cron |
| Storage | Cloudinary (görsel) + Supabase Storage (avatar) |
| Monitoring | Sentry |
| Analytics | Plausible (KVKK uyumlu) |
| Bot koruması | Cloudflare Turnstile (anon AI chat için) |

`vercel.json` ve env değişkenleri için [ARCHITECTURE.md → Deployment](./ARCHITECTURE.md#deployment).

---

## 🗺 Yol haritası

### V1 (mevcut, canlı)

✅ AI sohbet asistanı + 10 tool (agentic chain)  
✅ Otel ürünü tam yığın (Faz A-E) — schema + admin + işletme + wizard + AI customer-rep  
✅ 1000+ tatil otel envanteri (10 destinasyon × 100, procedural seed)  
✅ KVKK uyumu (TC checksum, KVKK metni, 51 ülke vatandaşlık)  
✅ Envanter koruması (overlap query)  
✅ Gamification (rozet + streak + bingo + spin + liderlik)  
✅ Sosyal (takip + feed + event chat)  
✅ Finansal (loyalty + iade + sigorta + cüzdan)  
✅ Lokasyon (şu an açık + last-minute + trafik ETA + walk-in)  
✅ Real-time (Presence + Realtime broadcast)  
✅ Görsel upload (Cloudinary webp)  
✅ Mock ödeme

### V1.5 (sıradaki)

- **iyzico / PayTR entegrasyonu** (gerçek ödeme)
- **E-fatura / e-arşiv** üretimi (Logo/Mikro/3.parti)
- **Polise misafir bildirim** (Konaklama Tesisleri Yönetmeliği — günlük push)
- **Email hatırlatma** (check-in 1 gün önce, cron/queue)
- **PDF voucher** (jsPDF veya server puppeteer)
- **Cloudinary orphan temizlik** (deal silinince upload'lar)
- **AI ile otele sor** chat — detay sayfasında concept/oda hakkında soru-cevap
- **Wizard upsell** — Step 4'te akşam yemeği/spa add-on

### V2

- Mobil app (React Native + Expo)
- B2B kurumsal hesaplar
- Fiyat tarihçesi (Akakçe benzeri)
- Affiliate (FırsatBuFırsat API hazır)
- Gelişmiş analitik dashboard
- Çok dilli destek (EN, AR)

### V3

- İşletmelere SaaS dashboard (aylık abonelik)
- Group booking
- White-label B2B

---

## 📊 Proje istatistikleri

- **18+ migration** — incremental, idempotent, RLS açık
- **1225+ aktif deal** (225 curated + 1000 procedural tatil)
- **2049+ oda tipi** (10 destinasyon × concept-based preset)
- **2 demo persona + 1 işletme persona**
- **10+ AI tool** — agentic chain
- **51 ülke vatandaşlık** seçimi (KVKK uyumlu)
- **24 amenity** (otel) + **6 oda amenity**
- **20 hotel concept** (her-sey-dahil, butik, magara-otel, kayak-otel vs.)
- **8 view type** (deniz, bahçe, havuz, dağ, şehir, park, iç-bahçe, manzara-yok)
- **6 board basis** (oda / +kahvaltı / yarım-pansiyon / tam-pansiyon / her-şey-dahil / ultra-her-şey-dahil)

---

## License

MIT
