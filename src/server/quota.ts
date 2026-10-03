export type Plan = 'free' | 'pro';

export const AI_LIMIT_FREE = 3;
export const AI_LIMIT_PRO = 50;

/**
 * The plan is always derived from `pro_until`, never from the cached
 * `profiles.plan` column, so a stale cache can never grant paid features.
 */
export function resolvePlan(proUntil: string | null, now: Date = new Date()): Plan {
  if (!proUntil) return 'free';
  const ts = Date.parse(proUntil);
  if (Number.isNaN(ts)) return 'free';
  return ts > now.getTime() ? 'pro' : 'free';
}

export function aiLimit(plan: Plan): number {
  return plan === 'pro' ? AI_LIMIT_PRO : AI_LIMIT_FREE;
}

/** Calendar day in Asia/Ho_Chi_Minh as YYYY-MM-DD. */
export function dayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function quotaError(
  plan: Plan,
  used: number,
  limit: number,
  loggedIn: boolean,
): { status: number; body: Record<string, unknown> } {
  return {
    status: 429,
    body:
      plan === 'pro'
        ? {
            code: 'AI_LIMIT_PRO',
            used,
            limit,
            message: 'Bạn đã dùng hết lượt AI hôm nay. Hãy thử lại ngày mai.',
          }
        : {
            code: 'AI_LIMIT_FREE',
            used,
            limit,
            upgrade: loggedIn,
            message: 'Bạn đã dùng hết 3 lượt AI miễn phí hôm nay.',
          },
  };
}