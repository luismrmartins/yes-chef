-- ── Events ────────────────────────────────────────────────────────────────────

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  target_user_id uuid references profiles(id) on delete set null,
  recipe_id uuid references recipes(id) on delete set null,
  post_text text,
  photo_url text,
  created_at timestamp default now()
);

-- ── Likes ────────────────────────────────────────────────────────────────────

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  created_at timestamp default now(),
  unique(user_id, event_id)
);

-- ── RLS: events ──────────────────────────────────────────────────────────────

alter table events enable row level security;

create policy "Anyone can read events"
  on events for select using (true);

create policy "Users can insert their own events"
  on events for insert with check (auth.uid() = user_id);

create policy "Users can delete their own events"
  on events for delete using (auth.uid() = user_id);

-- ── RLS: likes ───────────────────────────────────────────────────────────────

alter table likes enable row level security;

create policy "Anyone can read likes"
  on likes for select using (true);

create policy "Users can insert their own likes"
  on likes for insert with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on likes for delete using (auth.uid() = user_id);
