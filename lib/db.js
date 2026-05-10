import { supabase } from './supabase';

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProfile(userId, { username, displayName }) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, username: username.toLowerCase(), display_name: displayName })
    .select().single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

export async function saveProfile(userId, { firstName, lastName, username, unitPreference, email }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      username: username.toLowerCase().trim(),
      first_name: firstName,
      last_name: lastName,
      unit_preference: unitPreference,
      ...(email ? { email: email.toLowerCase().trim() } : {}),
    })
    .select().single();
  if (error) throw error;
  return data;
}

export async function checkUsernameAvailable(username) {
  const { data } = await supabase
    .from('profiles').select('id').eq('username', username.toLowerCase()).maybeSingle();
  return !data;
}

// ── Cookbooks ─────────────────────────────────────────────────────────────────

export async function getCookbooks() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('cookbooks')
    .select('id, name, color, recipes(count)')
    .eq('user_id', user.id)
    .order('created_at');
  if (error) throw error;
  return data.map(cb => ({
    id: cb.id, name: cb.name, color: cb.color,
    recipeCount: cb.recipes?.[0]?.count ?? 0,
  }));
}

export async function getUserCookbooks(userId) {
  const { data, error } = await supabase
    .from('cookbooks')
    .select('id, name, color, recipes(count)')
    .eq('user_id', userId)
    .order('created_at');
  if (error) return [];
  return data.map(cb => ({
    id: cb.id, name: cb.name, color: cb.color,
    recipeCount: cb.recipes?.[0]?.count ?? 0,
  }));
}

