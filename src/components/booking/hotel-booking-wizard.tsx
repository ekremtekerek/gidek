'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  User as UserIcon,
  Users,
} from 'lucide-react';
import {
  createHotelBookingAction,
  type CreateHotelBookingState,
} from '@/app/rezervasyon/[slug]/hotel-actions';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';
import { isValidTCKimlik } from '@/lib/utils/tc-kimlik';

// ----------------------------------------------------------------------------
// Tipler
// ----------------------------------------------------------------------------
export interface RoomTypeOption {
  id: string;
  name: string;
  description: string | null;
  capacity_adults: number;
  capacity_children: number;
  bed_setup: string | null;
  size_sqm: number | null;
  view_type: string | null;
  base_price_per_night: number;
  board_basis: string;
  cover_image: string | null;
  has_balcony: boolean;
  has_jacuzzi: boolean;
}

export interface HotelMetaForWizard {
  star_rating: number | null;
  check_in_time: string;
  check_out_time: string;
  tourism_tax_per_night: number;
  cancellation_policy: string | null;
  child_policy: string | null;
  pet_policy: string | null;
}

export interface HotelDealForWizard {
  id: string;
  slug: string;
  title: string;
  city: string;
  district: string | null;
}

interface Guest {
  guest_type: 'adult' | 'child';
  guest_index: number;
  first_name: string;
  last_name: string;
  nationality: string;
  national_id: string;
  passport_no: string;
  birth_date: string;
  gender: '' | 'M' | 'F' | 'other';
  phone: string;
  email: string;
  is_lead: boolean;
  room_index: number;
}

interface SavedDraft {
  step: 1 | 2 | 3 | 4;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  roomId: string;
  guests: Guest[];
  specialRequests: string;
  savedAt: number;
}

