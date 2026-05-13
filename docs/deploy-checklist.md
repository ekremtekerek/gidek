# gidek.net — production deploy checklist

V1 canlıya çıkmadan önce sırayla yapılacaklar. Tikleyerek ilerle.

## 1) Supabase cloud

- [ ] https://supabase.com/dashboard → yeni proje (region: Frankfurt veya Stockholm).
- [ ] Local migrations'ı linkle: `supabase link --project-ref <ref>`
- [ ] Migration'ları push: `supabase db push`
- [ ] `npm run seed` ile mock veriyi cloud DB'ye yaz (V1 başlangıcı).
- [ ] `npm run seed:fill` ile İstanbul/Ankara/İzmir 100'er fırsata tamamla.
- [ ] Storage: `avatars` bucket'ı public read (RLS migration zaten ayarladı).
- [ ] Auth → Settings:
  - Site URL: `https://gidek.net`
  - Redirect URLs: `https://gidek.net/**`
  - Email auth → Confirm email = ON (production).
- [ ] Auth → SMTP: Resend SMTP veya Supabase default. **Confirmation maili her durumda gider.**
- [ ] Database → Connection pooling: enabled (Vercel için).
- [ ] Backups: günlük (Free plan otomatik), Pro'da PITR.

## 2) Env değişkenleri (Vercel / hosting)

`.env.example` referans alarak Vercel project settings'e gir. **Public/non-public ayrımına dikkat**:

| Variable | Yer | Notlar |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | All | `https://gidek.net` |
| `NEXT_PUBLIC_SUPABASE_URL` | All | Cloud project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Cloud anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | **Sızdırma!** |
| `GEMINI_API_KEY` | Server | Billing tier yüksek olmalı |
| `AI_DAILY_BUDGET_USD` | Server | Başlangıçta 2-5 USD/gün |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | All | URL whitelist: gidek.net |
| `CLOUDINARY_*` | Server | Admin görsel upload |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | All | Cloudflare Turnstile site |
| `TURNSTILE_SECRET_KEY` | Server | **Sızdırma!** |
| `RESEND_API_KEY` | Server | Domain verified olmalı |
| `EMAIL_FROM` | Server | `gidek.net <noreply@gidek.net>` |
| `NEXT_PUBLIC_SENTRY_DSN` | All | Sentry browser DSN |
| `SENTRY_DSN` | Server | Aynı DSN ya da server-only project |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Build | Source map upload için CI'da |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | All | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Server | **Sızdırma!** |
| `SHARE_TOKEN_SECRET` | Server | `openssl rand -base64 32` |
| `ADMIN_EMAILS` | Server | virgülle ayır |

## 3) Cloudflare Turnstile

- [ ] https://dash.cloudflare.com → Turnstile → yeni site
- [ ] Mode: **Managed** (kullanıcının çoğu hiçbir şey görmez)
- [ ] Domains: `gidek.net`, `www.gidek.net`
- [ ] Site key + secret key Vercel env'e yaz.

## 4) Resend

- [ ] https://resend.com → domain `gidek.net` ekle, DNS kayıtlarını yap (SPF + DKIM + DMARC).
- [ ] Domain "verified" olunca API key üret.
- [ ] `EMAIL_FROM=gidek.net <noreply@gidek.net>` (verified domain'le aynı olmalı).
- [ ] Test: kendi e-posta adresine `/odeme/[code]` üzerinden bir test rezervasyonu yap, mail geldi mi.

## 5) Sentry

- [ ] https://sentry.io → yeni Next.js projesi (frontend + edge + serverless aynı projede OK).
- [ ] DSN'i Vercel env'e yaz.
- [ ] CI'da source map upload için auth token üret (Settings → Auth Tokens, `project:releases` scope).
- [ ] İlk deploy sonrası tunnel `/monitoring` çalışıyor mu test et (adblocker'lı bir tarayıcıda).

## 6) Cloudinary

- [ ] https://cloudinary.com → yeni cloud
- [ ] Upload preset: signed (server-side imzalı)
- [ ] Cloud name + API key + secret Vercel'e

## 7) Mapbox

- [ ] https://account.mapbox.com → yeni access token
- [ ] URL whitelist: `https://gidek.net/*`, `https://www.gidek.net/*`
- [ ] Token'ı Vercel'e yaz.

## 8) Domain & DNS

- [ ] gidek.net domain alındı mı?
- [ ] Vercel'e bağla → CNAME `cname.vercel-dns.com`
- [ ] HSTS + redirect www → apex
- [ ] SSL otomatik (Vercel)

## 9) İlk deploy

- [ ] `git push` → Vercel auto-deploy
- [ ] Build başarılı (Sentry uyarıları normal, bloklamaz)
- [ ] `/api/health` veya anasayfa 200 dönüyor
- [ ] Lighthouse mobile + desktop puanları (hedef: Perf 80+, A11y 95+)

## 10) Smoke test (prod URL'de)

- [ ] Anasayfa → fırsat carousel + harita
- [ ] AI sohbet (anon — Turnstile widget görünmeli)
- [ ] AI sohbet (auth — Turnstile yok)
- [ ] /k/yemek filter UX
- [ ] Detail → favorite → /favorilerim
- [ ] Booking → ödeme → email geldi mi
- [ ] /davet kodu görünüyor
- [ ] /gecmis-firsatlar arşivi
- [ ] Sentry'e bir test hatası gönder → görünüyor mu

## 11) İlk hafta izlemesi

- [ ] Sentry günlük: 0 critical error
- [ ] Supabase Logs: 0 RLS bypass
- [ ] AI günlük spend: bütçe altında
- [ ] Newsletter signup count
- [ ] İlk referral claim
