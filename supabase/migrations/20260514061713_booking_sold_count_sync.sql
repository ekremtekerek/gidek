-- bookings ↔ deals.sold_count senkronizasyonu.
--
-- 1) confirm_booking_payment: pending→confirmed gerçek transition'da
--    deals.sold_count'u quantity kadar artırır.
-- 2) cancel_booking: eğer iptal edilen kayıt 'confirmed' iseydi
--    sold_count'u quantity kadar geri alır ('pending' iptalinde dokunmaz).
-- 3) Mevcut DB için backfill — sold_count'u confirmed+used booking'lerin
--    quantity toplamından yeniden hesapla.

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

  -- pending → confirmed: sold_count'u quantity kadar artır.
  update public.deals
     set sold_count = sold_count + v_result.quantity
   where id = v_result.deal_id;

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
  v_caller     uuid := (select auth.uid());
  v_prev_row   public.bookings;
  v_result     public.bookings;
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

  -- confirmed → cancelled: sold_count'tan quantity'yi düş. pending iptalinde
  -- artırılmamıştı, dokunmuyoruz.
  if v_prev_row.status = 'confirmed' then
    update public.deals
       set sold_count = greatest(0, sold_count - v_result.quantity)
     where id = v_result.deal_id;
  end if;

  return v_result;
end;
$$;

-- Mevcut veriyi tek noktadan tutarlı hâle getir.
update public.deals d
   set sold_count = coalesce((
     select sum(b.quantity)::int
       from public.bookings b
      where b.deal_id = d.id
        and b.status in ('confirmed','used')
   ), 0);
