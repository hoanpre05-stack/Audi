import { createHash } from 'crypto';
import type { Request } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface Identity {
  userId: string | null;
  /** Salted hash used for anonymous quota. Null when IP_HASH_SALT is unset. */
  ipHash: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

/**
 * Salted IP hash. The raw IP is never stored or logged, and rotating the salt
 * makes the hashes non-linkable across deployments.
 */
export function hashIp(ip: string, salt: string): string {
  if (!salt) return '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

const ANONYMOUS: Identity = {
  userId: null,
  ipHash: null,
  email: null,
  name: null,
  avatar: null,
};

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
}

/**
 * Resolve who is calling.
 *
 * A valid access token identifies a member; anything else (no header, expired
 * token, bad token, Supabase not configured) falls back to an anonymous visitor
 * so the studio keeps working instead of hanging on an auth error.
 */
export async function resolveIdentity(req: Request): Promise<Identity> {
  const ipHash = hashIp(clientIp(req), process.env.IP_HASH_SALT || '') || null;

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return { ...ANONYMOUS, ipHash };
  }
  const token = header.slice('Bearer '.length).trim();

  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { ...ANONYMOUS, ipHash };

  try {
    const { data, error } = await createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).auth.getUser(token);
    if (error || !data.user) return { ...ANONYMOUS, ipHash };

    const meta = (data.user.user_metadata || {}) as Record<string, string>;
    return {
      userId: data.user.id,
      ipHash,
      email: data.user.email ?? null,
      name: meta.full_name || meta.name || null,
      avatar: meta.avatar_url || meta.picture || null,
    };
  } catch {
    return { ...ANONYMOUS, ipHash };
  }
}

/**
 * Identity for routes that must not fall back to anonymous.
 *
 * `NO_TOKEN` means the caller sent no Authorization header at all;
 * `INVALID_TOKEN` means a token was sent but rejected. Purchases distinguish
 * the two so the client knows whether to prompt for sign-in.
 */
export type RequiredIdentity =
  | { ok: true; identity: Identity }
  | { ok: false; reason: 'NO_TOKEN' | 'INVALID_TOKEN' | 'AUTH_NOT_CONFIGURED' };

export async function requireIdentity(req: Request): Promise<RequiredIdentity> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return { ok: false, reason: 'NO_TOKEN' };
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return { ok: false, reason: 'AUTH_NOT_CONFIGURED' };
  }
  const identity = await resolveIdentity(req);
  return identity.userId ? { ok: true, identity } : { ok: false, reason: 'INVALID_TOKEN' };
}