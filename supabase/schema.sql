-- ── Auth (managed by Supabase) ────────────────────────────────────────────────

-- ── Profiles ──────────────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  first_name text,
  last_name text,
  unit_preference text default 'metric',
  avatar_url text,
  created_at timestamp default now()
);

-- ── Cookbooks ─────────────────────────────────────────────────────────────────

create table cookbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text,
  created_at timestamp default now()
);

-- ── Recipes ───────────────────────────────────────────────────────────────────

create table recipes (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid references cookbooks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  time integer,
  difficulty text,
  servings integer,
  cooked_count integer default 0,
  last_cooked_at timestamp,
  tags text[] default '{}',
  created_at timestamp default now()
);

create table ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  name text not null,
  qty text,
  position integer
);

create table steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  text text not null,
  timer integer,
  position integer
);

-- ── Favourites ────────────────────────────────────────────────────────────────

create table favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade,
  created_at timestamp default now(),
  unique(user_id, recipe_id)
);

-- ── Shopping list ─────────────────────────────────────────────────────────────

create table shopping_list (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid,
  recipe_name text,
  ingredient_name text not null,
  qty text,
  priority text default 'eventually',
  checked boolean default false,
  added_at timestamp default now()
);

-- ── Recipe feedback ───────────────────────────────────────────────────────────

create table recipe_feedback (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  cooked_at timestamp default now(),
  ease_rating integer,
  taste_rating integer,
  overall_rating integer,
  notes text
);

-- ── Social: follows ───────────────────────────────────────────────────────────

create table follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp default now(),
  unique(follower_id, following_id)
);

-- ── Social: shared recipes ────────────────────────────────────────────────────

create table shared_recipes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  message text,
  created_at timestamp default now()
);

-- ── Notifications ─────────────────────────────────────────────────────────────

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  from_user_id uuid references auth.users(id) on delete set null,
  type text not null, -- 'follow' | 'share'
  recipe_id uuid references recipes(id) on delete set null,
  read boolean default false,
  created_at timestamp default now()
);
