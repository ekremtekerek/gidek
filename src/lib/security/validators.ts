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
