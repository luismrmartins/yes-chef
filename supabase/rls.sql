-- Run this in the Supabase SQL Editor to enable Row Level Security
-- and add policies so users can only access their own data.

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

alter table profiles         enable row level security;
alter table cookbooks        enable row level security;
alter table recipes          enable row level security;
alter table ingredients      enable row level security;
alter table steps            enable row level security;
alter table favourites       enable row level security;
alter table shopping_list    enable row level security;
alter table recipe_feedback  enable row level security;
alter table follows          enable row level security;
alter table shared_recipes   enable row level security;
alter table notifications    enable row level security;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Anyone can read profiles (needed for social features / search)
-- Only the owner can insert/update their own profile

create policy "profiles: read all"   on profiles for select using (true);
create policy "profiles: own insert" on profiles for insert with check (id = auth.uid());
create policy "profiles: own update" on profiles for update using (id = auth.uid());

-- ── cookbooks ─────────────────────────────────────────────────────────────────

create policy "cookbooks: own all" on cookbooks
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── recipes ───────────────────────────────────────────────────────────────────

create policy "recipes: own all" on recipes
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── ingredients ───────────────────────────────────────────────────────────────
-- No user_id column — gate via the parent recipe's owner

create policy "ingredients: own all" on ingredients
  using (
    exists (select 1 from recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
  )
  with check (
    exists (select 1 from recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
  );

-- ── steps ─────────────────────────────────────────────────────────────────────

create policy "steps: own all" on steps
  using (
    exists (select 1 from recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid())
  )
  with check (
    exists (select 1 from recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid())
  );

-- ── favourites ────────────────────────────────────────────────────────────────

create policy "favourites: own all" on favourites
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── shopping_list ─────────────────────────────────────────────────────────────

create policy "shopping_list: own all" on shopping_list
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── recipe_feedback ───────────────────────────────────────────────────────────

create policy "recipe_feedback: own all" on recipe_feedback
  using (
    exists (select 1 from recipes where recipes.id = recipe_feedback.recipe_id and recipes.user_id = auth.uid())
  )
  with check (
    exists (select 1 from recipes where recipes.id = recipe_feedback.recipe_id and recipes.user_id = auth.uid())
  );

-- ── follows ───────────────────────────────────────────────────────────────────
-- Anyone can read follows (needed for follower/following counts)
-- Users can only insert/delete their own follow relationships

create policy "follows: read all"    on follows for select using (true);
create policy "follows: own insert"  on follows for insert with check (follower_id = auth.uid());
create policy "follows: own delete"  on follows for delete using (follower_id = auth.uid());

-- ── shared_recipes ────────────────────────────────────────────────────────────
-- Read if you are the sender or the recipient
-- Only the sender can insert

create policy "shared_recipes: read own" on shared_recipes
  for select using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "shared_recipes: own insert" on shared_recipes
  for insert with check (from_user_id = auth.uid());

-- ── notifications ─────────────────────────────────────────────────────────────

create policy "notifications: own all" on notifications
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
