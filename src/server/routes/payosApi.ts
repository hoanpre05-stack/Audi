import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { SiteConfig } from '../siteConfig';
import {
  getPaymentByCode,
  getProfile,
  insertPayment,
  markPaymentStatus,
  setProfilePro,
} from '../db';
import { requireIdentity } from '../identity';
import {
  CREATE_PAYMENT_PATH,
  GET_PAYMENT_PATH,
  PAYOS_API_BASE,
  PLANS,
  extendProUntil,
  makeOrderCode,
  signPaymentRequest,
  verifyChecksum,
  type PlanKind,
} from '../payos';

const perMinute = (max: number) =>
  rateLimit({ windowMs: 60_000, limit: max, standardHeaders: true, legacyHeaders: false });

const isPlanKind = (value: unknown): value is PlanKind => value === 'monthly' || value === 'yearly';

const UNAUTHORIZED = {
  NO_TOKEN: { status: 401, body: { code: 'AUTH_REQUIRED', reason: 'NO_TOKEN' } },
  INVALID_TOKEN: { status: 401, body: { code: 'AUTH_REQUIRED', reason: 'INVALID_TOKEN' } },
  AUTH_NOT_CONFIGURED: {
    status: 503,
    body: { code: 'AUTH_NOT_CONFIGURED', message: 'Đăng nhập chưa được cấu hình trên máy chủ.' },
  },
} as const;

/**
 * Call the payOS merchant API.
 *
 * payOS has no sandbox: every call here runs against production, so a bad
 * signature or amount is rejected outright rather than silently accepted.
 */
async function payosRequest(path: string, payload: Record<string, unknown>): Promise<any> {
  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  if (!clientId || !apiKey) throw new Error('PayOS is not configured');
  const base = (process.env.PAYOS_API_BASE || PAYOS_API_BASE).replace(/\/+$/, '');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PayOS responded ${res.status}: ${text.slice(0, 200)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('PayOS returned a non-JSON body');
  }
}

/**
 * Activate an order: mark it paid and extend the member's expiry.
 *
 * Idempotent. A replayed webhook for an already-paid order is a no-op, which is
 * what stops a duplicate delivery from granting extra days. Paid days always
 * extend the remaining time rather than resetting it.
 */
async function activateOrder(
  orderCode: number,
  rawBody: unknown,
): Promise<'paid' | 'already_paid' | 'unknown'> {
  const payment = await getPaymentByCode(orderCode);
  if (!payment) return 'unknown';
  if (payment.status === 'paid') return 'already_paid';

  const days = PLANS[payment.planKind].days;
  const profile = await getProfile(payment.userId);
  const next = extendProUntil(profile?.pro_until ? new Date(profile.pro_until) : null, days);

  await markPaymentStatus(payment.id, 'paid', {
    paidAt: new Date().toISOString(),
    rawWebhook: rawBody,
  });
  await setProfilePro(payment.userId, next.toISOString());

  return 'paid';
}

