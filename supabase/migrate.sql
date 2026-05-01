-- Migration: add user_id columns, new columns, and new tables

-- ── profiles (new) ────────────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  first_name text,
  last_name text,
  unit_preference text default 'metric',
  avatar_url text,
  created_at timestamp default now()
);

-- add columns if profiles already exists
alter table profiles add column if not exists first_name text;
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists unit_preference text default 'metric';

-- ── cookbooks: add user_id ────────────────────────────────────────────────────

alter table cookbooks add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- ── recipes: add user_id, last_cooked_at, tags ────────────────────────────────

alter table recipes add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table recipes add column if not exists last_cooked_at timestamp;
alter table recipes add column if not exists tags text[] default '{}';

-- ── favourites: add user_id, fix unique constraint ────────────────────────────

alter table favourites add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table favourites drop constraint if exists favourites_recipe_id_key;
alter table favourites add constraint favourites_user_recipe_unique unique (user_id, recipe_id);

-- ── shopping_list: add user_id, priority ─────────────────────────────────────

alter table shopping_list add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table shopping_list add column if not exists priority text default 'eventually';

-- ── follows (new) ─────────────────────────────────────────────────────────────

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp default now(),
  unique(follower_id, following_id)
);

-- ── shared_recipes (new) ──────────────────────────────────────────────────────

create table if not exists shared_recipes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users(id) on delete cascade not null,
  to_user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  message text,
  created_at timestamp default now()
);

-- ── notifications (new) ───────────────────────────────────────────────────────

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  from_user_id uuid references auth.users(id) on delete set null,
  type text not null,
  recipe_id uuid references recipes(id) on delete set null,
  read boolean default false,
  created_at timestamp default now()
);
