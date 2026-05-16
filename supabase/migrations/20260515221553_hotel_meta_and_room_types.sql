-- Tatil/otel deal'ları için detaylı meta + oda tipleri.
-- "Yıldız + check-in/out saati + tesis özellikleri + politikalar + vergi"
-- tarafını `deal_hotel_meta` (deal başına 1 satır), oda envanterini ise
-- `deal_room_types` (deal başına N satır) taşır. Booking wizard ve admin
-- otel CRUD bunu kullanır. Booking-side şema (check_in/out date, guest list)
-- bir sonraki migration'da gelir.

-- ---------------------------------------------------------------------------
-- A1) deal_hotel_meta — otel/tatil deal'ı için 1:1 meta satırı
-- ---------------------------------------------------------------------------
CREATE TABLE public.deal_hotel_meta (
  deal_id uuid PRIMARY KEY REFERENCES public.deals(id) ON DELETE CASCADE,

  -- Temel
  star_rating int CHECK (star_rating IS NULL OR (star_rating BETWEEN 1 AND 5)),
  check_in_time time NOT NULL DEFAULT '14:00',
  check_out_time time NOT NULL DEFAULT '12:00',
  concept text CHECK (concept IS NULL OR concept IN (
    'her-sey-dahil','ultra-her-sey-dahil','butik','tasarim-otel','aile-resort',
    'spa-otel','plaj-resort','doga-ici','eko-otel','bungalov','yayla-evi',
    'magara-otel','kayak-otel','dag-evi','aqua-park','gourmet','ekonomik',
    'ruzgar-sorfu','balon-manzarali','marina'
  )),

  -- Tesis özellikleri (amenities)
  has_beach_access boolean NOT NULL DEFAULT false,
  has_private_beach boolean NOT NULL DEFAULT false,
  has_pool boolean NOT NULL DEFAULT false,
  has_indoor_pool boolean NOT NULL DEFAULT false,
  has_spa boolean NOT NULL DEFAULT false,
  has_hamam boolean NOT NULL DEFAULT false,
  has_sauna boolean NOT NULL DEFAULT false,
  has_gym boolean NOT NULL DEFAULT false,
  has_aquapark boolean NOT NULL DEFAULT false,
  has_kids_club boolean NOT NULL DEFAULT false,
  has_kids_pool boolean NOT NULL DEFAULT false,
  has_restaurant boolean NOT NULL DEFAULT true,
  has_bar boolean NOT NULL DEFAULT false,
  has_room_service boolean NOT NULL DEFAULT false,
  has_parking boolean NOT NULL DEFAULT false,
  has_valet boolean NOT NULL DEFAULT false,
  has_wifi boolean NOT NULL DEFAULT true,
  has_aircon boolean NOT NULL DEFAULT true,
  has_breakfast boolean NOT NULL DEFAULT true,
  has_transfer boolean NOT NULL DEFAULT false,
  has_laundry boolean NOT NULL DEFAULT false,
  has_business_center boolean NOT NULL DEFAULT false,
  has_meeting_room boolean NOT NULL DEFAULT false,
  has_disabled_access boolean NOT NULL DEFAULT false,

  -- Politikalar
  pet_friendly boolean NOT NULL DEFAULT false,
  smoking_allowed boolean NOT NULL DEFAULT false,
  cancellation_policy text,
  child_policy text,
  pet_policy text,
  extra_bed_available boolean NOT NULL DEFAULT false,
  extra_bed_price numeric(10,2) CHECK (extra_bed_price IS NULL OR extra_bed_price >= 0),

  -- Mesafeler (sıralamada kullanılır)
  distance_to_beach_m int CHECK (distance_to_beach_m IS NULL OR distance_to_beach_m >= 0),
  distance_to_center_m int CHECK (distance_to_center_m IS NULL OR distance_to_center_m >= 0),
  distance_to_airport_km numeric(5,1) CHECK (distance_to_airport_km IS NULL OR distance_to_airport_km >= 0),

  -- Vergi/yasal
  tourism_tax_per_night numeric(10,2) NOT NULL DEFAULT 0 CHECK (tourism_tax_per_night >= 0),

  total_rooms int CHECK (total_rooms IS NULL OR total_rooms > 0),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.deal_hotel_meta IS
  'Otel/tatil deal''ları için detaylı meta (yıldız, check-in/out saati, tesis özellikleri, politikalar). Deal başına 1 satır.';

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_hotel_meta()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_hotel_meta_updated_at
  BEFORE UPDATE ON public.deal_hotel_meta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_hotel_meta();

-- ---------------------------------------------------------------------------
-- A2) deal_room_types — oda tipi envanteri (deal başına N satır)
-- ---------------------------------------------------------------------------
CREATE TABLE public.deal_room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,

  name text NOT NULL,
  description text,

  -- Kapasite
  capacity_adults int NOT NULL DEFAULT 2 CHECK (capacity_adults > 0 AND capacity_adults <= 12),
  capacity_children int NOT NULL DEFAULT 0 CHECK (capacity_children >= 0 AND capacity_children <= 8),

  -- Yatak ve oda detay
  bed_setup text,
  size_sqm int CHECK (size_sqm IS NULL OR size_sqm > 0),
  view_type text CHECK (view_type IS NULL OR view_type IN (
    'deniz','bahce','havuz','dag','sehir','park','ic-bahce','manzara-yok'
  )),

  -- Oda özellikleri
  has_balcony boolean NOT NULL DEFAULT false,
  has_jacuzzi boolean NOT NULL DEFAULT false,
  has_kitchenette boolean NOT NULL DEFAULT false,
  has_minibar boolean NOT NULL DEFAULT false,
  has_safe boolean NOT NULL DEFAULT false,
  has_tv boolean NOT NULL DEFAULT true,

  -- Fiyat & pansiyon
  base_price_per_night numeric(10,2) NOT NULL CHECK (base_price_per_night > 0),
  board_basis text NOT NULL DEFAULT 'oda-kahvalti' CHECK (board_basis IN (
    'oda','oda-kahvalti','yarim-pansiyon','tam-pansiyon','her-sey-dahil','ultra-her-sey-dahil'
  )),

  total_units int CHECK (total_units IS NULL OR total_units > 0),

  cover_image text,
  images text[] NOT NULL DEFAULT ARRAY[]::text[],

  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.deal_room_types IS
  'Otel/tatil deal''larında satılan oda tipleri. Booking sırasında misafir bunlardan birini seçer.';

