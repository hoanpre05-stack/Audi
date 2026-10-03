/**
 * Per-key concurrency limiter.
 *
 * FFmpeg conversion is CPU-bound, so unbounded concurrency is the fastest way to
 * make the whole container unresponsive. Extra callers are rejected instead of
 * queued, because a queued video would sit in memory holding hundreds of
 * megabytes until it eventually timed out.
 */
export interface Limiter {
  /** Returns false when the key is already at capacity. */
  acquire(key: string): boolean;
  release(key: string): void;
  /** Current in-flight count for a key, for diagnostics and tests. */
  inFlight(key: string): number;
}

export function createLimiter(max: number): Limiter {
  const counts = new Map<string, number>();

  return {
    acquire(key: string): boolean {
      const current = counts.get(key) ?? 0;
      if (current >= max) return false;
      counts.set(key, current + 1);
      return true;
    },

    release(key: string): void {
      const current = counts.get(key) ?? 1;
      if (current <= 1) counts.delete(key);
      else counts.set(key, current - 1);
    },

    inFlight(key: string): number {
      return counts.get(key) ?? 0;
    },
  };
}