export async function createCookbook(name, color) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('cookbooks').insert({ name, color, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCookbook(id) {
  const { error } = await supabase.from('cookbooks').delete().eq('id', id);
  if (error) throw error;
}

// ── Recipes ───────────────────────────────────────────────────────────────────

function normalizeRecipe(r) {
  return {
    id: r.id, name: r.name, description: r.description,
    time: r.time, difficulty: r.difficulty, servings: r.servings,
    cookedCount: r.cooked_count, lastCookedAt: r.last_cooked_at || null,
    cookbookId: r.cookbook_id, tags: r.tags || [],
    userId: r.user_id || null,
    authorId: r.author_id || null,
    isPublic: r.is_public || false,
    isLocked: r.is_locked || false,
    publishedAt: r.published_at || null,
    ingredients: (r.ingredients || []).sort((a, b) => a.position - b.position),
    steps: (r.steps || []).sort((a, b) => a.position - b.position),
  };
}

export async function getRecipes(cookbookId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('cookbook_id', cookbookId).order('created_at');
  if (error) throw error;
  return data.map(normalizeRecipe);
}

export async function createRecipe(cookbookId, recipe) {
  const user = await getUser();
  const { data: rec, error } = await supabase
    .from('recipes')
    .insert({
      cookbook_id: cookbookId, user_id: user.id,
      name: recipe.name, description: recipe.description || '',
      time: recipe.time, difficulty: recipe.difficulty,
      servings: recipe.servings, cooked_count: 0, tags: recipe.tags || [],
      is_public: recipe.isPublic || false,
    }).select().single();
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
  // Refetch with relations so the returned shape matches getRecipes(): the
  // detail screen relies on userId / isPublic / isLocked etc. to decide which
  // action buttons to render, and ingredient/step ids matter for annotations.
  const { data: full } = await supabase
    .from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('id', rec.id).single();
  return normalizeRecipe(full || rec);
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementCookedCount(id) {
  const { error } = await supabase.rpc('increment_cooked_count', { recipe_id: id });
  if (error) throw error;
  // Best-effort: update last_cooked_at if the user owns the recipe (RLS-gated).
  await supabase.from('recipes')
    .update({ last_cooked_at: new Date().toISOString() })
    .eq('id', id);
}

export function formatCount(n) {
  const v = n || 0;
  return v.toLocaleString('en-US');
}

// ── Favourites ────────────────────────────────────────────────────────────────

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
  const user = await getUser();
  const { data } = await supabase.from('favourites').select('id')
    .eq('recipe_id', recipeId).eq('user_id', user.id).maybeSingle();
  if (data) {
    await supabase.from('favourites').delete().eq('recipe_id', recipeId).eq('user_id', user.id);
    return false;
  } else {
    await supabase.from('favourites').insert({ recipe_id: recipeId, user_id: user.id });
    return true;
  }
}

export async function addRecipeToCookbook(recipeId, cookbookId) {
  const user = await getUser();
  const { data: r, error } = await supabase
    .from('recipes')
    .select('*, ingredients(name, qty, position), steps(text, timer, position)')
    .eq('id', recipeId).single();
  if (error) throw error;
  const { data: newRec, error: recErr } = await supabase
    .from('recipes')
    .insert({ cookbook_id: cookbookId, user_id: user.id, name: r.name, description: r.description, time: r.time, difficulty: r.difficulty, servings: r.servings, cooked_count: 0 })
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

// ── Shopping list ─────────────────────────────────────────────────────────────

export async function getShoppingList() {
  const { data, error } = await supabase.from('shopping_list').select('*').order('added_at');
  if (error) throw error;
  return data;
}

export async function addToShoppingList(recipeId, recipeName, ingredients, priority = 'eventually') {
  const user = await getUser();
  const { error } = await supabase.from('shopping_list').insert(
    ingredients.map(ing => ({
      recipe_id: recipeId, recipe_name: recipeName,
      ingredient_name: ing.name, qty: ing.qty || '', priority, user_id: user.id,
    }))
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
  const user = await getUser();
  const { error } = await supabase.from('shopping_list').delete().eq('user_id', user.id);
  if (error) throw error;
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function saveRecipeFeedback(recipeId, ease, taste, overall, notes, extras = {}) {
  const { left_app, improvement_notes } = extras;
  const { error } = await supabase.from('recipe_feedback').insert({
    recipe_id: recipeId, ease_rating: ease, taste_rating: taste,
    overall_rating: overall, notes: notes || null,
    left_app: left_app || null,
    improvement_notes: improvement_notes || null,
  });
  if (error) throw error;
}

export async function copyRecipeToMyCookbook(recipeId, targetCookbookId) {
  const user = await getUser();
  const { data: src, error } = await supabase
    .from('recipes')
    .select('*, ingredients(name, qty, position), steps(text, timer, position)')
    .eq('id', recipeId).single();
  if (error) throw error;
  const { data: rec, error: rErr } = await supabase.from('recipes').insert({
    cookbook_id: targetCookbookId, user_id: user.id,
    name: src.name, description: src.description || '',
    time: src.time, difficulty: src.difficulty,
    servings: src.servings, tags: src.tags || [],
    cooked_count: 0, is_public: false,
  }).select().single();
  if (rErr) throw rErr;
  if (src.ingredients?.length) {
    await supabase.from('ingredients').insert(
      src.ingredients.map(i => ({ recipe_id: rec.id, name: i.name, qty: i.qty || '', position: i.position }))
    );
  }
  if (src.steps?.length) {
    await supabase.from('steps').insert(
      src.steps.map(s => ({ recipe_id: rec.id, text: s.text, timer: s.timer || null, position: s.position }))
    );
  }
  return rec;
}

export async function setRecipePublic(recipeId, isPublic) {
  const { error } = await supabase.from('recipes').update({ is_public: isPublic }).eq('id', recipeId);
  if (error) throw error;
}

export async function updateRecipe(recipeId, recipe) {
  const { error } = await supabase.from('recipes').update({
    name: recipe.name, description: recipe.description || '',
    time: recipe.time, difficulty: recipe.difficulty,
    servings: recipe.servings, tags: recipe.tags || [],
    is_public: recipe.isPublic || false,
  }).eq('id', recipeId);
  if (error) throw error;
  await supabase.from('ingredients').delete().eq('recipe_id', recipeId);
  if (recipe.ingredients?.length) {
    const { error: ingErr } = await supabase.from('ingredients').insert(
      recipe.ingredients.map((ing, idx) => ({ recipe_id: recipeId, name: ing.name, qty: ing.qty || '', position: idx }))
    );
    if (ingErr) throw ingErr;
  }
  await supabase.from('steps').delete().eq('recipe_id', recipeId);
  if (recipe.steps?.length) {
    const { error: stepErr } = await supabase.from('steps').insert(
      recipe.steps.map((step, idx) => ({ recipe_id: recipeId, text: step.text, timer: step.timer || null, position: idx }))
    );
    if (stepErr) throw stepErr;
  }
}

export async function getFeedback(recipeId) {
  const { data, error } = await supabase
    .from('recipe_feedback').select('*').eq('recipe_id', recipeId)
    .order('cooked_at', { ascending: false });
  if (error) throw error;
  return data;
}

// ── Social: follows ───────────────────────────────────────────────────────────

export async function getFollowCounts(userId) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return { followers: followers || 0, following: following || 0 };
}

export async function getFollowingIds(userId) {
  const { data, error } = await supabase
    .from('follows').select('following_id').eq('follower_id', userId);
  if (error) return [];
  return data.map(f => f.following_id);
}

export async function getFollowersList(userId) {
  const { data, error } = await supabase
    .from('follows').select('follower_id').eq('following_id', userId);
  if (error || !data.length) return [];
  const ids = data.map(f => f.follower_id);
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
  return profiles || [];
}

export async function getFollowingList(userId) {
  const { data, error } = await supabase
    .from('follows').select('following_id').eq('follower_id', userId);
  if (error || !data.length) return [];
  const ids = data.map(f => f.following_id);
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
  return profiles || [];
}

export async function followUser(targetUserId) {
  const user = await getUser();
  const { error } = await supabase.from('follows')
    .insert({ follower_id: user.id, following_id: targetUserId });
  if (error) throw error;
  await supabase.from('notifications')
    .insert({ user_id: targetUserId, from_user_id: user.id, type: 'follow' });
  await createEvent('followed_you', { targetUserId });
}

export async function unfollowUser(targetUserId) {
  const user = await getUser();
  const { error } = await supabase.from('follows').delete()
    .eq('follower_id', user.id).eq('following_id', targetUserId);
  if (error) throw error;
}

export async function checkIsFollowing(followerId, followingId) {
  const { data } = await supabase.from('follows').select('id')
    .eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
  return !!data;
}

// ── Search / Discover ─────────────────────────────────────────────────────────

export async function searchUsers(query) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, email')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .neq('id', user.id)
    .limit(20);
  if (error) return [];
  return data;
}

export async function getDiscoverUsers() {
  const user = await getUser();
  const followingIds = await getFollowingIds(user.id);
  const exclude = [user.id, ...followingIds];
  let q = supabase.from('profiles').select('id, username, display_name, avatar_url').limit(10);
  for (const id of exclude) q = q.neq('id', id);
  const { data } = await q;
  return data || [];
}

export async function getDiscoverPeople() {
  const user = await getUser();
  const followingIds = await getFollowingIds(user.id);
  const exclude = [user.id, ...followingIds];
  let q = supabase.from('profiles').select('id, username, display_name, avatar_url').limit(12);
  for (const id of exclude) q = q.neq('id', id);
  const { data: profiles } = await q;
  if (!profiles?.length) return [];
  const counts = await Promise.all(
    profiles.map(p => supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id))
  );
  return profiles.map((p, i) => ({ ...p, followerCount: counts[i].count || 0 }))
    .sort((a, b) => b.followerCount - a.followerCount);
}

export async function getPeopleFollowingMeNotFollowedBack() {
  const user = await getUser();
  const [followingIds, { data: followerData }] = await Promise.all([
    getFollowingIds(user.id),
    supabase.from('follows').select('follower_id').eq('following_id', user.id),
  ]);
  if (!followerData?.length) return [];
  const followerIds = followerData.map(f => f.follower_id)
    .filter(id => !followingIds.includes(id) && id !== user.id);
  if (!followerIds.length) return [];
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, display_name, avatar_url').in('id', followerIds);
  if (!profiles?.length) return [];
  const counts = await Promise.all(
    profiles.map(p => supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', p.id))
  );
  return profiles.map((p, i) => ({ ...p, followerCount: counts[i].count || 0 }));
}

export async function getUsersFollowingMe() {
  const user = await getUser();
  const followingIds = await getFollowingIds(user.id);
  const { data, error } = await supabase
    .from('follows').select('follower_id').eq('following_id', user.id);
  if (error || !data.length) return [];
  const followerIds = data.map(f => f.follower_id).filter(id => !followingIds.includes(id) && id !== user.id);
  if (!followerIds.length) return [];
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, display_name, avatar_url').in('id', followerIds);
  return profiles || [];
}

// ── Sharing ───────────────────────────────────────────────────────────────────

export async function shareRecipe(recipeId, toUserId, message) {
  const user = await getUser();
  const { error } = await supabase.from('shared_recipes').insert({
    from_user_id: user.id, to_user_id: toUserId,
    recipe_id: recipeId, message: message || null,
  });
  if (error) throw error;
  await supabase.from('notifications').insert({
    user_id: toUserId, from_user_id: user.id, type: 'share', recipe_id: recipeId,
  });
}

export async function getFriendsFeed() {
  const user = await getUser();
  const followingIds = await getFollowingIds(user.id);
  if (!followingIds.length) return [];
  const { data, error } = await supabase
    .from('shared_recipes')
    .select('id, message, created_at, from_user_id, recipe_id, recipes(*, ingredients(id, name, qty, position), steps(id, text, timer, position))')
    .eq('to_user_id', user.id)
    .in('from_user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error || !data.length) return [];
  const fromIds = [...new Set(data.map(s => s.from_user_id))];
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, display_name').in('id', fromIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return data.map(s => ({
    id: s.id, message: s.message, createdAt: s.created_at,
    from: profileMap[s.from_user_id],
    recipe: s.recipes ? normalizeRecipe(s.recipes) : null,
  })).filter(s => s.recipe);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications() {
  const user = await getUser();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, read, created_at, from_user_id, recipe_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data.length) return [];
  const fromIds = [...new Set(data.map(n => n.from_user_id).filter(Boolean))];
  const recipeIds = [...new Set(data.map(n => n.recipe_id).filter(Boolean))];
  const [{ data: profiles }, { data: recipes }] = await Promise.all([
    fromIds.length
      ? supabase.from('profiles').select('id, username, display_name').in('id', fromIds)
      : Promise.resolve({ data: [] }),
    recipeIds.length
      ? supabase.from('recipes').select('id, name').in('id', recipeIds)
      : Promise.resolve({ data: [] }),
  ]);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  const recipeMap = Object.fromEntries((recipes || []).map(r => [r.id, r]));
  return data.map(n => ({
    ...n,
    fromProfile: profileMap[n.from_user_id],
    recipe: recipeMap[n.recipe_id],
  }));
}

export async function getUnreadNotificationCount() {
  const user = await getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('read', false);
  if (error) return 0;
  return count || 0;
}

export async function markAllNotificationsRead() {
  const user = await getUser();
  await supabase.from('notifications')
    .update({ read: true }).eq('user_id', user.id).eq('read', false);
}

// ── Recipe likes & comments ───────────────────────────────────────────────────

export async function toggleRecipeLike(recipeId) {
  const user = await getUser();
  const { data } = await supabase.from('recipe_likes').select('id')
    .eq('recipe_id', recipeId).eq('user_id', user.id).maybeSingle();
  if (data) {
    await supabase.from('recipe_likes').delete().eq('id', data.id);
    return false;
  } else {
    await supabase.from('recipe_likes').insert({ recipe_id: recipeId, user_id: user.id });
    return true;
  }
}

export async function getRecipeLikes(recipeId) {
  const user = await getUser();
  const [{ count }, { data: mine }] = await Promise.all([
    supabase.from('recipe_likes').select('*', { count: 'exact', head: true }).eq('recipe_id', recipeId),
    supabase.from('recipe_likes').select('id').eq('recipe_id', recipeId).eq('user_id', user.id).maybeSingle(),
  ]);
  return { count: count || 0, likedByMe: !!mine };
}

export async function getRecipeComments(recipeId) {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select('id, text, created_at, user_id')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true });
  if (error || !data?.length) return [];
  const userIds = [...new Set(data.map(c => c.user_id))];
  const { data: profiles } = await supabase
    .from('profiles').select('id, username, display_name').in('id', userIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return data.map(c => ({ ...c, profiles: profileMap[c.user_id] }));
}

