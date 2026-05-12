/**
 * Toast key registry for server-action redirects.
 *
 * Server actions can't directly trigger a client toast, so they redirect
 * with a `?toast=<key>` query param; <ToastBridge> reads it and fires the
 * matching message before clearing the param.
 */
export const TOAST_KEYS = {
  loginSuccess: 'login-success',
  signupSuccess: 'signup-success',
  logoutSuccess: 'logout-success',
  profileUpdated: 'profile-updated',
  avatarUpdated: 'avatar-updated',
  avatarRemoved: 'avatar-removed',
  onboardingDone: 'onboarding-done',
  bookingCreated: 'booking-created',
  paymentSuccess: 'payment-success',
  passwordUpdated: 'password-updated',
} as const;

export type ToastKey = (typeof TOAST_KEYS)[keyof typeof TOAST_KEYS];

/**
 * Append `?toast=<key>` (or `&toast=<key>`) to a path safely.
 */
export function withToast(path: string, key: ToastKey): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}toast=${encodeURIComponent(key)}`;
}
