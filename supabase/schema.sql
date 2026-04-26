create table cookbooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  created_at timestamp default now()
);

create table recipes (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid references cookbooks(id) on delete cascade,
  name text not null,
  description text,
  time integer,
  difficulty text,
  servings integer,
  cooked_count integer default 0,
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

create table favourites (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  created_at timestamp default now(),
  unique(recipe_id)
);

create table shopping_list (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid,
  recipe_name text,
  ingredient_name text not null,
  qty text,
  checked boolean default false,
  added_at timestamp default now()
);

create table recipe_feedback (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  cooked_at timestamp default now(),
  ease_rating integer,
  taste_rating integer,
  overall_rating integer,
  notes text
);
