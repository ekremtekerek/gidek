-- Booking üzerinde kupon kodunu denormalize et — kullanıcı booking detayında
-- "Kupon: ABC" yazısını görebilsin diye. coupons tablosu RLS'siz okumaya
-- kapalı (private staff kodları sızmasın); bu sayede ek policy gerekmez.

alter table public.bookings
  add column if not exists coupon_code text;
