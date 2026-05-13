import 'server-only';

/**
 * Cloudflare Turnstile token doğrulaması — bot trafiğini elemek için
 * anonim AI sohbet ve signup formlarında kullanılır.
 *
 * Env:
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY (frontend)
 * - TURNSTILE_SECRET_KEY (server)
 *
 * Secret yoksa verify "kapalı" sayılır → her zaman pass döner. Bu
 * sayede yerel/dev'de Turnstile setup'sız çalışmaya devam eder; prod'a
 * secret koyunca otomatik aktive olur.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  ok: boolean;
  /** Turnstile devre dışıysa (secret yok) true; gerçek doğrulama yapılmadı. */
  disabled: boolean;
  /** Hata kodları (Cloudflare cevabından). */
  errorCodes?: string[];
}

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { ok: true, disabled: true };
  }
  if (!token || typeof token !== 'string' || token.length < 8) {
    return { ok: false, disabled: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      return { ok: false, disabled: false, errorCodes: [`http-${res.status}`] };
    }
    const data = (await res.json()) as {
      success?: boolean;
      'error-codes'?: string[];
    };
    return {
      ok: Boolean(data.success),
      disabled: false,
      errorCodes: data['error-codes'],
    };
  } catch {
    // Network/timeout — fail-closed (true negatif).
    return { ok: false, disabled: false, errorCodes: ['network'] };
  }
}
