-- Add is_public column to recipes
alter table recipes add column if not exists is_public boolean default false;

-- ── recipes: split into separate read / write policies ───────────────────────
drop policy if exists "recipes: own all" on recipes;

create policy "recipes: read own or public"
  on recipes for select
  using (user_id = auth.uid() or is_public = true);

create policy "recipes: own insert"
  on recipes for insert
  with check (user_id = auth.uid());

create policy "recipes: own update"
  on recipes for update
  using (user_id = auth.uid());

create policy "recipes: own delete"
  on recipes for delete
  using (user_id = auth.uid());

-- ── ingredients: allow reading when parent recipe is public ───────────────────
drop policy if exists "ingredients: own all" on ingredients;

create policy "ingredients: read own or public recipe"
  on ingredients for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = ingredients.recipe_id
        and (recipes.user_id = auth.uid() or recipes.is_public = true)
    )
  );

create policy "ingredients: own insert"
  on ingredients for insert
  with check (
    exists (select 1 from recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
  );

create policy "ingredients: own update"
  on ingredients for update
  using (
    exists (select 1 from recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
  );

create policy "ingredients: own delete"
  on ingredients for delete
  using (
    exists (select 1 from recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
  );

-- ── steps: same pattern as ingredients ───────────────────────────────────────
drop policy if exists "steps: own all" on steps;

create policy "steps: read own or public recipe"
  on steps for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = steps.recipe_id
        and (recipes.user_id = auth.uid() or recipes.is_public = true)
    )
  );

create policy "steps: own insert"
  on steps for insert
  with check (
    exists (select 1 from recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid())
  );

create policy "steps: own update"
  on steps for update
  using (
    exists (select 1 from recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid())
  );

create policy "steps: own delete"
  on steps for delete
  using (
    exists (select 1 from recipes where recipes.id = steps.recipe_id and recipes.user_id = auth.uid())
  );
