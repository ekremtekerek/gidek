-- Loyalty puan sistemi.
-- Her confirmed booking → +10 puan. Cancel'de geri çekilir (eğer
-- confirmed'dan iptal edildiyse). Profil sayfasında tier rozeti + ilerleme.
--
-- Tier eşikleri (UI'da gösterilir, DB'de hesaplama yok):
--   0-29:  Bronz
--   30-99: Gümüş
--   100+:  Altın

alter table public.profiles
  add column if not exists loyalty_points integer not null default 0
    check (loyalty_points >= 0);

-- confirm_booking_payment + cancel_booking RPC'lerini puan senkronize edecek
-- şekilde güncelle.

create or replace function public.confirm_booking_payment(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller  uuid := (select auth.uid());
  v_current public.bookings;
  v_result  public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_current
    from public.bookings
   where id = p_booking_id
     and user_id = v_caller;

  if v_current.id is null then
    raise exception 'booking not found' using errcode = 'P0002';
  end if;

  if v_current.status = 'confirmed' then
    return v_current;
  end if;

  if v_current.status <> 'pending' then
    raise exception 'booking not payable in status %', v_current.status
      using errcode = 'P0001';
  end if;

  update public.bookings
     set status = 'confirmed',
         updated_at = now()
   where id = p_booking_id
     and user_id = v_caller
     and status = 'pending'
  returning * into v_result;

  update public.deals
     set sold_count = sold_count + v_result.quantity
   where id = v_result.deal_id;

  if v_result.coupon_id is not null then
    update public.coupons
       set used_count = used_count + 1
     where id = v_result.coupon_id;
  end if;

  -- LOYALTY: +10 puan
  update public.profiles
     set loyalty_points = loyalty_points + 10
   where id = v_caller;

  return v_result;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller   uuid := (select auth.uid());
  v_prev_row public.bookings;
  v_result   public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_prev_row
    from public.bookings
   where id = p_booking_id
     and user_id = v_caller;

  update public.bookings
     set status = 'cancelled',
         updated_at = now()
   where id = p_booking_id
     and user_id = v_caller
     and status in ('confirmed','pending')
  returning * into v_result;

  if v_result.id is null then
    raise exception 'booking not found or not cancellable' using errcode = 'P0002';
  end if;

  if v_prev_row.status = 'confirmed' then
    update public.deals
       set sold_count = greatest(0, sold_count - v_result.quantity)
     where id = v_result.deal_id;

    if v_result.coupon_id is not null then
      update public.coupons
         set used_count = greatest(0, used_count - 1)
       where id = v_result.coupon_id;
    end if;

    -- LOYALTY: confirmed iptali → puan geri al (negatife düşmesin)
    update public.profiles
       set loyalty_points = greatest(0, loyalty_points - 10)
     where id = v_caller;
  end if;

  return v_result;
end;
$$;

-- Mevcut veriyi backfill — her aktif confirmed/used booking için 10 puan
update public.profiles p
   set loyalty_points = coalesce((
     select count(*) * 10
       from public.bookings b
      where b.user_id = p.id
        and b.status in ('confirmed','used')
   ), 0);
