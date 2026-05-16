'use client';

import { useActionState, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveHotelAction, type HotelFormState } from '@/app/admin/oteller/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AUDIENCE, DEAL_TAGS, MAIN_CATEGORIES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

// Bu constant'lar actions.ts'den re-export ediliyor; tarafımıza UI tarafından
// bağlanır. Tip için sabit liste şart.
const CONCEPTS = [
  'her-sey-dahil','ultra-her-sey-dahil','butik','tasarim-otel','aile-resort',
  'spa-otel','plaj-resort','doga-ici','eko-otel','bungalov','yayla-evi',
  'magara-otel','kayak-otel','dag-evi','aqua-park','gourmet','ekonomik',
  'ruzgar-sorfu','balon-manzarali','marina',
] as const;
type Concept = (typeof CONCEPTS)[number];

const VIEW_TYPES = [
  'deniz','bahce','havuz','dag','sehir','park','ic-bahce','manzara-yok',
] as const;
type ViewType = (typeof VIEW_TYPES)[number];

const BOARD_BASIS = [
  'oda','oda-kahvalti','yarim-pansiyon','tam-pansiyon','her-sey-dahil','ultra-her-sey-dahil',
] as const;
type BoardBasis = (typeof BOARD_BASIS)[number];

const AMENITIES: Array<{ key: string; label: string; group: string }> = [
  // Plaj & havuz
  { key: 'has_beach_access', label: 'Plaja erişim', group: 'Plaj & Havuz' },
  { key: 'has_private_beach', label: 'Özel plaj', group: 'Plaj & Havuz' },
  { key: 'has_pool', label: 'Açık havuz', group: 'Plaj & Havuz' },
  { key: 'has_indoor_pool', label: 'Kapalı havuz', group: 'Plaj & Havuz' },
  { key: 'has_aquapark', label: 'Aquapark', group: 'Plaj & Havuz' },
  { key: 'has_kids_pool', label: 'Çocuk havuzu', group: 'Plaj & Havuz' },
  // Spa & wellness
  { key: 'has_spa', label: 'Spa', group: 'Spa & Wellness' },
  { key: 'has_hamam', label: 'Hamam', group: 'Spa & Wellness' },
  { key: 'has_sauna', label: 'Sauna', group: 'Spa & Wellness' },
  { key: 'has_gym', label: 'Fitness / spor salonu', group: 'Spa & Wellness' },
  // Yeme-içme
  { key: 'has_restaurant', label: 'Restoran', group: 'Yeme-içme' },
  { key: 'has_bar', label: 'Bar', group: 'Yeme-içme' },
  { key: 'has_room_service', label: 'Oda servisi', group: 'Yeme-içme' },
  { key: 'has_breakfast', label: 'Kahvaltı dahil', group: 'Yeme-içme' },
  // Aile
  { key: 'has_kids_club', label: 'Çocuk kulübü', group: 'Aile' },
  // Hizmet & ulaşım
  { key: 'has_parking', label: 'Otopark', group: 'Hizmet & Ulaşım' },
  { key: 'has_valet', label: 'Vale', group: 'Hizmet & Ulaşım' },
  { key: 'has_transfer', label: 'Havalimanı transferi', group: 'Hizmet & Ulaşım' },
  { key: 'has_laundry', label: 'Çamaşırhane', group: 'Hizmet & Ulaşım' },
  // İş
  { key: 'has_business_center', label: 'Business center', group: 'İş' },
  { key: 'has_meeting_room', label: 'Toplantı salonu', group: 'İş' },
  // Genel
  { key: 'has_wifi', label: 'Wi-Fi', group: 'Genel' },
  { key: 'has_aircon', label: 'Klima', group: 'Genel' },
  { key: 'has_disabled_access', label: 'Engelli erişimi', group: 'Genel' },
];

