'use client';

import { useActionState, useState } from 'react';
import { Crown, Loader2, User as UserIcon } from 'lucide-react';
import {
  updateBookingGuestsAction,
  type EditGuestsState,
} from '@/app/rezervasyonlarim/[code]/misafir-duzenle/actions';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import { isValidTCKimlik } from '@/lib/utils/tc-kimlik';

interface Guest {
  id: string;
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
}

const NATIONALITIES: { code: string; label: string; flag: string }[] = [
  { code: 'TR', label: 'Türkiye', flag: '🇹🇷' },
  { code: 'DE', label: 'Almanya', flag: '🇩🇪' },
  { code: 'GB', label: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'US', label: 'ABD', flag: '🇺🇸' },
  { code: 'RU', label: 'Rusya', flag: '🇷🇺' },
  { code: 'NL', label: 'Hollanda', flag: '🇳🇱' },
  { code: 'FR', label: 'Fransa', flag: '🇫🇷' },
  { code: 'IT', label: 'İtalya', flag: '🇮🇹' },
  { code: 'OT', label: 'Diğer', flag: '🌐' },
];

interface Props {
  bookingCode: string;
  initialGuests: Guest[];
}

export function GuestEditForm({ bookingCode, initialGuests }: Props) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [state, formAction, pending] = useActionState<EditGuestsState, FormData>(
    updateBookingGuestsAction,
    null,
  );

  function updateGuest(idx: number, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  }

  function isGuestValid(g: Guest): boolean {
    if (g.first_name.trim().length < 2 || g.last_name.trim().length < 2 || !g.birth_date) {
      return false;
    }
    if (g.guest_type === 'adult') {
      if (g.nationality === 'TR') return isValidTCKimlik(g.national_id);
      return g.passport_no.trim().length >= 4;
    }
    return true;
  }
  const allValid = guests.every(isGuestValid);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="booking_code" value={bookingCode} />
      <input type="hidden" name="guests_json" value={JSON.stringify(guests)} />

      {state?.error ? (
        <div role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {guests.map((g, idx) => (
          <GuestCard key={g.id} g={g} idx={idx} onChange={(patch) => updateGuest(idx, patch)} />
        ))}
      </div>

      <div className="border-border bg-muted/30 sticky bottom-0 -mx-4 flex flex-col gap-3 border-t p-4 sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:rounded-b-lg">
        <p className="text-muted-foreground text-xs sm:me-auto">
          Değişiklikler kaydedildikten sonra otele bildirilir.
        </p>
        <Button type="submit" variant="primary" size="lg" disabled={!allValid || pending}>
          {pending ? (
            <>
              <Loader2 className="me-1.5 size-4 animate-spin" aria-hidden="true" />
              Kaydediliyor…
            </>
          ) : (
            'Misafir bilgilerini güncelle'
          )}
        </Button>
      </div>
    </form>
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
  const today = new Date().toISOString().slice(0, 10);
  const minBirth = isAdult ? '1920-01-01' : `${new Date().getFullYear() - 12}-01-01`;
  const maxBirth = isAdult ? `${new Date().getFullYear() - 13}-12-31` : today;

  return (
    <div className={cn(
      'rounded-xl border p-4',
      isLead ? 'border-foreground bg-foreground/5' : 'border-border bg-muted/10',
    )}>
      <div className="mb-3 flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <UserIcon className="size-4" aria-hidden="true" />
          {isAdult ? `Yetişkin ${guestNum}` : `Çocuk ${guestNum}`}
          {isLead ? (
            <span className="bg-foreground text-background inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              <Crown className="size-2.5" aria-hidden="true" />
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
              <Label htmlFor={`tc-${idx}`}>TC Kimlik (11 hane)</Label>
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
                <p className="text-xs text-rose-600 mt-1">Geçersiz TC kimlik no</p>
              ) : null}
            </div>
          ) : (
            <div>
              <Label htmlFor={`pp-${idx}`}>Pasaport No</Label>
              <Input
                id={`pp-${idx}`}
                value={g.passport_no}
                onChange={(e) => onChange({ passport_no: e.target.value.toUpperCase().slice(0, 20) })}
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
              maxLength={30}
              required
            />
          </div>
          <div>
            <Label htmlFor={`em-${idx}`}>E-posta</Label>
            <Input
              id={`em-${idx}`}
              type="email"
              value={g.email}
              onChange={(e) => onChange({ email: e.target.value })}
              maxLength={100}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
