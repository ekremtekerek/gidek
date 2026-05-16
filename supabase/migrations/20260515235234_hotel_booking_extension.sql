-- Otel rezervasyonu için bookings tablosunu zenginleştir + misafir bilgileri
-- tablosu ekle. Mevcut etkinlik/aktivite booking'leri etkilenmez — tüm yeni
-- alanlar nullable, varsayılan davranış değişmez.
--
-- Mevzuat notu: konaklama yapan her yetişkin için kimlik bilgisi alınır
-- (KVKK + Konaklama Tesisleri Yönetmeliği). Yabancılar için pasaport zorunlu,
-- TC vatandaşları için 11 hane TC kimlik. Çocuklarda kimlik opsiyonel ama
-- doğum tarihi zorunlu (çocuk politikası ve kapasite hesabı için).

-- ---------------------------------------------------------------------------
-- 1) bookings'i otel için genişlet
-- ---------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN check_in_date date,
  ADD COLUMN check_out_date date,
  ADD COLUMN nights int CHECK (nights IS NULL OR nights > 0),
  ADD COLUMN adult_count int CHECK (adult_count IS NULL OR adult_count > 0),
  ADD COLUMN child_count int CHECK (child_count IS NULL OR child_count >= 0),
  ADD COLUMN room_type_id uuid REFERENCES public.deal_room_types(id) ON DELETE SET NULL,
  ADD COLUMN board_basis text CHECK (board_basis IS NULL OR board_basis IN (
    'oda','oda-kahvalti','yarim-pansiyon','tam-pansiyon','her-sey-dahil','ultra-her-sey-dahil'
  )),
  ADD COLUMN tourism_tax_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (tourism_tax_total >= 0);

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_hotel_date_range_check CHECK (
    (check_in_date IS NULL AND check_out_date IS NULL)
    OR (check_in_date IS NOT NULL AND check_out_date IS NOT NULL AND check_out_date > check_in_date)
  );

COMMENT ON COLUMN public.bookings.check_in_date IS
  'Otel rezervasyonlarında giriş tarihi. Etkinlik rezervasyonlarında null.';
COMMENT ON COLUMN public.bookings.room_type_id IS
  'Otel rezervasyonlarında seçilen oda tipi. Etkinliklerde null.';
COMMENT ON COLUMN public.bookings.tourism_tax_total IS
  'Hesaplanmış konaklama vergisi toplamı (tüm geceler için).';

-- ---------------------------------------------------------------------------
-- 2) booking_guests — misafir kimlik bilgileri (mevzuat zorunlu)
-- ---------------------------------------------------------------------------
CREATE TABLE public.booking_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  guest_type text NOT NULL CHECK (guest_type IN ('adult', 'child')),
  guest_index int NOT NULL CHECK (guest_index >= 0),

  -- Kimlik
  first_name text NOT NULL CHECK (length(first_name) BETWEEN 2 AND 80),
  last_name text NOT NULL CHECK (length(last_name) BETWEEN 2 AND 80),
  national_id text CHECK (national_id IS NULL OR national_id ~ '^[0-9]{11}$'),
  passport_no text CHECK (passport_no IS NULL OR length(passport_no) BETWEEN 4 AND 20),
  nationality text NOT NULL DEFAULT 'TR' CHECK (length(nationality) = 2),
  birth_date date NOT NULL,
  gender text CHECK (gender IS NULL OR gender IN ('M', 'F', 'other')),

  -- İletişim (yalnızca lead guest için doldurulur genelde)
  phone text CHECK (phone IS NULL OR length(phone) BETWEEN 7 AND 30),
  email text CHECK (email IS NULL OR email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  is_lead boolean NOT NULL DEFAULT false,
  room_index int CHECK (room_index IS NULL OR room_index >= 0),

  special_requests text CHECK (special_requests IS NULL OR length(special_requests) <= 500),

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Yetişkin Türk vatandaşıysa TC kimlik zorunlu (yabancılar pasaport)
  CONSTRAINT booking_guests_adult_id_required CHECK (
    guest_type = 'child'
    OR (nationality = 'TR' AND national_id IS NOT NULL)
    OR (nationality <> 'TR' AND passport_no IS NOT NULL)
  )
);

COMMENT ON TABLE public.booking_guests IS
  'Otel rezervasyonlarında konaklayan her misafirin kimlik ve iletişim bilgisi. KVKK kapsamında saklanır.';

CREATE INDEX booking_guests_booking_idx ON public.booking_guests(booking_id);

-- Her booking'de tam olarak 1 lead guest
CREATE UNIQUE INDEX booking_guests_lead_unique
  ON public.booking_guests(booking_id) WHERE is_lead = true;

-- Aynı booking içinde aynı index tekrarlanmasın
CREATE UNIQUE INDEX booking_guests_unique_index
  ON public.booking_guests(booking_id, guest_type, guest_index);

-- ---------------------------------------------------------------------------
-- RLS — misafir bilgileri sadece booking sahibi + admin
-- ---------------------------------------------------------------------------
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_guests_select_own
  ON public.booking_guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_guests.booking_id
        AND b.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY booking_guests_insert_own
  ON public.booking_guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_guests.booking_id
        AND b.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY booking_guests_update_own
  ON public.booking_guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_guests.booking_id
        AND b.user_id = (SELECT auth.uid())
        AND b.status IN ('pending','confirmed')
    )
  );

CREATE POLICY booking_guests_admin_all
  ON public.booking_guests FOR ALL
  USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin')
  WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin');

-- Merchant (otel sahibi) kendi otelinde konaklayanları görebilir
CREATE POLICY booking_guests_merchant_select
  ON public.booking_guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.deals d ON d.id = b.deal_id
      JOIN public.profiles p ON p.merchant_id = d.merchant_id
      WHERE b.id = booking_guests.booking_id
        AND p.id = (SELECT auth.uid())
        AND p.merchant_id IS NOT NULL
    )
  );
