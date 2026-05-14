-- ============================================================================
-- event_messages — etkinlik bazlı canlı sohbet
-- ============================================================================
--
-- room_key = deal_id|date|time → aynı fırsata aynı tarih+saatte gelenler
-- aynı odada. RLS: sadece o etkinliğe confirmed/used booking'i olan kullanıcı
-- okuyabilir ve yazabilir.

create table public.event_messages (
  id          uuid primary key default gen_random_uuid(),
  room_key    text not null,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now()
);

create index event_messages_room_idx
  on public.event_messages (room_key, created_at desc);

alter table public.event_messages enable row level security;

-- ----------------------------------------------------------------------------
-- room_key kurucu: deal + date + time'ı stabil bir text'e çevirir.
-- ----------------------------------------------------------------------------

create or replace function public.build_event_room_key(
  p_deal_id uuid,
  p_date    date,
  p_time    time
) returns text
language sql
immutable
set search_path = ''
as $$
  select p_deal_id::text
      || '|' || coalesce(p_date::text, '')
      || '|' || coalesce(p_time::text, '');
$$;

-- ----------------------------------------------------------------------------
-- Helper: çağıran kullanıcı verilen room_key'e ait etkinliğe katılıyor mu?
-- bookings tablosunda confirmed/used + aynı koordinatlarda kayıt aranır.
-- ----------------------------------------------------------------------------

create or replace function public.user_can_access_event_room(p_room_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  if v_caller is null then return false; end if;
  return exists (
    select 1
      from public.bookings b
     where b.user_id = v_caller
       and b.status in ('confirmed','used')
       and public.build_event_room_key(b.deal_id, b.selected_date, b.selected_time)
           = p_room_key
  );
end;
$$;

revoke all on function public.user_can_access_event_room(text) from public;
grant execute on function public.user_can_access_event_room(text) to authenticated;

-- RLS policies: yalnızca odaya erişimi olan kullanıcı okuyabilir/yazabilir.
create policy "event_messages: read if in room"
  on public.event_messages
  for select
  to authenticated
  using (public.user_can_access_event_room(room_key));

create policy "event_messages: insert if in room"
  on public.event_messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.user_can_access_event_room(room_key)
  );

-- Kendi mesajını silebilir (UX için: yazılışta hata düzeltme yerine sil)
create policy "event_messages: self delete"
  on public.event_messages
  for delete
  to authenticated
  using (sender_id = (select auth.uid()));

-- Realtime broadcast — replication identity full ile diff gönder
alter table public.event_messages replica identity full;

-- supabase_realtime publication'a ekle (zaten varsa hata vermez)
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.event_messages;
    exception when duplicate_object then
      null;
    end;
  end if;
end$$;
