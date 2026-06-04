'use client';

import { useActionState, useState } from 'react';
import { Calendar, Clock, Gift, Heart, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimeField } from '@/components/ui/time-field';
import { createBookingAction, type CreateBookingState } from '@/app/rezervasyon/[slug]/actions';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  dealId: string;
  unitPrice: number;
  maxPerUser: number;
  validUntilDate: string;
}

const INITIAL: CreateBookingState = null;

export function BookingForm({ dealId, unitPrice, maxPerUser, validUntilDate }: Props) {
  const [state, formAction, pending] = useActionState(createBookingAction, INITIAL);
  const [quantity, setQuantity] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const subtotal = unitPrice * quantity;
  const insuranceFee = insurance ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const total = subtotal + insuranceFee;
  const err = state && 'fieldErrors' in state ? state.fieldErrors : undefined;
  const warning = state && 'warning' in state ? state : null;

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="dealId" value={dealId} />
      {/* Çakışma uyarısı kabul edildiğinde aynı submit'te bayrak gönderilir */}
      {warning ? <input type="hidden" name="confirm_overlap" value="on" /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quantity" className="inline-flex items-center gap-1.5">
          <Users className="size-4" aria-hidden="true" />
          Adet
        </Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxPerUser}
          step={1}
          required
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.min(maxPerUser, Number(e.target.value))))}
          aria-invalid={err?.quantity ? 'true' : undefined}
        />
        {err?.quantity ? (
          <p className="text-sm text-rose-600 dark:text-rose-400">{err.quantity[0]}</p>
        ) : (
          <p className="text-muted-foreground text-xs">En fazla {maxPerUser} adet alabilirsin.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="selected_date" className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" aria-hidden="true" />
            Tarih
          </Label>
          <DateField
            id="selected_date"
            name="selected_date"
            min={todayIso}
            max={validUntilDate}
            required
            placeholder="Tarih seç"
          />
          {err?.selected_date ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.selected_date[0]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="selected_time" className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            Saat (opsiyonel)
          </Label>
          <TimeField id="selected_time" name="selected_time" placeholder="Saat seç" />
          {err?.selected_time ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{err.selected_time[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes" className="inline-flex items-center gap-1.5">
          <MessageSquare className="size-4" aria-hidden="true" />
          Not (opsiyonel)
        </Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Özel istek, alerji, ulaşım vb."
          className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[88px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Kim için?</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setIsGift(false)}
            className={cn(
              'border-border flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
              !isGift
                ? 'border-foreground bg-foreground/5'
                : 'hover:border-foreground/40 bg-background',
            )}
            aria-pressed={!isGift}
          >
            <Heart className="size-4" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Kendim için</p>
              <p className="text-muted-foreground text-xs">E-bilet sana gelir</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIsGift(true)}
            className={cn(
              'border-border flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
              isGift ? 'border-rose-500 bg-rose-500/5' : 'hover:border-foreground/40 bg-background',
            )}
            aria-pressed={isGift}
          >
            <Gift className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Hediye olarak</p>
              <p className="text-muted-foreground text-xs">E-bilet alıcıya gider</p>
            </div>
          </button>
        </div>
        {/* Form'a is_gift bayrağı zaman zaman state ile sync için */}
        <input type="hidden" name="is_gift" value={isGift ? 'on' : ''} />
      </div>

      {isGift ? (
        <div className="flex flex-col gap-4 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-foreground/90 text-xs leading-relaxed">
            <Gift className="me-1 inline-block size-3.5 text-rose-600" aria-hidden="true" />
            Hediye alıcısının bilgilerini gir; ödemeyi sen yaparsın, e-bilet alıcıya gider. Mesajını
            da iletiriz.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift_recipient_name">Alıcı adı</Label>
              <Input
                id="gift_recipient_name"
                name="gift_recipient_name"
                type="text"
                maxLength={80}
                placeholder="Aslı Yılmaz"
                aria-invalid={err?.gift_recipient_name ? 'true' : undefined}
              />
              {err?.gift_recipient_name ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  {err.gift_recipient_name[0]}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gift_recipient_phone">Alıcı telefon</Label>
              <Input
                id="gift_recipient_phone"
                name="gift_recipient_phone"
                type="tel"
                maxLength={30}
                placeholder="+90 555 …"
                aria-invalid={err?.gift_recipient_phone ? 'true' : undefined}
              />
              {err?.gift_recipient_phone ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                  {err.gift_recipient_phone[0]}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gift_recipient_email">Alıcı e-posta (opsiyonel)</Label>
            <Input
              id="gift_recipient_email"
              name="gift_recipient_email"
              type="email"
              autoComplete="off"
              placeholder="asli@ornek.com"
              aria-invalid={err?.gift_recipient_email ? 'true' : undefined}
            />
            {err?.gift_recipient_email ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {err.gift_recipient_email[0]}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gift_message">Kişisel mesaj (opsiyonel)</Label>
            <textarea
              id="gift_message"
              name="gift_message"
              rows={2}
              maxLength={500}
              placeholder="Doğum günün kutlu olsun! Bu seninle keyifli bir gün geçireceğin yer olsun."
              className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 placeholder:text-muted-foreground min-h-[60px] w-full rounded-md border p-3 text-sm transition-colors focus:ring-2 focus:outline-none"
            />
          </div>
        </div>
      ) : null}

      {/* İptal sigortası (opt-in, %5 prim) */}
      <label
        className={cn(
          'group relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
          insurance ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border hover:bg-muted/40',
        )}
      >
        <input
          type="checkbox"
          name="insurance"
          checked={insurance}
          onChange={(e) => setInsurance(e.target.checked)}
          className="accent-foreground mt-0.5 size-4"
        />
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
            İptal sigortası ekle
            <span className="text-muted-foreground text-xs font-normal">
              +{formatTRY(Math.round(subtotal * 0.05 * 100) / 100)}
            </span>
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Sigortalı rezervasyonlarda iptal halinde{' '}
            <strong className="text-foreground">tam tutar</strong> iade kuponu — sigortasız %50.
          </p>
        </div>
      </label>

      <div className="border-border bg-muted/30 flex flex-col gap-1 rounded-lg border p-4">
        {insuranceFee > 0 ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fırsat tutarı</span>
              <span className="tabular-nums">{formatTRY(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                İptal sigortası
              </span>
              <span className="tabular-nums">+{formatTRY(insuranceFee)}</span>
            </div>
            <div className="border-border mt-1 flex items-center justify-between border-t pt-1.5">
              <span className="text-sm font-medium">Toplam</span>
              <span className="text-2xl font-semibold tabular-nums">{formatTRY(total)}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Toplam tutar</span>
            <span className="text-2xl font-semibold">{formatTRY(total)}</span>
          </div>
        )}
      </div>

      {state && 'error' in state && state.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      {warning ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
              ⚠
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-sm font-semibold">
                Aynı gün için zaten rezervasyonun var
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Aşağıdaki rezervasyon{warning.conflicts.length > 1 ? 'ların' : 'un'} ile çakışıyor.
                Yine de devam etmek istersen aynı butona tekrar bas.
              </p>
            </div>
          </div>
          <ul className="border-border bg-background flex flex-col gap-1.5 rounded-md border p-3 text-xs">
            {warning.conflicts.map((c) => (
              <li key={c.bookingCode} className="flex items-center justify-between gap-3">
                <span className="line-clamp-1 font-medium">{c.dealTitle}</span>
                <span className="text-muted-foreground tabular-nums">
                  {c.selectedTime ? c.selectedTime.slice(0, 5) : 'Saat —'} ·{' '}
                  <a
                    href={`/rezervasyonlarim/${c.bookingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-2 hover:underline"
                  >
                    {c.bookingCode}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" full disabled={pending}>
        {pending
          ? 'Rezervasyon oluşturuluyor…'
          : warning
            ? 'Yine de devam et'
            : 'Rezervasyonu Tamamla'}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Onay kodun e-posta gibi davranır; rezervasyon detayların hesabında saklanır.
      </p>
    </form>
  );
}
