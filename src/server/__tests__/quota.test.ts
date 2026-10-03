import { describe, it, expect } from 'vitest';
import {
  resolvePlan,
  aiLimit,
  dayKey,
  quotaError,
  AI_LIMIT_FREE,
  AI_LIMIT_PRO,
} from '../quota';

describe('resolvePlan', () => {
  const now = new Date('2026-10-03T12:00:00Z');

  it('returns free when there is no expiry', () => {
    expect(resolvePlan(null, now)).toBe('free');
  });

  it('returns free when the expiry is in the past', () => {
    expect(resolvePlan('2026-10-01T00:00:00Z', now)).toBe('free');
  });

  it('returns pro when the expiry is in the future', () => {
    expect(resolvePlan('2026-10-10T00:00:00Z', now)).toBe('pro');
  });

  it('treats exactly-now as expired', () => {
    expect(resolvePlan(now.toISOString(), now)).toBe('free');
  });

  it('treats an unparsable value as free', () => {
    expect(resolvePlan('khong-hop-le', now)).toBe('free');
  });
});

describe('aiLimit', () => {
  it('maps plans to their documented limits', () => {
    expect(aiLimit('free')).toBe(AI_LIMIT_FREE);
    expect(aiLimit('pro')).toBe(AI_LIMIT_PRO);
    expect(AI_LIMIT_FREE).toBe(3);
    expect(AI_LIMIT_PRO).toBe(50);
  });
});

describe('dayKey', () => {
  it('uses the Asia/Ho_Chi_Minh calendar day', () => {
    // 2026-10-03T17:30:00Z is already 2026-10-04 in UTC+7.
    expect(dayKey(new Date('2026-10-03T17:30:00Z'))).toBe('2026-10-04');
  });

  it('resets exactly at midnight Vietnam time (17:00 UTC)', () => {
    expect(dayKey(new Date('2026-10-03T16:59:59Z'))).toBe('2026-10-03');
    expect(dayKey(new Date('2026-10-03T17:00:00Z'))).toBe('2026-10-04');
    expect(dayKey(new Date('2026-10-03T16:00:00Z'))).toBe('2026-10-03');
  });
});

describe('quotaError', () => {
  it('offers an upgrade to a logged-in free user', () => {
    const res = quotaError('free', 4, 3, true);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AI_LIMIT_FREE');
    expect(res.body.upgrade).toBe(true);
    expect(res.body.limit).toBe(3);
  });

  it('does not offer an upgrade to an anonymous visitor', () => {
    const res = quotaError('free', 4, 3, false);
    expect(res.body.code).toBe('AI_LIMIT_FREE');
    expect(res.body.upgrade).toBe(false);
  });

  it('reports the fair-use cap for pro users', () => {
    const res = quotaError('pro', 51, 50, true);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('AI_LIMIT_PRO');
    expect(res.body.limit).toBe(50);
  });
});