import { createHmac, timingSafeEqual } from 'crypto';

export const MONTH_DAYS = 30;
export const YEAR_DAYS = 365;

/**
 * payOS limits the description to 9 characters when the paying bank account is
 * not itself linked through payOS. 8 characters keeps us safely inside it.
 */
export const PLANS = {
  monthly: { amount: 79000, days: MONTH_DAYS, description: 'LS Pro T' },
  yearly: { amount: 790000, days: YEAR_DAYS, description: 'LS Pro N' },
} as const;

export type PlanKind = keyof typeof PLANS;

export const PAYOS_API_BASE = 'https://api-merchant.payos.vn';
export const CREATE_PAYMENT_PATH = '/v2/payment-requests';
export const GET_PAYMENT_PATH = '/v2/payment-requests';

/**
 * Sign the fields payOS cares about.
 *
 * payOS uses HMAC-SHA256 (not a bare hash) with the channel checksum key, over
 * the fields sorted alphabetically and joined as `k=v` pairs. Getting this
 * wrong is silent: requests are simply rejected as "signature không hợp lệ",
 * or a webhook is ignored.
 */
function signSorted(entries: Array<[string, string]>, key: string): string {
  const payload = entries
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return createHmac('sha256', key).update(payload).digest('hex');
}

/** Signature for POST /v2/payment-requests. */
export function signPaymentRequest(
  params: {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
  },
  key: string,
): string {
  return signSorted(
    [
      ['amount', String(params.amount)],
      ['cancelUrl', params.cancelUrl],
      ['description', params.description],
      ['orderCode', String(params.orderCode)],
      ['returnUrl', params.returnUrl],
    ],
    key,
  );
}

/**
 * Verify an incoming webhook signature. Same HMAC scheme over the `data`
 * object. Returns false whenever anything is missing or mismatched, including
 * when no checksum key is configured, so an unconfigured server never trusts a
 * payment.
 */
export function verifyChecksum(
  data: Record<string, string>,
  signature: string,
  key: string,
): boolean {
  if (!key || !signature) return false;
  const expected = signSorted(
    Object.entries(data).map(([k, v]) => [k, String(v)] as [string, string]),
    key,
  );
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
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