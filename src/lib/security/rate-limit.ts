import 'server-only';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { getServiceClient } from '@/lib/db/service';

const ANON_DAILY_LIMIT = Number(process.env.AI_ANON_DAILY_LIMIT ?? 2);
const USER_DAILY_LIMIT = Number(process.env.AI_USER_DAILY_LIMIT ?? 30);
const IP_HASH_SALT = process.env.IP_HASH_SALT ?? 'gidek-v1-rate-limit-salt';

export type RateLimitOk = {
  allowed: true;
  remaining: number;
  identifier: { userId: string | null; ipHash: string };
};

export type RateLimitBlocked = {
  allowed: false;
  code: 'RATE_LIMITED' | 'SIGNUP_REQUIRED';
  message: string;
  ipHash: string;
};

export type RateLimitResult = RateLimitOk | RateLimitBlocked;

function hashIp(ip: string): string {
  return createHash('sha256').update(`${IP_HASH_SALT}:${ip}`).digest('hex');
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = h.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/**
 * Returns whether the caller may run another AI query today.
 * Anonymous: 2/day per hashed IP. Authenticated: 30/day per user.
 * Both successful and previously-rate-limited queries count toward the bucket.
 */
export async function checkAiRateLimit(userId: string | null): Promise<RateLimitResult> {
  const ip = await getClientIp();
  const ipHash = hashIp(ip);
  const supabase = getServiceClient();

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  let query = supabase
    .from('ai_query_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString())
    .in('status', ['success', 'rate_limited']);

  query = userId ? query.eq('user_id', userId) : query.eq('ip_hash', ipHash);

  const { count, error } = await query;
  if (error) throw error;

  const used = count ?? 0;
  const limit = userId ? USER_DAILY_LIMIT : ANON_DAILY_LIMIT;

  if (used >= limit) {
    return {
      allowed: false,
      ipHash,
      code: userId ? 'RATE_LIMITED' : 'SIGNUP_REQUIRED',
      message: userId
        ? 'Günlük sorgu limitin doldu. Yarın tekrar dene veya destek ile iletişime geç.'
        : 'Ücretsiz sorgu hakkın bugünlük doldu. Sınırsız öneri için ücretsiz üye ol.',
    };
  }

  return {
    allowed: true,
    remaining: limit - used - 1,
    identifier: { userId, ipHash },
  };
}
