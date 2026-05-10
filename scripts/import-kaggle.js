/* eslint-disable */
// Import recipes from data/RAW_recipes.csv (Kaggle dataset) into Supabase as
// locked, public community recipes. Designed to be re-runnable safely:
// cookbooks are upserted by name; recipes are inserted fresh each run, so
// truncate the recipes table beforehand if you want a clean slate.
//
//   node scripts/import-kaggle.js
//
// Required env vars (loaded from .env.local):
//   NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY (needed to bypass RLS for cross-user inserts)
//   SYSTEM_USER_ID            (auth.users.id that will own the community cookbooks)

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// ─── Config ─────────────────────────────────────────────────────────────────
const IMPORT_LIMIT = 500;         // hard cap on total recipes imported
const PER_COOKBOOK_CAP = 80;      // max recipes per cookbook
const START_OFFSET = 0;           // skip the first N source rows; 0 to start from the top
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 250;
const CSV_PATH = path.join(__dirname, '..', 'data', 'RAW_recipes.csv');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !SYSTEM_USER_ID) {
  console.error('Missing required env vars. Add to .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=...');
  console.error('  SYSTEM_USER_ID=<auth.users.id of community owner>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Cookbook category rules (priority order) ───────────────────────────────
// First matching rule wins.
const COOKBOOK_RULES = [
  { name: 'Breakfast & Brunch', match: ({ tags }) => tags.some(t => /breakfast|brunch|morning/.test(t)) },
  { name: 'Italian',            match: ({ tags }) => tags.some(t => /italian/.test(t)) },
  { name: 'Baking',             match: ({ tags }) => tags.some(t => /baking|bread|cake|cookies?|dessert/.test(t)) },
  { name: 'Soups & Stews',      match: ({ tags }) => tags.some(t => /soup|stew/.test(t)) },
  { name: 'Vegetarian',         match: ({ tags }) => tags.some(t => /vegetarian|vegan/.test(t)) },
  { name: 'Meat & Fish',        match: ({ tags }) => tags.some(t => /\bmeat\b|chicken|beef|fish|seafood/.test(t)) },
  { name: 'Quick & Easy',       match: ({ minutes }) => minutes <= 20 },
  { name: 'Community Recipes',  match: () => true },
];

// ─── Parsers ────────────────────────────────────────────────────────────────
function parsePythonList(raw) {
  if (!raw) return [];
  let s = String(raw).trim();
  if (s.startsWith('[') && s.endsWith(']')) s = s.slice(1, -1);
  if (!s.trim()) return [];
  const out = [];
  const re = /(['"])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    out.push(m[2].replace(/\\(['"\\])/g, '$1').trim());
  }
  return out.filter(Boolean);
}

function titleCase(s) {
  return s.replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

function capFirst(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

// ─── Quantity / unit parser ─────────────────────────────────────────────────
// Whitelist of valid units. Single letters like "g" or "l" only match when
// followed by whitespace or end of string, so "1 garlic" no longer extracts
// "g" from "garlic".

const UNIT_LIST = [
  // weight
  'kilograms', 'kilogram', 'kg', 'pounds', 'pound', 'lbs', 'lb',
  'ounces', 'ounce', 'oz', 'grams', 'gram', 'g',
  // volume
  'tablespoons', 'tablespoon', 'tbsp', 'teaspoons', 'teaspoon', 'tsp',
  'litres', 'litre', 'liters', 'liter',
  'pints', 'pint', 'cups', 'cup',
  'fl\\s+oz',
  'ml', 'dl', 'cl', 'l',
  // other
  'pinches', 'pinch', 'handfuls', 'handful', 'bunches', 'bunch',
  'cloves', 'clove', 'slices', 'slice', 'pieces', 'piece',
  'sprigs', 'sprig', 'sheets', 'sheet', 'rashers', 'rasher',
  'cans', 'can', 'tins', 'tin', 'jars', 'jar', 'packs', 'pack', 'bags', 'bag',
];
// Sort longest-first so JS alternation prefers e.g. "grams" over "g".
const SORTED_UNITS = [...UNIT_LIST].sort((a, b) => b.length - a.length);
const UNIT_PATTERN = SORTED_UNITS.join('|');

// Number (with fractions / mixed numbers / unicode), then optional whitespace,
// then optional unit that MUST end at a word boundary (\s or end-of-string).
const QTY_RE = new RegExp(
  `^([\\d./⅓⅔¼½¾⅛⅜⅝⅞]+(?:\\s+\\d+/\\d+)?)\\s*(?:(${UNIT_PATTERN})(?=\\s|$))?`,
  'i'
);

function splitQty(ingredient) {
  const trimmed = String(ingredient || '').trim();
  if (!trimmed) return { qty: '', name: '' };
  const m = trimmed.match(QTY_RE);
  if (!m || !m[1]) return { qty: '', name: trimmed };
  const rest = trimmed.slice(m[0].length).trim();
  if (!rest) return { qty: '', name: trimmed };
  return { qty: m[0].trim(), name: rest };
}

// ─── Parser self-test ───────────────────────────────────────────────────────

function runQtyParserTests() {
  const cases = [
    ['1 garlic',          { qty: '1',        name: 'garlic' }],
    ['200g flour',        { qty: '200g',     name: 'flour' }],
    ['2 cups milk',       { qty: '2 cups',   name: 'milk' }],
    ['1 lemon',           { qty: '1',        name: 'lemon' }],
    ['3 large eggs',      { qty: '3',        name: 'large eggs' }],
    ['500ml water',       { qty: '500ml',    name: 'water' }],
    ['1 garlic clove',    { qty: '1',        name: 'garlic clove' }],
    ['2 tbsp olive oil',  { qty: '2 tbsp',   name: 'olive oil' }],
  ];
  let allPass = true;
  for (const [input, expected] of cases) {
    const actual = splitQty(input);
    const pass = actual.qty === expected.qty && actual.name === expected.name;
    if (!pass) allPass = false;
    console.log(`${pass ? 'PASS' : 'FAIL'}  "${input}" → qty="${actual.qty}", name="${actual.name}"${pass ? '' : ` (expected qty="${expected.qty}", name="${expected.name}")`}`);
  }
  return allPass;
}

// Detect first time mention in a step. Returns minutes (number) or null.
const TIMER_RE = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i;
function detectTimer(stepText) {
  const m = stepText.match(TIMER_RE);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2].toLowerCase();
  if (/^h/.test(unit)) return Math.round(num * 60);
  return Math.round(num);
}

function pickCookbook(rec) {
  for (const rule of COOKBOOK_RULES) {
    if (rule.match(rec)) return rule.name;
  }
  return 'Community Recipes';
}

// ─── Per-row transform ──────────────────────────────────────────────────────
function transformRow(row) {
  const name = (row.name || '').trim();
  if (!name) return { skip: 'empty name' };
  if (name.length < 5 || name.length > 60) return { skip: 'name length' };

  const minutes = parseInt(row.minutes, 10);
  if (!Number.isFinite(minutes)) return { skip: 'bad minutes' };
  if (minutes < 10 || minutes > 120) return { skip: 'minutes out of range' };

  const ingredients = parsePythonList(row.ingredients);
  if (ingredients.length < 4 || ingredients.length > 15) return { skip: 'ingredients out of range' };

  const steps = parsePythonList(row.steps);
  if (steps.length < 3 || steps.length > 12) return { skip: 'steps out of range' };

  const description = (row.description || '').trim();
  if (!description) return { skip: 'empty description' };
  const truncatedDescription = description.length > 300 ? description.slice(0, 300) : description;

  const tags = parsePythonList(row.tags).map(t => t.toLowerCase());

  const difficulty = minutes <= 20 ? 'Easy' : minutes <= 45 ? 'Medium' : 'Advanced';
  const servings = 4;
  const cookbook = pickCookbook({ tags, minutes });

  const ingredientRows = ingredients.map((raw, idx) => {
    const { qty, name: ingName } = splitQty(raw);
    return { name: ingName, qty, position: idx };
  });

  const stepRows = steps.map((raw, idx) => ({
    text: capFirst(raw),
    timer: detectTimer(raw),
    position: idx,
  }));

  return {
    recipe: {
      name: titleCase(name),
      description: truncatedDescription,
      time: minutes,
      difficulty,
      servings,
      tags: [],
      is_public: true,
      is_locked: true,
      author_id: null,
      published_at: new Date().toISOString(),
      user_id: SYSTEM_USER_ID,
    },
    ingredientRows,
    stepRows,
    cookbookName: cookbook,
    score: ingredients.length + steps.length,
  };
}

// ─── Cookbook bootstrap ─────────────────────────────────────────────────────
async function ensureCookbooks() {
  const names = COOKBOOK_RULES.map(r => r.name);
  const { data: existing, error } = await supabase
    .from('cookbooks')
    .select('id, name')
    .eq('user_id', SYSTEM_USER_ID)
    .in('name', names);
  if (error) throw error;
  const byName = Object.fromEntries((existing || []).map(c => [c.name, c.id]));
  const missing = names.filter(n => !byName[n]);
  if (missing.length) {
    const { data: created, error: insErr } = await supabase
      .from('cookbooks')
      .insert(missing.map(n => ({ name: n, color: null, user_id: SYSTEM_USER_ID })))
      .select('id, name');
    if (insErr) throw insErr;
    for (const c of created || []) byName[c.name] = c.id;
  }
  return byName;
}

// ─── Per-recipe insert ──────────────────────────────────────────────────────
// One recipe insert, one batched ingredients call, one batched steps call.
async function insertRecipe(b, cookbookByName, stats) {
  try {
    const { data: rec, error } = await supabase
      .from('recipes')
      .insert({ ...b.recipe, cookbook_id: cookbookByName[b.cookbookName] })
      .select('id')
      .single();
    if (error) throw error;

    const ings = b.ingredientRows.map(x => ({ ...x, recipe_id: rec.id }));
    if (ings.length) {
      const { error: ingErr } = await supabase.from('ingredients').insert(ings);
      if (ingErr) throw ingErr;
    }

    const steps = b.stepRows.map(x => ({ ...x, recipe_id: rec.id }));
    if (steps.length) {
      const { error: stepErr } = await supabase.from('steps').insert(steps);
      if (stepErr) throw stepErr;
    }

    stats.imported += 1;
    stats.byCookbook[b.cookbookName] = (stats.byCookbook[b.cookbookName] || 0) + 1;
  } catch (e) {
    stats.failed += 1;
    console.error(`  Recipe "${b.recipe.name}" failed: ${e.message}`);
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('Validating quantity parser…');
  if (!runQtyParserTests()) {
    console.error('Quantity parser tests failed. Aborting import.');
    process.exit(1);
  }
  console.log('All parser tests passed.\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`Reading ${CSV_PATH}…`);
  const text = fs.readFileSync(CSV_PATH, 'utf8');
  console.log('Parsing CSV…');
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });
  console.log(`Parsed ${rows.length} rows. Importing up to ${IMPORT_LIMIT}.`);

  const cookbookByName = await ensureCookbooks();
  console.log('Cookbooks ready:', Object.keys(cookbookByName).join(', '));

  const stats = { imported: 0, skipped: 0, failed: 0, byCookbook: {} };

  if (START_OFFSET > 0) console.log(`Skipping the first ${START_OFFSET} rows.`);

  // Pass 1: transform & filter all rows, group by cookbook.
  const buckets = {};
  for (let i = 0; i < rows.length; i++) {
    if (i < START_OFFSET) continue;
    const row = rows[i];
    let t;
    try { t = transformRow(row); }
    catch (e) {
      stats.skipped += 1;
      console.error(`  Transform error on "${row.name}": ${e.message}`);
      continue;
    }
    if (t.skip) { stats.skipped += 1; continue; }
    (buckets[t.cookbookName] = buckets[t.cookbookName] || []).push(t);
  }

  // Pass 2: sort each cookbook by quality (steps + ingredients), cap at PER_COOKBOOK_CAP.
  for (const name of Object.keys(buckets)) {
    buckets[name].sort((a, b) => b.score - a.score);
    if (buckets[name].length > PER_COOKBOOK_CAP) buckets[name].length = PER_COOKBOOK_CAP;
  }

  console.log('Candidates per cookbook (after cap):');
  for (const [name, list] of Object.entries(buckets)) {
    console.log(`  ${name}: ${list.length}`);
  }

  // Pass 3: round-robin across cookbooks until we hit IMPORT_LIMIT or run dry.
  const selected = [];
  const cursors = Object.fromEntries(Object.keys(buckets).map(n => [n, 0]));
  let added = true;
  while (added && selected.length < IMPORT_LIMIT) {
    added = false;
    for (const name of Object.keys(buckets)) {
      if (selected.length >= IMPORT_LIMIT) break;
      if (cursors[name] < buckets[name].length) {
        selected.push(buckets[name][cursors[name]++]);
        added = true;
      }
    }
  }

  console.log(`Selected ${selected.length} recipes for import.`);

  // Pass 4: insert in batches, with delay between batches.
  for (let i = 0; i < selected.length; i += BATCH_SIZE) {
    const batch = selected.slice(i, i + BATCH_SIZE);
    for (const b of batch) await insertRecipe(b, cookbookByName, stats);
    if (stats.imported % 50 === 0 || i + BATCH_SIZE >= selected.length) {
      console.log(`Imported ${stats.imported}/${selected.length} recipes…`);
    }
    if (i + BATCH_SIZE < selected.length) await sleep(BATCH_DELAY_MS);
  }

  const cookbooksUsed = Object.keys(stats.byCookbook).length;
  console.log('');
  console.log(`Done. Imported ${stats.imported} recipes across ${cookbooksUsed} cookbooks. Skipped ${stats.skipped} recipes.`);
  if (stats.failed) console.log(`Failed: ${stats.failed}`);
  console.log('Per-cookbook:');
  for (const [name, n] of Object.entries(stats.byCookbook).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${n}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
