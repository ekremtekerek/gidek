/**
 * Loyalty tier'lar — puan eşiklerinden seviye + ilerleme hesabı.
 *
 * Eşikler:
 *   0-29:  Bronz
 *   30-99: Gümüş
 *   100+:  Altın
 */

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

export interface LoyaltyState {
  points: number;
  tier: LoyaltyTier;
  label: string;
  emoji: string;
  /** Sonraki tier'a kalan puan; en üst tier'daysa null */
  pointsToNext: number | null;
  /** Mevcut tier eşiği — progress bar başlangıcı */
  currentTierMin: number;
  /** Bir sonraki tier eşiği — progress bar bitişi; en üst tier'daysa null */
  nextTierMin: number | null;
}

const TIERS: { tier: LoyaltyTier; min: number; label: string; emoji: string }[] = [
  { tier: 'bronze', min: 0,   label: 'Bronz', emoji: '🥉' },
  { tier: 'silver', min: 30,  label: 'Gümüş', emoji: '🥈' },
  { tier: 'gold',   min: 100, label: 'Altın', emoji: '🥇' },
];

export function loyaltyState(points: number): LoyaltyState {
  const safePoints = Math.max(0, Math.floor(points));
  let currentIdx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (safePoints >= TIERS[i].min) {
      currentIdx = i;
      break;
    }
  }
  const current = TIERS[currentIdx];
  const next = TIERS[currentIdx + 1] ?? null;

  return {
    points: safePoints,
    tier: current.tier,
    label: current.label,
    emoji: current.emoji,
    pointsToNext: next ? next.min - safePoints : null,
    currentTierMin: current.min,
    nextTierMin: next?.min ?? null,
  };
}

/** Her booking için kazanılan puan — RPC ile aynı (10 puan). */
export const POINTS_PER_BOOKING = 10;
