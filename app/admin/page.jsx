'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  adminListRecipes, adminGetRecipeFull, adminUpdateRecipe, adminUnpublishRecipe, adminDeleteRecipe,
  adminListUsers, adminToggleUserAdmin,
  adminListPhotos, adminDeletePhoto,
  adminGetStats, formatCount,
} from '../../lib/db';

const STYLES = `
  body { font-family: 'DM Mono', monospace; background: #fff; color: #1E1C1A; }
  .admin-shell { max-width: 1200px; margin: 0 auto; padding: 24px; }
  .admin-header { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 16px; border-bottom: 1px solid #D8D4CC; }
  .admin-title { font-size: 22px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; }
  .admin-tabs { display: flex; gap: 24px; margin: 16px 0 24px; border-bottom: 1px solid #D8D4CC; }
  .admin-tab { background: none; border: none; padding: 10px 0; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.14em; color: #9A9590; border-bottom: 2px solid transparent; }
  .admin-tab.active { color: #1E1C1A; border-bottom-color: #1E1C1A; }
  .admin-search { width: 320px; padding: 8px 12px; border: 1px solid #D8D4CC; font-family: 'DM Mono', monospace; font-size: 12px; outline: none; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 10px 12px; border-bottom: 1px solid #D8D4CC; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; color: #6A6560; }
  td { padding: 10px 12px; border-bottom: 1px solid #EDEAE4; vertical-align: top; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .btn { background: none; border: 1px solid #D8D4CC; padding: 4px 10px; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1C1A; }
  .btn:hover { background: #EDEAE4; }
  .btn-blue { color: #1B4FD8; border-color: #1B4FD8; }
  .btn-red { color: #b00020; border-color: #b00020; }
  .btn-row { display: flex; gap: 6px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat-card { padding: 16px; border: 1px solid #D8D4CC; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9A9590; }
  .stat-value { font-size: 28px; font-weight: 300; margin-top: 6px; font-variant-numeric: tabular-nums; }
  .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .photo-cell img { width: 100%; height: 160px; object-fit: cover; border: 1px solid #D8D4CC; }
  .photo-meta { font-size: 10px; color: #6A6560; margin-top: 6px; line-height: 1.4; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: center; justify-content: center; }
  .modal { background: #fff; max-width: 720px; width: 100%; max-height: 85vh; overflow-y: auto; padding: 24px; border: 1px solid #D8D4CC; }
  .form-row { margin-bottom: 16px; }
  .form-row label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6A6560; margin-bottom: 6px; }
  .form-row input, .form-row textarea, .form-row select { width: 100%; padding: 8px 12px; border: 1px solid #D8D4CC; font-family: 'DM Mono', monospace; font-size: 12px; outline: none; }
  .form-row textarea { resize: vertical; min-height: 80px; }
  .empty { padding: 40px; text-align: center; color: #9A9590; font-size: 12px; }
  .denied { padding: 80px 20px; text-align: center; }
  .badge { display: inline-block; padding: 2px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; border: 1px solid #D8D4CC; }
  .badge.live { color: #1B4FD8; border-color: #1B4FD8; }
  .badge.locked { color: #6A6560; }
  a.profile-link { color: #1B4FD8; text-decoration: none; }
  a.profile-link:hover { text-decoration: underline; }
`;

