-- ============================================================================
-- gidek.net — initial schema (V1)
-- ============================================================================
-- Tables, RLS, indexes, helper functions, and security-sensitive triggers.
-- All public.* tables have RLS enabled. anon/authenticated access goes through
-- policies; service_role bypasses RLS (used only on the server).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists vector  with schema extensions;
create extension if not exists pg_trgm with schema extensions;


-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- generic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'name',
      null
    )
  );
  return new;
end;
$$;

-- generate human-friendly booking code: GDK-XXXX-YYYY (ambiguous chars stripped)
create or replace function public.generate_booking_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'GDK-';
  i int;
begin
  for i in 1..4 loop
    result := result || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  end loop;
  result := result || '-';
  for i in 1..4 loop
    result := result || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  end loop;
  return result;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. TABLES
-- ----------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  phone           text,
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auth.users -> profile sync
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- user_preferences ----------------------------------------------------------
create table public.user_preferences (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  city            text default 'İstanbul',
  district        text,
  household_type  text
                    check (household_type in
                      ('single','couple','family_with_kids','family_no_kids','friends')),
  kids_age_groups text[] default '{}'
                    check (kids_age_groups <@ array['0-3','4-6','7-12','teen']::text[]),
  budget_min      numeric(10,2) check (budget_min is null or budget_min >= 0),
  budget_max      numeric(10,2) check (budget_max is null or budget_max >= 0),
  interests       text[] default '{}',
  dislikes        text[] default '{}',
  dietary         text[] default '{}'
                    check (dietary <@
                      array['vejetaryen','vegan','helal','glutensiz','alkolsuz']::text[]),
  accessibility   text[] default '{}',
  preferred_times jsonb,
  language        text not null default 'tr',
  embedding       extensions.vector(768),
  updated_at      timestamptz not null default now(),
  constraint budget_range_check
    check (budget_min is null or budget_max is null or budget_min <= budget_max)
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();


-- categories (self-referential: ana + alt kategori) -------------------------
create table public.categories (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  parent_id        uuid references public.categories(id) on delete restrict,
  icon             text,
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  description      text,
  meta_title       text,
  meta_description text,
  created_at       timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id);
create index categories_active_idx on public.categories (is_active, sort_order)
  where is_active;


-- merchants -----------------------------------------------------------------
create table public.merchants (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  logo_url     text,
  description  text,
  phone        text,
  email        text,
  website      text,
  address      text,
  city         text,
  district     text,
  lat          numeric(9,6),
  lng          numeric(9,6),
  is_active    boolean not null default true,
  is_verified  boolean not null default false,
  rating_avg   numeric(3,2),
  rating_count integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger merchants_set_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

create index merchants_slug_active_idx on public.merchants (slug) where is_active;
create index merchants_city_idx        on public.merchants (city) where is_active;


-- deals (the main entity) ---------------------------------------------------
create table public.deals (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  merchant_id      uuid not null references public.merchants(id) on delete restrict,

  -- content
  title            text not null,
  subtitle         text,
  description      text not null,
  highlights       text[] default '{}',
  terms            text,
  cover_image      text not null,
  images           text[] not null default '{}',

  -- pricing (always TRY in V1)
  original_price   numeric(10,2) not null check (original_price >= 0),
  discounted_price numeric(10,2) not null check (discounted_price >= 0),
  discount_percent integer generated always as (
    case when original_price > 0
         then round((1 - discounted_price / original_price) * 100)::int
         else 0
    end
  ) stored,
  currency         text not null default 'TRY',

  -- location & timing
  city             text not null,
  district         text,
  venue_name       text,
  lat              numeric(9,6),
  lng              numeric(9,6),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  valid_from       timestamptz not null default now(),
  valid_until      timestamptz not null,
  available_times  jsonb,

  -- classification (drives AI search + faceted filters)
  tags             text[] not null default '{}'
                     check (tags <@ array[
                       -- atmosfer / vibe
                       'romantik','sessiz','eglenceli','luks','samimi','enerjik','huzurlu','rahat',
                       -- mekan
                       'acik-hava','deniz-manzarali','dogada','sehir-merkezi','tarihi',
                       -- zaman / vesile
                       'son-dakika','hafta-sonu','gece-hayati','brunch','ozel-gun',
                       -- pratik
                       'aninda-onay','esnek-iptal','rezervasyon-sart',
                       -- kitle / erişim
                       'cocuk-dostu','evcil-hayvan-dostu','engelli-erisimi',
                       'lgbtq-friendly','business-uygun','grup-icin',
                       -- diyet
                       'vejetaryen','vegan','helal','glutensiz','alkolsuz',
                       -- stil / sosyal kanit
                       'odullu','populer','yerel-favori','gizli-cevher','yeni'
                     ]::text[]),
  audience         text[] not null default '{}'
                     check (audience <@
                       array['couple','family','kids','solo','group']::text[]),

  -- commerce
  capacity         integer check (capacity is null or capacity > 0),
  max_per_user     integer not null default 4 check (max_per_user > 0),
  sold_count       integer not null default 0,

  -- vitrin
  is_active        boolean not null default true,
  is_featured      boolean not null default false,
  sort_priority    integer not null default 0,
  view_count       integer not null default 0,
  rating_avg       numeric(3,2),
  rating_count     integer not null default 0,

  -- AI / search infra
  embedding        extensions.vector(768),
  search_text      tsvector generated always as (
    to_tsvector('simple',
      coalesce(title,'')       || ' ' ||
      coalesce(subtitle,'')    || ' ' ||
      coalesce(description,'')
    )
  ) stored,

  -- SEO overrides
  meta_title       text,
  meta_description text,

  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint price_check       check (discounted_price <= original_price),
  constraint valid_range_check check (valid_until > valid_from)
);

create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

create index deals_active_published_idx on public.deals (is_active, published_at desc)
  where is_active;
create index deals_city_idx        on public.deals (city)        where is_active;
create index deals_district_idx    on public.deals (district)    where is_active;
create index deals_tags_gin        on public.deals using gin (tags);
create index deals_audience_gin    on public.deals using gin (audience);
create index deals_search_gin      on public.deals using gin (search_text);
create index deals_embedding_hnsw  on public.deals using hnsw (embedding extensions.vector_cosine_ops);
create index deals_valid_until_idx on public.deals (valid_until) where is_active;
create index deals_merchant_idx    on public.deals (merchant_id);


-- deal_categories (many-to-many) --------------------------------------------
create table public.deal_categories (
  deal_id     uuid references public.deals(id)      on delete cascade,
  category_id uuid references public.categories(id) on delete restrict,
  primary key (deal_id, category_id)
);
create index deal_categories_cat_idx on public.deal_categories (category_id);


-- favorites -----------------------------------------------------------------
create table public.favorites (
  user_id    uuid references public.profiles(id) on delete cascade,
  deal_id    uuid references public.deals(id)    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);
create index favorites_user_idx on public.favorites (user_id, created_at desc);


-- bookings (mock in V1) -----------------------------------------------------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  booking_code  text unique not null default public.generate_booking_code(),
  user_id       uuid references public.profiles(id) on delete set null,
  deal_id       uuid not null references public.deals(id) on delete restrict,

  quantity      integer not null default 1 check (quantity > 0),
  unit_price    numeric(10,2) not null check (unit_price >= 0),
  total_amount  numeric(10,2) not null check (total_amount >= 0),
  currency      text not null default 'TRY',

  guest_name    text,
  guest_phone   text,
  guest_email   text,

  selected_date date,
  selected_time time,
  notes         text,

  status        text not null default 'confirmed'
                  check (status in ('pending','confirmed','cancelled','used')),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create index bookings_user_idx on public.bookings (user_id, created_at desc);
create index bookings_deal_idx on public.bookings (deal_id);


-- ai_query_logs (rate limit + cost tracking) --------------------------------
create table public.ai_query_logs (
  id                 bigserial primary key,
  user_id            uuid references public.profiles(id) on delete set null,
  ip_hash            text,
  session_id         text,
  query_text         text not null,
  retrieved_deal_ids uuid[] not null default '{}',
  response_deal_ids  uuid[] not null default '{}',
  model_used         text not null,
  input_tokens       integer,
  output_tokens      integer,
  cost_usd           numeric(10,6),
  cache_hit          boolean not null default false,
  duration_ms        integer,
  status             text not null
                       check (status in ('success','rate_limited','circuit_broken','error')),
  error_message      text,
  created_at         timestamptz not null default now()
);

create index ai_query_logs_user_time_idx on public.ai_query_logs (user_id, created_at desc);
create index ai_query_logs_ip_time_idx   on public.ai_query_logs (ip_hash, created_at desc);
create index ai_query_logs_time_idx      on public.ai_query_logs (created_at desc);


-- ai_cache (semantic cache) -------------------------------------------------
create table public.ai_cache (
  id              bigserial primary key,
  query_hash      text unique not null,
  query_embedding extensions.vector(768) not null,
  response        jsonb not null,
  user_segment    text,
  hit_count       integer not null default 0,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null
);

create index ai_cache_embedding_idx on public.ai_cache
  using hnsw (query_embedding extensions.vector_cosine_ops);
create index ai_cache_expires_idx on public.ai_cache (expires_at);


-- ai_daily_budget (circuit breaker) -----------------------------------------
create table public.ai_daily_budget (
  date           date primary key,
  total_cost_usd numeric(10,4) not null default 0,
  total_queries  integer not null default 0,
  circuit_open   boolean not null default false,
  updated_at     timestamptz not null default now()
);

create trigger ai_daily_budget_set_updated_at
  before update on public.ai_daily_budget
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles         enable row level security;
alter table public.user_preferences enable row level security;
alter table public.merchants        enable row level security;
alter table public.categories       enable row level security;
alter table public.deals            enable row level security;
alter table public.deal_categories  enable row level security;
alter table public.favorites        enable row level security;
alter table public.bookings         enable row level security;
alter table public.ai_query_logs    enable row level security;
alter table public.ai_cache         enable row level security;
alter table public.ai_daily_budget  enable row level security;

-- profiles: owner-only read/update; INSERT via trigger, DELETE via auth cascade
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- user_preferences: owner-only CRUD
create policy user_preferences_select_own on public.user_preferences
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_preferences_insert_own on public.user_preferences
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy user_preferences_update_own on public.user_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy user_preferences_delete_own on public.user_preferences
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- merchants: anyone may read active merchants
create policy merchants_select_active on public.merchants
  for select to anon, authenticated
  using (is_active);

-- categories: anyone may read active categories
create policy categories_select_active on public.categories
  for select to anon, authenticated
  using (is_active);

-- deals: anyone may read deals that are active, published, and still valid
create policy deals_select_public on public.deals
  for select to anon, authenticated
  using (
    is_active
    and published_at is not null
    and published_at <= now()
    and valid_until > now()
  );

-- deal_categories: piggyback on deals visibility
create policy deal_categories_select on public.deal_categories
  for select to anon, authenticated
  using (true);

-- favorites: owner-only CRUD
create policy favorites_select_own on public.favorites
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy favorites_insert_own on public.favorites
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy favorites_delete_own on public.favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- bookings: owner-only read + insert (no direct update — use cancel_booking())
create policy bookings_select_own on public.bookings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy bookings_insert_own on public.bookings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- ai_query_logs / ai_cache / ai_daily_budget: no policies = service_role only.


-- ----------------------------------------------------------------------------
-- 5. SECURITY-DEFINER FUNCTIONS (controlled mutations)
-- ----------------------------------------------------------------------------

-- Cancel a booking. Avoids permissive RLS UPDATE policy that could let users
-- mutate price / quantity / status to arbitrary values.
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller  uuid := (select auth.uid());
  v_result  public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.bookings
     set status = 'cancelled',
         updated_at = now()
   where id = p_booking_id
     and user_id = v_caller
     and status in ('confirmed','pending')
  returning * into v_result;

  if v_result is null then
    raise exception 'booking not found or not cancellable' using errcode = 'P0002';
  end if;

  return v_result;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;
