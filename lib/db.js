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
    isPublic: r.is_public || false,
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
  const { error } = await supabase.from('recipes')
    .update({ cooked_count: (current.cooked_count || 0) + 1, last_cooked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
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

export async function saveRecipeFeedback(recipeId, ease, taste, overall, notes) {
  const { error } = await supabase.from('recipe_feedback').insert({
    recipe_id: recipeId, ease_rating: ease, taste_rating: taste,
    overall_rating: overall, notes: notes || null,
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

export async function getPublicRecipes(userId) {
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, time, difficulty, servings, tags, cooked_count, last_cooked_at, cookbook_id')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at');
  if (error) return [];
  return data.map(r => ({
    id: r.id, name: r.name, time: r.time, difficulty: r.difficulty,
    servings: r.servings, tags: r.tags || [],
    cookedCount: r.cooked_count, lastCookedAt: r.last_cooked_at || null,
    cookbookId: r.cookbook_id,
  }));
}

export async function getUserPublicProfile(targetUserId) {
  const user = await getUser();
  const [{ data: profile }, cookbooks, followCounts, isFollowing, publicRecipes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle(),
    getUserCookbooks(targetUserId),
    getFollowCounts(targetUserId),
    checkIsFollowing(user.id, targetUserId),
    getPublicRecipes(targetUserId),
  ]);
  return { profile, cookbooks, followCounts, isFollowing, publicRecipes };
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
