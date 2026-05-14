'use client';

import { useActionState, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onboardingAction, type OnboardingState } from '@/app/onboarding/actions';
import { DIETARY, HOUSEHOLD_TYPES, KIDS_AGE_GROUPS, MAIN_CATEGORIES, SUPPORTED_CITIES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

interface Props {
  initial?: {
    city: string | null;
    district: string | null;
    household_type: string | null;
    kids_age_groups: string[];
    budget_min: number | null;
    budget_max: number | null;
    interests: string[];
    dietary: string[];
    dislikes: string[];
    has_car?: boolean | null;
    has_pet?: boolean | null;
    time_preference?: string | null;
  } | null;
}

const INITIAL: OnboardingState = null;

export function OnboardingForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(onboardingAction, INITIAL);
  const [household, setHousehold] = useState(initial?.household_type ?? '');

  const isFamilyWithKids = household === 'family_with_kids';

  const checked = (arr: string[] | null | undefined, v: string) => !!arr?.includes(v);
  const err = state?.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <Section
        title="Yaşam tarzın"
        desc="AI hangi tür önerilerin uyacağını anlasın diye."
      >
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Yaşam tarzı</legend>
          {HOUSEHOLD_TYPES.map((opt) => (
            <ChipRadio
              key={opt.slug}
              name="household_type"
              value={opt.slug}
              label={opt.label}
              checked={household === opt.slug}
              onChange={setHousehold}
            />
          ))}
        </fieldset>

        {isFamilyWithKids ? (
          <fieldset className="mt-4 flex flex-col gap-2">
            <legend className="text-muted-foreground text-sm">Çocuklarının yaş grupları</legend>
            <div className="flex flex-wrap gap-2">
              {KIDS_AGE_GROUPS.map((g) => (
                <ChipCheckbox
                  key={g.slug}
                  name="kids_age_groups"
                  value={g.slug}
                  label={g.label}
                  defaultChecked={checked(initial?.kids_age_groups, g.slug)}
                />
              ))}
            </div>
          </fieldset>
        ) : null}
      </Section>

      <Section title="Nerede yaşıyorsun?" desc="Sana yakın fırsatları öne çıkaralım.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">Şehir</Label>
            <select
              id="city"
              name="city"
              defaultValue={initial?.city ?? 'İstanbul'}
              className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-11 rounded-md border px-3.5 text-sm focus:ring-2 focus:outline-none"
            >
              {SUPPORTED_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="district">Semt (opsiyonel)</Label>
            <Input
              id="district"
              name="district"
              type="text"
              defaultValue={initial?.district ?? ''}
              placeholder="Örn. Kadıköy, Çankaya"
              maxLength={50}
            />
          </div>
        </div>
      </Section>

      <Section title="Tipik bütçen" desc="Uçtan uca aralık ver, AI seçimleri buna göre yapsın.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget_min">En az (₺)</Label>
            <Input
              id="budget_min"
              name="budget_min"
              type="number"
              min={0}
              step={50}
              defaultValue={initial?.budget_min ?? ''}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget_max">En çok (₺)</Label>
            <Input
              id="budget_max"
              name="budget_max"
              type="number"
              min={0}
              step={50}
              defaultValue={initial?.budget_max ?? ''}
              placeholder="2000"
              aria-invalid={err?.budget_max ? 'true' : undefined}
            />
            {err?.budget_max ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{err.budget_max[0]}</p>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="Hangi kategoriler ilgini çekiyor?" desc="Çoklu seç. Boş bırakırsan AI hepsini eşit değerlendirir.">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">İlgi alanları</legend>
          {MAIN_CATEGORIES.map((c) => (
            <ChipCheckbox
              key={c.slug}
              name="interests"
              value={c.slug}
              label={c.name}
              defaultChecked={checked(initial?.interests, c.slug)}
            />
          ))}
        </fieldset>
      </Section>

      <Section title="Beslenme tercihlerin" desc="Diyet kısıtlarına uymayan fırsatlar gizlenir.">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Beslenme</legend>
          {DIETARY.map((d) => (
            <ChipCheckbox
              key={d.slug}
              name="dietary"
              value={d.slug}
              label={d.label}
              defaultChecked={checked(initial?.dietary, d.slug)}
            />
          ))}
        </fieldset>
      </Section>

      <Section
        title="Sevmediğin şeyler"
        desc="Hızlı seç ya da kendi notunu yaz — AI önerileri bunlardan uzak duracak."
      >
        <DislikesField initial={initial?.dislikes ?? []} />
      </Section>

      <Section title="Birkaç pratik soru daha" desc="AI önerilerini daha keskin yapsın diye.">
        <div className="flex flex-col gap-5">
          <TriRadio
            name="has_car"
            label="Araba var mı?"
            initial={
              initial?.has_car === true ? 'yes' : initial?.has_car === false ? 'no' : ''
            }
            options={[
              { value: 'yes', label: 'Var' },
              { value: 'no', label: 'Yok' },
            ]}
          />
          <TriRadio
            name="has_pet"
            label="Evcil hayvanın var mı?"
            initial={
              initial?.has_pet === true ? 'yes' : initial?.has_pet === false ? 'no' : ''
            }
            options={[
              { value: 'yes', label: 'Var' },
              { value: 'no', label: 'Yok' },
            ]}
          />
          <TriRadio
            name="time_preference"
            label="Hangi günler daha uygunsun?"
            initial={
              initial?.time_preference === 'weekday' ||
              initial?.time_preference === 'weekend' ||
              initial?.time_preference === 'any'
                ? initial.time_preference
                : ''
            }
            options={[
              { value: 'weekday', label: 'Hafta içi' },
              { value: 'weekend', label: 'Hafta sonu' },
              { value: 'any', label: 'Fark etmez' },
            ]}
          />
        </div>
      </Section>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="border-border flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          name="intent"
          value="skip"
          variant="ghost"
          size="md"
          disabled={pending}
        >
          Şimdilik atla
        </Button>
        <Button
          type="submit"
          name="intent"
          value="save"
          variant="primary"
          size="lg"
          disabled={pending}
        >
          {pending ? 'Kaydediliyor…' : 'Tamamla ve devam et'}
        </Button>
      </div>
    </form>
  );
}

/**
 * Sevmediği şeyler için hibrit alan — sık önerilen chip'ler + serbest metin.
 * Submit'te `dislike_picks` (checkbox) ve `dislikes_extra` (input) ayrı
 * gelir; action katmanı ikisini birleştirip array olarak kaydeder.
 */
// Türkçe label'lar doğrudan kaydedilir — AI'ya gönderildiğinde doğal okunur
// ("sevmediği: kalabalık, sigaralı ortam"). Slug yerine label tutmak hem
// preferences.ts'in render kodunu basit tutar hem AI prompt'unda nüans korur.
const SUGGESTED_DISLIKES = [
  'Kalabalık',
  'Gürültülü',
  'Çok pahalı',
  'Geç saat',
  'Sigaralı ortam',
  'Park sorunu',
  'Fast food',
  'Çocuk dostu değil',
  'Sadece kapalı mekan',
  'Sıra/bekleme',
];

const SUGGESTED_SET = new Set(SUGGESTED_DISLIKES);

function DislikesField({ initial }: { initial: string[] }) {
  // Mevcut dislikes'ı pick'lere ve extra metne ayır
  const pickedDefaults = initial.filter((v) => SUGGESTED_SET.has(v));
  const extraDefaults = initial
    .filter((v) => !SUGGESTED_SET.has(v))
    .join(', ');

  return (
    <div className="flex flex-col gap-3">
      <fieldset>
        <legend className="sr-only">Sık seçilen tercihler</legend>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_DISLIKES.map((d) => (
            <ChipCheckbox
              key={d}
              name="dislike_picks"
              value={d}
              label={d}
              defaultChecked={pickedDefaults.includes(d)}
            />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dislikes_extra" className="text-muted-foreground text-xs">
          Aklındakini yaz — virgülle birden çok
        </Label>
        <Input
          id="dislikes_extra"
          name="dislikes_extra"
          type="text"
          defaultValue={extraDefaults}
          placeholder="Örn. sushi, lavanta kokusu, çok loş aydınlatma"
          maxLength={500}
        />
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section>
      <header className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
      </header>
      {children}
    </section>
  );
}

function ChipCheckbox({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className={cn(
          'border-border bg-background hover:border-foreground/30 inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
          'peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground',
          'peer-focus-visible:ring-foreground/30 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
        )}
      >
        {label}
      </span>
    </label>
  );
}

/**
 * "Yes/No/Skip" tarzı küçük chip grup — atlamak için hiçbir seçeneği
 * işaretlemeyebilirsin. Default uncontrolled, native radio davranışı.
 */
function TriRadio({
  name,
  label,
  initial,
  options,
}: {
  name: string;
  label: string;
  initial: string;
  options: { value: string; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              defaultChecked={initial === opt.value}
              className="peer sr-only"
            />
            <span
              className={cn(
                'border-border bg-background hover:border-foreground/30 inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                'peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground',
                'peer-focus-visible:ring-foreground/30 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
              )}
            >
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ChipRadio({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        className="peer sr-only"
      />
      <span
        className={cn(
          'border-border bg-background hover:border-foreground/30 inline-block rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
          'peer-checked:bg-foreground peer-checked:text-background peer-checked:border-foreground',
          'peer-focus-visible:ring-foreground/30 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
        )}
      >
        {label}
      </span>
    </label>
  );
}
