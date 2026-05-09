-- ─────────────────────────────────────────────────────────────────────────────
-- schema-features.sql
-- Cook counter RPC, full-text search on recipes, recipe photos table +
-- storage bucket, and profiles.is_admin. Run as one block in the Supabase
-- SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. RPC: atomic cook-count increment ──────────────────────────────────────
-- SECURITY DEFINER lets any authenticated user increment cooked_count without
-- needing UPDATE RLS on the row (so users can record cooks of public recipes
-- they don't own).

create or replace function increment_cooked_count(recipe_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update recipes set cooked_count = cooked_count + 1 where id = recipe_id;
$$;

grant execute on function increment_cooked_count(uuid) to authenticated;


-- ── 2. Full-text search on recipes ───────────────────────────────────────────
-- Generated column is recomputed automatically on insert/update, so existing
-- rows backfill when this column is added.

alter table recipes
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(difficulty, '')
    )
  ) stored;

create index if not exists recipes_search_idx
  on recipes using gin(search_vector);


-- ── 3. recipe_photos table ───────────────────────────────────────────────────

create table if not exists recipe_photos (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid references recipes(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  photo_url   text not null,
  caption     text,
  is_primary  boolean default false,
  created_at  timestamp default now()
);

create index if not exists recipe_photos_recipe_idx on recipe_photos (recipe_id);
create index if not exists recipe_photos_primary_idx
  on recipe_photos (recipe_id) where is_primary = true;

alter table recipe_photos enable row level security;

create policy "recipe_photos: read all"
  on recipe_photos for select using (true);

create policy "recipe_photos: own insert"
  on recipe_photos for insert with check (user_id = auth.uid());

create policy "recipe_photos: own update"
  on recipe_photos for update
  using      (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "recipe_photos: own delete"
  on recipe_photos for delete using (user_id = auth.uid());


-- ── 4. Storage bucket for recipe photos ──────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('recipe-photos', 'recipe-photos', true)
  on conflict (id) do nothing;

-- Storage RLS for the bucket.
-- File path convention: {recipe_id}/{user_id}/{timestamp}.{ext}
-- So (storage.foldername(name))[2] is the user_id.

create policy "recipe-photos: read all"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

create policy "recipe-photos: own insert"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "recipe-photos: own update"
  on storage.objects for update
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "recipe-photos: own delete"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
  );


-- ── 5. profiles.is_admin ─────────────────────────────────────────────────────

alter table profiles
  add column if not exists is_admin boolean default false;
