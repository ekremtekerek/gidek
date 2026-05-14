-- ============================================================================
-- profiles.share_attendance — etkinlik katılımcı listesinde görünmek
-- ============================================================================
--
-- Kullanıcı opt-in ile başkalarının "aynı etkinlikteyim" listesinde
-- görünmesine izin verir. Default false → gizlilik öncelikli.

alter table public.profiles
  add column if not exists share_attendance boolean not null default false;

-- ----------------------------------------------------------------------------
-- attendees_for_booking — verilen rezervasyon koordinatlarında (deal +
-- selected_date + selected_time) opt-in olan diğer kullanıcıları döner.
-- Çağıran user bu rezervasyona sahip olmak zorunda — auth.uid() kontrolü.
-- ----------------------------------------------------------------------------

create or replace function public.attendees_for_booking(p_booking_code text)
returns table (
  user_id      uuid,
  public_slug  text,
  display_name text,
  avatar_url   text,
  quantity     int
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_me     public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_me
    from public.bookings
   where booking_code = p_booking_code
     and user_id = v_caller;
  if v_me.id is null then
    raise exception 'booking not found' using errcode = 'P0002';
  end if;
  if v_me.status not in ('confirmed','used') then
    return;
  end if;

  return query
    select b.user_id,
           p.public_slug,
           p.display_name,
           p.avatar_url,
           b.quantity
      from public.bookings b
      join public.profiles p on p.id = b.user_id
     where b.deal_id        = v_me.deal_id
       and b.selected_date is not distinct from v_me.selected_date
       and b.selected_time is not distinct from v_me.selected_time
       and b.status         in ('confirmed','used')
       and b.user_id        <> v_caller
       and p.share_attendance = true
       and p.is_public        = true
       and p.public_slug     is not null;
end;
$$;

revoke all on function public.attendees_for_booking(text) from public;
grant execute on function public.attendees_for_booking(text) to authenticated;
