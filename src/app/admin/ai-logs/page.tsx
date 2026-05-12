import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getServiceClient } from '@/lib/db/service';
import { formatDate } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'AI sorguları · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'discount'> = {
  success: 'success',
  rate_limited: 'warning',
  circuit_broken: 'warning',
  error: 'discount',
};

export default async function AiLogsPage() {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('ai_query_logs')
    .select('id, status, query_text, model_used, duration_ms, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100);

  const logs = (data ?? []) as Array<{
    id: string;
    status: string;
    query_text: string | null;
    model_used: string | null;
    duration_ms: number | null;
    created_at: string;
    user_id: string | null;
  }>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Activity className="size-3.5" aria-hidden="true" />
            Observability
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">AI sorguları</h1>
          <p className="text-muted-foreground mt-1 text-sm">Son 100 kayıt</p>
        </div>
      </header>

      {logs.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Henüz log yok. Birkaç chat sorusu sor, burada görünecek.
        </p>
      ) : (
        <div className="border-border bg-background overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border bg-muted/40 text-muted-foreground border-b text-left text-xs">
                <th className="p-3 font-medium">Tarih</th>
                <th className="p-3 font-medium">Durum</th>
                <th className="p-3 font-medium">Sorgu</th>
                <th className="p-3 font-medium text-right">Süre</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-border border-b last:border-0 align-top">
                  <td className="p-3 align-top text-xs text-muted-foreground">
                    {formatDate(l.created_at)}
                    <br />
                    <span className="text-[10px]">
                      {new Date(l.created_at).toLocaleTimeString('tr-TR')}
                    </span>
                  </td>
                  <td className="p-3 align-top">
                    <Badge variant={STATUS_VARIANT[l.status] ?? 'default'} size="sm">
                      {l.status}
                    </Badge>
                    {l.user_id ? null : (
                      <p className="text-muted-foreground mt-1 text-[10px]">anonim</p>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <p className="line-clamp-2 text-sm">{l.query_text ?? '(boş)'}</p>
                    {l.model_used ? (
                      <p className="text-muted-foreground mt-0.5 text-[10px]">{l.model_used}</p>
                    ) : null}
                  </td>
                  <td className="p-3 align-top text-right tabular-nums">
                    {l.duration_ms !== null ? `${l.duration_ms} ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