interface Props {
  deal: HotelDealForWizard;
  rooms: RoomTypeOption[];
  meta: HotelMetaForWizard | null;
  /** /f/[slug]'daki oda kartından gelen `?room=` param'ı — varsayılan seçim */
  initialRoomId?: string;
  /** Giriş yapmış kullanıcının profili — lead misafir otomatik doldurulur */
  initialLead?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysISO(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function nightsBetween(ci: string, co: string): number {
  if (!ci || !co) return 0;
  const diff = (new Date(co).getTime() - new Date(ci).getTime()) / 86_400_000;
  return Math.max(0, Math.round(diff));
}
function makeGuest(
  type: 'adult' | 'child',
  idx: number,
  lead?: { first_name?: string; last_name?: string; phone?: string; email?: string },
): Guest {
  const isLead = type === 'adult' && idx === 0;
  return {
    guest_type: type,
    guest_index: idx,
    first_name: isLead ? (lead?.first_name ?? '') : '',
    last_name: isLead ? (lead?.last_name ?? '') : '',
    nationality: 'TR',
    national_id: '',
    passport_no: '',
    birth_date: '',
    gender: '',
    phone: isLead ? (lead?.phone ?? '') : '',
    email: isLead ? (lead?.email ?? '') : '',
    is_lead: isLead,
    room_index: 0,
  };
}

function resyncGuests(
  prev: Guest[],
  adults: number,
  kids: number,
  lead?: { first_name?: string; last_name?: string; phone?: string; email?: string },
): Guest[] {
  const next: Guest[] = [];
  for (let i = 0; i < adults; i++) {
    const existing = prev.find((g) => g.guest_type === 'adult' && g.guest_index === i);
    next.push(existing ?? makeGuest('adult', i, i === 0 ? lead : undefined));
  }
  for (let i = 0; i < kids; i++) {
    const existing = prev.find((g) => g.guest_type === 'child' && g.guest_index === i);
    next.push(existing ?? makeGuest('child', i));
  }
  // Lead garantisi: ilk yetişkin lead
  let leadSeen = false;
  return next.map((g) => {
    if (g.guest_type === 'adult' && g.guest_index === 0 && !leadSeen) {
      leadSeen = true;
      return { ...g, is_lead: true };
    }
    return { ...g, is_lead: false };
  });
}

const BOARD_LABELS: Record<string, string> = {
  oda: 'Sadece oda',
  'oda-kahvalti': 'Oda + Kahvaltı',
  'yarim-pansiyon': 'Yarım Pansiyon',
  'tam-pansiyon': 'Tam Pansiyon',
  'her-sey-dahil': 'Her Şey Dahil',
  'ultra-her-sey-dahil': 'Ultra Her Şey Dahil',
};

const NATIONALITIES: { code: string; label: string; flag: string }[] = [
  { code: 'TR', label: 'Türkiye', flag: '🇹🇷' },
  { code: 'DE', label: 'Almanya', flag: '🇩🇪' },
  { code: 'GB', label: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'US', label: 'ABD', flag: '🇺🇸' },
  { code: 'RU', label: 'Rusya', flag: '🇷🇺' },
  { code: 'UA', label: 'Ukrayna', flag: '🇺🇦' },
  { code: 'NL', label: 'Hollanda', flag: '🇳🇱' },
  { code: 'FR', label: 'Fransa', flag: '🇫🇷' },
  { code: 'IT', label: 'İtalya', flag: '🇮🇹' },
  { code: 'ES', label: 'İspanya', flag: '🇪🇸' },
  { code: 'PT', label: 'Portekiz', flag: '🇵🇹' },
  { code: 'GR', label: 'Yunanistan', flag: '🇬🇷' },
  { code: 'BG', label: 'Bulgaristan', flag: '🇧🇬' },
  { code: 'RO', label: 'Romanya', flag: '🇷🇴' },
  { code: 'HU', label: 'Macaristan', flag: '🇭🇺' },
  { code: 'PL', label: 'Polonya', flag: '🇵🇱' },
  { code: 'CZ', label: 'Çekya', flag: '🇨🇿' },
  { code: 'AT', label: 'Avusturya', flag: '🇦🇹' },
  { code: 'CH', label: 'İsviçre', flag: '🇨🇭' },
  { code: 'BE', label: 'Belçika', flag: '🇧🇪' },
  { code: 'DK', label: 'Danimarka', flag: '🇩🇰' },
  { code: 'SE', label: 'İsveç', flag: '🇸🇪' },
  { code: 'NO', label: 'Norveç', flag: '🇳🇴' },
  { code: 'FI', label: 'Finlandiya', flag: '🇫🇮' },
  { code: 'IE', label: 'İrlanda', flag: '🇮🇪' },
  { code: 'IL', label: 'İsrail', flag: '🇮🇱' },
  { code: 'IR', label: 'İran', flag: '🇮🇷' },
  { code: 'IQ', label: 'Irak', flag: '🇮🇶' },
  { code: 'SY', label: 'Suriye', flag: '🇸🇾' },
  { code: 'LB', label: 'Lübnan', flag: '🇱🇧' },
  { code: 'SA', label: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: 'AE', label: 'BAE', flag: '🇦🇪' },
  { code: 'QA', label: 'Katar', flag: '🇶🇦' },
  { code: 'KW', label: 'Kuveyt', flag: '🇰🇼' },
  { code: 'EG', label: 'Mısır', flag: '🇪🇬' },
  { code: 'MA', label: 'Fas', flag: '🇲🇦' },
  { code: 'TN', label: 'Tunus', flag: '🇹🇳' },
  { code: 'AZ', label: 'Azerbaycan', flag: '🇦🇿' },
  { code: 'GE', label: 'Gürcistan', flag: '🇬🇪' },
  { code: 'KZ', label: 'Kazakistan', flag: '🇰🇿' },
  { code: 'UZ', label: 'Özbekistan', flag: '🇺🇿' },
  { code: 'TM', label: 'Türkmenistan', flag: '🇹🇲' },
  { code: 'KG', label: 'Kırgızistan', flag: '🇰🇬' },
  { code: 'CN', label: 'Çin', flag: '🇨🇳' },
  { code: 'JP', label: 'Japonya', flag: '🇯🇵' },
  { code: 'KR', label: 'Güney Kore', flag: '🇰🇷' },
  { code: 'IN', label: 'Hindistan', flag: '🇮🇳' },
  { code: 'AU', label: 'Avustralya', flag: '🇦🇺' },
  { code: 'CA', label: 'Kanada', flag: '🇨🇦' },
  { code: 'BR', label: 'Brezilya', flag: '🇧🇷' },
  { code: 'OT', label: 'Diğer', flag: '🌐' },
];

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
export function HotelBookingWizard({ deal, rooms, meta, initialRoomId, initialLead }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [checkIn, setCheckIn] = useState<string>(() => plusDaysISO(todayISO(), 7));
  const [checkOut, setCheckOut] = useState<string>(() => plusDaysISO(todayISO(), 9));
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);

  const defaultRoomId =
    initialRoomId && rooms.some((r) => r.id === initialRoomId)
      ? initialRoomId
      : (rooms[0]?.id ?? '');
  const [roomId, setRoomId] = useState<string>(defaultRoomId);
  const [guests, setGuests] = useState<Guest[]>(() => resyncGuests([], adults, kids, initialLead));
  const [specialRequests, setSpecialRequests] = useState('');
  const [acceptPolicies, setAcceptPolicies] = useState(false);

  // Availability: tarihler değişince odaların müsaitlik durumu fetch edilir.
  const [availability, setAvailability] = useState<
    Map<string, { available: number; total: number }>
  >(new Map());
  const [availLoading, setAvailLoading] = useState(false);

  // localStorage'a kaydedilmiş yarım kalan rezervasyon — mount'ta okunur,
  // null değilse Step 1'in başında "Devam et / Sıfırla" banner'ı çıkar.
  const STORAGE_KEY = `gidek-hotel-wizard-${deal.id}`;
  const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000;
  const [savedDraft, setSavedDraft] = useState<SavedDraft | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedDraft;
      if (
        !parsed ||
        typeof parsed.savedAt !== 'number' ||
        Date.now() - parsed.savedAt > MAX_DRAFT_AGE_MS
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      void Promise.resolve().then(() => setSavedDraft(parsed));
    } catch {
      /* corrupted draft, ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY]);

  // Auto-save (debounced) — kullanıcı her etkileşimde state localStorage'a yazılır
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const t = window.setTimeout(() => {
      try {
        const draft: SavedDraft = {
          step,
          checkIn,
          checkOut,
          adults,
          kids,
          roomId,
          guests,
          specialRequests,
          savedAt: Date.now(),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      } catch {
        /* quota/disabled */
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [STORAGE_KEY, step, checkIn, checkOut, adults, kids, roomId, guests, specialRequests]);

  function applyDraft(d: SavedDraft) {
    setStep(d.step);
    setCheckIn(d.checkIn);
    setCheckOut(d.checkOut);
    setAdults(d.adults);
    setKids(d.kids);
    if (d.roomId && rooms.some((r) => r.id === d.roomId)) setRoomId(d.roomId);
    setGuests(d.guests);
    setSpecialRequests(d.specialRequests);
    setSavedDraft(null);
  }
  function discardDraft() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    setSavedDraft(null);
  }

