import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const url = env.VITE_SUPABASE_URL as string | undefined;
const anonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Null when the Supabase env vars are absent, which is the case on a fresh
 * checkout and in local development. Every call site must tolerate null.
 * Never put the service role key here: this module ships to the browser.
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;