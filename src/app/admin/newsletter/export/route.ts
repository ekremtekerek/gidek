import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

/**
 * Newsletter abone listesi CSV indirme — admin için. Excel uyumluluğu için
 * UTF-8 BOM ile başlar. Servis-role kullanır (RLS bypass).
 */
export async function GET() {
  await requireAdmin();

  const supabase = getServiceClient();
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('email, source, subscribed_at, confirmed_at, unsubscribed_at')
    .order('subscribed_at', { ascending: false });

  const rows = data ?? [];
  const header = ['email', 'source', 'subscribed_at', 'confirmed_at', 'unsubscribed_at'];
  const escape = (v: string | null) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const body =
    '﻿' +
    header.join(',') +
    '\n' +
    rows
      .map((r) =>
        [r.email, r.source, r.subscribed_at, r.confirmed_at, r.unsubscribed_at]
          .map(escape)
          .join(','),
      )
      .join('\n');

  const filename = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
