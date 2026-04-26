const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ─── URLs to import ────────────────────────────────────────────────────────────
const URLS = [
  'https://www.bbcgoodfood.com/recipes/spaghetti-bolognese',
  'https://www.bbcgoodfood.com/recipes/chicken-tikka-masala',
  'https://www.bbcgoodfood.com/recipes/french-onion-soup',
  'https://www.bbcgoodfood.com/recipes/beef-bourguignon',
  'https://www.bbcgoodfood.com/recipes/chilli-prawn-linguine',
  'https://www.bbcgoodfood.com/recipes/mushroom-risotto',
  'https://www.bbcgoodfood.com/recipes/slow-cooker-lamb-tagine',
  'https://www.bbcgoodfood.com/recipes/lemon-drizzle-cake',
  'https://www.bbcgoodfood.com/recipes/banana-bread',
  'https://www.bbcgoodfood.com/recipes/chocolate-fondant',
];

const COOKBOOK_NAME = 'BBC Good Food';
const COOKBOOK_COLOR = '#8B1A0A';

// ─── Load env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// ─── ISO 8601 duration parser (PT1H30M → 90) ──────────────────────────────────
function parseIso(duration) {
  if (!duration) return 0;
  const m = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0);
}

// ─── Split "200g pasta" → { qty: "200g", name: "pasta" } ─────────────────────
function splitIngredient(raw) {
  const str = raw.replace(/\s+/g, ' ').trim();
  // leading amount + optional unit
  const m = str.match(/^([\d¼½¾⅐-⅞\/\-–\s]+(?:g|kg|ml|l|litre|liter|oz|lb|lbs|tsp|tbsp|tbsps|cup|cups|pinch|handful|bunch|clove|cloves|head|heads|slice|slices|piece|pieces|rasher|rashers|large|medium|small|ripe|fresh)?\.?\s*)/i);
  if (m && m[1].trim()) {
    const qty = m[1].trim();
    const name = str.slice(m[1].length).trim();
    if (name) return { qty, name };
  }
  return { qty: '', name: str };
}

// ─── Extract first timer mention from step text (minutes) ─────────────────────
function extractTimer(text) {
  // "for 20-25 minutes" → 20, "about 5 mins" → 5, "1 hour" → 60
  const hrMatch = text.match(/(\d+)\s*(?:hour|hr)s?/i);
  const minMatch = text.match(/(\d+)(?:\s*[-–]\s*\d+)?\s*(?:min(?:ute)?s?)/i);
  if (hrMatch && minMatch) return parseInt(hrMatch[1]) * 60 + parseInt(minMatch[1]);
  if (hrMatch) return parseInt(hrMatch[1]) * 60;
  if (minMatch) return parseInt(minMatch[1]);
  return null;
}

// ─── Recursively find a Recipe node in JSON-LD ────────────────────────────────
function findRecipeNode(data) {
  if (!data || typeof data !== 'object') return null;
  const type = data['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return data;
  if (Array.isArray(data)) {
    for (const item of data) { const r = findRecipeNode(item); if (r) return r; }
  }
  if (data['@graph']) {
    for (const item of data['@graph']) { const r = findRecipeNode(item); if (r) return r; }
  }
  return null;
}

// ─── Fetch page and extract Recipe JSON-LD ────────────────────────────────────
async function fetchRecipeSchema(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();

  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const node = findRecipeNode(json);
      if (node) return node;
    } catch { /* skip malformed blocks */ }
  }
  throw new Error('No Recipe JSON-LD block found in page');
}

// ─── Map JSON-LD → our data shape ────────────────────────────────────────────
function parseSchema(schema, url) {
  const prep = parseIso(schema.prepTime);
  const cook = parseIso(schema.cookTime);
  const total = parseIso(schema.totalTime) || (prep + cook) || 30;

  // servings: may be "Serves 4", "4", or ["4 servings"]
  let servings = 4;
  const rawYield = Array.isArray(schema.recipeYield) ? schema.recipeYield[0] : schema.recipeYield;
  if (rawYield) { const n = parseInt(rawYield); if (n > 0) servings = n; }

  const ingredients = (schema.recipeIngredient || []).map(i => splitIngredient(String(i)));

  const rawSteps = schema.recipeInstructions || [];
  const steps = rawSteps.flatMap(step => {
    if (typeof step === 'string') return [{ text: step.trim(), timer: extractTimer(step) }];
    if (step['@type'] === 'HowToSection' && step.itemListElement) {
      return step.itemListElement.map(s => {
        const text = (s.text || s.description || '').trim();
        return { text, timer: extractTimer(text) };
      });
    }
    const text = (step.text || step.description || '').replace(/<[^>]+>/g, '').trim();
    return text ? [{ text, timer: extractTimer(text) }] : [];
  }).filter(s => s.text);

  // difficulty: JSON-LD rarely carries this; fall back to Medium
  let difficulty = 'Medium';
  if (schema.difficulty) {
    const d = String(schema.difficulty).toLowerCase();
    if (d.includes('easy')) difficulty = 'Easy';
    else if (d.includes('hard') || d.includes('challeng') || d.includes('advanced')) difficulty = 'Hard';
  }

  const description = (schema.description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .trim();

  return { name: schema.name, description, time: total, difficulty, servings, ingredients, steps };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Creating cookbook "${COOKBOOK_NAME}"...`);
  const { data: cookbook, error: cbErr } = await supabase
    .from('cookbooks').insert({ name: COOKBOOK_NAME, color: COOKBOOK_COLOR }).select().single();
  if (cbErr) { console.error('Failed to create cookbook:', cbErr.message); process.exit(1); }
  console.log(`  ✓ Cookbook created\n`);

  let ok = 0, fail = 0;

  for (const url of URLS) {
    console.log(`Fetching: ${url}`);
    try {
      const schema = await fetchRecipeSchema(url);
      const recipe = parseSchema(schema, url);
      console.log(`  Parsed: "${recipe.name}" — ${recipe.time}min, ${recipe.servings} servings, ${recipe.ingredients.length} ingredients, ${recipe.steps.length} steps`);

      const { data: rec, error: recErr } = await supabase
        .from('recipes')
        .insert({
          cookbook_id: cookbook.id,
          name: recipe.name,
          description: recipe.description,
          time: recipe.time,
          difficulty: recipe.difficulty,
          servings: recipe.servings,
          cooked_count: 0,
          tags: [],
        })
        .select().single();
      if (recErr) throw new Error(recErr.message);

      if (recipe.ingredients.length) {
        const { error: ingErr } = await supabase.from('ingredients').insert(
          recipe.ingredients.map((ing, idx) => ({ recipe_id: rec.id, name: ing.name, qty: ing.qty, position: idx }))
        );
        if (ingErr) throw new Error(`ingredients: ${ingErr.message}`);
      }

      if (recipe.steps.length) {
        const { error: stepErr } = await supabase.from('steps').insert(
          recipe.steps.map((step, idx) => ({ recipe_id: rec.id, text: step.text, timer: step.timer || null, position: idx }))
        );
        if (stepErr) throw new Error(`steps: ${stepErr.message}`);
      }

      console.log(`  ✓ Imported\n`);
      ok++;
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}\n`);
      fail++;
    }

    // small delay to be polite
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`────────────────────────────`);
  console.log(`Done: ${ok}/${URLS.length} recipes imported${fail ? `, ${fail} failed` : ''}.`);
}

main().catch(err => { console.error(err); process.exit(1); });