  const [state, formAction, pending] = useActionState<CreateHotelBookingState, FormData>(
    createHotelBookingAction,
    null,
  );

  const nights = nightsBetween(checkIn, checkOut);
  const selectedRoom = rooms.find((r) => r.id === roomId) ?? null;
  const taxPerNight = Number(meta?.tourism_tax_per_night ?? 0);
  const roomSubtotal = selectedRoom ? selectedRoom.base_price_per_night * nights : 0;
  const tourismTaxTotal = taxPerNight * adults * nights;
  const total = roomSubtotal + tourismTaxTotal;

  function setAdultCount(n: number) {
    const v = Math.max(1, Math.min(12, n));
    setAdults(v);
    setGuests((prev) => resyncGuests(prev, v, kids, initialLead));
  }
  function setKidCount(n: number) {
    const v = Math.max(0, Math.min(8, n));
    setKids(v);
    setGuests((prev) => resyncGuests(prev, adults, v, initialLead));
  }
  function updateGuest(idx: number, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  // Availability fetch — tarihler değişince
  useEffect(() => {
    if (!checkIn || !checkOut || nightsBetween(checkIn, checkOut) < 1) return;
    const ctrl = new AbortController();
    // setState'i microtask'a defer ediyoruz; effect body'sinde direkt setState
    // çağrısı React 19 strict mode'da uyarı veriyor.
    void Promise.resolve().then(() => setAvailLoading(true));
    fetch(`/api/hotel/availability?deal=${deal.id}&checkin=${checkIn}&checkout=${checkOut}`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            rooms?: { id: string; total_units: number | null; available: number | null }[];
          } | null,
        ) => {
          if (!data?.rooms) return;
          const map = new Map<string, { available: number; total: number }>();
          for (const r of data.rooms) {
            if (r.total_units !== null && r.available !== null) {
              map.set(r.id, { available: r.available, total: r.total_units });
            }
          }
          setAvailability(map);
        },
      )
      .catch(() => {
        // sessiz fail — UI fallback olarak availability rozetini gizler
      })
      .finally(() => setAvailLoading(false));
    return () => ctrl.abort();
  }, [checkIn, checkOut, deal.id]);

  // En düşük gece başı fiyat — Step 1 preview için
  const minPricePerNight = useMemo(
    () => (rooms.length === 0 ? 0 : Math.min(...rooms.map((r) => r.base_price_per_night))),
    [rooms],
  );
  const previewMinTotal = nights > 0 ? minPricePerNight * nights : 0;

  // Validation per step
  const step1Valid =
    checkIn && checkOut && nights >= 1 && new Date(checkIn) >= new Date(todayISO()) && adults >= 1;

  const step2Valid =
    Boolean(selectedRoom) &&
    selectedRoom!.capacity_adults >= adults &&
    selectedRoom!.capacity_children >= kids;

  function guestErrors(g: Guest): string[] {
    const errs: string[] = [];
    const label =
      g.guest_type === 'adult' ? `Yetişkin ${g.guest_index + 1}` : `Çocuk ${g.guest_index + 1}`;
    if (g.first_name.trim().length < 2) errs.push(`${label}: ad eksik`);
    if (g.last_name.trim().length < 2) errs.push(`${label}: soyad eksik`);
    if (!g.birth_date) errs.push(`${label}: doğum tarihi eksik`);
    if (g.guest_type === 'adult') {
      if (g.nationality === 'TR' && !isValidTCKimlik(g.national_id)) {
        errs.push(`${label}: TC kimlik geçersiz`);
      }
      if (g.nationality !== 'TR' && g.passport_no.trim().length < 4) {
        errs.push(`${label}: pasaport no eksik`);
      }
    }
    if (g.is_lead && g.phone.trim().length < 7) {
      errs.push(`${label} (sahip): telefon eksik`);
    }
    return errs;
  }
  const allStep3Errors = useMemo(() => guests.flatMap((g) => guestErrors(g)), [guests]);
  const step3Valid = allStep3Errors.length === 0;

  const canSubmit = step1Valid && step2Valid && step3Valid && acceptPolicies && !pending;

  const err = state?.fieldErrors;

  return (
    <div className="flex flex-col gap-6">
      <Stepper
        current={step}
        steps={[
          { n: 1, label: 'Tarih & Kişi' },
          { n: 2, label: 'Oda' },
          { n: 3, label: 'Misafir' },
          { n: 4, label: 'Özet' },
        ]}
      />

      {savedDraft ? (
        <div
          role="region"
          aria-label="Yarım kalan rezervasyon"
          className="flex flex-col gap-3 rounded-lg border border-sky-500/40 bg-sky-500/10 p-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Yarım kalan rezervasyonun var</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {new Date(savedDraft.savedAt).toLocaleString('tr-TR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {savedDraft.adults} yetişkin
              {savedDraft.kids > 0 ? ` + ${savedDraft.kids} çocuk` : ''} · Adım {savedDraft.step}/4
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={discardDraft}>
              Sıfırla
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => applyDraft(savedDraft)}
            >
              Devam et
            </Button>
          </div>
        </div>
      ) : null}

      {state?.error ? (
        <div
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </div>
      ) : null}

      <form action={formAction} onSubmit={() => discardDraft()} className="flex flex-col gap-6">
        {/* Tüm step'lerin hidden state'i — son submit'te gönderilir.
            check_in/out_date DateField içinde hidden input olarak üretiliyor. */}
        <input type="hidden" name="deal_id" value={deal.id} />
        <input type="hidden" name="room_type_id" value={roomId} />
        <input type="hidden" name="adult_count" value={adults} />
        <input type="hidden" name="child_count" value={kids} />
        <input type="hidden" name="guests_json" value={JSON.stringify(guests)} />
        <input type="hidden" name="special_requests" value={specialRequests} />
        {acceptPolicies ? <input type="hidden" name="accept_policies" value="on" /> : null}

        {/* ============================== STEP 1 ============================== */}
        {step === 1 ? (
          <section className="border-border bg-background flex flex-col gap-5 rounded-xl border p-5 sm:p-6">
            <header>
              <h2 className="text-lg font-semibold tracking-tight">Tarih ve kişi sayısı</h2>
              <p className="text-muted-foreground text-xs">
                Giriş {meta?.check_in_time ?? '14:00'}, çıkış {meta?.check_out_time ?? '12:00'}
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ci">
                  <CalendarDays className="me-1 inline size-3.5" aria-hidden="true" />
                  Giriş
                </Label>
                <DateField
                  id="ci"
                  name="check_in_date"
                  value={checkIn}
                  onChange={(v) => {
                    setCheckIn(v);
                    if (v && new Date(v) >= new Date(checkOut)) {
                      setCheckOut(plusDaysISO(v, 2));
                    }
                  }}
                  min={todayISO()}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="co">
                  <CalendarDays className="me-1 inline size-3.5" aria-hidden="true" />
                  Çıkış
                </Label>
                <DateField
                  id="co"
                  name="check_out_date"
                  value={checkOut}
                  onChange={(v) => setCheckOut(v)}
                  min={plusDaysISO(checkIn || todayISO(), 1)}
                  required
                />
              </div>
            </div>

            {nights > 0 ? (
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{nights} gece</strong> konaklama
              </p>
            ) : null}

            {/* Anlık özet — tarih+kişi seçildikçe en düşük tahmini fiyat */}
            {nights > 0 && minPricePerNight > 0 ? (
              <div className="flex items-center justify-between rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
                <div>
                  <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                    Tahmini en düşük tutar
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    {nights} gece × {adults} yetişkin{kids > 0 ? ` + ${kids} çocuk` : ''} · en uygun
                    odadan
                  </p>
                </div>
                <p className="text-foreground text-lg font-bold tracking-tight">
                  {formatTRY(previewMinTotal)}
                  <span className="text-muted-foreground ms-1 text-[11px] font-normal">
                    &apos;dan
                  </span>
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Counter
                label="Yetişkin (13+)"
                value={adults}
                onChange={setAdultCount}
                min={1}
                max={12}
              />
              <Counter label="Çocuk (0-12)" value={kids} onChange={setKidCount} min={0} max={8} />
            </div>

            <NavRow
              right={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                >
                  Oda seç <ArrowRight className="ms-1.5 size-4" aria-hidden="true" />
                </Button>
              }
            />
          </section>
        ) : null}

        {/* ============================== STEP 2 ============================== */}
        {step === 2 ? (
          <section className="border-border bg-background flex flex-col gap-4 rounded-xl border p-5 sm:p-6">
            <header className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Oda seç</h2>
                <p className="text-muted-foreground text-xs">
                  {nights} gece · {adults} yetişkin {kids > 0 ? `+ ${kids} çocuk` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
              >
                Tarih/kişi değiştir
              </button>
            </header>

            {rooms.length === 0 ? (
              <p className="text-muted-foreground border-border bg-muted/30 rounded-lg border border-dashed p-6 text-center text-sm">
                Bu otel için tanımlı oda tipi yok. Admin&apos;den oda tipi eklenmeli.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {rooms.map((r) => {
                  const fits = r.capacity_adults >= adults && r.capacity_children >= kids;
                  const avail = availability.get(r.id) ?? null;
                  const isFull = avail !== null && avail.available === 0;
                  const isLow = avail !== null && avail.available > 0 && avail.available <= 3;
                  const selectable = fits && !isFull;
                  const isSelected = roomId === r.id;
                  const total = r.base_price_per_night * nights;
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        'flex cursor-pointer items-stretch gap-3 rounded-xl border p-3 transition-colors sm:p-4',
                        isSelected
                          ? 'border-foreground bg-foreground/5'
                          : selectable
                            ? 'border-border hover:border-foreground/40'
                            : 'border-border bg-muted/30 cursor-not-allowed opacity-60',
                      )}
                    >
                      <input
                        type="radio"
                        name="room_select"
                        value={r.id}
                        checked={isSelected}
                        onChange={() => selectable && setRoomId(r.id)}
                        disabled={!selectable}
                        className="sr-only"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{r.name}</p>
                            {r.description ? (
                              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                                {r.description}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold">{formatTRY(total)}</p>
                            <p className="text-muted-foreground text-[10px]">
                              {nights} gece · {formatTRY(r.base_price_per_night)}/gece
                            </p>
                          </div>
                        </div>
                        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-[11px]">
                          <span>
                            <Users className="me-0.5 inline size-3" aria-hidden="true" />
                            {r.capacity_adults}+{r.capacity_children}
                          </span>
                          {r.bed_setup ? <span>· {r.bed_setup}</span> : null}
                          {r.size_sqm ? <span>· {r.size_sqm} m²</span> : null}
                          {r.view_type ? <span>· {r.view_type} manzara</span> : null}
                          {/* Müsaitlik rozeti */}
                          {availLoading ? (
                            <span className="text-muted-foreground/70">· kontrol ediliyor…</span>
                          ) : avail !== null ? (
                            isFull ? (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                Dolu
                              </span>
                            ) : isLow ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                Son {avail.available} oda
                              </span>
                            ) : (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                Müsait
                              </span>
                            )
                          ) : null}
                          <span className="bg-muted ms-auto rounded-full px-2 py-0.5">
                            {BOARD_LABELS[r.board_basis] ?? r.board_basis}
                          </span>
                        </div>
                        {!fits ? (
                          <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                            Bu oda {r.capacity_adults} yetişkin + {r.capacity_children} çocuk alır
                          </p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <NavRow
              left={
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="me-1.5 size-4" aria-hidden="true" />
                  Geri
                </Button>
              }
              right={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                >
                  Misafir bilgileri <ArrowRight className="ms-1.5 size-4" aria-hidden="true" />
                </Button>
              }
            />
          </section>
        ) : null}

        {/* ============================== STEP 3 ============================== */}
        {step === 3 ? (
          <section className="border-border bg-background flex flex-col gap-5 rounded-xl border p-5 sm:p-6">
            <header>
              <h2 className="text-lg font-semibold tracking-tight">Misafir bilgileri</h2>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                Konaklama yasası gereği, yetişkin Türk vatandaşları için TC kimlik no, yabancılar
                için pasaport no zorunludur. Bilgiler KVKK kapsamında işlenir.
              </p>
            </header>

            <div className="flex flex-col gap-4">
              {guests.map((g, idx) => (
                <GuestCard
                  key={`${g.guest_type}-${g.guest_index}`}
                  g={g}
                  idx={idx}
                  onChange={(patch) => updateGuest(idx, patch)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sr">Özel istek (opsiyonel)</Label>
              <textarea
                id="sr"
                rows={2}
                maxLength={500}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Erken giriş, deniz manzaralı kat, alerji vb."
                className="border-border bg-background w-full rounded-md border p-3 text-sm"
              />
            </div>

            {!step3Valid && allStep3Errors.length > 0 ? (
              <div
                role="alert"
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"
              >
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Devam etmek için {allStep3Errors.length} alan eksik
                </p>
                <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-xs text-amber-700 dark:text-amber-300">
                  {allStep3Errors.slice(0, 8).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {allStep3Errors.length > 8 ? (
                    <li>…ve {allStep3Errors.length - 8} tane daha</li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            <NavRow
              left={
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="me-1.5 size-4" aria-hidden="true" />
                  Geri
                </Button>
              }
              right={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setStep(4)}
                  disabled={!step3Valid}
                >
                  Özet <ArrowRight className="ms-1.5 size-4" aria-hidden="true" />
                </Button>
              }
            />
          </section>
        ) : null}

        {/* ============================== STEP 4 ============================== */}
        {step === 4 ? (
          <section className="border-border bg-background flex flex-col gap-5 rounded-xl border p-5 sm:p-6">
            <header>
              <h2 className="text-lg font-semibold tracking-tight">Rezervasyon özeti</h2>
            </header>

            <dl className="border-border bg-muted/30 grid grid-cols-2 gap-2 rounded-lg border p-4 text-sm">
              <dt className="text-muted-foreground">Otel</dt>
              <dd className="text-right font-medium">{deal.title}</dd>
              <dt className="text-muted-foreground">Tarihler</dt>
              <dd className="text-right">
                {checkIn} → {checkOut} · {nights} gece
              </dd>
              <dt className="text-muted-foreground">Oda</dt>
              <dd className="text-right">{selectedRoom?.name}</dd>
              <dt className="text-muted-foreground">Pansiyon</dt>
              <dd className="text-right">{BOARD_LABELS[selectedRoom?.board_basis ?? ''] ?? '—'}</dd>
              <dt className="text-muted-foreground">Misafir</dt>
              <dd className="text-right">
                {adults} yetişkin {kids > 0 ? `+ ${kids} çocuk` : ''}
              </dd>
              <dt className="text-muted-foreground">Lead misafir</dt>
              <dd className="text-right">
                {guests.find((g) => g.is_lead)?.first_name}{' '}
                {guests.find((g) => g.is_lead)?.last_name}
              </dd>
            </dl>

            <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
              <Row
                label={`Oda (${nights} gece × ${formatTRY(selectedRoom?.base_price_per_night ?? 0)})`}
                value={formatTRY(roomSubtotal)}
              />
              {tourismTaxTotal > 0 ? (
                <Row
                  label={`Konaklama vergisi (${adults} kişi × ${nights} gece)`}
                  value={formatTRY(tourismTaxTotal)}
                />
              ) : null}
              <div className="border-border mt-1 flex items-baseline justify-between border-t pt-2">
                <span className="text-sm font-medium">Toplam</span>
                <span className="text-2xl font-semibold">{formatTRY(total)}</span>
              </div>
            </div>

            {meta?.cancellation_policy || meta?.child_policy ? (
              <details className="border-border rounded-lg border p-3 text-xs">
                <summary className="cursor-pointer font-medium">Politikalar</summary>
                <div className="text-muted-foreground mt-2 flex flex-col gap-2 leading-relaxed">
                  {meta?.cancellation_policy ? (
                    <p>
                      <strong className="text-foreground">İptal:</strong> {meta.cancellation_policy}
                    </p>
                  ) : null}
                  {meta?.child_policy ? (
                    <p>
                      <strong className="text-foreground">Çocuk:</strong> {meta.child_policy}
                    </p>
                  ) : null}
                  {meta?.pet_policy ? (
                    <p>
                      <strong className="text-foreground">Evcil hayvan:</strong> {meta.pet_policy}
                    </p>
                  ) : null}
                </div>
              </details>
            ) : null}

            <div className="text-muted-foreground rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-[11px] leading-relaxed">
              <p>
                <strong className="text-foreground">KVKK bilgilendirmesi:</strong> Konaklama
                Tesisleri Yönetmeliği gereği konaklayan her yetişkin misafirin kimlik bilgileri otel
                tarafından kayıt altına alınır ve yetkili mercilere bildirilir. Veriler{' '}
                <a
                  href="/yasal/kvkk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  KVKK aydınlatma metnimiz
                </a>{' '}
                kapsamında işlenir.
              </p>
            </div>

            <label className="border-border bg-muted/20 flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={acceptPolicies}
                onChange={(e) => setAcceptPolicies(e.target.checked)}
                className="accent-foreground mt-0.5 size-4"
              />
              <span>
                İptal koşulları, çocuk politikası ve KVKK aydınlatma metnini okudum, kabul ediyorum.
              </span>
            </label>
            {err?.accept_policies ? (
              <p className="text-xs text-rose-600">{err.accept_policies[0]}</p>
            ) : null}

            <NavRow
              left={
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="me-1.5 size-4" aria-hidden="true" />
                  Geri
                </Button>
              }
              right={
                <Button type="submit" variant="primary" size="lg" disabled={!canSubmit}>
                  {pending ? (
                    <>
                      <Loader2 className="me-1.5 size-4 animate-spin" aria-hidden="true" />
                      Rezervasyon oluşturuluyor…
                    </>
                  ) : (
                    <>Rezervasyonu Tamamla</>
                  )}
                </Button>
              }
            />
          </section>
        ) : null}
      </form>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------
function HelpHint({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      tabIndex={0}
      role="button"
      className="text-muted-foreground hover:text-foreground bg-muted inline-flex size-4 cursor-help items-center justify-center rounded-full text-[10px] leading-none font-bold"
    >
      ?
    </span>
  );
}

// Tailwind JIT'in tüm w-X/4'leri build'e dahil etmesi için sabit liste —
// dinamik string ile yapılamaz çünkü class isimleri compile-time çıkarılır.
const PROGRESS_WIDTH_CLASS: Record<number, string> = {
  1: 'w-1/4',
  2: 'w-2/4',
  3: 'w-3/4',
  4: 'w-full',
};

function Stepper({ current, steps }: { current: number; steps: { n: number; label: string }[] }) {
  const currentStep = steps.find((s) => s.n === current);
  const pct = PROGRESS_WIDTH_CLASS[current] ?? 'w-0';

  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={current}
      aria-label={`Adım ${current} / ${steps.length} — ${currentStep?.label ?? ''}`}
    >
      {/* Screen reader live region — step değişince duyurulur */}
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        Adım {current} / {steps.length} — {currentStep?.label}
      </span>
      {/* Mobile: compact progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground font-semibold">{currentStep?.label}</span>
          <span className="text-muted-foreground">
            Adım {current}/{steps.length}
          </span>
        </div>
        <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
          <div className={cn('bg-foreground h-full rounded-full transition-all', pct)} />
        </div>
      </div>

      {/* sm+: full stepper */}
      <ol className="hidden items-center gap-1 text-sm sm:flex">
        {steps.map((s, i) => {
          const done = s.n < current;
          const active = s.n === current;
          return (
            <li key={s.n} className="flex items-center gap-1">
              <span
                className={cn(
                  'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="size-3.5" aria-hidden="true" /> : s.n}
              </span>
              <span
                className={cn(
                  active ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  'whitespace-nowrap',
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 ? (
                <ChevronRight
                  className="text-muted-foreground mx-1 size-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Counter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="border-border bg-muted/10 flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label="Azalt"
          className="border-border hover:bg-muted inline-flex size-8 items-center justify-center rounded-full border disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <span className="w-6 text-center text-sm tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label="Arttır"
          className="border-border hover:bg-muted inline-flex size-8 items-center justify-center rounded-full border disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function NavRow({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="border-border mt-2 flex items-center justify-between border-t pt-4">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function GuestCard({
  g,
  idx,
  onChange,
}: {
  g: Guest;
  idx: number;
  onChange: (patch: Partial<Guest>) => void;
}) {
  const isAdult = g.guest_type === 'adult';
  const isLead = g.is_lead;
  const guestNum = g.guest_index + 1;

  // Year limits to filter "child" vs "adult"
  const today = new Date().toISOString().slice(0, 10);
  const minBirth = isAdult ? '1920-01-01' : `${new Date().getFullYear() - 12}-01-01`;
  const maxBirth = isAdult ? `${new Date().getFullYear() - 13}-12-31` : today;

  // Memoized derived hint
  const idHint = useMemo(() => {
    if (!isAdult) return 'Çocuklar için kimlik opsiyonel';
    if (g.nationality === 'TR') return 'TC kimlik (11 hane)';
    return 'Pasaport no';
  }, [isAdult, g.nationality]);

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isLead ? 'border-foreground bg-foreground/5' : 'border-border bg-muted/10',
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <UserIcon className="size-4" aria-hidden="true" />
          {isAdult ? `Yetişkin ${guestNum}` : `Çocuk ${guestNum}`}
          {isLead ? (
            <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
              Rezervasyon sahibi
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`fn-${idx}`}>Ad</Label>
          <Input
            id={`fn-${idx}`}
            value={g.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
            maxLength={80}
            required
          />
        </div>
        <div>
          <Label htmlFor={`ln-${idx}`}>Soyad</Label>
          <Input
            id={`ln-${idx}`}
            value={g.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
            maxLength={80}
            required
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`bd-${idx}`}>Doğum tarihi</Label>
          <DateField
            id={`bd-${idx}`}
            name={`bd-${idx}`}
            value={g.birth_date}
            onChange={(v) => onChange({ birth_date: v })}
            min={minBirth}
            max={maxBirth}
            required
          />
        </div>
        <div>
          <Label htmlFor={`nat-${idx}`}>Vatandaşlık</Label>
          <select
            id={`nat-${idx}`}
            value={g.nationality}
            onChange={(e) => onChange({ nationality: e.target.value })}
            className="border-border bg-background h-10 w-full rounded-md border px-2 text-sm"
          >
            {NATIONALITIES.map((n) => (
              <option key={n.code} value={n.code}>
                {n.flag} {n.label}
              </option>
            ))}
          </select>
        </div>
        {isAdult ? (
          <div>
            <Label>Cinsiyet</Label>
            <select
              value={g.gender}
              onChange={(e) => onChange({ gender: e.target.value as Guest['gender'] })}
              className="border-border bg-background h-10 w-full rounded-md border px-2 text-sm"
            >
              <option value="">—</option>
              <option value="M">Erkek</option>
              <option value="F">Kadın</option>
              <option value="other">Diğer</option>
            </select>
          </div>
        ) : null}
      </div>

      {isAdult ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {g.nationality === 'TR' ? (
            <div>
              <Label htmlFor={`tc-${idx}`} className="inline-flex items-center gap-1.5">
                {idHint}
                <HelpHint text="11 hane, sadece rakam. Kimliğinizin ön yüzünde T.C. KİMLİK NO yazısının altında bulunur. Otele giriş için yasal zorunluluktur." />
              </Label>
              <Input
                id={`tc-${idx}`}
                inputMode="numeric"
                pattern="[0-9]{11}"
                value={g.national_id}
                onChange={(e) =>
                  onChange({ national_id: e.target.value.replace(/[^0-9]/g, '').slice(0, 11) })
                }
                placeholder="12345678901"
                aria-invalid={
                  g.national_id.length === 11 && !isValidTCKimlik(g.national_id)
                    ? 'true'
                    : undefined
                }
                required
              />
              {g.national_id.length === 11 && !isValidTCKimlik(g.national_id) ? (
                <p className="mt-1 text-xs text-rose-600">Geçersiz TC kimlik no — kontrol et</p>
              ) : null}
            </div>
          ) : (
            <div>
              <Label htmlFor={`pp-${idx}`} className="inline-flex items-center gap-1.5">
                {idHint}
                <HelpHint text="Pasaport numaranızın tamamı (harf+rakam). Kimliği fotoğraflı sayfasının üst sağında bulunur. Otele giriş için yasal zorunluluktur." />
              </Label>
              <Input
                id={`pp-${idx}`}
                value={g.passport_no}
                onChange={(e) =>
                  onChange({ passport_no: e.target.value.toUpperCase().slice(0, 20) })
                }
                placeholder="P12345678"
                required
              />
            </div>
          )}
        </div>
      ) : null}

      {isLead ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`ph-${idx}`}>Telefon</Label>
            <Input
              id={`ph-${idx}`}
              type="tel"
              value={g.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+90 555 …"
              maxLength={30}
              required
            />
          </div>
          <div>
            <Label htmlFor={`em-${idx}`}>E-posta (opsiyonel)</Label>
            <Input
              id={`em-${idx}`}
              type="email"
              value={g.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="ad@ornek.com"
              maxLength={100}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
