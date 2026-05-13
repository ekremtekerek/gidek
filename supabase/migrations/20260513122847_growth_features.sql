-- Growth features migration: referrals, newsletter, onboarding columns,
-- trending score, push subscriptions.

-- ============================================================================
-- 1) REFERRALS — kullanıcı başına 1 kalıcı davet kodu + kayıt tabanlı claim
-- ============================================================================

create table if not exists public.referrals (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  code       text not null unique,
  created_at timestamptz not null default now()
);

-- Kod formatı: 6 karakter alfanumerik (büyük harf). Server action ile üretilir.
create or replace function public.gen_referral_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  candidate text;
  exists_ boolean;
begin
  loop
    candidate := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));
    select exists(select 1 from public.referrals where code = candidate) into exists_;
    if not exists_ then
      return candidate;
    end if;
  end loop;
end;
$$;

create table if not exists public.referral_claims (
  id            bigserial primary key,
  code          text not null references public.referrals(code) on delete cascade,
  redeemer_id   uuid not null unique references auth.users(id) on delete cascade,
  claimed_at    timestamptz not null default now()
);

create index if not exists referral_claims_code_idx on public.referral_claims(code);

alter table public.referrals enable row level security;
alter table public.referral_claims enable row level security;

-- Sahibi kendi kodunu okuyabilir; başkası okuyamaz.
drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals
  for select to authenticated using (auth.uid() = user_id);

-- Kullanıcı kendi davet ettiği kişilerin sayısını görebilsin.
drop policy if exists referral_claims_select_owner on public.referral_claims;
create policy referral_claims_select_owner on public.referral_claims
  for select to authenticated using (
    code in (select code from public.referrals where user_id = auth.uid())
  );

-- INSERT/UPDATE/DELETE yalnızca service_role tarafından (server action).

-- ============================================================================
-- 2) NEWSLETTER SUBSCRIBERS — anonim e-posta yakalama
-- ============================================================================

create table if not exists public.newsletter_subscribers (
  id              bigserial primary key,
  email           text not null unique,
  source          text not null default 'footer',
  confirmed_at    timestamptz,
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;
-- Public insert açık (anonim form). Server zaten zod + rate limit yapacak.
drop policy if exists newsletter_insert_public on public.newsletter_subscribers;
create policy newsletter_insert_public on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

-- ============================================================================
-- 3) ONBOARDING ZENGİNLEŞTİRME — user_preferences yeni kolonlar
-- ============================================================================

alter table public.user_preferences
  add column if not exists has_car         boolean,
  add column if not exists has_pet         boolean,
  add column if not exists time_preference text
    check (time_preference is null or time_preference in ('weekday', 'weekend', 'any'));

-- ============================================================================
-- 4) DYNAMIC FEATURED — trending_score SQL fonksiyonu
-- ============================================================================
-- view * 1.0 + sold * 5.0 + 50 * exp(-days / 14)  → 14 günlük yarı-ömür

create or replace function public.deal_trending_score(
  view_count_in   int,
  sold_count_in   int,
  published_at_in timestamptz
)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select
    coalesce(view_count_in, 0)::numeric * 1.0
    + coalesce(sold_count_in, 0)::numeric * 5.0
    + (
      case
        when published_at_in is null then 0
        else 50.0 * exp(-extract(epoch from (now() - published_at_in)) / (14 * 86400.0))
      end
    );
$$;

-- ============================================================================
-- 5) PWA PUSH SUBSCRIPTIONS — kullanıcı başına N cihaz
-- ============================================================================

create table if not exists public.push_subscriptions (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth_secret  text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated using (auth.uid() = user_id);
-- INSERT/DELETE service role üzerinden.
