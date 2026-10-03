import type { Request } from 'express';
import { resolveIdentity } from './identity';
import { getProfile, incrementUsage, isSupabaseConfigured } from './db';
import { aiLimit, quotaError, resolvePlan, type Plan } from './quota';

export interface Gate {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

const pass: Gate = { ok: true, status: 200, body: {} };

/**
 * Spend one AI credit for the current request.
 *
 * Call this AFTER body validation and BEFORE any Gemini call, so a malformed
 * request never burns a credit and a valid one can never skip the counter.
 *
 * Two deliberate choices:
 *
 * - Fails CLOSED when Supabase is unreachable. Serving Gemini calls we cannot
 *   count would let anyone drain the key with a script.
 * - Fails CLOSED for anonymous visitors when IP_HASH_SALT is unset, because
 *   there would be no way to attribute their usage.
 *
 * An upstream Gemini failure does not refund the credit: refunding is exactly
 * what a retry-storm exploit would abuse.
 */
export async function consumeAiCredit(req: Request): Promise<Gate> {
  if (!isSupabaseConfigured()) {
    console.error('[guard] Supabase is not configured; refusing uncounted AI calls');
    return {
      ok: false,
      status: 503,
      body: {
        code: 'AUTH_BACKEND',
        message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
      },
    };
  }

  let identity;
  try {
    identity = await resolveIdentity(req);
  } catch (err) {
    console.error('[guard] identity resolution failed', err);
    return { ok: false, status: 503, body: { code: 'AUTH_BACKEND' } };
  }

  if (!identity.userId && !identity.ipHash) {
    console.error('[guard] anonymous request with no IP_HASH_SALT; cannot attribute usage');
    return {
      ok: false,
      status: 503,
      body: {
        code: 'QUOTA_UNAVAILABLE',
        message: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
      },
    };
  }

  let plan: Plan = 'free';
  if (identity.userId) {
    try {
      const profile = await getProfile(identity.userId);
      // Derived from pro_until, never from the cached plan column.
      plan = resolvePlan(profile?.pro_until ?? null);
    } catch (err) {
      console.error('[guard] profile lookup failed', err);
      return { ok: false, status: 503, body: { code: 'AUTH_BACKEND' } };
    }
  }

  const limit = aiLimit(plan);
  let used: number;
  try {
    used = await incrementUsage(identity.userId, identity.ipHash);
  } catch (err) {
    console.error('[guard] usage increment failed', err);
    return { ok: false, status: 503, body: { code: 'AUTH_BACKEND' } };
  }

  if (used > limit) {
    const err = quotaError(plan, used, limit, Boolean(identity.userId));
    return { ok: false, status: err.status, body: err.body };
  }

  return pass;
}