export async function addRecipeComment(recipeId, text) {
  const user = await getUser();
  const { error } = await supabase.from('recipe_comments')
    .insert({ recipe_id: recipeId, user_id: user.id, text: text.trim() });
  if (error) throw error;
}

export async function deleteRecipeComment(commentId) {
  const { error } = await supabase.from('recipe_comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ── Events ────────────────────────────────────────────────────────────────────

export async function createEvent(type, { targetUserId = null, recipeId = null, postText = null, photoUrl = null } = {}) {
  const user = await getUser();
  if (!user) return;
  await supabase.from('events').insert({
    user_id: user.id,
    type,
    target_user_id: targetUserId,
    recipe_id: recipeId,
    post_text: postText,
    photo_url: photoUrl,
  });
}

export async function getTimeline() {
  const user = await getUser();
  const followingIds = await getFollowingIds(user.id);
  const userIds = [user.id, ...followingIds];
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(50);
  if (!events?.length) return [];
  const authorIds = [...new Set(events.map(e => e.user_id))];
  const targetIds = [...new Set(events.map(e => e.target_user_id).filter(Boolean))];
  const recipeIds = [...new Set(events.map(e => e.recipe_id).filter(Boolean))];
  const allProfileIds = [...new Set([...authorIds, ...targetIds])];
  const [{ data: profiles }, { data: recipes }] = await Promise.all([
    supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', allProfileIds),
    recipeIds.length
      ? supabase.from('recipes').select('id, name').in('id', recipeIds)
      : Promise.resolve({ data: [] }),
  ]);
  const eventIds = events.map(e => e.id);
  const { data: likes } = await supabase.from('likes').select('event_id, user_id').in('event_id', eventIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  const recipeMap = Object.fromEntries((recipes || []).map(r => [r.id, r]));
  const likeCounts = {};
  const likedByMe = new Set();
  (likes || []).forEach(l => {
    likeCounts[l.event_id] = (likeCounts[l.event_id] || 0) + 1;
    if (l.user_id === user.id) likedByMe.add(l.event_id);
  });
  return events.map(e => ({
    ...e,
    userProfile: profileMap[e.user_id],
    targetProfile: profileMap[e.target_user_id],
    recipe: recipeMap[e.recipe_id],
    likeCount: likeCounts[e.id] || 0,
    likedByMe: likedByMe.has(e.id),
  }));
}

export async function toggleLike(eventId) {
  const user = await getUser();
  const { data } = await supabase.from('likes').select('id')
    .eq('event_id', eventId).eq('user_id', user.id).maybeSingle();
  if (data) {
    await supabase.from('likes').delete().eq('id', data.id);
    return false;
  } else {
    await supabase.from('likes').insert({ event_id: eventId, user_id: user.id });
    return true;
  }
}

export async function getPublicRecipeDetail(recipeId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('id', recipeId).single();
  if (error) throw error;
  return normalizeRecipe(data);
}

export async function getUserPublicRecipes(userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, time, difficulty, servings, tags, cooked_count, last_cooked_at, cookbook_id, is_locked, published_at')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at');
  if (error) return [];
  return data.map(r => ({
    id: r.id, name: r.name, time: r.time, difficulty: r.difficulty,
    servings: r.servings, tags: r.tags || [],
    cookedCount: r.cooked_count, lastCookedAt: r.last_cooked_at || null,
    cookbookId: r.cookbook_id,
    isLocked: r.is_locked || false,
    publishedAt: r.published_at || null,
  }));
}

export async function getUserPublicProfile(targetUserId) {
  const user = await getUser();
  const [{ data: profile }, cookbooks, followCounts, isFollowing, publicRecipes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle(),
    getUserCookbooks(targetUserId),
    getFollowCounts(targetUserId),
    checkIsFollowing(user.id, targetUserId),
    getUserPublicRecipes(targetUserId),
  ]);
  return { profile, cookbooks, followCounts, isFollowing, publicRecipes };
}

// ── Authorship, locking, annotations, saved recipes ──────────────────────────

export async function publishRecipe(recipeId) {
  const user = await getUser();
  const { error } = await supabase.from('recipes').update({
    is_public: true,
    is_locked: true,
    published_at: new Date().toISOString(),
    author_id: user.id,
  }).eq('id', recipeId);
  if (error) throw error;
}

export async function saveRecipeToLibrary(recipeId, cookbookId = null) {
  const user = await getUser();
  const { data, error } = await supabase.from('saved_recipes')
    .upsert(
      { user_id: user.id, recipe_id: recipeId, cookbook_id: cookbookId },
      { onConflict: 'user_id,recipe_id' }
    )
    .select().single();
  if (error) throw error;
  return data;
}

export async function unsaveRecipe(recipeId) {
  const user = await getUser();
  const { error } = await supabase.from('saved_recipes').delete()
    .eq('user_id', user.id).eq('recipe_id', recipeId);
  if (error) throw error;
}

export async function getSavedRecipeIds() {
  const user = await getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('saved_recipes')
    .select('recipe_id, cookbook_id').eq('user_id', user.id);
  if (error) return [];
  return data;
}

export async function isRecipeSaved(recipeId) {
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabase.from('saved_recipes')
    .select('id, cookbook_id').eq('user_id', user.id).eq('recipe_id', recipeId).maybeSingle();
  return data;
}

export async function getAnnotations(recipeId, userId) {
  const { data, error } = await supabase
    .from('recipe_annotations')
    .select('*')
    .eq('recipe_id', recipeId)
    .eq('user_id', userId)
    .order('created_at');
  if (error) return [];
  return data;
}

export async function saveAnnotation(recipeId, type, content, ingredientId = null, stepId = null) {
  const user = await getUser();
  const { data, error } = await supabase.from('recipe_annotations').insert({
    user_id: user.id,
    recipe_id: recipeId,
    annotation_type: type,
    content,
    ingredient_id: ingredientId,
    step_id: stepId,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateAnnotation(id, content) {
  const { data, error } = await supabase.from('recipe_annotations')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAnnotation(id) {
  const { error } = await supabase.from('recipe_annotations').delete().eq('id', id);
  if (error) throw error;
}

export async function searchPublicRecipes(query, filters = {}, page = 0, limit = 20) {
  const { min_time, max_time, difficulty, cookbook_id } = filters;
  let q = supabase.from('recipes')
    .select('id, name, description, time, difficulty, servings, cooked_count, author_id, published_at, cookbook_id')
    .eq('is_public', true)
    .eq('is_locked', true);

  const trimmed = (query || '').trim();
  if (trimmed) {
    q = q.textSearch('search_vector', trimmed, { type: 'websearch', config: 'english' });
    q = q.order('cooked_count', { ascending: false });
  } else {
    q = q.order('cooked_count', { ascending: false });
  }

  if (typeof min_time === 'number') q = q.gte('time', min_time);
  if (typeof max_time === 'number') q = q.lte('time', max_time);
  if (difficulty) q = q.eq('difficulty', difficulty);
  if (cookbook_id) q = q.eq('cookbook_id', cookbook_id);

  const offset = page * limit;
  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) return [];
  if (!data?.length) return [];

  const authorIds = [...new Set(data.map(r => r.author_id).filter(Boolean))];
  const { data: profiles } = authorIds.length
    ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', authorIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

  return data.map(r => ({
    id: r.id, name: r.name, description: r.description,
    time: r.time, difficulty: r.difficulty, servings: r.servings,
    tags: [], cookedCount: r.cooked_count,
    authorId: r.author_id, publishedAt: r.published_at,
    cookbookId: r.cookbook_id,
    author: profileMap[r.author_id] || null,
  }));
}

export async function getPublicRecipes(limit = 10, offset = 0) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, description, time, difficulty, servings, tags, cooked_count, author_id, published_at')
    .eq('is_public', true)
    .eq('is_locked', true)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return [];
  if (!data.length) return [];
  const authorIds = [...new Set(data.map(r => r.author_id).filter(Boolean))];
  const { data: profiles } = authorIds.length
    ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', authorIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return data.map(r => ({
    id: r.id, name: r.name, description: r.description,
    time: r.time, difficulty: r.difficulty, servings: r.servings,
    tags: r.tags || [], cookedCount: r.cooked_count,
    authorId: r.author_id, publishedAt: r.published_at,
    author: profileMap[r.author_id] || null,
  }));
}

