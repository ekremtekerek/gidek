import { z } from 'zod';

export const emailSchema = z
  .string({ message: 'E-posta adresi gerekli' })
  .trim()
  .toLowerCase()
  .email('Geçerli bir e-posta adresi gir');

export const passwordSchema = z
  .string({ message: 'Şifre gerekli' })
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(72, 'Şifre çok uzun');

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'En az 2 karakter')
  .max(50, 'En fazla 50 karakter')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

/** Trim, return undefined for empty string. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalNumber = z
  .string()
  .trim()
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return undefined;
    return n;
  });

export const HOUSEHOLD_VALUES = [
  'single',
  'couple',
  'family_with_kids',
  'family_no_kids',
  'friends',
] as const;

export const KIDS_AGE_VALUES = ['0-3', '4-6', '7-12', 'teen'] as const;
export const DIETARY_VALUES = ['vejetaryen', 'vegan', 'helal', 'glutensiz', 'alkolsuz'] as const;

export const onboardingSchema = z
  .object({
    city: optionalText(50),
    district: optionalText(50),
    household_type: z
      .string()
      .optional()
      .transform((v) => (HOUSEHOLD_VALUES.includes(v as never) ? (v as (typeof HOUSEHOLD_VALUES)[number]) : undefined)),
    kids_age_groups: z
      .array(z.enum(KIDS_AGE_VALUES))
      .optional()
      .default([]),
    budget_min: optionalNumber,
    budget_max: optionalNumber,
    interests: z.array(z.string().trim().min(1).max(50)).optional().default([]),
    dietary: z.array(z.enum(DIETARY_VALUES)).optional().default([]),
    dislikes: z.array(z.string().trim().min(1).max(50)).optional().default([]),
    // Genişletilmiş profil — atlanabilir.
    has_car: z
      .union([z.literal('yes'), z.literal('no'), z.literal('')])
      .optional()
      .transform((v) => (v === 'yes' ? true : v === 'no' ? false : undefined)),
    has_pet: z
      .union([z.literal('yes'), z.literal('no'), z.literal('')])
      .optional()
      .transform((v) => (v === 'yes' ? true : v === 'no' ? false : undefined)),
    time_preference: z
      .union([z.literal('weekday'), z.literal('weekend'), z.literal('any'), z.literal('')])
      .optional()
      .transform((v) =>
        v === 'weekday' || v === 'weekend' || v === 'any' ? v : undefined,
      ),
  })
  .superRefine((data, ctx) => {
    if (
      data.budget_min !== undefined &&
      data.budget_max !== undefined &&
      data.budget_min > data.budget_max
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['budget_max'],
        message: 'Üst bütçe alt bütçeden küçük olamaz',
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createBookingSchema = z
  .object({
    dealId: z.string().uuid('Geçersiz fırsat tanımlayıcısı'),
    quantity: z.coerce
      .number()
      .int('Adet tamsayı olmalı')
      .min(1, 'En az 1 adet')
      .max(20, 'En fazla 20 adet'),
    selected_date: z
      .string()
      .regex(isoDateRegex, 'Tarih formatı geçersiz')
      .refine((d) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(`${d}T00:00:00`) >= today;
      }, 'Tarih geçmişte olamaz'),
    selected_time: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .refine((v) => v === undefined || timeRegex.test(v), { message: 'Saat formatı HH:MM olmalı' }),
    notes: optionalText(500),
    is_gift: z
      .union([z.literal('on'), z.literal('true'), z.literal(''), z.null(), z.undefined()])
      .transform((v) => v === 'on' || v === 'true'),
    gift_recipient_name: optionalText(80),
    gift_recipient_email: z
      .string()
      .trim()
      .email('Geçerli e-posta')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    gift_recipient_phone: optionalText(30),
    gift_message: optionalText(500),
    insurance: z
      .union([z.literal('on'), z.literal('true'), z.literal(''), z.null(), z.undefined()])
      .transform((v) => v === 'on' || v === 'true'),
  })
  .superRefine((data, ctx) => {
    if (data.is_gift) {
      // Hediye seçildiyse alıcı adı + (telefon VEYA e-posta) en az biri zorunlu
      if (!data.gift_recipient_name) {
        ctx.addIssue({
          code: 'custom',
          path: ['gift_recipient_name'],
          message: 'Alıcının adı zorunlu',
        });
      }
      if (!data.gift_recipient_email && !data.gift_recipient_phone) {
        ctx.addIssue({
          code: 'custom',
          path: ['gift_recipient_phone'],
          message: 'Alıcının e-posta veya telefonundan en az biri',
        });
      }
    }
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const createReviewSchema = z.object({
  dealId: z.string().uuid('Geçersiz fırsat tanımlayıcısı'),
  rating: z.coerce
    .number()
    .int('Puan tamsayı olmalı')
    .min(1, 'En az 1 yıldız')
    .max(5, 'En fazla 5 yıldız'),
  body: z
    .string()
    .trim()
    .min(5, 'En az 5 karakter')
    .max(1000, 'En fazla 1000 karakter'),
  displayName: z
    .string()
    .trim()
    .min(2, 'En az 2 karakter')
    .max(50, 'En fazla 50 karakter')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(2, 'En az 2 karakter')
    .max(50, 'En fazla 50 karakter')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .or(z.literal('').transform(() => null)),
  phone: z
    .string()
    .trim()
    .max(20, 'En fazla 20 karakter')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .or(z.literal('').transform(() => null)),
  public_slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'En az 3 karakter')
    .max(30, 'En fazla 30 karakter')
    .regex(/^[a-z0-9_-]+$/, 'Yalnızca küçük harf, rakam, _ ve - kullanılabilir')
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .or(z.literal('').transform(() => null)),
  is_public: z
    .union([z.literal('on'), z.literal('true'), z.literal(''), z.null(), z.undefined()])
    .transform((v) => v === 'on' || v === 'true'),
  share_attendance: z
    .union([z.literal('on'), z.literal('true'), z.literal(''), z.null(), z.undefined()])
    .transform((v) => v === 'on' || v === 'true'),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/** Map bounds query params — string'den number'a parse + sınırlandırma. */
const coord = (min: number, max: number) =>
  z.coerce.number().refine((v) => Number.isFinite(v) && v >= min && v <= max, {
    message: 'Geçersiz koordinat',
  });

export const boundsQuerySchema = z
  .object({
    swLat: coord(-90, 90),
    swLng: coord(-180, 180),
    neLat: coord(-90, 90),
    neLng: coord(-180, 180),
  })
  .refine((b) => b.neLat > b.swLat && b.neLng > b.swLng, {
    message: 'Bbox tersine çevrilmiş',
  });

export type BoundsQuery = z.infer<typeof boundsQuerySchema>;
