import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fckexozgafjzlfmzgwki.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZja2V4b3pnYWZqemxmbXpnd2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODcwNTksImV4cCI6MjA5Mjc2MzA1OX0.ZeSGaZoE1PLew1JQ03QQAawQEctneQ-rEW6hOUlISDk'
);

const COOKBOOKS = [
  { name: 'Italian Nights', color: '#111111' },
  { name: 'Fast & Furious', color: '#8B1A0A' },
  { name: 'Sunday Roasts', color: '#1a3a1a' },
  { name: 'Vegetarian', color: '#2A6B8C' },
  { name: 'Breakfast & Brunch', color: '#5B4FCF' },
  { name: 'Baking', color: '#1a1a2e' },
];

const ITALIAN_RECIPES = [
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with egg, pecorino, guanciale and black pepper.',
    time: 25, difficulty: 'Medium', servings: 2,
    ingredients: [
      { name: 'Spaghetti', qty: '200g' },
      { name: 'Guanciale or pancetta', qty: '150g' },
      { name: 'Egg yolks', qty: '4' },
      { name: 'Pecorino Romano', qty: '60g grated' },
      { name: 'Black pepper', qty: 'generous' },
    ],
    steps: [
      { text: 'Bring a large pot of well-salted water to a boil. Cook spaghetti until al dente, about 8-10 minutes.', timer: null },
      { text: 'Cook guanciale in a large pan over medium heat until crispy and fat has rendered out.', timer: 7 },
      { text: 'In a bowl, whisk together egg yolks and grated pecorino. Season generously with cracked black pepper.', timer: null },
      { text: 'Reserve 1 cup pasta water, drain pasta. Add pasta to the pan with guanciale, off the heat.', timer: null },
      { text: 'Add egg mixture, tossing quickly and adding pasta water a little at a time until you have a creamy sauce. Work fast — no scrambled eggs.', timer: null },
      { text: 'Serve immediately with more pecorino and cracked black pepper.', timer: null },
    ],
  },
  {
    name: 'Cacio e Pepe',
    description: 'The simplest Roman pasta. Four ingredients, perfect technique.',
    time: 20, difficulty: 'Medium', servings: 2,
    ingredients: [
      { name: 'Tonnarelli or spaghetti', qty: '400g' },
      { name: 'Pecorino Romano', qty: '200g finely grated' },
      { name: 'Black pepper', qty: '2 tsp freshly cracked' },
      { name: 'Salt', qty: 'to taste' },
    ],
    steps: [
      { text: 'Cook pasta in well-salted boiling water until 2 minutes before al dente. Reserve plenty of pasta water.', timer: null },
      { text: 'Toast black pepper in a large dry pan until fragrant, about 1 minute.', timer: 1 },
      { text: 'Add a ladle of pasta water to the pepper and let it reduce slightly.', timer: null },
      { text: 'Add the pasta and finish cooking in the pan, tossing constantly over medium heat.', timer: null },
      { text: 'Remove from heat. Add pecorino in three additions, tossing and adding small splashes of pasta water to create a glossy, creamy sauce.', timer: null },
      { text: 'Serve immediately with extra pecorino and cracked pepper. Speed is everything.', timer: null },
    ],
  },
  {
    name: 'Ribollita',
    description: 'Tuscan bread and bean soup — thick, hearty, and better the next day.',
    time: 60, difficulty: 'Easy', servings: 4,
    ingredients: [
      { name: 'Cannellini beans', qty: '400g cooked' },
      { name: 'Cavolo nero', qty: '300g' },
      { name: 'Stale bread', qty: '4 thick slices' },
      { name: 'Onion', qty: '1 large' },
      { name: 'Carrots', qty: '2' },
      { name: 'Celery', qty: '2 stalks' },
      { name: 'Canned tomatoes', qty: '400g' },
      { name: 'Garlic', qty: '3 cloves' },
      { name: 'Olive oil', qty: '4 tbsp' },
      { name: 'Parmesan rind', qty: '1 piece (optional)' },
    ],
    steps: [
      { text: 'Soften onion, carrot, and celery in olive oil for 10 minutes over medium heat.', timer: 10 },
      { text: 'Add garlic and cook for 1 minute, then add tomatoes and simmer 10 minutes.', timer: 10 },
      { text: 'Add beans — mash half with a spoon for body — and the parmesan rind if using.', timer: null },
      { text: 'Add cavolo nero and enough water to cover generously. Simmer 20 minutes.', timer: 20 },
      { text: 'Tear in the stale bread, stir well, and simmer 10 more minutes until thick.', timer: 10 },
      { text: 'Rest off heat for 10 minutes. Season generously.', timer: 10 },
      { text: 'Serve in deep bowls with a heavy pour of your best olive oil over the top.', timer: null },
    ],
  },
  {
    name: 'Tiramisu',
    description: 'The classic. Needs 4 hours chilling — plan ahead.',
    time: 30, difficulty: 'Medium', servings: 6,
    ingredients: [
      { name: 'Mascarpone', qty: '500g' },
      { name: 'Eggs, separated', qty: '6' },
      { name: 'Caster sugar', qty: '6 tbsp' },
      { name: 'Strong espresso', qty: '300ml' },
      { name: 'Savoiardi biscuits', qty: '200g' },
      { name: 'Marsala or dark rum', qty: '2 tbsp' },
      { name: 'Cocoa powder', qty: 'for dusting' },
      { name: 'Salt', qty: 'pinch' },
    ],
    steps: [
      { text: 'Whisk egg yolks with sugar in a bowl until pale, thick, and tripled in volume.', timer: null },
      { text: 'Fold in mascarpone until smooth and lump-free.', timer: null },
      { text: 'Whisk egg whites with a pinch of salt to stiff peaks, then fold gently into the mascarpone mixture in three additions.', timer: null },
      { text: 'Mix espresso with marsala in a shallow bowl. Cool to room temperature.', timer: null },
      { text: 'Dip each biscuit for 1-2 seconds only — soaked but not falling apart. Layer in a dish, spoon over half the cream. Repeat.', timer: null },
      { text: 'Dust heavily with cocoa and refrigerate for at least 4 hours, ideally overnight.', timer: null },
    ],
  },
  {
    name: 'Osso Buco',
    description: 'Braised Milanese veal shanks with gremolata. A Sunday project.',
    time: 90, difficulty: 'Hard', servings: 4,
    ingredients: [
      { name: 'Veal shin cross-cuts', qty: '4 thick pieces' },
      { name: 'Onion', qty: '1 large' },
      { name: 'Celery', qty: '2 stalks' },
      { name: 'Carrots', qty: '2' },
      { name: 'Dry white wine', qty: '200ml' },
      { name: 'Canned tomatoes', qty: '400g' },
      { name: 'Beef stock', qty: '500ml' },
      { name: 'Lemon zest and garlic', qty: 'for gremolata' },
      { name: 'Flat-leaf parsley', qty: 'handful' },
      { name: 'Olive oil', qty: '3 tbsp' },
    ],
    steps: [
      { text: 'Dust veal in seasoned flour and sear in hot oil until deeply golden on all sides. Remove and set aside.', timer: null },
      { text: 'In the same pan, cook onion, celery, and carrot over medium heat for 8 minutes until soft.', timer: 8 },
      { text: 'Add wine and reduce by half, scraping up any browned bits.', timer: 3 },
      { text: 'Return veal. Add tomatoes and stock — liquid should come halfway up the meat.', timer: null },
      { text: 'Cover and braise on the lowest possible heat for 1.5 hours until the meat is giving and nearly falling off the bone.', timer: 90 },
      { text: 'Meanwhile, finely mix lemon zest, 1 garlic clove, and parsley for the gremolata.', timer: null },
      { text: 'Remove the veal. Reduce the sauce over high heat until glossy and coating.', timer: null },
      { text: 'Return the veal to the sauce, scatter gremolata over the top, and serve with risotto milanese or soft polenta.', timer: null },
    ],
  },
  {
    name: 'Focaccia',
    description: 'Olive oil-drenched Ligurian flatbread. Easy but needs time.',
    time: 45, difficulty: 'Easy', servings: 8,
    ingredients: [
      { name: 'Strong white bread flour', qty: '500g' },
      { name: 'Instant yeast', qty: '7g' },
      { name: 'Fine salt', qty: '10g' },
      { name: 'Warm water', qty: '400ml' },
      { name: 'Olive oil', qty: '6 tbsp, plus extra' },
      { name: 'Flaky sea salt', qty: 'for topping' },
    ],
    steps: [
      { text: 'Mix flour, yeast, and salt. Add warm water and 4 tbsp olive oil. Mix to a rough dough.', timer: null },
      { text: 'Knead for 10 minutes until smooth and elastic, or 7 minutes in a stand mixer.', timer: 10 },
      { text: 'Place in an oiled bowl, cover, and prove for 1.5 hours until doubled in size.', timer: 90 },
      { text: 'Tip into a well-oiled 30x40cm baking tray. Stretch to fill. Dimple all over with your fingers.', timer: null },
      { text: 'Drizzle with 2 tbsp olive oil, scatter flaky salt generously, and prove for 30 minutes more.', timer: 30 },
      { text: 'Bake at 220°C / 425°F for 20-25 minutes until deep golden and pulling from the edges.', timer: 22 },
      { text: 'Drizzle more olive oil over while still hot. Rest 10 minutes before cutting.', timer: 10 },
    ],
  },
];