type Room = {
  id?: string;
  name: string;
  description: string;
  capacity_adults: number;
  capacity_children: number;
  bed_setup: string;
  size_sqm: string; // input string
  view_type: ViewType | '';
  base_price_per_night: number;
  board_basis: BoardBasis;
  total_units: string;
  cover_image: string;
  sort_order: number;
  is_active: boolean;
  has_balcony: boolean;
  has_jacuzzi: boolean;
  has_kitchenette: boolean;
  has_minibar: boolean;
  has_safe: boolean;
  has_tv: boolean;
};

function emptyRoom(): Room {
  return {
    name: 'Standart Oda',
    description: '',
    capacity_adults: 2,
    capacity_children: 0,
    bed_setup: 'Fransız yatak',
    size_sqm: '',
    view_type: '',
    base_price_per_night: 2000,
    board_basis: 'oda-kahvalti',
    total_units: '',
    cover_image: '',
    sort_order: 0,
    is_active: true,
    has_balcony: false,
    has_jacuzzi: false,
    has_kitchenette: false,
    has_minibar: false,
    has_safe: false,
    has_tv: true,
  };
}

type Amenities = Record<string, boolean>;

type HotelInitial = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  merchant_id: string;
  categories: string[];
  cover_image: string;
  images: string[];
  original_price: number;
  discounted_price: number;
  city: string;
  district: string | null;
  valid_from: string;
  valid_until: string;
  max_per_user: number;
  tags: string[];
  audience: string[];
  highlights: string[];
  is_active: boolean;
  is_featured: boolean;
  published_at: string | null;
  // Meta
  star_rating: number | null;
  check_in_time: string;
  check_out_time: string;
  concept: Concept | null;
  pet_friendly: boolean;
  smoking_allowed: boolean;
  cancellation_policy: string | null;
  child_policy: string | null;
  pet_policy: string | null;
  extra_bed_available: boolean;
  extra_bed_price: number | null;
  distance_to_beach_m: number | null;
  distance_to_center_m: number | null;
  distance_to_airport_km: number | null;
  tourism_tax_per_night: number;
  total_rooms: number | null;
  amenities: Amenities;
  rooms: Room[];
};

interface Props {
  merchants: Array<{ id: string; name: string; city: string | null; district: string | null }>;
  initial?: HotelInitial;
}

function toDateTimeLocal(iso: string | null | undefined, fallback: () => string): string {
  if (!iso) return fallback();
  return new Date(iso).toISOString().slice(0, 16);
}

