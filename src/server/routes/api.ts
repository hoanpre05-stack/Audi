import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getPayments, getProfile, getUsageCount, isSupabaseConfigured } from '../db';
import { requireIdentity, resolveIdentity } from '../identity';
import { aiLimit, dayKey, resolvePlan } from '../quota';

const perMinute = (max: number) =>
  rateLimit({ windowMs: 60_000, limit: max, standardHeaders: true, legacyHeaders: false });

export function mountApiRoutes(app: Express): void {
  /**
   * Current viewer state. Anonymous callers are supported and simply get the
   * free plan, so the studio can render a usage badge before sign-in.
   */
  app.get('/api/me', perMinute(60), async (_req: Request, res: Response) => {
    if (!isSupabaseConfigured()) {
      return res.json({
        userId: null,
        email: null,
        name: null,
        avatar: null,
        plan: 'free',
        proUntil: null,
        aiUsedToday: 0,
        aiLimit: aiLimit('free'),
        quotaAvailable: false,
      });
    }

    try {
      const identity = await resolveIdentity(_req);
      const day = dayKey();

      if (!identity.userId) {
        const used = identity.ipHash ? await getUsageCount(null, identity.ipHash, day) : 0;
        return res.json({
          userId: null,
          email: null,
          name: null,
          avatar: null,
          plan: 'free',
          proUntil: null,
          aiUsedToday: used,
          aiLimit: aiLimit('free'),
          quotaAvailable: Boolean(identity.ipHash),
        });
      }

      const profile = await getProfile(identity.userId);
      const plan = resolvePlan(profile?.pro_until ?? null);
      const used = await getUsageCount(identity.userId, null, day);
      return res.json({
        userId: identity.userId,
        email: profile?.email ?? identity.email,
        name: profile?.display_name ?? identity.name,
        avatar: profile?.avatar_url ?? identity.avatar,
        plan,
        proUntil: profile?.pro_until ?? null,
        aiUsedToday: used,
        aiLimit: aiLimit(plan),
        quotaAvailable: true,
      });
    } catch (err) {
      console.error('[/api/me]', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }
  });

  /** Payment history for the signed-in member. */
  app.get('/api/payments', perMinute(30), async (req: Request, res: Response) => {
    const required = await requireIdentity(req);
    if (!required.ok) {
      return res.status(401).json({
        code: 'AUTH_REQUIRED',
        reason: required.reason,
      });
    }
    try {
      return res.json({ payments: await getPayments(required.identity.userId!) });
    } catch (err) {
      console.error('[/api/payments]', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }
  });
}