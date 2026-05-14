-- ============================================================================
-- bookings.insurance_purchased — iptal sigortası
-- ============================================================================
--
-- Opt-in: kullanıcı rezervasyon esnasında %5'lik bir prim ödeyerek iptal
-- sigortası alır. Bu durumda confirmed booking iptal edildiğinde %100 iade
-- kuponu verilir (sigortasız %50 yerine).
--
-- insurance_fee booking total_amount'a dahildir.

alter table public.bookings
  add column if not exists insurance_purchased boolean not null default false,
  add column if not exists insurance_fee numeric(10,2) not null default 0
    check (insurance_fee >= 0);

-- ----------------------------------------------------------------------------
-- cancel_booking — sigortalı ise %100 iade, değilse %50
-- ----------------------------------------------------------------------------

create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller        uuid := (select auth.uid());
  v_prev_row      public.bookings;
  v_result        public.bookings;
  v_refund_pct    numeric;
  v_refund_value  numeric(10,2);
  v_refund_code   text;
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

    update public.profiles
       set loyalty_points = greatest(0, loyalty_points - 10)
     where id = v_caller;

    -- Sigortalı ise %100, değilse %50 iade kuponu
    v_refund_pct := case when v_result.insurance_purchased then 1.0 else 0.5 end;
    v_refund_value := round(coalesce(v_result.total_amount, 0) * v_refund_pct, 2);
    if v_refund_value > 0 then
      v_refund_code := 'REFUND-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

      insert into public.coupons (
        code, description, discount_type, discount_value,
        min_order_amount, max_uses, valid_from, valid_until, is_active
      ) values (
        v_refund_code,
        case when v_result.insurance_purchased
             then 'Sigortalı iptal iadesi — ' || v_refund_value || ' TL kredi'
             else 'İptal iadesi — ' || v_refund_value || ' TL kredi'
        end,
        'fixed', v_refund_value,
        0, 1,
        now(), now() + interval '90 days',
        true
      );

      insert into public.user_refund_coupons (booking_id, user_id, coupon_code, refund_value)
        values (v_result.id, v_caller, v_refund_code, v_refund_value);
    end if;
  end if;

  return v_result;
end;
$$;
