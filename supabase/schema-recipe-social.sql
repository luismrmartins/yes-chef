-- ── Recipe likes ─────────────────────────────────────────────────────────────

create table if not exists recipe_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  created_at timestamp default now(),
  unique(user_id, recipe_id)
);

-- ── Recipe comments ───────────────────────────────────────────────────────────

create table if not exists recipe_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  text text not null,
  created_at timestamp default now()
);

-- ── RLS: recipe_likes ─────────────────────────────────────────────────────────

alter table recipe_likes enable row level security;

create policy "recipe_likes: read all"
  on recipe_likes for select using (true);

create policy "recipe_likes: own insert"
  on recipe_likes for insert with check (auth.uid() = user_id);

create policy "recipe_likes: own delete"
  on recipe_likes for delete using (auth.uid() = user_id);

-- ── RLS: recipe_comments ──────────────────────────────────────────────────────

alter table recipe_comments enable row level security;

create policy "recipe_comments: read all"
  on recipe_comments for select using (true);

create policy "recipe_comments: own insert"
  on recipe_comments for insert with check (auth.uid() = user_id);

create policy "recipe_comments: own delete"
  on recipe_comments for delete using (auth.uid() = user_id);
