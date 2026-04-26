import { supabase } from './supabase';

export async function getCookbooks() {
  const { data, error } = await supabase
    .from('cookbooks')
    .select('id, name, color, recipes(count)')
    .order('created_at');
  if (error) throw error;
  return data.map(cb => ({
    id: cb.id,
    name: cb.name,
    color: cb.color,
    recipeCount: cb.recipes?.[0]?.count ?? 0,
  }));
}

export async function createCookbook(name, color) {
  const { data, error } = await supabase
    .from('cookbooks')
    .insert({ name, color })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCookbook(id) {
  const { error } = await supabase.from('cookbooks').delete().eq('id', id);
  if (error) throw error;
}

function normalizeRecipe(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    time: r.time,
    difficulty: r.difficulty,
    servings: r.servings,
    cookedCount: r.cooked_count,
    lastCookedAt: r.last_cooked_at || null,
    cookbookId: r.cookbook_id,
    tags: r.tags || [],
    ingredients: (r.ingredients || []).sort((a, b) => a.position - b.position),
    steps: (r.steps || []).sort((a, b) => a.position - b.position),
  };
}

export async function getRecipes(cookbookId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('cookbook_id', cookbookId)
    .order('created_at');
  if (error) throw error;
  return data.map(normalizeRecipe);
}

export async function createRecipe(cookbookId, recipe) {
  const { data: rec, error } = await supabase
    .from('recipes')
    .insert({
      cookbook_id: cookbookId,
      name: recipe.name,
      description: recipe.description || '',
      time: recipe.time,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      cooked_count: 0,
      tags: recipe.tags || [],
    })
    .select()
    .single();
  if (error) throw error;

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  if (ingredients.length) {
    const { error: ingErr } = await supabase.from('ingredients').insert(
      ingredients.map((ing, idx) => ({ recipe_id: rec.id, name: ing.name, qty: ing.qty || '', position: idx }))
    );
    if (ingErr) throw ingErr;
  }

  if (steps.length) {
    const { error: stepErr } = await supabase.from('steps').insert(
      steps.map((step, idx) => ({ recipe_id: rec.id, text: step.text, timer: step.timer || null, position: idx }))
    );
    if (stepErr) throw stepErr;
  }

  return {
    id: rec.id, name: rec.name, description: rec.description,
    time: rec.time, difficulty: rec.difficulty, servings: rec.servings,
    cookedCount: 0, cookbookId, tags: recipe.tags || [],
    ingredients: ingredients.map((ing, idx) => ({ ...ing, position: idx })),
    steps: steps.map((step, idx) => ({ ...step, position: idx })),
  };
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementCookedCount(id) {
  const { data: current, error: fetchErr } = await supabase
    .from('recipes').select('cooked_count').eq('id', id).single();
  if (fetchErr) throw fetchErr;
  const { error } = await supabase
    .from('recipes').update({ cooked_count: (current.cooked_count || 0) + 1, last_cooked_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// Favourites
export async function getFavouriteIds() {
  const { data, error } = await supabase.from('favourites').select('recipe_id');
  if (error) throw error;
  return data.map(f => f.recipe_id);
}

export async function getFavouriteRecipes() {
  const { data, error } = await supabase
    .from('favourites')
    .select('recipe_id, recipes(*, ingredients(id, name, qty, position), steps(id, text, timer, position))')
    .order('created_at');
  if (error) throw error;
  return data.map(f => normalizeRecipe(f.recipes));
}

export async function toggleFavourite(recipeId) {
  const { data } = await supabase.from('favourites').select('id').eq('recipe_id', recipeId).maybeSingle();
  if (data) {
    await supabase.from('favourites').delete().eq('recipe_id', recipeId);
    return false;
  } else {
    await supabase.from('favourites').insert({ recipe_id: recipeId });
    return true;
  }
}

// Add to cookbook (copies recipe)
export async function addRecipeToCookbook(recipeId, cookbookId) {
  const { data: r, error } = await supabase
    .from('recipes')
    .select('*, ingredients(name, qty, position), steps(text, timer, position)')
    .eq('id', recipeId)
    .single();
  if (error) throw error;

  const { data: newRec, error: recErr } = await supabase
    .from('recipes')
    .insert({ cookbook_id: cookbookId, name: r.name, description: r.description, time: r.time, difficulty: r.difficulty, servings: r.servings, cooked_count: 0 })
    .select().single();
  if (recErr) throw recErr;

  if (r.ingredients?.length) {
    await supabase.from('ingredients').insert(
      r.ingredients.map(ing => ({ recipe_id: newRec.id, name: ing.name, qty: ing.qty, position: ing.position }))
    );
  }
  if (r.steps?.length) {
    await supabase.from('steps').insert(
      r.steps.map(s => ({ recipe_id: newRec.id, text: s.text, timer: s.timer, position: s.position }))
    );
  }
  return newRec;
}

// Shopping list
export async function getShoppingList() {
  const { data, error } = await supabase.from('shopping_list').select('*').order('added_at');
  if (error) throw error;
  return data;
}

export async function addToShoppingList(recipeId, recipeName, ingredients, priority = 'eventually') {
  const { error } = await supabase.from('shopping_list').insert(
    ingredients.map(ing => ({ recipe_id: recipeId, recipe_name: recipeName, ingredient_name: ing.name, qty: ing.qty || '', priority }))
  );
  if (error) throw error;
}

export async function toggleShoppingItem(id, currentChecked) {
  const { error } = await supabase.from('shopping_list').update({ checked: !currentChecked }).eq('id', id);
  if (error) throw error;
}

export async function deleteShoppingItem(id) {
  const { error } = await supabase.from('shopping_list').delete().eq('id', id);
  if (error) throw error;
}

export async function clearShoppingList() {
  const { error } = await supabase.from('shopping_list').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// Feedback
export async function saveRecipeFeedback(recipeId, ease, taste, overall, notes) {
  const { error } = await supabase.from('recipe_feedback').insert({
    recipe_id: recipeId, ease_rating: ease, taste_rating: taste,
    overall_rating: overall, notes: notes || null,
  });
  if (error) throw error;
}

export async function getFeedback(recipeId) {
  const { data, error } = await supabase
    .from('recipe_feedback').select('*').eq('recipe_id', recipeId).order('cooked_at', { ascending: false });
  if (error) throw error;
  return data;
}