export default function AdminPage() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = none
  const [isAdmin, setIsAdmin] = useState(null); // null = checking
  const [tab, setTab] = useState('recipes');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setUser(null); setIsAdmin(false); return; }
      setUser(session.user);
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle();
      setIsAdmin(!!data?.is_admin);
    });
  }, []);

  if (user === undefined || isAdmin === null) {
    return <><style>{STYLES}</style><div className="admin-shell"><div className="empty">Loading…</div></div></>;
  }

  if (!user) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="admin-shell">
          <div className="denied">
            <div className="admin-title">Sign in required</div>
            <p style={{ marginTop: 12 }}><a className="profile-link" href="/">← Go home</a></p>
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="admin-shell">
          <div className="denied">
            <div className="admin-title">Not authorised</div>
            <p style={{ marginTop: 12, color: '#6A6560' }}>This area is admin-only.</p>
            <p style={{ marginTop: 12 }}><a className="profile-link" href="/">← Go home</a></p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="admin-shell">
        <div className="admin-header">
          <div className="admin-title">The Pass — Admin</div>
          <a className="profile-link" href="/">← Back to app</a>
        </div>
        <div className="admin-tabs">
          <button className={`admin-tab${tab === 'recipes' ? ' active' : ''}`} onClick={() => setTab('recipes')}>Recipes</button>
          <button className={`admin-tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Users</button>
          <button className={`admin-tab${tab === 'photos' ? ' active' : ''}`} onClick={() => setTab('photos')}>Photos</button>
          <button className={`admin-tab${tab === 'stats' ? ' active' : ''}`} onClick={() => setTab('stats')}>Stats</button>
        </div>
        {tab === 'recipes' && <RecipesTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'photos' && <PhotosTab />}
        {tab === 'stats' && <StatsTab />}
      </div>
    </>
  );
}

// ─── Recipes tab ────────────────────────────────────────────────────────────

function RecipesTab() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // recipe id
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      adminListRecipes(query, 100).then(r => { setRecipes(r); setLoading(false); });
    }, 250);
    return () => clearTimeout(t);
  }, [query, refreshTick]);

  const refresh = () => setRefreshTick(t => t + 1);

  const handleUnpublish = async (id) => {
    if (!confirm('Unpublish this recipe? It will become a private draft.')) return;
    try { await adminUnpublishRecipe(id); refresh(); }
    catch (e) { alert('Failed: ' + e.message); }
  };
  const handleDelete = async (id) => {
    if (!confirm('Delete this recipe permanently? This cannot be undone.')) return;
    try { await adminDeleteRecipe(id); refresh(); }
    catch (e) { alert('Failed: ' + e.message); }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <input className="admin-search" placeholder="Search recipes…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      {loading ? <div className="empty">Loading…</div> : recipes.length === 0 ? <div className="empty">No recipes</div> : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th className="num">Cooked</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.owner ? `@${r.owner.username}` : '—'}</td>
                <td className="num">{formatCount(r.cooked_count || 0)}</td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                <td>
                  {r.is_public ? <span className="badge live">Public</span> : <span className="badge">Private</span>}
                  {' '}
                  {r.is_locked && <span className="badge locked">Locked</span>}
                </td>
                <td>
                  <div className="btn-row">
                    <button className="btn btn-blue" onClick={() => setEditing(r.id)}>Edit</button>
                    {r.is_public && <button className="btn" onClick={() => handleUnpublish(r.id)}>Unpublish</button>}
                    <button className="btn btn-red" onClick={() => handleDelete(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing && (
        <RecipeEditModal
          recipeId={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </>
  );
}

function RecipeEditModal({ recipeId, onClose, onSaved }) {
  const [recipe, setRecipe] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetRecipeFull(recipeId).then(setRecipe).catch(e => alert('Load failed: ' + e.message));
  }, [recipeId]);

  if (!recipe) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}><div className="empty">Loading…</div></div>
      </div>
    );
  }

  const update = (k, v) => setRecipe(r => ({ ...r, [k]: v }));
  const setIng = (idx, k, v) => setRecipe(r => ({
    ...r, ingredients: r.ingredients.map((ing, i) => i === idx ? { ...ing, [k]: v } : ing),
  }));
  const addIng = () => setRecipe(r => ({ ...r, ingredients: [...r.ingredients, { name: '', qty: '' }] }));
  const removeIng = (idx) => setRecipe(r => ({ ...r, ingredients: r.ingredients.filter((_, i) => i !== idx) }));
  const setStep = (idx, k, v) => setRecipe(r => ({
    ...r, steps: r.steps.map((s, i) => i === idx ? { ...s, [k]: v } : s),
  }));
  const addStep = () => setRecipe(r => ({ ...r, steps: [...r.steps, { text: '', timer: null }] }));
  const removeStep = (idx) => setRecipe(r => ({ ...r, steps: r.steps.filter((_, i) => i !== idx) }));
  const moveStep = (idx, dir) => setRecipe(r => {
    const next = r.steps.slice();
    const j = idx + dir;
    if (j < 0 || j >= next.length) return r;
    [next[idx], next[j]] = [next[j], next[idx]];
    return { ...r, steps: next };
  });

  const save = async () => {
    setSaving(true);
    try {
      await adminUpdateRecipe(recipe.id, {
        name: recipe.name,
        description: recipe.description || '',
        time: parseInt(recipe.time, 10) || 0,
        difficulty: recipe.difficulty,
        servings: parseInt(recipe.servings, 10) || 1,
        is_public: recipe.is_public,
        is_locked: recipe.is_locked,
        ingredients: recipe.ingredients.filter(i => i.name?.trim()),
        steps: recipe.steps.filter(s => s.text?.trim()).map(s => ({ ...s, timer: s.timer ? parseInt(s.timer, 10) : null })),
      });
      onSaved();
    } catch (e) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="admin-title" style={{ fontSize: 14, marginBottom: 16 }}>Edit recipe</div>
        <div className="form-row"><label>Name</label><input value={recipe.name || ''} onChange={e => update('name', e.target.value)} /></div>
        <div className="form-row"><label>Description</label><textarea value={recipe.description || ''} onChange={e => update('description', e.target.value)} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div className="form-row"><label>Time (min)</label><input type="number" value={recipe.time || ''} onChange={e => update('time', e.target.value)} /></div>
          <div className="form-row"><label>Difficulty</label>
            <select value={recipe.difficulty || 'Medium'} onChange={e => update('difficulty', e.target.value)}>
              <option>Easy</option><option>Medium</option><option>Advanced</option>
            </select>
          </div>
          <div className="form-row"><label>Servings</label><input type="number" value={recipe.servings || ''} onChange={e => update('servings', e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label style={{ display: 'flex', gap: 6, fontSize: 11, alignItems: 'center' }}>
            <input type="checkbox" checked={!!recipe.is_public} onChange={e => update('is_public', e.target.checked)} /> Public
          </label>
          <label style={{ display: 'flex', gap: 6, fontSize: 11, alignItems: 'center' }}>
            <input type="checkbox" checked={!!recipe.is_locked} onChange={e => update('is_locked', e.target.checked)} /> Locked
          </label>
        </div>

        <div className="admin-title" style={{ fontSize: 12, margin: '20px 0 8px' }}>Ingredients</div>
        {recipe.ingredients.map((ing, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
            <input style={{ width: 120 }} placeholder="qty" value={ing.qty || ''} onChange={e => setIng(idx, 'qty', e.target.value)} />
            <input style={{ flex: 1 }} placeholder="name" value={ing.name || ''} onChange={e => setIng(idx, 'name', e.target.value)} />
            <button className="btn btn-red" onClick={() => removeIng(idx)}>×</button>
          </div>
        ))}
        <button className="btn" onClick={addIng} style={{ marginTop: 6 }}>+ Add ingredient</button>

        <div className="admin-title" style={{ fontSize: 12, margin: '20px 0 8px' }}>Steps</div>
        {recipe.steps.map((s, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
            <span style={{ minWidth: 24, paddingTop: 8, fontSize: 11, color: '#6A6560' }}>{idx + 1}.</span>
            <textarea style={{ flex: 1 }} value={s.text || ''} onChange={e => setStep(idx, 'text', e.target.value)} />
            <input style={{ width: 80 }} placeholder="timer" type="number" value={s.timer || ''} onChange={e => setStep(idx, 'timer', e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button className="btn" onClick={() => moveStep(idx, -1)}>↑</button>
              <button className="btn" onClick={() => moveStep(idx, 1)}>↓</button>
            </div>
            <button className="btn btn-red" onClick={() => removeStep(idx)}>×</button>
          </div>
        ))}
        <button className="btn" onClick={addStep} style={{ marginTop: 6 }}>+ Add step</button>

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button className="btn btn-blue" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Users tab ──────────────────────────────────────────────────────────────

function UsersTab() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      adminListUsers(query).then(u => { setUsers(u); setLoading(false); });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const toggle = async (id, current) => {
    try {
      await adminToggleUserAdmin(id, !current);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_admin: !current } : u));
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <input className="admin-search" placeholder="Search users…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      {loading ? <div className="empty">Loading…</div> : users.length === 0 ? <div className="empty">No users</div> : (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Display name</th>
              <th>Joined</th>
              <th className="num">Recipes</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>@{u.username}</td>
                <td>{u.display_name || '—'}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td className="num">{u.recipeCount}</td>
                <td>{u.is_admin ? <span className="badge live">Admin</span> : '—'}</td>
                <td>
                  <div className="btn-row">
                    <button className="btn" onClick={() => toggle(u.id, u.is_admin)}>{u.is_admin ? 'Remove admin' : 'Make admin'}</button>
                    <a className="btn btn-blue" href={`/?user=${u.id}`}>View profile</a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

// ─── Photos tab ─────────────────────────────────────────────────────────────

function PhotosTab() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    adminListPhotos(200).then(p => { setPhotos(p); setLoading(false); });
  }, [refreshTick]);

  const remove = async (id) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await adminDeletePhoto(id);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  if (loading) return <div className="empty">Loading…</div>;
  if (!photos.length) return <div className="empty">No photos uploaded yet</div>;

  return (
    <div className="photo-grid">
      {photos.map(p => (
        <div key={p.id} className="photo-cell">
          <img src={p.photo_url} alt={p.caption || ''} />
          <div className="photo-meta">
            <div>{p.recipe?.name || '—'}</div>
            <div>by @{p.uploader?.username || '—'}</div>
            {p.caption && <div style={{ fontStyle: 'italic', marginTop: 4 }}>{p.caption}</div>}
          </div>
          <button className="btn btn-red" style={{ marginTop: 6 }} onClick={() => remove(p.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

// ─── Stats tab ──────────────────────────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminGetStats().then(setStats).catch(e => alert('Failed to load stats: ' + e.message));
  }, []);

  if (!stats) return <div className="empty">Loading…</div>;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total users</div>
          <div className="stat-value">{formatCount(stats.users)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Public recipes</div>
          <div className="stat-value">{formatCount(stats.publicRecipes)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cooks this week</div>
          <div className="stat-value">{formatCount(stats.cooksThisWeek)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Photos uploaded</div>
          <div className="stat-value">{formatCount(stats.photos)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="stat-label" style={{ marginBottom: 8 }}>Most cooked this week</div>
          {stats.topRecipe ? (
            <div style={{ padding: 12, border: '1px solid #D8D4CC' }}>
              <div style={{ fontSize: 16, fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif" }}>{stats.topRecipe.name}</div>
              <div style={{ fontSize: 11, color: '#6A6560', marginTop: 4 }}>Cooked {formatCount(stats.topRecipe.count)} time{stats.topRecipe.count !== 1 ? 's' : ''}</div>
            </div>
          ) : <div className="empty">No cooks yet</div>}
        </div>
        <div>
          <div className="stat-label" style={{ marginBottom: 8 }}>Most active users this week</div>
          {stats.topUsers.length ? (
            <table>
              <thead><tr><th>User</th><th className="num">Cooks</th></tr></thead>
              <tbody>
                {stats.topUsers.map(u => (
                  <tr key={u.id}>
                    <td>@{u.username}</td>
                    <td className="num">{formatCount(u.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">No active users yet</div>}
        </div>
      </div>
    </>
  );
}
