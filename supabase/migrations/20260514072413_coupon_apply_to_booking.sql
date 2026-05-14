-- Kuponun ödeme sayfasında uygulanabilmesi için RPC'ler. bookings tablosunda
-- UPDATE RLS policy'si yok; security-definer fonksiyonlar sahibine ait
-- 'pending' kayıtlarda kupon ekler / çıkarır ve total_amount'u recalculate
-- eder. validate_coupon zaten code/sebep döndürüyor; burada onun çıktısını
-- kontrol edip raise exception ile aksiyona kullanıcı mesajı gönderiyoruz.

create or replace function public.apply_coupon_to_booking(
  p_booking_id uuid,
  p_code       text
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller   uuid := (select auth.uid());
  v_booking  public.bookings;
  v_subtotal numeric(10,2);
  v_v        record;
  v_result   public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     and user_id = v_caller;

  if v_booking.id is null then
    raise exception 'booking not found' using errcode = 'P0002';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'booking not editable' using errcode = 'P0001';
  end if;

  -- Subtotal her zaman orijinal birim fiyat × adet — daha önce uygulanmış
  -- kuponun etkisini geri alarak temiz hesaplıyoruz.
  v_subtotal := v_booking.unit_price * v_booking.quantity;

  select * into v_v
    from public.validate_coupon(p_code, v_subtotal);

  if v_v.reason <> 'ok' or v_v.coupon_id is null then
    -- Sebebi raise mesajına gömüyoruz; action katmanı Türkçe label'ı seçer.
    raise exception 'coupon_invalid:%', v_v.reason using errcode = 'P0001';
  end if;

  update public.bookings
     set coupon_id       = v_v.coupon_id,
         coupon_code     = upper(trim(p_code)),
         discount_amount = v_v.discount_amount,
         total_amount    = greatest(0, v_subtotal - v_v.discount_amount),
         updated_at      = now()
   where id = p_booking_id
     and user_id = v_caller
     and status = 'pending'
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.apply_coupon_to_booking(uuid, text) from public;
grant execute on function public.apply_coupon_to_booking(uuid, text) to authenticated;


create or replace function public.remove_coupon_from_booking(p_booking_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller   uuid := (select auth.uid());
  v_booking  public.bookings;
  v_subtotal numeric(10,2);
  v_result   public.bookings;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_booking
    from public.bookings
   where id = p_booking_id
     and user_id = v_caller;

  if v_booking.id is null then
    raise exception 'booking not found' using errcode = 'P0002';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'booking not editable' using errcode = 'P0001';
  end if;

  v_subtotal := v_booking.unit_price * v_booking.quantity;

  update public.bookings
     set coupon_id       = null,
         coupon_code     = null,
         discount_amount = 0,
         total_amount    = v_subtotal,
         updated_at      = now()
   where id = p_booking_id
     and user_id = v_caller
     and status = 'pending'
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.remove_coupon_from_booking(uuid) from public;
grant execute on function public.remove_coupon_from_booking(uuid) to authenticated;
