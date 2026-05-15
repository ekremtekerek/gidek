# 🎥 gidek · 1 Dakikalık Tanıtım Videosu

> Jüri için ekran kaydı senaryosu. **Hedef:** 60 saniyede izleyiciyi etkilemek, "bu çalışan bir ürün" hissini vermek, satın alma kararı verdirmek.

---

## 🎯 Strateji — neden bu özellikler seçildi

22 özelliğin **hepsini gösteremeyiz** (jüri yorulur, anlam kaybolur). Onun yerine **6 wow sahne** seçtim:

1. **AI keşif + "neden bu öneri?"** — diferansiasyonun kalbi
2. **Mock booking + sigorta + e-bilet** — gerçek ürün, çalışan akış
3. **Daily spin çark** — görsel olarak yakalayıcı, viral feature
4. **Şehir bingosu + Rozetler** — gamification katmanı, geri dönme tetiği
5. **Etkinlik chat odası (realtime)** — sosyal katman, teknik derinlik
6. **Cüzdan** — kazanç + ekosistem, "ben kazandım" hissi

Geri kalan 16 özellik **voiceover'da tek cümlede** geçer: *"Üstüne 16 özellik daha — takip sistemi, akış, sigorta, hediye kartı, ETA, walk-in baskı..."*

---

## ⏱️ Saniye saniye plan (toplam 60 sn)

| Saniye | Sahne | Ekran | Voiceover |
|---|---|---|---|
| **0:00 – 0:06** | Hook + logo | Anasayfa (büyük hero) | "Türkiye'de fırsat aramak: 1000+ kupon, 50 filtre, kayboldun. **gidek** bunu **AI ile** değiştiriyor." |
| **0:06 – 0:18** | AI keşif | Chat input'a yaz, AI cevap ver | "Doğal dille yazıyorsun — *'Beşiktaş'ta çift için romantik akşam'* — Gemini RAG ile **961 fırsat** arasından 3 öneri saniyede. Ve her birinin yanında **'neden bu?'** açıklaması." (? popover aç) |
| **0:18 – 0:30** | Booking + sigorta + e-bilet | Detay → rezervasyon → sigorta tikle → mock ödeme → QR | "Rezervasyon yap, **iptal sigortası** ekle — sektörde olmayan bir özellik. Ödeme sonrası **anında e-bilet, QR kod**. Tüm akış çalışıyor." |
| **0:30 – 0:38** | Çark + rozet | `/cark` çevir, modal ödül, profile dön | "Günlük çark, **şehir bingosu**, streak, rozetler — kullanıcıyı **geri getiren gamification katmanı**." |
| **0:38 – 0:46** | Realtime chat | Booking detay → "Etkinlik sohbet odası" → mesaj at | "Aynı etkinliğe gelen başka biriyle — **Supabase Realtime broadcast** ile canlı sohbet odası. RLS ile sadece onaylı katılımcılar." |
| **0:46 – 0:53** | Cüzdan + ekosistem | `/cuzdan` aç, çoklu kupon kartları | "Bingo'dan, çarktan, sadakat eşiklerinden kazandığın **kuponlar tek ekranda**." |
| **0:53 – 1:00** | Outro + URL | Anasayfaya dön, URL altta | "**22 özellik. 961 fırsat. Adil komisyon.** Tüm akış canlı: **gidek.vercel.app**." |

---

## 🎙️ Voiceover — kelime kelime metin (kopyala-oku)

> **Toplam 130 kelime · Türkçe konuşma temposu = 60-65 saniye**
> İpucu: 1.0× tempoda kayıt yap, edit'te gerekirse 1.05× hızlandır.

```
[0:00]
Türkiye'de fırsat aramak bir kabus.
Bin kupon, elli filtre — kullanıcı kayboldu.

[0:05]
gidek bunu yapay zekayla değiştiriyor.
Doğal dille yazıyorsun:
"Beşiktaş'ta çift için romantik bir akşam."

[0:14]
Gemini destekli RAG, dokuz yüz altmış bir fırsat arasından
saniyede üç öneri çıkarıyor.
Ve her birinin yanında bir "neden bu öneri?" — yapay zeka şeffaf.

[0:23]
Rezervasyon yap, iptal sigortası ekle —
sektörde olmayan bir özellik.
Ödeme anında e-bilet, QR kod, takvime entegrasyon.

[0:33]
Günlük çark, şehir bingosu, streak, rozetler —
kullanıcıyı geri getiren gamification katmanı.

[0:39]
Aynı etkinliğe gelen başka biriyle — Supabase Realtime ile
canlı sohbet odası. RLS ile sadece onaylı katılımcılar.

[0:48]
Kazandığın tüm kuponlar tek ekranda — gerçek değer üretiyor.

[0:54]
Yirmi iki özellik. Dokuz yüz altmış bir fırsat. Adil komisyon.
Tamamı canlı. gidek dot vercel dot app.
```

---

## 🎬 Ekran çekimi rehberi — ne tıklayacaksın

