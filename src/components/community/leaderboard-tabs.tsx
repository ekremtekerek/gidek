'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User as UserIcon } from 'lucide-react';
import type { Champion } from '@/lib/db/queries/community';
import { cn } from '@/lib/utils/cn';

type Period = 'weekly' | 'monthly' | 'yearly';

interface Props {
  weekly: Champion[];
  monthly: Champion[];
  yearly: Champion[];
}

const TABS: Array<{ key: Period; label: string; windowLabel: string }> = [
  { key: 'weekly',  label: 'Haftalık', windowLabel: '7 günde' },
  { key: 'monthly', label: 'Aylık',    windowLabel: '30 günde' },
  { key: 'yearly',  label: 'Yıllık',   windowLabel: '365 günde' },
];

export function LeaderboardTabs({ weekly, monthly, yearly }: Props) {
  const [period, setPeriod] = useState<Period>('weekly');

  const data = period === 'weekly' ? weekly : period === 'monthly' ? monthly : yearly;
  const tab = TABS.find((t) => t.key === period)!;

  return (
    <div>
      {/* Sekmeler */}
      <div
        role="tablist"
        aria-label="Liderlik dönemi"
        className="border-border bg-muted/40 inline-flex rounded-full border p-1"
      >
        {TABS.map((t) => {
          const active = t.key === period;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setPeriod(t.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {data.length === 0 ? (
          <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center text-sm">
            Bu dönem için henüz şampiyon yok — bir rezervasyon yap, sen lider ol!
          </p>
        ) : period === 'weekly' ? (
          <ChampionPodium champions={data} windowLabel={tab.windowLabel} />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {data.map((c, idx) => (
              <li key={c.id}>
                <ChampionRow rank={idx + 1} champion={c} windowLabel={tab.windowLabel} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ChampionPodium({
  champions,
  windowLabel,
}: {
  champions: Champion[];
  windowLabel: string;
}) {
  const [first, second, third] = champions;
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {champions.map((c, idx) => (
          <ChampionRow key={c.id} rank={idx + 1} champion={c} windowLabel={windowLabel} />
        ))}
      </div>
      <div className="hidden grid-cols-3 items-end gap-3 sm:grid">
        {second ? (
          <PodiumCard champion={second} rank={2} height="md" windowLabel={windowLabel} />
        ) : (
          <div />
        )}
        {first ? (
          <PodiumCard champion={first} rank={1} height="lg" windowLabel={windowLabel} />
        ) : (
          <div />
        )}
        {third ? (
          <PodiumCard champion={third} rank={3} height="sm" windowLabel={windowLabel} />
        ) : (
          <div />
        )}
      </div>
    </>
  );
}

function PodiumCard({
  champion,
  rank,
  height,
  windowLabel,
}: {
  champion: Champion;
  rank: 1 | 2 | 3;
  height: 'sm' | 'md' | 'lg';
  windowLabel: string;
}) {
  const heightCls =
    height === 'lg' ? 'pt-10 pb-6' : height === 'md' ? 'pt-8 pb-5' : 'pt-7 pb-4';
  const rankColor =
    rank === 1
      ? 'from-amber-500 to-yellow-400'
      : rank === 2
        ? 'from-slate-400 to-slate-300'
        : 'from-orange-500 to-orange-400';
  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';

  return (
    <Link
      href={`/u/${champion.publicSlug}`}
      className={cn(
        'border-border bg-background hover:border-foreground/30 group relative flex flex-col items-center gap-2 rounded-2xl border text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg',
        heightCls,
        rank === 1 ? 'ring-2 ring-amber-400/40' : null,
      )}
    >
      <span
        className={cn(
          'absolute -top-3 inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br text-base shadow-md ring-2 ring-background',
          rankColor,
        )}
        aria-hidden="true"
      >
        {medalEmoji}
      </span>
      <Avatar champion={champion} size={height === 'lg' ? 'lg' : 'md'} />
      <p className="line-clamp-1 px-2 text-sm font-semibold">{champion.displayName}</p>
      <p className="text-muted-foreground text-[11px]">@{champion.publicSlug}</p>
      <p className="border-border mt-1 rounded-full border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium tabular-nums">
        {champion.windowBookings} · {windowLabel}
      </p>
    </Link>
  );
}

function ChampionRow({
  rank,
  champion,
  windowLabel,
}: {
  rank: number;
  champion: Champion;
  windowLabel: string;
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
  return (
    <Link
      href={`/u/${champion.publicSlug}`}
      className="border-border bg-background hover:border-foreground/30 flex items-center gap-3 rounded-xl border p-3 transition-colors"
    >
      <span aria-hidden="true" className="text-xl">
        {medal}
      </span>
      <Avatar champion={champion} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-semibold">{champion.displayName}</p>
        <p className="text-muted-foreground text-[11px]">@{champion.publicSlug}</p>
      </div>
      <span className="text-right">
        <p className="text-sm font-bold tabular-nums">{champion.windowBookings}</p>
        <p className="text-muted-foreground text-[10px]">{windowLabel}</p>
      </span>
    </Link>
  );
}

function Avatar({
  champion,
  size,
}: {
  champion: Champion;
  size: 'sm' | 'md' | 'lg';
}) {
  const cls = size === 'lg' ? 'size-20' : size === 'md' ? 'size-16' : 'size-10';
  const initials = champion.displayName
    .split(/[\s@.]+/)
    .map((p: string) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'bg-muted text-foreground inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        cls,
        size === 'lg' ? 'text-lg' : size === 'md' ? 'text-base' : 'text-xs',
      )}
    >
      {champion.avatarUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={champion.avatarUrl}
          alt={champion.displayName}
          className="size-full object-cover"
        />
      ) : (
        initials || <UserIcon className="size-5" aria-hidden="true" />
      )}
    </span>
  );
}
