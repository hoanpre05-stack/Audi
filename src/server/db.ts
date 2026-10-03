import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { dayKey } from './quota';

let admin: SupabaseClient | null = null;

/**
 * Service-role Supabase client. This bypasses RLS, so it must only ever be
 * constructed from server-side env vars and must never be bundled for the
 * browser.
 */
export function getAdmin(): SupabaseClient {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  admin = createClient(url, key, { auth: { persistSession: false } });
  return admin;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro';
  pro_until: string | null;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await getAdmin()
    .from('profiles')
    .select('id, email, display_name, avatar_url, plan, pro_until')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function getUsageCount(
  userId: string | null,
  ipHash: string | null,
  day: string = dayKey(),
): Promise<number> {
  let query = getAdmin().from('usage_daily').select('ai_count').eq('day', day);
  query = userId ? query.eq('user_id', userId) : query.eq('ip_hash', ipHash ?? '');
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? Number((data as { ai_count: number }).ai_count) || 0 : 0;
}

/**
 * Spend one AI credit. The increment happens inside Postgres so two concurrent
 * requests cannot both read the same count and lose one.
 */
export async function incrementUsage(
  userId: string | null,
  ipHash: string | null,
  day: string = dayKey(),
): Promise<number> {
  const { data, error } = await getAdmin().rpc('increment_ai_usage', {
    p_user_id: userId,
    p_ip_hash: userId ? null : ipHash,
    p_day: day,
  });
  if (error) throw error;
  return Number(data) || 0;
}

export interface PaymentRow {
  orderCode: number;
  amount: number;
  planKind: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export async function getPayments(userId: string): Promise<PaymentRow[]> {
  const { data, error } = await getAdmin()
    .from('payments')
    .select('payos_order_code, amount, plan_kind, status, paid_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data as any[]) || []).map((row) => ({
    orderCode: Number(row.payos_order_code),
    amount: Number(row.amount),
    planKind: row.plan_kind,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }));
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planKind: 'monthly' | 'yearly';
  status: string;
}

/** Look up one order. Returns null when the code is unknown to us. */
export async function getPaymentByCode(
  orderCode: number,
): Promise<PaymentRecord | null> {
  const { data, error } = await getAdmin()
    .from('payments')
    .select('id, user_id, plan_kind, status')
    .eq('payos_order_code', orderCode)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as any;
  return {
    id: row.id,
    userId: row.user_id,
    planKind: row.plan_kind,
    status: row.status,
  };
}

export async function markPaymentStatus(
  id: string,
  status: string,
  extra: { paidAt?: string; rawWebhook?: unknown } = {},
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (extra.paidAt) patch.paid_at = extra.paidAt;
  if (extra.rawWebhook !== undefined) patch.raw_webhook = extra.rawWebhook;
  const { error } = await getAdmin().from('payments').update(patch).eq('id', id);
  if (error) throw error;
}

export async function setProfilePro(
  userId: string,
  proUntilIso: string,
): Promise<void> {
  const { error } = await getAdmin()
    .from('profiles')
    .update({ plan: 'pro', pro_until: proUntilIso, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export async function insertPayment(row: {
  userId: string;
  orderCode: number;
  amount: number;
  planKind: 'monthly' | 'yearly';
}): Promise<void> {
  const { error } = await getAdmin().from('payments').insert({
    user_id: row.userId,
    payos_order_code: row.orderCode,
    amount: row.amount,
    plan_kind: row.planKind,
    status: 'pending',
  });
  if (error) throw error;
}