### Sahne 1 — Hook (0:00–0:06)
- **Açılış:** `https://gidek.vercel.app` anasayfa
- Hareketsiz dur, sadece logo + hero görünür kalır
- Mouse hareketsiz, beyaz boş alana

### Sahne 2 — AI keşif (0:06–0:18)
- Mood chip **"Romantik akşam"** üstüne mouse → tıklama
- Prompt input'a otomatik yazıldı
- Üzerine **manuel** ekle: *"Beşiktaş'ta, bütçe 1500"*
- **Enter** → AI yanıtı bekle (ön-cache'den hızlı)
- Yanıt gelince ilk önerideki **"?"** butonuna tıkla
- Popover açıldı → 1 saniye bekle → kapat

### Sahne 3 — Booking (0:18–0:30)
- İlk öneri kartına **tıkla** → detay sayfası
- **"Rezervasyon yap"** butonuna bas
- Formda: Tarih = yarın, Kişi = 2
- **"İptal sigortası ekle"** checkbox'ı tikle → toplam değişimini göster (1 sn dur)
- **"Onayla ve devam et"** → ödeme sayfası
- Kart: `4242 4242 4242 4242` (yazılı görünebilir, hızlı doldur)
- **Ödemeyi tamamla** → 1.2 sn animasyon
- **E-bilet sayfası açıldı, QR kod görünür** (1 sn bekle)

### Sahne 4 — Çark + rozet (0:30–0:38)
- Üst menüden **Profil** → 1 sn dur (loyalty kartı, streak rozeti görünsün)
- Profil menüsünden **"Günlük çark"** → `/cark`
- Çarka **tıklama yapmadan** dön — sadece görsel (animasyonlu mini banner de görünür)
- Aslında **"ÇEVİR"** butonuna bas → animasyon (4.5 sn beklenir — burada **edit'te hızlandır**)
- Modal sonuç görünür → 1 sn bekle

### Sahne 5 — Realtime chat (0:38–0:46)
- **/rezervasyonlarim** → az önce yaptığın rezervasyona tıkla
- Aşağı kaydır → **"Etkinlik sohbet odası"** bölümünü göster → **aç**
- Boş chat görünür → kısa mesaj at: **"Selam!"** → Enter
- Mesaj görünür → 1 sn dur

### Sahne 6 — Cüzdan (0:46–0:53)
- **/cuzdan** doğrudan adres çubuğundan git
- Sayfa açılır → kuponlar görünür → yavaş scroll aşağı (1-2 sn)

### Sahne 7 — Outro (0:53–1:00)
- **/** (anasayfa) dön → hero görünür
- Alt köşede **URL overlay** (post-processing'de ekle): **`gidek.vercel.app`** + küçük QR
- Hareketsiz dur

---

## 🎨 Edit'te yapılacaklar

| İşlem | Araç önerisi |
|---|---|
| **Hızlandırma:** çarkın 4.5 sn animasyonu → 1.5 sn (3× speed) | CapCut/DaVinci → "Speed" kontrolü |
| **Ses kayıt:** voiceover ayrı dosya | Audacity (free) veya doğrudan Loom/OBS mic |
| **Geçişler:** hızlı fade veya cut, **karmaşık transition yok** | CapCut default cut |
| **Müzik:** opsiyonel, sessiz/hafif | Pixabay Music (royalty-free) — düşük volume %15 |
| **URL overlay:** "gidek.vercel.app" alt köşede son 5 sn | CapCut Text → küçük + readable |
| **Logo:** ilk 1 sn full screen | (varsa) yoksa hero zaten yeterli |
| **Subtitle:** Türkçe altyazı ekle — sessiz izleyenler için | CapCut "Auto captions" → editle |
| **Render:** 1080p MP4 H.264, 30fps, ~10-20 MB | Standart export |

---

## 🛠️ Kayıt aracı seçimi

| Araç | Avantaj | Dezavantaj |
|---|---|---|
| **Loom (browser)** | Kayıt+edit+share tek araç, voiceover beraber kaydeder | Free 5 dk limit, paid plan watermark |
| **OBS Studio** | Tam kontrol, ücretsiz, profesyonel | Kurulum + öğrenme 30 dk |
| **Windows Game Bar** (Win+G) | Yerleşik, sıfır kurulum | Sadece tek pencere kaydı, basit |
| **CapCut Desktop** | Hem kayıt hem edit, ücretsiz | Mac/Win |
| **ScreenStudio** (Mac) | Otomatik zoom + cursor, çok şık | Sadece Mac, $89 ama trial var |

**Önerim:** Tek dosyada hızlıca → **CapCut Desktop**. Edit'te kestiğin gibi voiceover ile birleştirip export. Ücretsiz, watermark yok.

---

## 🎤 Voiceover kayıt ipuçları

- **Hız:** Doğal konuşma + %10 enerjik. **Robot okur gibi** olma.
- **Mikrofon:** Telefon kulaklığı bile yeter. Önemli olan **gürültüsüz oda**.
- **Mesafe:** Mikrofona ~15 cm — yakın olursan patlama (p sesi) çıkar, uzakta kalsa boş ses.
- **Pratik:** Önce 3 kere **sessiz okumak** kelimeleri akıcılaştırır.
- **Pause:** Cümleler arası **0.3-0.5 sn duraklama** — anlam yerleşir.
- **Vurgu:** *italik* yapacağın kelimeleri **abart hafif** — "Yapay zekayla" → "Yapay **zekayla**".
- **Hata varsa baştan oku** — kesip yapıştırma daha çok uğraştırır.

---

## 📐 Görsel düzen ipuçları

- **Tarayıcı:** Gizli mod / temiz pencere (uzantı simgeleri görünmesin)
- **Çözünürlük:** 1920×1080 veya 1440×900 (oradan 16:9 export)
- **Cursor büyütme:** Windows → Erişilebilirlik → Fare imleci boyutu 2 (görünür olsun)
- **Zoom:** Tarayıcı zoom 100% (Ctrl+0)
- **Notification kapat:** Discord/Mail/Slack hepsini sustur (Win+A → Focus Assist on)
- **Tab gizle:** Tek bir tab açık, başlık çubuğunda gereksiz şey yok
- **DevTools kapalı**, bookmark bar kapalı

---

## 🚦 Çekim öncesi 5 dakikalık checklist

```
☐ npm run dev çalışıyor (veya gidek.vercel.app live)
☐ Aslı persona ile giriş yapılmış (sağ üst avatar)
☐ Tarayıcı 100% zoom, gizli mod
☐ Notifications off (Focus Assist on)
☐ Mikrofon test edildi
☐ DEMO-VIDEO.md açık, voiceover metni hazır
☐ İptal sigortası tikinin yerini biliyorum (form'da)
☐ Çark sayfasını biliyorum (/cark)
☐ Cüzdan sayfasını biliyorum (/cuzdan)
☐ Voiceover'ı sesli olarak 1 kere okudum (akıcı)
☐ Demo rezervasyon yapılmadı (çark + bingo + bookings sıfır olmamalı)
```

---

## 🎯 Jüriye dikkat çekme stratejisi

### ⚡ İlk 5 saniye (en kritik!)

İlk cümle **hooks olmazsa** jüri zaten kafa çevirir. Önerim:

> ✅ İyi: "Türkiye'de fırsat aramak bir **kabus**." (problem direkt)
> ❌ Kötü: "Merhaba, biz gidek." (kim önemsemez)

### 🔥 3 wow noktası — burada yavaşla

1. **0:14 — "961 fırsat arasından saniyede 3 öneri"** → sayı şok ediyor
2. **0:23 — "İptal sigortası, sektörde olmayan"** → diferansiasyon
3. **0:39 — "Supabase Realtime, RLS"** → teknik derinlik (jüri developer ise)

Bu 3 cümleyi söylerken **0.2 sn pause** ver. Anlamın yerleşmesi için.

### 🎨 Görsel kontrast

- AI sahnesi: **statik** ekran (textler okunur)
- Çark sahnesi: **hareket** (görsel patlama)
- Chat sahnesi: **2 mesaj** anında alır gibi → live feel

### 📱 Mobil de göster (opsiyonel +5 sn)

Eğer 60 sn yerine 65 sn olabilirse, en sonda **telefon görüntüsü** ekle — DevTools Device Mode iPhone 14 Pro:
> "Mobil ve web — her boyutta sorunsuz."

Bu jüriye "responsive değerlendirildi" sinyali verir.

---

## ✅ Sonuç ne istiyoruz

Video bittiğinde jüri şu 4 şeyi hissetmeli:

1. **"Bu çalışan bir ürün, fake demo değil."** (real booking, real QR, real data)
2. **"AI burada gerçekten değer üretiyor."** (RAG + neden bu? + 961 fırsat)
3. **"Bu ekipte güçlü mühendislik var."** (Realtime, RLS, gamification, sigorta)
4. **"Çok fazla özellik var, derinlik var."** (22 özellik, 6 paket)

---

## 🚨 Kaçınılacak hatalar

- ❌ **Çok hızlı tıklama** — jüri ne olduğunu anlayamaz; her tıklamadan sonra 0.5 sn bekle
- ❌ **Voiceover okuma hissi** — provayı 3 kere yap; en doğal 3. denemede gelir
- ❌ **60 sn'yi aşma** — jüri 65 sn'den sonra dikkat dağılır; 58-62 sn ideal
- ❌ **Fazla geçiş efekti** — basit cut, hızlı tempo profesyonel görünür
- ❌ **Müzik çok yüksek** — voiceover boğulur, %15-20 max
- ❌ **Watermark** (Loom free etc.) — CapCut tercih et
- ❌ **Cursor takip edilemez** — büyük cursor + slow hover

---

## 🎬 Tek satır özet

> 60 saniye = 6 sahne × 10 sn ortalama. **Hook → AI → Booking → Çark → Chat → Cüzdan → Outro.** Voiceover Türkçe doğal tempo, edit'te sessizlikleri kes, URL overlay son 5 sn'de.

İyi çekimler! 🎥
