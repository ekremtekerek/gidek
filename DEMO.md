# gidek · Canlı Demo Scripti

**Süre:** 2:45 – 3:30 dk
**Format:** Tek nefeste akan canlı tıklama
**Tarayıcı:** Chrome — gizli/InPrivate pencerede temiz cache ile aç
**Önceden hazırlık:** Server çalışıyor (`npm run dev`), `/demo/persona` sayfası açık, Aslı persona seçili

---

## 🎬 Açılış (0:00 → 0:15)

> *"Türkiye'de 1.000+ fırsatın olduğu bir ekosistem var ama kullanıcı 50 filtre tıklayarak romantik bir akşam bulmak zorunda. Bizim gibi yapay zeka çağında bu hâlâ böyle. **gidek** bunu değiştiriyor — doğal dille soruyorsun, Gemini destekli AI sana 5 dakikada planı kuruyor. Şimdi gerçek demo'yu izleyelim."*

**Ekranda:** Anasayfa `http://localhost:3000` açık. Hero alanı, mood chips görünür.

---

## 🎬 1. AI Keşif (0:15 → 1:00)

### Adım 1A — Mood chip (5 sn)
> *"Acelesi olan kullanıcı için tek tıkla atmosfer ipuçları var."*

**Tıkla:** "Romantik akşam" mood chip → prompt input'a yansır.

### Adım 1B — Free-text + AI çağrısı (20 sn)
**Yaz (üzerine ekle):**
```
Beşiktaş'ta bütçe 1500 TL, deniz manzaralı olsun
```
**Enter.**

> *"Anlık olarak Gemini 2.5 Flash, pgvector ile **961 fırsat** içinden top-30 semantik aday çekiyor, bunları kullanıcının onboarding profili — şehir, hane tipi, bütçe, diyet, negatif tercihler — ile yeniden sıralıyor ve 3-5 sonuç döndürüyor."*

### Adım 1C — "Neden bu öneri?" (20 sn)
**Bekle:** AI yanıtı gelir, kartlar görünür.

> *"Her önerinin yanında bu **? butonu** var..."*

**Tıkla:** İlk öneride **?** butonu → popover açılır.

> *"Burada Gemini structured output ile **bu kullanıcıya neden bu öneri** ve **eşleşme faktörleri** sunuyor — 'çift için ideal, bütçen içinde, Beşiktaş'ta yürüme mesafesinde'. Yapay zekayı şeffaf tutuyoruz."*

**Kapat.**

---

## 🎬 2. Fırsat Detayı + Canlı Rozetler (1:00 → 1:30)

### Adım 2A — Detay sayfası açılışı (15 sn)
**Tıkla:** İlk öneri kartına → deal detay sayfası açılır.

> *"Detay sayfasında klasik bilgilerin üstüne 4 canlı sinyal eklemişiz..."*

**Göster (üst-orta alan):**
1. 🟢 **"Şu an açık · bugün 09:00–23:00"** → *"Mekanın çalışma saatleri JSONB, gerçek zamanlı."*
2. 🚗 **"Konumumdan ne kadar?"** butonuna tıkla → konum izni ver → *"Senden 14 dk · 6.2 km"* → *"Mapbox Directions API ile canlı trafiğe göre."*
3. 🔥 **"Şu an çok hareketli · bugün 8"** → *"Walk-in pressure — bu fırsata bugün kaç onaylı rezervasyon yapıldı."*
4. ⏱️ **Last-minute countdown** (eğer 24h kala ise) → *"Bitime saatler kala canlı countdown banner."*

---

## 🎬 3. Booking + Sigorta + Mock Ödeme (1:30 → 2:00)

### Adım 3A — Rezervasyon (10 sn)
**Tıkla:** "Rezervasyon yap" → form sayfası.

**Doldur hızlıca:**
- Tarih: yarın
- Saat: 19:00
- Kişi: 2
- ☑ **"İptal sigortası ekle"** tikle

