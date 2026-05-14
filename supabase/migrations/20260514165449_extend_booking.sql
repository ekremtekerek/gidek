-- ============================================================================
-- extend_booking — mevcut rezervasyona +1 kişi ekleme
-- ============================================================================
--
-- Sadece pending VEYA confirmed booking için. quantity++, total_amount
-- yeniden hesaplanır (unit_price * new_quantity + insurance_fee).
-- Sigortalı booking için sigorta primi yüzde olarak kalır (%5 yeni subtotal).
-- Coupon discount korunmaz (extend == farklı bir transaction).
--
-- max_per_user kontrolü yapılır; geçilirse hata.

create or replace function public.extend_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller       uuid := (select auth.uid());
  v_current      public.bookings;
  v_deal         public.deals;
  v_new_qty      integer;
  v_new_subtotal numeric(10,2);
  v_new_insur    numeric(10,2);
  v_new_total    numeric(10,2);
  v_result       public.bookings;
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
  if v_current.status not in ('pending','confirmed') then
    raise exception 'booking not extendable in status %', v_current.status
      using errcode = 'P0001';
  end if;

  select * into v_deal
    from public.deals
   where id = v_current.deal_id;
  if v_deal.id is null then
    raise exception 'deal not found' using errcode = 'P0002';
  end if;

  v_new_qty := v_current.quantity + 1;
  if v_new_qty > v_deal.max_per_user then
    raise exception 'max_per_user_exceeded' using errcode = 'P0001';
  end if;

  v_new_subtotal := round(v_current.unit_price * v_new_qty, 2);
  v_new_insur := case when v_current.insurance_purchased
                      then round(v_new_subtotal * 0.05, 2)
                      else 0
                 end;
  v_new_total := v_new_subtotal + v_new_insur - coalesce(v_current.discount_amount, 0);
  if v_new_total < 0 then v_new_total := 0; end if;

  update public.bookings
     set quantity      = v_new_qty,
         total_amount  = v_new_total,
         insurance_fee = v_new_insur,
         updated_at    = now()
   where id = p_booking_id
     and user_id = v_caller
  returning * into v_result;

  -- Eğer status confirmed ise deals.sold_count'u da +1 yansıt
  if v_current.status = 'confirmed' then
    update public.deals
       set sold_count = sold_count + 1
     where id = v_current.deal_id;
  end if;

  return v_result;
end;
$$;

revoke all on function public.extend_booking(uuid) from public;
grant execute on function public.extend_booking(uuid) to authenticated;
