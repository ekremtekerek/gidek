'use server';

import { signInAction } from '@/app/giris/actions';

/**
 * Form-binding wrapper — useActionState'siz direkt form submit için.
 * Persona kartında prev-state'e gerek olmadığından sade bir adapter.
 */
export async function signInAsDemoAction(formData: FormData) {
  await signInAction(null, formData);
}
