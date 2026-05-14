-- ============================================================================
-- follows — sosyal takip ilişkisi
-- ============================================================================
--
-- Bir kullanıcının başka public profilleri takip etmesi. Bidirectional değil
-- (Twitter modeli — takip ↦ tek yönlü). public profile dışındakiler takip
-- edilemez ama RPC bu kontrolü yapmıyor; UI'da gizli profiller takip butonu
-- göstermiyor → policy bunu zorlamıyor.

create table public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

create index follows_follower_idx on public.follows (follower_id, created_at desc);
create index follows_followee_idx on public.follows (followee_id, created_at desc);

alter table public.follows enable row level security;

-- Herkes follow ilişkilerini okuyabilir (profil sayfasında "x kişi takipte"
-- vb. göstermek için). User detayı yok, sadece ID'ler.
create policy "follows: read all"
  on public.follows
  for select
  to anon, authenticated
  using (true);

-- Kullanıcı yalnız kendi follow'unu yazabilir / silebilir.
create policy "follows: self insert"
  on public.follows
  for insert
  to authenticated
  with check (follower_id = (select auth.uid()));

create policy "follows: self delete"
  on public.follows
  for delete
  to authenticated
  using (follower_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- Profile takipçi/takip sayıları için view (kolay sorgulama).
-- ----------------------------------------------------------------------------

create or replace view public.profile_follow_counts
with (security_invoker = true)
as
select
  p.id as user_id,
  coalesce(
    (select count(*) from public.follows f where f.followee_id = p.id),
    0
  )::int as followers_count,
  coalesce(
    (select count(*) from public.follows f where f.follower_id = p.id),
    0
  )::int as following_count
from public.profiles p;

grant select on public.profile_follow_counts to anon, authenticated;
