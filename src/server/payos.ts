import { createHash } from 'crypto';

export const MONTH_DAYS = 30;
export const YEAR_DAYS = 365;

export const PLANS = {
  monthly: { amount: 79000, days: MONTH_DAYS, description: 'LS Pro 1 thang' },
  yearly: { amount: 790000, days: YEAR_DAYS, description: 'LS Pro 1 nam' },
} as const;

export type PlanKind = keyof typeof PLANS;

export function verifyChecksum(
  data: Record<string, string>,
  checksum: string,
  key: string,
): boolean {
  if (!key || !checksum) return false;
  const payload =
    Object.keys(data)
      .sort()
      .map((k) => `${k}=${data[k]}`)
      .join('&') + key;
  const expected = createHash('sha256').update(payload).digest('hex');
  return expected === checksum;
}

/**
 * Paid days always extend the remaining time instead of resetting it, so a
 * member who renews early keeps the days they already paid for.
 */
export function extendProUntil(base: Date | null, days: number, now: Date = new Date()): Date {
  const start = base && base.getTime() > now.getTime() ? base : now;
  return new Date(start.getTime() + days * 86_400_000);
}

/**
 * PayOS order code: a positive integer of at most 14 digits (their limit is 15).
 *
 * Composed as `<9-digit ms base><5-digit sequence>`. The base advances with the
 * clock and the sequence advances on every call, so two calls in the same
 * millisecond still get different codes.
 */
let seq = 0;

export function makeOrderCode(): number {
  const base = Date.now() % 1_000_000_000;
  seq = (seq + 1) % 100_000;
  return base * 100_000 + seq;
}