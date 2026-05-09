-- ─────────────────────────────────────────────────────────────────────────────
-- schema-authorship.sql
-- Adds recipe authorship, locking, personal annotations, and saved recipes.
-- Run in the Supabase SQL Editor in the order written.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Recipes: new columns ───────────────────────────────────────────────────

alter table recipes add column if not exists author_id    uuid references auth.users(id) on delete set null;
alter table recipes add column if not exists is_public    boolean default false;
alter table recipes add column if not exists is_locked    boolean default false;
alter table recipes add column if not exists published_at timestamp;

create index if not exists recipes_author_id_idx    on recipes (author_id);
create index if not exists recipes_published_at_idx on recipes (published_at desc) where is_public = true;


-- ── 2. recipe_annotations ─────────────────────────────────────────────────────

create table if not exists recipe_annotations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  recipe_id       uuid references recipes(id) on delete cascade not null,
  ingredient_id   uuid references ingredients(id) on delete cascade,
  step_id         uuid references steps(id) on delete cascade,
  annotation_type text not null check (
    annotation_type in ('step_note', 'ingredient_sub', 'ingredient_qty', 'general')
  ),
  content         text not null,
  created_at      timestamp default now(),
  updated_at      timestamp default now()
);

create index if not exists recipe_annotations_user_recipe_idx
  on recipe_annotations (user_id, recipe_id);


-- ── 3. saved_recipes ──────────────────────────────────────────────────────────

create table if not exists saved_recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  recipe_id   uuid references recipes(id) on delete cascade not null,
  cookbook_id uuid references cookbooks(id) on delete set null,
  saved_at    timestamp default now(),
  unique (user_id, recipe_id)
);

create index if not exists saved_recipes_user_idx     on saved_recipes (user_id);
create index if not exists saved_recipes_cookbook_idx on saved_recipes (cookbook_id);


-- ── 4. Enable RLS on the new tables ──────────────────────────────────────────

alter table recipe_annotations enable row level security;
alter table saved_recipes      enable row level security;


-- ── 5. recipes: re-do the update policy to honour is_locked ──────────────────
-- Existing read / insert / delete policies (from migrate-privacy.sql) are fine.
-- We only need to tighten update so a locked recipe cannot be edited.

drop policy if exists "recipes: own update" on recipes;

create policy "recipes: own update unlocked"
  on recipes for update
  using      (user_id = auth.uid() and is_locked = false)
  with check (user_id = auth.uid());


-- ── 6. ingredients: tighten write policies for is_locked ─────────────────────

drop policy if exists "ingredients: own insert" on ingredients;
drop policy if exists "ingredients: own update" on ingredients;
drop policy if exists "ingredients: own delete" on ingredients;

create policy "ingredients: own insert unlocked"
  on ingredients for insert
  with check (
    exists (
      select 1 from recipes
      where recipes.id = ingredients.recipe_id
        and recipes.user_id = auth.uid()
        and recipes.is_locked = false
    )
  );

create policy "ingredients: own update unlocked"
  on ingredients for update
  using (
    exists (
      select 1 from recipes
      where recipes.id = ingredients.recipe_id
        and recipes.user_id = auth.uid()
        and recipes.is_locked = false
    )
  );

create policy "ingredients: own delete unlocked"
  on ingredients for delete
  using (
    exists (
      select 1 from recipes
      where recipes.id = ingredients.recipe_id
        and recipes.user_id = auth.uid()
        and recipes.is_locked = false
    )
  );


-- ── 7. steps: same lock-aware policies ───────────────────────────────────────

drop policy if exists "steps: own insert" on steps;
drop policy if exists "steps: own update" on steps;
drop policy if exists "steps: own delete" on steps;

create policy "steps: own insert unlocked"
  on steps for insert
  with check (
    exists (
      select 1 from recipes
      where recipes.id = steps.recipe_id
        and recipes.user_id = auth.uid()
        and recipes.is_locked = false
    )
  );

create policy "steps: own update unlocked"
  on steps for update
  using (
    exists (
      select 1 from recipes
      where recipes.id = steps.recipe_id
        and recipes.user_id = auth.uid()
        and recipes.is_locked = false
    )
  );

create policy "steps: own delete unlocked"
  on steps for delete
  using (
    exists (
      select 1 from recipes
      where recipes.id = steps.recipe_id
        and recipes.user_id = auth.uid()
        and recipes.is_locked = false
    )
  );


-- ── 8. recipe_annotations: only the owning user can read/write ───────────────

create policy "recipe_annotations: own select"
  on recipe_annotations for select
  using (user_id = auth.uid());

create policy "recipe_annotations: own insert"
  on recipe_annotations for insert
  with check (user_id = auth.uid());

create policy "recipe_annotations: own update"
  on recipe_annotations for update
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "recipe_annotations: own delete"
  on recipe_annotations for delete
  using (user_id = auth.uid());


-- ── 9. saved_recipes: only the owning user can read/write ────────────────────

create policy "saved_recipes: own select"
  on saved_recipes for select
  using (user_id = auth.uid());

create policy "saved_recipes: own insert"
  on saved_recipes for insert
  with check (user_id = auth.uid());

create policy "saved_recipes: own update"
  on saved_recipes for update
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "saved_recipes: own delete"
  on saved_recipes for delete
  using (user_id = auth.uid());
