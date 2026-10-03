import { describe, it, expect } from 'vitest';
import { createLimiter } from '../concurrency';

describe('createLimiter', () => {
  it('allows up to the cap then rejects', () => {
    const limiter = createLimiter(2);
    expect(limiter.acquire('a')).toBe(true);
    expect(limiter.acquire('a')).toBe(true);
    expect(limiter.acquire('a')).toBe(false);
  });

  it('frees a slot on release', () => {
    const limiter = createLimiter(1);
    expect(limiter.acquire('a')).toBe(true);
    expect(limiter.acquire('a')).toBe(false);
    limiter.release('a');
    expect(limiter.acquire('a')).toBe(true);
  });

  it('tracks keys independently', () => {
    const limiter = createLimiter(1);
    expect(limiter.acquire('a')).toBe(true);
    expect(limiter.acquire('b')).toBe(true);
    expect(limiter.acquire('a')).toBe(false);
    expect(limiter.acquire('b')).toBe(false);
  });

  it('does not go negative on an extra release', () => {
    const limiter = createLimiter(2);
    limiter.acquire('a');
    limiter.release('a');
    limiter.release('a');
    limiter.release('a');
    expect(limiter.inFlight('a')).toBe(0);
    expect(limiter.acquire('a')).toBe(true);
  });

  it('forgets keys that drop to zero', () => {
    const limiter = createLimiter(2);
    limiter.acquire('a');
    limiter.release('a');
    expect(limiter.inFlight('a')).toBe(0);
  });
});