import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// All admin write actions go through this single endpoint.
// Auth: caller must send a valid Supabase session JWT in the Authorization header
// AND the corresponding profile must have is_admin = true. Once verified, the
// underlying op runs with the service role key so it bypasses RLS.

export async function POST(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !service) {
    return NextResponse.json({ error: 'server misconfigured (missing supabase env)' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: uErr } = await userClient.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile, error: pErr } = await userClient
    .from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!profile?.is_admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const { action } = body || {};

  try {
    switch (action) {
      case 'updateRecipe': {
        const { id, updates } = body;
        if (!id || !updates) return NextResponse.json({ error: 'missing id/updates' }, { status: 400 });
        const safe = {};
        for (const k of ['name', 'description', 'time', 'difficulty', 'servings', 'tags', 'is_public', 'is_locked']) {
          if (k in updates) safe[k] = updates[k];
        }
        if (Object.keys(safe).length) {
          const { error } = await admin.from('recipes').update(safe).eq('id', id);
          if (error) throw error;
        }
        if (Array.isArray(updates.ingredients)) {
          await admin.from('ingredients').delete().eq('recipe_id', id);
          if (updates.ingredients.length) {
            const { error } = await admin.from('ingredients').insert(
              updates.ingredients.map((ing, idx) => ({
                recipe_id: id, name: ing.name, qty: ing.qty || '', position: idx,
              }))
            );
            if (error) throw error;
          }
        }
        if (Array.isArray(updates.steps)) {
          await admin.from('steps').delete().eq('recipe_id', id);
          if (updates.steps.length) {
            const { error } = await admin.from('steps').insert(
              updates.steps.map((s, idx) => ({
                recipe_id: id, text: s.text, timer: s.timer || null, position: idx,
              }))
            );
            if (error) throw error;
          }
        }
        return NextResponse.json({ ok: true });
      }

      case 'unpublishRecipe': {
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
        const { error } = await admin.from('recipes')
          .update({ is_public: false, is_locked: false })
          .eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'deleteRecipe': {
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
        const { error } = await admin.from('recipes').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'toggleAdmin': {
        const { id, isAdmin } = body;
        if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
        const { error } = await admin.from('profiles')
          .update({ is_admin: !!isAdmin }).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      case 'deletePhoto': {
        const { id } = body;
        if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
        const { data: photo } = await admin.from('recipe_photos')
          .select('photo_url').eq('id', id).maybeSingle();
        if (photo?.photo_url) {
          const marker = '/storage/v1/object/public/recipe-photos/';
          const idx = photo.photo_url.indexOf(marker);
          if (idx >= 0) {
            const path = photo.photo_url.slice(idx + marker.length);
            await admin.storage.from('recipe-photos').remove([path]);
          }
        }
        const { error } = await admin.from('recipe_photos').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
