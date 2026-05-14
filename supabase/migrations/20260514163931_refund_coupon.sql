-- ============================================================================
-- refund coupon — confirmed booking iptal edince %50 iade kuponu
-- ============================================================================
--
-- V1 mock ödeme olduğu için gerçek nakit iadesi yok; bunun yerine ödenen
-- tutarın %50'si değerinde tek-kullanımlık fixed-amount kupon. 90 gün geçerli.
-- cancel_booking() RPC'sini bu davranışla güncelliyoruz.
--
-- pending → cancelled durumlarda kupon verilmez (ödeme yapılmadı).

-- booking → refund coupon eşlemesini takip için tablo (opsiyonel ama metadata için)
create table if not exists public.user_refund_coupons (
  booking_id   uuid primary key references public.bookings(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  coupon_code  text not null,
  refund_value numeric(10,2) not null,
  created_at   timestamptz not null default now()
);

create index user_refund_coupons_user_idx on public.user_refund_coupons (user_id);

alter table public.user_refund_coupons enable row level security;

create policy "refund_coupons: self read"
  on public.user_refund_coupons
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- cancel_booking — confirmed iptaller için iade kuponu da yarat.
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

    -- İade kuponu: ödenen tutarın %50'si, tek kullanım, 90 gün
    v_refund_value := round(coalesce(v_result.total_amount, 0) * 0.5, 2);
    if v_refund_value > 0 then
      v_refund_code := 'REFUND-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

      insert into public.coupons (
        code, description, discount_type, discount_value,
        min_order_amount, max_uses, valid_from, valid_until, is_active
      ) values (
        v_refund_code,
        'İptal iadesi — ' || v_refund_value || ' TL kredi',
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
