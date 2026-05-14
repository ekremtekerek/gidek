-- public.confirm_booking_payment
--
-- Mock ödeme akışı için security-definer RPC. bookings tablosunda doğrudan
-- UPDATE RLS policy'si yok (yetki dar tutulmuş — bkz. cancel_booking deseni).
-- Bu fonksiyon, sahibine ait 'pending' bir rezervasyonu 'confirmed' durumuna
-- yükseltir ve güncellenmiş satırı döndürür. Idempotent: 'confirmed' kayıt
-- üzerinde tekrar çağrılırsa mevcut satırı döner; 'cancelled' / 'used'
-- üzerinde exception atar.

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

  return v_result;
end;
$$;

revoke all on function public.confirm_booking_payment(uuid) from public;
grant execute on function public.confirm_booking_payment(uuid) to authenticated;
