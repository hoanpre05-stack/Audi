import { supabase } from './supabase';

export type ViewerPlan = 'free' | 'pro';

const PLAN_EVENT = 'viewer-plan-change';

/**
 * Cached plan for ad gating and export resolution.
 *
 * Pro members must see no ads, so the cached value only ever *downgrades*
 * immediately on refresh and *upgrades* after a confirmed server answer.
 * Default is 'free', which is the safe (ad-showing) state.
 */
let cachedPlan: ViewerPlan = 'free';

export function getViewerPlan(): ViewerPlan {
  return cachedPlan;
}

export function setViewerPlan(plan: ViewerPlan): void {
  if (cachedPlan === plan) return;
  cachedPlan = plan;
  window.dispatchEvent(new CustomEvent<string>(PLAN_EVENT, { detail: plan }));
}

export function onViewerPlanChange(cb: (plan: ViewerPlan) => void): () => void {
  const handler = () => cb(cachedPlan);
  window.addEventListener(PLAN_EVENT, handler);
  return () => window.removeEventListener(PLAN_EVENT, handler);
}

export interface MeState {
  userId: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  plan: ViewerPlan;
  proUntil: string | null;
  aiUsedToday: number;
  aiLimit: number;
  /**
   * False when the server cannot attribute usage (Supabase or IP_HASH_SALT is
   * unset). AI calls will be refused in that state, so the UI must not claim the
   * user is out of credits.
   */
  quotaAvailable?: boolean;
}

export const EMPTY_ME: MeState = {
  userId: null,
  email: null,
  name: null,
  avatar: null,
  plan: 'free',
  proUntil: null,
  aiUsedToday: 0,
  aiLimit: 3,
  quotaAvailable: false,
};

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Load /api/me and cache the plan. Safe to call repeatedly. */
export async function fetchMe(): Promise<MeState> {
  try {
    const token = await accessToken();
    const res = await fetch('/api/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return EMPTY_ME;
    const me: MeState = { ...EMPTY_ME, ...(await res.json()) };
    setViewerPlan(me.plan === 'pro' ? 'pro' : 'free');
    return me;
  } catch {
    return EMPTY_ME;
  }
}

/**
 * Spend one AI credit before the studio calls a Gemini route.
 * The server is the only authority; the client never grants itself credits.
 */
export async function consumeCredit(): Promise<{
  ok: boolean;
  body: Record<string, unknown>;
}> {
  try {
    const token = await accessToken();
    const res = await fetch('/api/usage/consume', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        // Expired or invalid token: drop it so the next attempt falls back to the IP quota.
        await supabase?.auth.signOut().catch(() => undefined);
      }
      return { ok: false, body: body as Record<string, unknown> };
    }
    return { ok: true, body: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, body: { code: 'NETWORK' } };
  }
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/account` },
  });
}