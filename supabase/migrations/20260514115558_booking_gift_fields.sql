-- Hediye akışı: bir kullanıcı kendi adına değil başka birine fırsat
-- rezerve edebilir. Alıcı bilgileri zaten var olan guest_name/email/phone
-- alanlarına yazılır; ek olarak is_gift bayrağı + kişisel mesaj.

alter table public.bookings
  add column if not exists is_gift boolean not null default false,
  add column if not exists gift_message text;