CREATE INDEX deal_room_types_deal_idx ON public.deal_room_types(deal_id);
CREATE INDEX deal_room_types_active_idx ON public.deal_room_types(deal_id) WHERE is_active = true;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_room_types()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_room_types_updated_at
  BEFORE UPDATE ON public.deal_room_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_room_types();

-- ---------------------------------------------------------------------------
-- RLS — public read (deal görünüyorsa meta/oda da görünür), admin write
-- ---------------------------------------------------------------------------
ALTER TABLE public.deal_hotel_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_room_types ENABLE ROW LEVEL SECURITY;

-- Public SELECT — yalnızca deal published_at not null AND published_at <= now()
CREATE POLICY hotel_meta_select_public
  ON public.deal_hotel_meta FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_hotel_meta.deal_id
        AND d.published_at IS NOT NULL
        AND d.published_at <= now()
    )
  );

CREATE POLICY room_types_select_public
  ON public.deal_room_types FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = deal_room_types.deal_id
        AND d.published_at IS NOT NULL
        AND d.published_at <= now()
    )
  );

-- Admin (app_metadata.role = 'admin') tüm CRUD
CREATE POLICY hotel_meta_admin_all
  ON public.deal_hotel_meta FOR ALL
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  )
  WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  );

CREATE POLICY room_types_admin_all
  ON public.deal_room_types FOR ALL
  USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  )
  WITH CHECK (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'admin'
  );

-- Merchant kullanıcısı kendi deal'larının meta/odasını yönetebilir
CREATE POLICY hotel_meta_merchant_all
  ON public.deal_hotel_meta FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.profiles p ON p.merchant_id = d.merchant_id
      WHERE d.id = deal_hotel_meta.deal_id
        AND p.id = (SELECT auth.uid())
        AND p.merchant_id IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.profiles p ON p.merchant_id = d.merchant_id
      WHERE d.id = deal_hotel_meta.deal_id
        AND p.id = (SELECT auth.uid())
        AND p.merchant_id IS NOT NULL
    )
  );

CREATE POLICY room_types_merchant_all
  ON public.deal_room_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.profiles p ON p.merchant_id = d.merchant_id
      WHERE d.id = deal_room_types.deal_id
        AND p.id = (SELECT auth.uid())
        AND p.merchant_id IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deals d
      JOIN public.profiles p ON p.merchant_id = d.merchant_id
      WHERE d.id = deal_room_types.deal_id
        AND p.id = (SELECT auth.uid())
        AND p.merchant_id IS NOT NULL
    )
  );
