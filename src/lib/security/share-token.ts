import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Wishlist gibi public-share linkler için HMAC-SHA256 imzalı token.
 * Format: `<base64url(payload)>.<base64url(sig)>`.
 * Payload: `<userId>:<purpose>` (örn. "abc-uuid:wishlist").
 *
 * Secret: SHARE_TOKEN_SECRET (env). Yoksa NEXTAUTH_SECRET veya SUPABASE_JWT
 * yedek olarak kullanılır; hiçbiri yoksa public share devre dışı.
 */

function getSecret(): string {
  const key =
    process.env.SHARE_TOKEN_SECRET ??
    process.env.SUPABASE_JWT_SECRET ??
    '';
  if (!key) {
    throw new Error('SHARE_TOKEN_SECRET tanımlı değil');
  }
  return key;
}

function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', getSecret()).update(payload).digest());
}

export function createShareToken(args: { userId: string; purpose: string }): string {
  const payload = `${args.userId}:${args.purpose}`;
  const payloadB64 = b64url(Buffer.from(payload, 'utf8'));
  const sig = sign(payload);
  return `${payloadB64}.${sig}`;
}

export interface DecodedShareToken {
  userId: string;
  purpose: string;
}

export function verifyShareToken(
  token: string,
  expectedPurpose?: string,
): DecodedShareToken | null {
  const dot = token.indexOf('.');
  if (dot < 1 || dot >= token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let payload: string;
  try {
    payload = fromB64url(payloadB64).toString('utf8');
  } catch {
    return null;
  }

  const colon = payload.indexOf(':');
  if (colon < 1) return null;
  const userId = payload.slice(0, colon);
  const purpose = payload.slice(colon + 1);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  if (expectedPurpose && purpose !== expectedPurpose) return null;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = fromB64url(sign(payload));
    actual = fromB64url(sigB64);
  } catch {
    return null;
  }
  if (expected.length !== actual.length) return null;
  if (!timingSafeEqual(expected, actual)) return null;

  return { userId, purpose };
}
