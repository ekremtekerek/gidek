import 'server-only';
import { Resend } from 'resend';

export interface EmailEnvelope {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Email gönderici.
 * - RESEND_API_KEY varsa Resend üzerinden gerçek gönderim.
 * - Yoksa stdout'a mock log basar (dev/local için).
 *
 * Çağıran kod aynı kalır; provider değiştirmek tek dosya işi.
 *
 * Env:
 * - RESEND_API_KEY: Resend API anahtarı (https://resend.com)
 * - EMAIL_FROM: "Gönderen Adı <noreply@domain.com>" formatında. Yoksa
 *   "gidek.net <onboarding@resend.dev>" fallback (test domain).
 */
const FROM_FALLBACK = 'gidek.net <onboarding@resend.dev>';

let cached: Resend | null = null;
function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export async function sendEmail(envelope: EmailEnvelope): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // Provider yok → dev/local mock log.
    console.log('\n──────── 📧 MOCK EMAIL ────────');
    console.log(`To:      ${envelope.to}`);
    console.log(`Subject: ${envelope.subject}`);
    console.log('──');
    for (const line of envelope.text.split('\n')) console.log(line);
    console.log('────────────────────────────────\n');
    return;
  }

  const from = process.env.EMAIL_FROM ?? FROM_FALLBACK;
  try {
    const { error } = await resend.emails.send({
      from,
      to: envelope.to,
      subject: envelope.subject,
      text: envelope.text,
      ...(envelope.html ? { html: envelope.html } : {}),
    });
    if (error) {
      console.error('[email] resend error:', error);
    }
  } catch (err) {
    console.error('[email] send threw:', err);
  }
}