> *"İptal sigortası dünyada yok denecek kadar az platformda var — biz fırsatın %5'i prim ile kullanıcıya **%100 iade** garantisi veriyoruz. Sigortasızlarda %50."*

**Toplam tutarı göster** (sigorta satırı + total değişimi).

### Adım 3B — Mock ödeme (10 sn)
**Onayla** → ödeme sayfası açılır.

**Doldur:** `4242 4242 4242 4242` / `12/30` / `123`
**Tamamla** → 1.2 sn animasyon → rezervasyon detay sayfası.

> *"Mock ödeme V1'de — canlıya çıkışta iyzico/PayTR entegrasyonu hazır. Sonrası: e-bilet anında oluştu, **iki kişilik = iki ayrı QR kod**, ayrı turnike geçişi için."*

### Adım 3C — Anlık gamification (10 sn)
**Tıkla:** Sağ üst → "Profil"

> *"Ve burası ilginç — booking onayından 200ms sonra fire-and-forget pipeline 4 şeyi paralel yaptı..."*

**Göster:**
- Loyalty puanı: 10 ↗
- 🔥 **1 hafta seri** (streak rozeti)
- "İlk rezervasyon" rozeti turuncu çerçevede
- Şehir bingosu progress'i bir kare doldu

> *"Streak, rozet sistemi, şehir bingosu, daily spin — kullanıcıyı geri getiren 5 katman gamification."*

---

## 🎬 4. Daily Spin + Cüzdan (2:00 → 2:25)

### Adım 4A — Çark (10 sn)
**Tıkla:** Profilde "Günlük çark" → `/cark`.

> *"Günde bir kez ücretsiz çark — viral değer. Servis tarafında ağırlıklandırılmış ödül havuzu, kupon otomatik üretiliyor."*

**ÇEVİR** → 4.5 sn animasyon → modal sonuç.

### Adım 4B — Cüzdan (10 sn)
**Tıkla:** Geri profil → "Cüzdanım" → `/cuzdan`.

> *"Cüzdan — bingo, spin, loyalty, iade kuponlarının hepsi tek ekranda. Kopyala butonu, kullanım durumu, geçerlilik tarihi."*

