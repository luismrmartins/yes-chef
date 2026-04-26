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
