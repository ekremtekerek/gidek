-- Yorum derinleştirici: fotoğraflar + nested cevaplar
-- ============================================================================

-- 1) review_photos — bir yoruma ekli görseller
create table public.review_photos (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  url         text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index review_photos_review_idx on public.review_photos (review_id, sort_order);

alter table public.review_photos enable row level security;

-- Aktif yorumun fotoğrafları herkese açık (review zaten public select)
create policy review_photos_select_active on public.review_photos
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.reviews r
       where r.id = review_id and r.is_active
    )
  );

-- Kullanıcı kendi yorumuna foto ekleyebilir
create policy review_photos_insert_own on public.review_photos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.reviews r
       where r.id = review_id
         and r.user_id = (select auth.uid())
    )
  );

create policy review_photos_delete_own on public.review_photos
  for delete to authenticated
  using (
    exists (
      select 1 from public.reviews r
       where r.id = review_id
         and r.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 2) review_replies — yoruma cevap (merchant veya kullanıcı)
-- ============================================================================

create table public.review_replies (
  id                uuid primary key default gen_random_uuid(),
  review_id         uuid not null references public.reviews(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete set null,
  /** Merchant cevabı mı? UI'da rozetle gösterilir. */
  is_merchant_reply boolean not null default false,
  display_name      text not null check (char_length(display_name) between 2 and 80),
  body              text not null check (char_length(body) between 2 and 500),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index review_replies_review_idx on public.review_replies (review_id, created_at);

create trigger review_replies_set_updated_at
  before update on public.review_replies
  for each row execute function public.set_updated_at();

alter table public.review_replies enable row level security;

create policy review_replies_select_active on public.review_replies
  for select to anon, authenticated
  using (is_active);

create policy review_replies_insert_auth on public.review_replies
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy review_replies_update_own on public.review_replies
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy review_replies_delete_own on public.review_replies
  for delete to authenticated
  using (user_id = (select auth.uid()));