**Göster:** Renkli kupon kartları (spin'den kazanılan + loyalty 100 puan kuponu).

---

## 🎬 5. Sosyal Akış (2:25 → 2:50)

### Adım 5A — Topluluk + Liderlik (10 sn)
**Tıkla:** Header → "Topluluk" → `/u`.

> *"Topluluk — haftalık, aylık, yıllık şampiyonlar; podium; loyalty piramidi; topluluğun en çok favorilediği fırsatlar."*

**Tıkla:** "Yıllık" sekmesi → podium değişir.

### Adım 5B — Etkinlik chat (15 sn)
**Bir public profile** (örn. Mehmet) tıkla → `/u/mehmet`.

> *"Takip sistemi — Twitter modeli, tek yönlü."*

**Tıkla:** "Takip et" → "Takiptesin" oldu.

**Geri:** Rezervasyon detayına dön → "Etkinlik sohbet odası" → aç.

> *"Aynı etkinliğe, aynı saatte gelenler için Supabase Realtime ile broadcast chat. RLS sadece o etkinliğin onaylı katılımcılarına açık — gizlilik birinci sınıf."*

---

## 🎬 6. Kapanış (2:50 → 3:10)

**Ekranda:** Profil sayfası ya da anasayfa.

> *"22 büyük özellik. Tek başına çalışan AI keşif değil — RAG + gamification + sosyal + finansal + lokasyon — bütün bir ekosistem. **961 mock fırsat** üzerinde her şey **şu anda gerçek**. Tech stack: Next.js 16, Supabase, Gemini 2.5, Mapbox, Cloudinary. Tüm RLS açık, KVKK uyumlu, PWA hazır."*

> *"İş modeli üç kademe: V1 kendi merchant'larımızla **adil komisyon** (sektör %30, biz %10-15 hedefimiz), V2 affiliate (Fırsat Bu Fırsat API'si hazır), V3 işletmelere SaaS dashboard."*

> *"Sorularınız?"*

---

## 🎯 Olası Jüri Soruları + Cevaplar

| Soru | Cevap |
|---|---|
| "Hangi LLM?" | Gemini 2.5 Flash — fiyat-performans + 1M context, hızlı. Embedding `text-embedding-004` 768d. |
| "Kaç user'da ölçeklenir?" | Supabase Postgres + pgvector, ISR, edge caching. 100K MAU'ya kadar pansiyon yok. RAG cache layer var (`ai_cache`). |
| "Güvenlik?" | Her tabloda RLS, zod validation her API girdisinde, rate-limit AI'da, httpOnly cookie, `service_role` asla NEXT_PUBLIC değil, dangerouslySetInnerHTML yasak. |
| "Mock veri yerine?" | İşletme entegrasyonu hazır: merchant dashboard (deal CRUD, AI içerik gen). Affiliate fallback: FırsatBuFırsat API entegrasyonu spec'li. |
| "Neden hediye / sigorta?" | Standart deal platformlarında olmayan değer önerileri. Sigorta = güven; hediye = viral. Komisyon kaynağı dışında ek gelir kalemleri. |
| "AI maliyeti?" | Anonim 2 sorgu/gün, üye 30/gün rate-limit. Embedding cache'li. Tipik aktif user'da $0.02-0.05/ay tahmini Gemini maliyeti. |
| "KVKK?" | Profil sayfasından şifre/e-posta değişimi, **veri silme** RPC ile gerçekten siliyor, cookie consent, gizlilik metni. |

---

## ⚙️ Demo Öncesi 60 Saniye Hazırlık

```bash
# Terminal 1 — local Supabase çalışıyor mu
npm run db:start

# Terminal 2 — dev server
npm run dev

# Verify
curl -s http://localhost:3000 -o nul -w "%{http_code}\n"   # 200 bekle
```

**Tarayıcı sekmeleri:**
1. `http://localhost:3000/demo/persona` — Aslı'ya tıklama hazır
2. `http://localhost:3000` — anasayfa
3. (Yedek) `http://127.0.0.1:54323` — Supabase Studio (jüri "veri var mı?" sorarsa göster)

**Yedek senaryolar:**
- AI cevap gecikirse: *"Şu an Gemini'nin global trafiğine bağlı; cache hit'lerde 200ms, miss'lerde 2-3 sn. Birkaç saniye verelim..."*
- Konum izni reddetilirse: *"Anonim kullanıcıya tahmini süre veremiyoruz — KVKK gereği opt-in."*
- Çark "bugün çevirildi" çıkarsa: *"Bugün zaten test ettim — sonuç modalını gösterelim"* → "Bugünün ödülünü tekrar göster" linki.

---

## 📊 Demo Sonrası Tek-Sayfa Not (jüriye bırakabilirsin)

```
gidek  ·  AI ile Türkiye'nin fırsat keşif platformu
────────────────────────────────────────────────────
PROBLEM   1.000+ kupon, 50+ filtre — kullanıcı kaybolur. Mevcut
          platformlar %30 komisyon, kişiselleştirme yok.

ÇÖZÜM     Doğal dil → Gemini RAG → 3-5 öneri  +  gamification +
          sosyal katman + adil komisyon + işletmeye veri.

TECH      Next.js 16 RSC · Supabase + pgvector · Gemini 2.5 Flash
          Mapbox · Cloudinary · PWA · 13 migration · RLS açık

DURUM     22 özellik canlı, 961 fırsat envanter, 4 demo persona.
          Build temiz. Demo: localhost (canlı: hackathon sonrası).

İŞ MODELİ V1 komisyon · V2 affiliate (FBF spec) · V3 SaaS dashboard

İLETİŞİM  github.com/<repo>  ·  gidek.net  ·  info@cisoft.net.tr
```
