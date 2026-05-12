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
    dislikes: optionalText(500),
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
