import { describe, it, expect } from 'vitest';
import { createHmac, createHash } from 'crypto';
import {
  verifyChecksum,
  signPaymentRequest,
  extendProUntil,
  makeOrderCode,
  PLANS,
  MONTH_DAYS,
  YEAR_DAYS,
} from '../payos';

const hmac = (payload: string, key: string) =>
  createHmac('sha256', key).update(payload).digest('hex');

describe('signPaymentRequest', () => {
  const params = {
    orderCode: 123,
    amount: 79000,
    description: 'LS Pro T',
    cancelUrl: 'https://delyai.app/pricing?cancelled=1',
    returnUrl: 'https://delyai.app/account?paid=1',
  };

  it('produces the HMAC-SHA256 of alphabetically sorted k=v pairs', () => {
    const expected = hmac(
      'amount=79000&cancelUrl=https://delyai.app/pricing?cancelled=1&description=LS Pro T&orderCode=123&returnUrl=https://delyai.app/account?paid=1',
      'secret',
    );
    expect(signPaymentRequest(params, 'secret')).toBe(expected);
  });

  it('changes when any signed field changes', () => {
    const base = signPaymentRequest(params, 'secret');
    expect(signPaymentRequest({ ...params, amount: 1 }, 'secret')).not.toBe(base);
    expect(signPaymentRequest({ ...params, returnUrl: 'https://evil.example' }, 'secret')).not.toBe(base);
  });

  it('changes when the key changes', () => {
    expect(signPaymentRequest(params, 'other')).not.toBe(signPaymentRequest(params, 'secret'));
  });
});

describe('verifyChecksum', () => {
  const data = { orderCode: '123', amount: '79000', status: 'PAID' };
  const payload = 'amount=79000&orderCode=123&status=PAID';

  it('accepts a correct HMAC signature', () => {
    expect(verifyChecksum(data, hmac(payload, 'secret'), 'secret')).toBe(true);
  });

  it('rejects the old wrong scheme: a bare sha256 of payload+key', () => {
    // This is what the first implementation did. It must never verify, otherwise
    // anyone who knew the payload shape could forge a payment.
    const legacy = createHash('sha256').update(payload + 'secret').digest('hex');
    expect(legacy).not.toBe(hmac(payload, 'secret'));
    expect(verifyChecksum(data, legacy, 'secret')).toBe(false);
  });

  it('rejects a signature of an all-ones hex string', () => {
    expect(verifyChecksum(data, 'a'.repeat(64), 'secret')).toBe(false);
  });

  it('rejects a signature made with the wrong key', () => {
    expect(verifyChecksum(data, hmac(payload, 'other'), 'secret')).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const tampered = { ...data, amount: '1' };
    expect(verifyChecksum(tampered, hmac(payload, 'secret'), 'secret')).toBe(false);
  });

  it('rejects everything when no key is configured', () => {
    expect(verifyChecksum(data, hmac(payload, 'secret'), '')).toBe(false);
  });

  it('rejects a signature of the wrong length without throwing', () => {
    expect(verifyChecksum(data, 'abc', 'secret')).toBe(false);
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

  it('keeps descriptions within the 9-character payOS limit', () => {
    expect(PLANS.monthly.description.length).toBeLessThanOrEqual(9);
    expect(PLANS.yearly.description.length).toBeLessThanOrEqual(9);
  });
});