async function seed() {
  console.log('Clearing existing data...');
  await supabase.from('cookbooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('Inserting cookbooks...');
  const { data: cookbooks, error: cbErr } = await supabase
    .from('cookbooks')
    .insert(COOKBOOKS)
    .select();
  if (cbErr) { console.error('Cookbook insert failed:', cbErr); process.exit(1); }

  const italianId = cookbooks.find(c => c.name === 'Italian Nights').id;
  console.log(`Seeding Italian Nights (${italianId})...`);

  for (const recipe of ITALIAN_RECIPES) {
    const { data: rec, error: recErr } = await supabase
      .from('recipes')
      .insert({ cookbook_id: italianId, name: recipe.name, description: recipe.description, time: recipe.time, difficulty: recipe.difficulty, servings: recipe.servings, cooked_count: 0 })
      .select()
      .single();
    if (recErr) { console.error(`Recipe insert failed (${recipe.name}):`, recErr); process.exit(1); }

    await supabase.from('ingredients').insert(
      recipe.ingredients.map((ing, idx) => ({ recipe_id: rec.id, name: ing.name, qty: ing.qty, position: idx }))
    );
    await supabase.from('steps').insert(
      recipe.steps.map((step, idx) => ({ recipe_id: rec.id, text: step.text, timer: step.timer || null, position: idx }))
    );
    console.log(`  ✓ ${recipe.name}`);
  }

  console.log('Done.');
}

seed().catch(err => { console.error(err); process.exit(1); });