export function HotelForm({ merchants, initial }: Props) {
  const editing = Boolean(initial);
  const [state, formAction, pending] = useActionState<HotelFormState, FormData>(
    saveHotelAction,
    null,
  );

  const [city, setCity] = useState(initial?.city ?? 'Muğla');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(initial?.categories ?? ['tatil-otelleri']),
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(initial?.tags ?? []));
  const [selectedAudience, setSelectedAudience] = useState<Set<string>>(
    new Set(initial?.audience ?? ['couple', 'family']),
  );
  const [amenities, setAmenities] = useState<Amenities>(() => {
    const init: Amenities = {};
    for (const a of AMENITIES) {
      init[a.key] = initial?.amenities?.[a.key] ?? (a.key === 'has_wifi' || a.key === 'has_aircon');
    }
    return init;
  });
  const [rooms, setRooms] = useState<Room[]>(initial?.rooms ?? [emptyRoom()]);
  const [extraImages, setExtraImages] = useState<string[]>(
    initial?.images?.filter((u) => u !== initial?.cover_image) ?? [],
  );

  const err = state?.fieldErrors;
  const formError = state?.error;

  const groupedAmenities = useMemo(() => {
    const map = new Map<string, typeof AMENITIES>();
    for (const a of AMENITIES) {
      const arr = map.get(a.group) ?? [];
      arr.push(a);
      map.set(a.group, arr);
    }
    return [...map.entries()];
  }, []);

  function onMerchantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = merchants.find((x) => x.id === e.target.value);
    if (!m) return;
    if (m.city) setCity(m.city);
    if (m.district) setDistrict(m.district);
  }

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function updateRoom(idx: number, patch: Partial<Room>) {
    setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRoom(idx: number) {
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  }
  function addRoom() {
    setRooms((prev) => [...prev, { ...emptyRoom(), sort_order: prev.length }]);
  }

  const [todayLocal] = useState(() => new Date().toISOString().slice(0, 16));
  const [ninetyDays] = useState(() =>
    new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 16),
  );

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="rooms_json" value={JSON.stringify(rooms)} />

      {/* ---------------- TEMEL ---------------- */}
      <Section title="Temel bilgiler" description="Liste ve detay sayfasında görünen ana içerik">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="İşletme (Merchant)" error={err?.merchant_id?.[0]}>
            <select
              name="merchant_id"
              required
              defaultValue={initial?.merchant_id ?? ''}
              onChange={onMerchantChange}
              className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">— işletme seç —</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.city ? `· ${m.city}` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Başlık" error={err?.title?.[0]}>
            <Input
              name="title"
              type="text"
              required
              maxLength={200}
              defaultValue={initial?.title ?? ''}
              placeholder="Yalıkavak · 3 Gece Her Şey Dahil · Deniz Manzaralı Suite"
            />
          </Field>
        </div>

        <Field label="Alt başlık (opsiyonel)" error={err?.subtitle?.[0]}>
          <Input
            name="subtitle"
            type="text"
            maxLength={200}
            defaultValue={initial?.subtitle ?? ''}
            placeholder="3 gece konaklama · Her Şey Dahil · Aile Suit"
          />
        </Field>

        <Field label="Açıklama" error={err?.description?.[0]}>
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={5000}
            rows={4}
            defaultValue={initial?.description ?? ''}
            className="border-border bg-background w-full rounded-md border p-3 text-sm"
            placeholder="Otelin konsepti, manzarası, plaj/havuz, restoran, etkinlikler…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Şehir" error={err?.city?.[0]}>
            <Input
              name="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={50}
            />
          </Field>
          <Field label="İlçe / Bölge">
            <Input
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              maxLength={50}
              placeholder="Yalıkavak"
            />
          </Field>
          <Field label="Paket fiyatı (varsayılan)" error={err?.discounted_price?.[0]}>
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="original_price"
                type="number"
                step="1"
                min={0}
                required
                defaultValue={initial?.original_price ?? 5000}
                placeholder="Orijinal"
              />
              <Input
                name="discounted_price"
                type="number"
                step="1"
                min={0}
                required
                defaultValue={initial?.discounted_price ?? 3500}
                placeholder="İndirimli"
              />
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Geçerli başlangıç" error={err?.valid_from?.[0]}>
            <input
              type="datetime-local"
              name="valid_from"
              required
              defaultValue={toDateTimeLocal(initial?.valid_from, () => todayLocal)}
              className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
            />
          </Field>
          <Field label="Geçerli bitiş" error={err?.valid_until?.[0]}>
            <input
              type="datetime-local"
              name="valid_until"
              required
              defaultValue={toDateTimeLocal(initial?.valid_until, () => ninetyDays)}
              className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
            />
          </Field>
        </div>

        <Field label="Kapak görseli (URL)" error={err?.cover_image?.[0]}>
          <Input
            name="cover_image"
            type="url"
            required
            defaultValue={initial?.cover_image ?? ''}
            placeholder="https://…"
          />
        </Field>

        <Field label="Ek görseller (URL, satır başına 1 — max 7)">
          <textarea
            rows={3}
            value={extraImages.join('\n')}
            onChange={(e) => setExtraImages(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 7))}
            className="border-border bg-background w-full rounded-md border p-3 text-sm"
            placeholder={'https://…\nhttps://…'}
          />
          {extraImages.map((url) => (
            <input key={url} type="hidden" name="images[]" value={url} />
          ))}
        </Field>

        <Field label="Kategoriler" error={err?.categories?.[0]}>
          <div className="flex flex-wrap gap-2">
            {MAIN_CATEGORIES.map((c) => (
              <ChipToggle
                key={c.slug}
                active={selectedCategories.has(c.slug)}
                onClick={() => toggleSet(setSelectedCategories, c.slug)}
                label={c.name}
              />
            ))}
          </div>
          {[...selectedCategories].map((c) => (
            <input key={c} type="hidden" name="categories[]" value={c} />
          ))}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hedef kitle">
            <div className="flex flex-wrap gap-2">
              {AUDIENCE.map((a) => (
                <ChipToggle
                  key={a.slug}
                  active={selectedAudience.has(a.slug)}
                  onClick={() => toggleSet(setSelectedAudience, a.slug)}
                  label={a.label}
                />
              ))}
            </div>
            {[...selectedAudience].map((a) => (
              <input key={a} type="hidden" name="audience[]" value={a} />
            ))}
          </Field>
          <Field label="Etiketler">
            <div className="flex flex-wrap gap-2">
              {DEAL_TAGS.slice(0, 20).map((t) => (
                <ChipToggle
                  key={t.slug}
                  active={selectedTags.has(t.slug)}
                  onClick={() => toggleSet(setSelectedTags, t.slug)}
                  label={t.label}
                />
              ))}
            </div>
            {[...selectedTags].map((t) => (
              <input key={t} type="hidden" name="tags[]" value={t} />
            ))}
          </Field>
        </div>

        <Field label="Vurgular (satır başına 1)">
          <textarea
            name="highlights"
            rows={3}
            maxLength={2000}
            defaultValue={initial?.highlights?.join('\n') ?? ''}
            className="border-border bg-background w-full rounded-md border p-3 text-sm"
            placeholder={'3 gece konaklama\nHer Şey Dahil\nDeniz manzaralı oda'}
          />
        </Field>

        <div className="flex flex-wrap gap-4">
          <CheckboxLabel name="is_active" label="Aktif" defaultChecked={initial?.is_active ?? true} />
          <CheckboxLabel name="is_featured" label="Öne çıkan" defaultChecked={initial?.is_featured ?? false} />
          <CheckboxLabel
            name="published_now"
            label="Şimdi yayında"
            defaultChecked={initial ? Boolean(initial.published_at) : true}
          />
        </div>

        <Field label="Max alım (kullanıcı başına)">
          <Input
            name="max_per_user"
            type="number"
            min={1}
            max={50}
            defaultValue={initial?.max_per_user ?? 4}
          />
        </Field>
      </Section>

      {/* ---------------- OTEL META ---------------- */}
      <Section title="Otel meta" description="Yıldız, check-in/out, konsept">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Yıldız (1-5)">
            <select
              name="star_rating"
              defaultValue={initial?.star_rating ?? ''}
              className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">—</option>
              <option value="1">★</option>
              <option value="2">★★</option>
              <option value="3">★★★</option>
              <option value="4">★★★★</option>
              <option value="5">★★★★★</option>
            </select>
          </Field>
          <Field label="Check-in saat">
            <input
              type="time"
              name="check_in_time"
              defaultValue={initial?.check_in_time ?? '14:00'}
              className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
            />
          </Field>
          <Field label="Check-out saat">
            <input
              type="time"
              name="check_out_time"
              defaultValue={initial?.check_out_time ?? '12:00'}
              className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
            />
          </Field>
          <Field label="Toplam oda sayısı">
            <Input
              name="total_rooms"
              type="number"
              min={1}
              defaultValue={initial?.total_rooms ?? ''}
              placeholder="Örn. 120"
            />
          </Field>
        </div>

        <Field label="Konsept">
          <select
            name="concept"
            defaultValue={initial?.concept ?? ''}
            className="border-border bg-background h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">— seç —</option>
            {CONCEPTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Plaja mesafe (m)">
            <Input
              name="distance_to_beach_m"
              type="number"
              min={0}
              defaultValue={initial?.distance_to_beach_m ?? ''}
            />
          </Field>
          <Field label="Şehir merkezine (m)">
            <Input
              name="distance_to_center_m"
              type="number"
              min={0}
              defaultValue={initial?.distance_to_center_m ?? ''}
            />
          </Field>
          <Field label="Havalimanına (km)">
            <Input
              name="distance_to_airport_km"
              type="number"
              step="0.1"
              min={0}
              defaultValue={initial?.distance_to_airport_km ?? ''}
            />
          </Field>
        </div>

        <Field label="Konaklama Vergisi (TL/gece)">
          <Input
            name="tourism_tax_per_night"
            type="number"
            step="0.01"
            min={0}
            defaultValue={initial?.tourism_tax_per_night ?? 0}
          />
        </Field>
      </Section>

      {/* ---------------- AMENITIES ---------------- */}
      <Section title="Tesis özellikleri" description="Filtreleme ve detay sayfasında listelenir">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groupedAmenities.map(([group, items]) => (
            <div key={group} className="border-border bg-muted/20 rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {group}
              </p>
              <div className="flex flex-col gap-1.5">
                {items.map((a) => (
                  <label key={a.key} className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={a.key}
                      checked={amenities[a.key] ?? false}
                      onChange={(e) =>
                        setAmenities((prev) => ({ ...prev, [a.key]: e.target.checked }))
                      }
                      className="accent-foreground size-4"
                    />
                    <span>{a.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- POLITIKALAR ---------------- */}
      <Section title="Politikalar" description="İptal, çocuk, evcil hayvan koşulları">
        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxLabel
            name="pet_friendly"
            label="Evcil hayvan kabul ediliyor"
            defaultChecked={initial?.pet_friendly ?? false}
          />
          <CheckboxLabel
            name="smoking_allowed"
            label="Sigara içilebilir"
            defaultChecked={initial?.smoking_allowed ?? false}
          />
        </div>

        <Field label="İptal politikası">
          <textarea
            name="cancellation_policy"
            rows={3}
            maxLength={2000}
            defaultValue={initial?.cancellation_policy ?? ''}
            className="border-border bg-background w-full rounded-md border p-3 text-sm"
            placeholder="Konaklamadan 14 gün öncesine kadar ücretsiz iptal…"
          />
        </Field>

        <Field label="Çocuk politikası">
          <textarea
            name="child_policy"
            rows={3}
            maxLength={2000}
            defaultValue={initial?.child_policy ?? ''}
            className="border-border bg-background w-full rounded-md border p-3 text-sm"
            placeholder="0-2 yaş ücretsiz, 3-12 yaş %50 indirimli…"
          />
        </Field>

        <Field label="Evcil hayvan politikası">
          <textarea
            name="pet_policy"
            rows={2}
            maxLength={2000}
            defaultValue={initial?.pet_policy ?? ''}
            className="border-border bg-background w-full rounded-md border p-3 text-sm"
            placeholder="10 kg'a kadar köpekler kabul edilir, gecelik 100 TL ek ücret…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <CheckboxLabel
            name="extra_bed_available"
            label="Ek yatak istenebilir"
            defaultChecked={initial?.extra_bed_available ?? false}
          />
          <Field label="Ek yatak fiyatı (TL/gece)">
            <Input
              name="extra_bed_price"
              type="number"
              step="0.01"
              min={0}
              defaultValue={initial?.extra_bed_price ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* ---------------- ODA TIPLERI ---------------- */}
      <Section title="Oda tipleri" description="Bu otelde satılan oda türleri — booking ekranında listelenir">
        <div className="flex flex-col gap-4">
          {rooms.map((room, idx) => (
            <div key={room.id ?? `new-${idx}`} className="border-border bg-muted/10 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Oda #{idx + 1}</p>
                <button
                  type="button"
                  onClick={() => removeRoom(idx)}
                  className="text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 text-xs"
                  aria-label="Odayı sil"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Sil
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Oda adı">
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoom(idx, { name: e.target.value })}
                    maxLength={120}
                    required
                  />
                </Field>
                <Field label="Yatak düzeni">
                  <Input
                    value={room.bed_setup}
                    onChange={(e) => updateRoom(idx, { bed_setup: e.target.value })}
                    maxLength={200}
                    placeholder="King + 1 çekyat"
                  />
                </Field>
              </div>

              <Field label="Açıklama">
                <textarea
                  value={room.description}
                  onChange={(e) => updateRoom(idx, { description: e.target.value })}
                  rows={2}
                  maxLength={2000}
                  className="border-border bg-background w-full rounded-md border p-2 text-sm"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Yetişkin">
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={room.capacity_adults}
                    onChange={(e) => updateRoom(idx, { capacity_adults: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Çocuk">
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={room.capacity_children}
                    onChange={(e) => updateRoom(idx, { capacity_children: Number(e.target.value) })}
                  />
                </Field>
                <Field label="m²">
                  <Input
                    type="number"
                    min={0}
                    value={room.size_sqm}
                    onChange={(e) => updateRoom(idx, { size_sqm: e.target.value })}
                  />
                </Field>
                <Field label="Manzara">
                  <select
                    value={room.view_type}
                    onChange={(e) => updateRoom(idx, { view_type: e.target.value as ViewType | '' })}
                    className="border-border bg-background h-10 w-full rounded-md border px-2 text-sm"
                  >
                    <option value="">—</option>
                    {VIEW_TYPES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Gece fiyatı (TL)">
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    value={room.base_price_per_night}
                    onChange={(e) => updateRoom(idx, { base_price_per_night: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Pansiyon">
                  <select
                    value={room.board_basis}
                    onChange={(e) => updateRoom(idx, { board_basis: e.target.value as BoardBasis })}
                    className="border-border bg-background h-10 w-full rounded-md border px-2 text-sm"
                  >
                    {BOARD_BASIS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Toplam ünite">
                  <Input
                    type="number"
                    min={1}
                    value={room.total_units}
                    onChange={(e) => updateRoom(idx, { total_units: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Oda kapak görseli (URL)">
                <Input
                  type="url"
                  value={room.cover_image}
                  onChange={(e) => updateRoom(idx, { cover_image: e.target.value })}
                  placeholder="https://…"
                />
              </Field>

              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ['has_balcony', 'Balkon'],
                    ['has_jacuzzi', 'Jakuzi'],
                    ['has_kitchenette', 'Mini mutfak'],
                    ['has_minibar', 'Minibar'],
                    ['has_safe', 'Kasa'],
                    ['has_tv', 'TV'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={room[key]}
                      onChange={(e) => updateRoom(idx, { [key]: e.target.checked })}
                      className="accent-foreground size-4"
                    />
                    {label}
                  </label>
                ))}
                <label className="ms-auto inline-flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={room.is_active}
                    onChange={(e) => updateRoom(idx, { is_active: e.target.checked })}
                    className="accent-foreground size-4"
                  />
                  Aktif
                </label>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addRoom} className="self-start">
            <Plus className="me-1.5 size-4" aria-hidden="true" />
            Oda tipi ekle
          </Button>
        </div>
      </Section>

      {/* ---------------- SUBMIT ---------------- */}
      <div className="border-border bg-muted/30 sticky bottom-0 -mx-4 flex flex-col gap-3 border-t p-4 sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:rounded-b-lg">
        {formError ? (
          <p role="alert" className="text-sm text-rose-600 sm:me-auto">
            {formError}
          </p>
        ) : null}
        <Button type="submit" variant="primary" size="lg" disabled={pending}>
          {pending
            ? 'Kaydediliyor…'
            : editing
              ? 'Güncelle'
              : 'Oteli kaydet'}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border bg-background rounded-lg border p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function ChipToggle({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-border rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'hover:bg-muted bg-background',
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function CheckboxLabel({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="accent-foreground size-4"
      />
      {label}
    </label>
  );
}
