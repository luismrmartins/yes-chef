import { supabase } from './supabase';

export async function getCookbooks() {
  const { data, error } = await supabase
    .from('cookbooks')
    .select('id, name, color')
    .order('created_at');
  if (error) throw error;
  return data;
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

export async function getRecipes(cookbookId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('cookbook_id', cookbookId)
    .order('created_at');
  if (error) throw error;
  return data.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    time: r.time,
    difficulty: r.difficulty,
    servings: r.servings,
    cookedCount: r.cooked_count,
    ingredients: (r.ingredients || []).sort((a, b) => a.position - b.position),
    steps: (r.steps || []).sort((a, b) => a.position - b.position),
  }));
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
    })
    .select()
    .single();
  if (error) throw error;

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  if (ingredients.length) {
    const { error: ingErr } = await supabase.from('ingredients').insert(
      ingredients.map((ing, idx) => ({
        recipe_id: rec.id,
        name: ing.name,
        qty: ing.qty || '',
        position: idx,
      }))
    );
    if (ingErr) throw ingErr;
  }

  if (steps.length) {
    const { error: stepErr } = await supabase.from('steps').insert(
      steps.map((step, idx) => ({
        recipe_id: rec.id,
        text: step.text,
        timer: step.timer || null,
        position: idx,
      }))
    );
    if (stepErr) throw stepErr;
  }

  return {
    id: rec.id,
    name: rec.name,
    description: rec.description,
    time: rec.time,
    difficulty: rec.difficulty,
    servings: rec.servings,
    cookedCount: 0,
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
    .from('recipes')
    .select('cooked_count')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;
  const { error } = await supabase
    .from('recipes')
    .update({ cooked_count: (current.cooked_count || 0) + 1 })
    .eq('id', id);
  if (error) throw error;
}