// ── Discovery ─────────────────────────────────────────────────────────────────

function seededRng(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function attachAuthorProfiles(recipes) {
  if (!recipes.length) return [];
  const authorIds = [...new Set(recipes.map(r => r.author_id).filter(Boolean))];
  const { data: profiles } = authorIds.length
    ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', authorIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return recipes.map(r => ({
    id: r.id, name: r.name, description: r.description,
    time: r.time, difficulty: r.difficulty, servings: r.servings,
    cookedCount: r.cooked_count, authorId: r.author_id,
    publishedAt: r.published_at, cookbookId: r.cookbook_id,
    author: profileMap[r.author_id] || null,
  }));
}

async function getUserExclusionIds(userId) {
  const [{ data: saved }, { data: cooked }] = await Promise.all([
    supabase.from('saved_recipes').select('recipe_id').eq('user_id', userId),
    supabase.from('events').select('recipe_id').eq('user_id', userId).eq('type', 'cooked_recipe').not('recipe_id', 'is', null),
  ]);
  return new Set([
    ...(saved || []).map(r => r.recipe_id),
    ...(cooked || []).map(r => r.recipe_id),
  ]);
}

export async function getDailyPicks(userId, count = 5) {
  const exclude = await getUserExclusionIds(userId);
  const { data, error } = await supabase.from('recipes')
    .select('id, name, description, time, difficulty, servings, cooked_count, author_id, published_at, cookbook_id')
    .eq('is_public', true)
    .eq('is_locked', true)
    .order('cooked_count', { ascending: false })
    .limit(100);
  if (error) return [];
  const candidates = (data || []).filter(r => !exclude.has(r.id));
  if (!candidates.length) return [];
  const today = new Date().toISOString().slice(0, 10);
  const rng = seededRng(`${today}-${userId}`);
  const shuffled = shuffleWithRng(candidates, rng);
  return attachAuthorProfiles(shuffled.slice(0, count));
}

