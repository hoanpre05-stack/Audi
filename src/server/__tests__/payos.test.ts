import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';
import {
  verifyChecksum,
  extendProUntil,
  makeOrderCode,
  PLANS,
  MONTH_DAYS,
  YEAR_DAYS,
} from '../payos';

const sign = (data: Record<string, string>, key: string) =>
  createHash('sha256')
    .update(
      Object.keys(data)
        .sort()
        .map((k) => `${k}=${data[k]}`)
        .join('&') + key,
    )
    .digest('hex');

describe('verifyChecksum', () => {
  const data = { orderCode: '123', amount: '79000', status: 'PAID' };

  it('accepts a correct checksum', () => {
    expect(verifyChecksum(data, sign(data, 'secret'), 'secret')).toBe(true);
  });

  it('rejects a checksum made with the wrong key', () => {
    expect(verifyChecksum(data, sign(data, 'other'), 'secret')).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const tampered = { ...data, amount: '1' };
    expect(verifyChecksum(tampered, sign(data, 'secret'), 'secret')).toBe(false);
  });

  it('rejects everything when no key is configured', () => {
    expect(verifyChecksum(data, 'anything', '')).toBe(false);
  });
});

describe('extendProUntil', () => {
  const now = new Date('2026-10-03T00:00:00Z');

  it('adds from now when there is no existing expiry', () => {
    expect(extendProUntil(null, MONTH_DAYS, now).toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });

  it('extends from the existing expiry when it is still in the future', () => {
    const base = new Date('2026-10-20T00:00:00Z');
    expect(extendProUntil(base, MONTH_DAYS, now).toISOString()).toBe('2026-11-19T00:00:00.000Z');
  });

  it('restarts from now when the existing expiry has lapsed', () => {
    const base = new Date('2026-09-01T00:00:00Z');
    expect(extendProUntil(base, MONTH_DAYS, now).toISOString()).toBe('2026-11-02T00:00:00.000Z');
  });

  it('adds a full year', () => {
    expect(YEAR_DAYS).toBe(365);
    expect(extendProUntil(null, YEAR_DAYS, now).toISOString()).toBe('2027-10-03T00:00:00.000Z');
  });
});

describe('makeOrderCode', () => {
  it('produces a positive integer of at most 15 digits', () => {
    const code = makeOrderCode();
    expect(Number.isInteger(code)).toBe(true);
    expect(code).toBeGreaterThan(0);
    expect(String(code).length).toBeLessThanOrEqual(15);
  });

  it('does not repeat within a tight loop', () => {
    const codes = new Set(Array.from({ length: 500 }, () => makeOrderCode()));
    expect(codes.size).toBeGreaterThan(490);
  });
});

describe('PLANS', () => {
  it('prices the documented products', () => {
    expect(PLANS.monthly.amount).toBe(79000);
    expect(PLANS.yearly.amount).toBe(790000);
    expect(PLANS.monthly.days).toBe(MONTH_DAYS);
    expect(PLANS.yearly.days).toBe(YEAR_DAYS);
  });
});