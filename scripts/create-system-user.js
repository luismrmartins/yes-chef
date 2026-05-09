/* eslint-disable */
// One-shot helper: creates (or finds) a "community" auth user, then appends
// SYSTEM_USER_ID=<uuid> to .env.local. Re-running is safe — it won't add
// the line twice.

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENV_PATH = path.join(__dirname, '..', '.env.local');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL = 'community@thepass.app';
const PASSWORD = 'community-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

async function findExisting() {
  // listUsers paginates; community user shows up on the first page if it exists.
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find(u => u.email === EMAIL);
    if (found) return found;
    if (data.users.length < 1000) return null;
    page += 1;
  }
  return null;
}

async function ensureProfile(userId, username) {
  const { data: existing } = await supabase
    .from('profiles').select('id').eq('id', userId).maybeSingle();
  if (existing) return;
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    username,
    display_name: 'The Pass Community',
  });
  if (error && !/duplicate/i.test(error.message)) {
    console.warn('Profile insert warning:', error.message);
  }
}

function appendToEnv(uuid) {
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  if (/^SYSTEM_USER_ID=/m.test(text)) {
    console.log('.env.local already has SYSTEM_USER_ID — leaving it alone.');
    return;
  }
  const sep = text.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(ENV_PATH, text + sep + `SYSTEM_USER_ID=${uuid}\n`);
  console.log(`Appended SYSTEM_USER_ID=${uuid} to .env.local`);
}

async function main() {
  let user = await findExisting();
  if (user) {
    console.log(`Existing user found: ${user.email} (${user.id})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: 'The Pass Community' },
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created user: ${user.email} (${user.id})`);
  }
  await ensureProfile(user.id, 'community');
  appendToEnv(user.id);
}

main().catch(err => {
  console.error('Failed:', err.message || err);
  process.exit(1);
});