export async function getRandomSuggestions(userId, count = 5, alreadyShown = []) {
  const exclude = await getUserExclusionIds(userId);
  for (const id of alreadyShown) exclude.add(id);
  const { data, error } = await supabase.from('recipes')
    .select('id, name, description, time, difficulty, servings, cooked_count, author_id, published_at, cookbook_id')
    .eq('is_public', true)
    .eq('is_locked', true)
    .order('cooked_count', { ascending: false })
    .limit(150);
  if (error) return [];
  const candidates = (data || []).filter(r => !exclude.has(r.id));
  if (!candidates.length) return [];
  // Non-seeded shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return attachAuthorProfiles(candidates.slice(0, count));
}

export async function getTrendingRecipes(days = 7, limit = 10) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: events } = await supabase
    .from('events')
    .select('recipe_id')
    .eq('type', 'cooked_recipe')
    .not('recipe_id', 'is', null)
    .gte('created_at', since);
  if (!events?.length) return [];
  const counts = {};
  for (const e of events) counts[e.recipe_id] = (counts[e.recipe_id] || 0) + 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
  const ids = ranked.map(([id]) => id);
  if (!ids.length) return [];
  const { data: recipes } = await supabase.from('recipes')
    .select('id, name, description, time, difficulty, servings, cooked_count, author_id, published_at, cookbook_id')
    .in('id', ids)
    .eq('is_public', true)
    .eq('is_locked', true);
  const recipeMap = Object.fromEntries((recipes || []).map(r => [r.id, r]));
  const ordered = ids.map(id => recipeMap[id]).filter(Boolean);
  const enriched = await attachAuthorProfiles(ordered);
  return enriched.map(r => ({ ...r, weeklyCount: counts[r.id] || 0 }));
}

