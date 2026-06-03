-- Affiliate pivot: fırsatlar artık firsatbufirsat.com yayıncı API'sinden çekilir.
-- deals/merchants tablolarına dış kaynak (source/external_id) ve affiliate satın-alma
-- bağlantısı (external_url, affiliate_options) kolonları eklenir; tıklama takibi için
-- affiliate_clicks tablosu açılır. Mevcut CHECK constraint'leri korunur — mapping
-- katmanı (src/lib/affiliate/mapping.ts) bunlara uyacak şekilde veriyi normalize eder.

-- ----------------------------------------------------------------------------
-- merchants: dış kaynak izleri
-- ----------------------------------------------------------------------------
alter table public.merchants
  add column if not exists source      text not null default 'local',
  add column if not exists external_id text;

-- Aynı kaynaktan gelen işletme tekilliği (idempotent upsert). Postgres null'ları
-- distinct sayar → mevcut 'local' satırlar (external_id null) çakışmaz.
alter table public.merchants
  add constraint merchants_source_external_uniq unique (source, external_id);

-- ----------------------------------------------------------------------------
-- deals: dış kaynak + affiliate satın-alma alanları
-- ----------------------------------------------------------------------------
alter table public.deals
  add column if not exists source            text   not null default 'local',
  add column if not exists external_id       text,
  -- Fallback affiliate sayfası (pid içerir). subDeal seçimi yoksa buraya yönlenir.
  add column if not exists external_url      text,
  -- API'nin serbest metin tag'leri (CHECK yok) — embedding + full-text zenginliği için.
  add column if not exists external_tags     text[] not null default '{}',
  -- Bilet tipi / etkinlik seansı listesi: [{subDealId, label, price, checkoutLink}].
  add column if not exists affiliate_options jsonb;

alter table public.deals
  add constraint deals_source_external_uniq unique (source, external_id);

-- Kaynağa göre hızlı filtre (sync stale-deactivation + admin).
create index if not exists deals_source_idx on public.deals (source);

-- ----------------------------------------------------------------------------
-- affiliate_clicks: komisyon/analitik. Sadece server (service_role) yazar/okur.
-- ----------------------------------------------------------------------------
create table if not exists public.affiliate_clicks (
  id                   uuid primary key default gen_random_uuid(),
  deal_id              uuid not null references public.deals(id) on delete cascade,
  sub_deal_external_id text,
  user_id              uuid references public.profiles(id) on delete set null,
  referrer             text,
  created_at           timestamptz not null default now()
);

create index if not exists affiliate_clicks_deal_idx   on public.affiliate_clicks (deal_id);
create index if not exists affiliate_clicks_created_idx on public.affiliate_clicks (created_at desc);

-- RLS açık, public policy yok: anon/authenticated erişemez. Tıklama logu ve okuma
-- yalnızca service_role (RLS bypass) üzerinden /api/affiliate/go ve admin tarafında yapılır.
alter table public.affiliate_clicks enable row level security;

-- ----------------------------------------------------------------------------
-- match_deals overload temizliği (RAG düzeltmesi)
-- ----------------------------------------------------------------------------
-- Eski 3-argümanlı match_deals(vector,int,text), sonradan near_lat/near_lng
-- eklenen 5-argümanlı sürümle BİRLİKTE var oldu. PostgREST, rag.ts'in 3 isimli
-- argümanla yaptığı çağrıda iki aday arasında seçim yapamayıp "could not choose
-- the best candidate function" (ambiguous) hatası veriyor → AI/RAG araması
-- tamamen kırık. Eski overload'u kaldır; 5-argümanlı sürüm near_lat/near_lng
-- default null ile birebir aynı davranışı sağlar.
drop function if exists public.match_deals(extensions.vector(768), integer, text);
