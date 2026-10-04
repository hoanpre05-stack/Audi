/**
 * Dev utility: return the 3 free daily AI calls after testing.
 *
 * Deletes only ANONYMOUS usage rows (rows with no user_id) for a given day.
 * It never touches a signed-in member's counter, and it never removes the row
 * data beyond that day.
 *
 * Requires --confirm. Without it the script prints what it would delete and
 * exits, so an accidental run against production cannot wipe live counters.
 *
 *   npm run reset:test-usage -- --confirm
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { dayKey } from '../src/server/quota';

dotenv.config();

const CONFIRMED = process.argv.includes('--confirm');

const run = async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

  const db = createClient(url, key, { auth: { persistSession: false } });
  const today = dayKey();

  const { data, error } = await db
    .from('usage_daily')
    .select('day, ai_count, ip_hash')
    .is('user_id', null)
    .eq('day', today);
  if (error) throw error;

  console.log(`Ngay (Asia/Ho_Chi_Minh): ${today}`);
  if (!data || data.length === 0) {
    console.log('Khong co duong an danh nao de xoa.');
    return;
  }
  for (const row of data) {
    console.log(`  ai_count=${row.ai_count}  hash=${String(row.ip_hash).slice(0, 12)}...`);
  }

  if (!CONFIRMED) {
    console.log('\nChua xoa gi. Chay lai voi --confirm de thuc hien.');
    return;
  }

  const { error: delErr } = await db
    .from('usage_daily')
    .delete()
    .is('user_id', null)
    .eq('day', today);
  if (delErr) throw delErr;

  console.log(`\nDa xoa ${data.length} dong. Luong AI mien phi da duoc tra lai.`);
};

run().catch((e) => {
  console.error('That bai:', e.message);
  process.exit(1);
});