export async function getRecipeWithAuthor(recipeId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('id', recipeId).single();
  if (error) throw error;
  const recipe = {
    ...normalizeRecipe(data),
    userId: data.user_id,
    authorId: data.author_id || null,
    isLocked: data.is_locked || false,
    publishedAt: data.published_at || null,
  };
  if (data.author_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', data.author_id).maybeSingle();
    recipe.author = profile || null;
  } else {
    recipe.author = null;
  }
  return recipe;
}

export async function uploadPostPhoto(file) {
  const user = await getUser();
  const ext = file.name.split('.').pop();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('post-photos').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('post-photos').getPublicUrl(path);
  return data.publicUrl;
}

// ── Recipe photos ─────────────────────────────────────────────────────────────

export async function addRecipePhoto(recipeId, file, caption = null) {
  const user = await getUser();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${recipeId}/${user.id}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('recipe-photos').upload(path, file);
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from('recipe-photos').getPublicUrl(path);
  const { data, error: dbErr } = await supabase.from('recipe_photos').insert({
    recipe_id: recipeId,
    user_id: user.id,
    photo_url: urlData.publicUrl,
    caption: caption || null,
  }).select().single();
  if (dbErr) throw dbErr;
  return data;
}

// Variant: insert a recipe_photos row using an already-uploaded URL (e.g. the
// user already uploaded a photo via post-photos and wants to also attach it
// to the recipe without re-uploading).
export async function attachExistingPhotoToRecipe(recipeId, photoUrl, caption = null) {
  const user = await getUser();
  const { data, error } = await supabase.from('recipe_photos').insert({
    recipe_id: recipeId,
    user_id: user.id,
    photo_url: photoUrl,
    caption: caption || null,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getRecipePhotos(recipeId) {
  const { data, error } = await supabase.from('recipe_photos')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return [];
  if (!data?.length) return [];
  const userIds = [...new Set(data.map(p => p.user_id))];
  const { data: profiles } = await supabase.from('profiles')
    .select('id, username, display_name').in('id', userIds);
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return data.map(p => ({ ...p, uploader: profileMap[p.user_id] || null }));
}

export async function deleteRecipePhoto(id) {
  const { data: photo } = await supabase.from('recipe_photos')
    .select('photo_url').eq('id', id).maybeSingle();
  if (photo?.photo_url) {
    const marker = '/storage/v1/object/public/recipe-photos/';
    const idx = photo.photo_url.indexOf(marker);
    if (idx >= 0) {
      const path = photo.photo_url.slice(idx + marker.length);
      await supabase.storage.from('recipe-photos').remove([path]);
    }
  }
  const { error } = await supabase.from('recipe_photos').delete().eq('id', id);
  if (error) throw error;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

async function callAdmin(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not authenticated');
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `admin ${action} failed`);
  return data;
}

export async function adminUpdateRecipe(id, updates) { return callAdmin('updateRecipe', { id, updates }); }
export async function adminUnpublishRecipe(id) { return callAdmin('unpublishRecipe', { id }); }
export async function adminDeleteRecipe(id) { return callAdmin('deleteRecipe', { id }); }
export async function adminToggleUserAdmin(id, isAdmin) { return callAdmin('toggleAdmin', { id, isAdmin }); }
export async function adminDeletePhoto(id) { return callAdmin('deletePhoto', { id }); }

export async function adminListRecipes(query, limit = 50) {
  let q = supabase.from('recipes')
    .select('id, name, time, difficulty, cooked_count, is_public, is_locked, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  const trimmed = (query || '').trim();
  if (trimmed) q = q.textSearch('search_vector', trimmed, { type: 'websearch', config: 'english' });
  const { data, error } = await q;
  if (error) return [];
  if (!data?.length) return [];
  const ids = [...new Set(data.map(r => r.user_id).filter(Boolean))];
  const { data: profiles } = ids.length
    ? await supabase.from('profiles').select('id, username, display_name').in('id', ids)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return data.map(r => ({ ...r, owner: profileMap[r.user_id] || null }));
}

export async function adminGetRecipeFull(id) {
  const { data, error } = await supabase.from('recipes')
    .select('*, ingredients(id, name, qty, position), steps(id, text, timer, position)')
    .eq('id', id).single();
  if (error) throw error;
  return {
    id: data.id, name: data.name, description: data.description || '',
    time: data.time, difficulty: data.difficulty, servings: data.servings,
    tags: data.tags || [], is_public: data.is_public, is_locked: data.is_locked,
    ingredients: (data.ingredients || []).sort((a, b) => a.position - b.position),
    steps: (data.steps || []).sort((a, b) => a.position - b.position),
  };
}

export async function adminListUsers(query) {
  let q = supabase.from('profiles')
    .select('id, username, display_name, created_at, is_admin')
    .limit(100);
  const trimmed = (query || '').trim();
  if (trimmed) q = q.or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) return [];
  if (!data?.length) return [];
  // Recipe counts via N+1 — fine for admin scale
  const counts = await Promise.all(data.map(p =>
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', p.id)
  ));
  return data.map((p, i) => ({ ...p, recipeCount: counts[i].count || 0 }));
}

export async function adminListPhotos(limit = 100) {
  const { data: photos, error } = await supabase.from('recipe_photos')
    .select('id, photo_url, caption, recipe_id, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  if (!photos?.length) return [];
  const recipeIds = [...new Set(photos.map(p => p.recipe_id))];
  const userIds = [...new Set(photos.map(p => p.user_id))];
  const [{ data: recipes }, { data: profiles }] = await Promise.all([
    supabase.from('recipes').select('id, name').in('id', recipeIds),
    supabase.from('profiles').select('id, username').in('id', userIds),
  ]);
  const rMap = Object.fromEntries((recipes || []).map(r => [r.id, r]));
  const pMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
  return photos.map(p => ({
    ...p,
    recipe: rMap[p.recipe_id] || null,
    uploader: pMap[p.user_id] || null,
  }));
}

export async function adminGetStats() {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [
    usersRes,
    publicRes,
    photosRes,
    cooksRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('is_public', true).eq('is_locked', true),
    supabase.from('recipe_photos').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('type', 'cooked_recipe').gte('created_at', since7d),
    supabase.from('events').select('recipe_id, user_id').eq('type', 'cooked_recipe').gte('created_at', since7d),
  ]);

  const recipeCounts = {};
  const userCounts = {};
  for (const e of eventsRes.data || []) {
    if (e.recipe_id) recipeCounts[e.recipe_id] = (recipeCounts[e.recipe_id] || 0) + 1;
    if (e.user_id) userCounts[e.user_id] = (userCounts[e.user_id] || 0) + 1;
  }
  const topRecipeId = Object.entries(recipeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const topUserIds = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);

  const [topRecipeRes, topUsersRes] = await Promise.all([
    topRecipeId
      ? supabase.from('recipes').select('id, name').eq('id', topRecipeId).maybeSingle()
      : Promise.resolve({ data: null }),
    topUserIds.length
      ? supabase.from('profiles').select('id, username, display_name').in('id', topUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    users: usersRes.count || 0,
    publicRecipes: publicRes.count || 0,
    cooksThisWeek: cooksRes.count || 0,
    photos: photosRes.count || 0,
    topRecipe: topRecipeRes.data ? { id: topRecipeRes.data.id, name: topRecipeRes.data.name, count: recipeCounts[topRecipeRes.data.id] || 0 } : null,
    topUsers: ((topUsersRes.data || []).map(u => ({ ...u, count: userCounts[u.id] || 0 })))
      .sort((a, b) => b.count - a.count),
  };
}

export async function setPrimaryPhoto(id, recipeId) {
  // RLS only allows updating own photos. The clear-others step below scopes
  // to the current user's photos via RLS, so other users' primary flags are
  // unaffected. Acceptable for v1: there can be one primary per uploader.
  const user = await getUser();
  await supabase.from('recipe_photos')
    .update({ is_primary: false })
    .eq('recipe_id', recipeId)
    .eq('user_id', user.id);
  const { error } = await supabase.from('recipe_photos')
    .update({ is_primary: true })
    .eq('id', id);
  if (error) throw error;
}