export function mountPayosRoutes(app: Express, cfg: SiteConfig): void {
  /** Create a checkout link. Sign-in is mandatory: money must map to an account. */
  app.post('/api/payos/create', perMinute(5), async (req: Request, res: Response) => {
    const required = await requireIdentity(req);
    if (!required.ok) {
      const e = UNAUTHORIZED[required.reason];
      return res.status(e.status).json(e.body);
    }
    // Narrow a local, not `req.body.plan` directly: TypeScript cannot carry a
    // type guard across a mutable property access.
    const requestedPlan = req.body?.plan;
    if (!isPlanKind(requestedPlan)) return res.status(400).json({ code: 'BAD_PLAN' });

    const userId = required.identity.userId as string;
    const product = PLANS[requestedPlan];

    try {
      const orderCode = makeOrderCode();
      const cancelUrl = `${cfg.appUrl}/pricing?cancelled=1`;
      const returnUrl = `${cfg.appUrl}/account?paid=1&orderCode=${orderCode}`;
      const checksumKey = process.env.PAYOS_CHECKSUM_KEY || '';

      const order = await payosRequest(CREATE_PAYMENT_PATH, {
        orderCode,
        amount: product.amount,
        description: product.description,
        cancelUrl,
        returnUrl,
        // Required by payOS. Omitting it means every create call is rejected.
        signature: signPaymentRequest(
          { orderCode, amount: product.amount, description: product.description, cancelUrl, returnUrl },
          checksumKey,
        ),
      });

      // payOS reports business failures in the body with HTTP 200.
      if (order?.code !== '00') {
        throw new Error(`PayOS rejected the order: ${order?.code} ${order?.desc || ''}`);
      }
      const checkoutUrl = order?.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('PayOS returned no checkout URL');

      // Recorded only after PayOS accepted the order, so we never hold a
      // pending row for an order that does not exist.
      await insertPayment({
        userId,
        orderCode,
        amount: product.amount,
        planKind: requestedPlan,
      });

      return res.json({ checkoutUrl, orderCode });
    } catch (err) {
      console.error('[/api/payos/create]', err);
      return res.status(502).json({
        code: 'PAYOS_CREATE_FAILED',
        message: 'Không tạo được link thanh toán. Vui lòng thử lại sau.',
      });
    }
  });

  /**
   * PayOS calls this server-to-server. It is public, so the signature is the
   * only thing that makes it trustworthy.
   */
  app.post('/api/payos/webhook', async (req: Request, res: Response) => {
    const key = process.env.PAYOS_CHECKSUM_KEY || '';
    const data = (req.body?.data || {}) as Record<string, string>;
    const signature = (req.body?.signature || '') as string;

    if (!verifyChecksum(data, signature, key)) {
      return res.status(400).json({ code: 'BAD_SIGNATURE' });
    }

    const orderCode = Number(data.orderCode);
    if (!Number.isFinite(orderCode)) return res.status(400).json({ code: 'BAD_ORDER' });

    // payOS signals success with a top-level `success` flag and `code: "00"`,
    // not only with a status string inside `data`.
    const succeeded =
      req.body?.success === true &&
      (req.body?.code === '00' || String(data.status || '').toUpperCase() === 'PAID');

    if (!succeeded) {
      // Still a genuine, correctly signed notice about a failed transfer.
      // Record nothing and acknowledge so payOS stops retrying.
      console.warn(
        `[payos webhook] orderCode ${orderCode} not paid (code=${req.body?.code} success=${req.body?.success})`,
      );
      return res.json({ ok: true, activated: false });
    }

    try {
      const result = await activateOrder(orderCode, req.body);
      if (result === 'unknown') {
        // Not our order. Answer 200 so PayOS stops retrying, but change nothing.
        console.warn(`[payos webhook] unknown orderCode ${orderCode}, ignored`);
      }
      return res.json({ ok: true, result });
    } catch (err) {
      // 500 tells PayOS to retry, which matters because activation failed.
      console.error('[/api/payos/webhook]', err);
      return res.status(500).json({ code: 'WEBHOOK_FAILED' });
    }
  });

  /**
   * Fallback for slow webhooks: the account page polls this after returning from
   * PayOS. Never trust the client to flip its own plan.
   */
  app.get('/api/payos/status/:orderCode', perMinute(30), async (req: Request, res: Response) => {
    const required = await requireIdentity(req);
    if (!required.ok) {
      const e = UNAUTHORIZED[required.reason];
      return res.status(e.status).json(e.body);
    }

    const orderCode = Number(req.params.orderCode);
    if (!Number.isFinite(orderCode)) return res.status(400).json({ code: 'BAD_ORDER' });

    try {
      const payment = await getPaymentByCode(orderCode);
      if (!payment || payment.userId !== required.identity.userId) {
        return res.status(404).json({ code: 'ORDER_NOT_FOUND' });
      }

      if (payment.status !== 'paid') {
        try {
          // payOS only documents POST for writes; the lookup endpoint accepts
          // POST on this gateway and answers with the same envelope.
          const info = await payosRequest(`${GET_PAYMENT_PATH}/${orderCode}`, {});
          const status = String(info?.data?.status || '').toUpperCase();
          if (info?.code !== '00') {
            console.warn(`[/api/payos/status] lookup not ready: ${info?.code} ${info?.desc || ''}`);
          } else if (status === 'PAID') {
            await activateOrder(orderCode, { source: 'status-poll', status });
          } else if (status === 'CANCELLED' || status === 'EXPIRED') {
            await markPaymentStatus(payment.id, status.toLowerCase());
          }
        } catch (err) {
          // The order may simply not be queryable yet; the next poll retries.
          console.error('[/api/payos/status] upstream lookup failed', err);
        }
      }

      const profile = await getProfile(required.identity.userId as string);
      return res.json({
        status: payment.status === 'paid' ? 'paid' : payment.status,
        plan: profile?.plan ?? 'free',
        proUntil: profile?.pro_until ?? null,
      });
    } catch (err) {
      console.error('[/api/payos/status]', err);
      return res.status(503).json({ code: 'AUTH_BACKEND' });
    }
  });
}