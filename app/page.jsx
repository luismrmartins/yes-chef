'use client';
import { useState, useEffect, useRef } from 'react';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red: #E8260A;
    --black: #111111;
    --white: #FFFFFF;
    --gray: #F2F2F2;
    --gray2: #CCCCCC;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--white);
    color: var(--black);
    min-height: 100vh;
  }

  .app { width: 100%; margin: 0 auto; min-height: 100vh; position: relative; overflow-x: hidden; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 24px; border-radius: 4px; border: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    transition: all 0.15s ease; text-decoration: none;
  }
  .btn-primary { background: var(--red); color: var(--white); }
  .btn-primary:hover { background: #c41f07; }
  .btn-primary:disabled { background: var(--gray2); cursor: not-allowed; }
  .btn-red { background: var(--red); color: var(--white); }
  .btn-red:hover { background: #c41f07; }
  .btn-ghost { background: transparent; color: var(--black); border: 2px solid var(--black); border-radius: 4px; }
  .btn-ghost:hover { background: var(--gray); }
  .btn-sm { padding: 8px 16px; font-size: 14px; }
  .btn-full { width: 100%; }

  .screen { min-height: 100vh; display: flex; flex-direction: column; }
  .safe-top { padding-top: env(safe-area-inset-top, 0px); }

  .hero { background: var(--black); color: var(--white); padding: 48px 24px 36px; }
  .hero-sm { padding: 36px 24px 28px; }
  .hero-label { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--red); margin-bottom: 8px; font-weight: 700; }
  .hero-title { font-family: 'Barlow Condensed', sans-serif; font-size: 56px; line-height: 0.92; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; }

  .back-row { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 2px solid var(--black); }
  .back-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--black); font-size: 13px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .back-btn:hover { color: var(--red); }

  .card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 20px; }
  .cookbook-card {
    border-radius: 0; aspect-ratio: 3/4; display: flex; flex-direction: column;
    justify-content: flex-end; padding: 16px; cursor: pointer; position: relative; overflow: hidden;
    background: var(--black);
    transition: opacity 0.15s ease;
  }
  .cookbook-card:hover { opacity: 0.82; }
  .cookbook-card-emoji { font-size: 28px; position: absolute; top: 16px; left: 16px; }
  .cookbook-card-name { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700; color: white; line-height: 1.0; text-transform: uppercase; letter-spacing: 0.02em; }
  .cookbook-card-count { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; color: var(--red); margin-top: 4px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .new-cookbook-card {
    border-radius: 0; aspect-ratio: 3/4; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px; border: 2px solid var(--black);
    cursor: pointer; background: var(--white); transition: all 0.15s;
  }
  .new-cookbook-card:hover { background: var(--gray); }
  .new-cookbook-card span { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; color: var(--black); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }

  .recipe-list { padding: 0 20px; display: flex; flex-direction: column; gap: 8px; }
  .recipe-card {
    border-radius: 0; padding: 16px; background: var(--white);
    border: 2px solid var(--black); cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: space-between;
  }
  .recipe-card:hover { background: var(--gray); }
  .recipe-card-info h3 { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1; }
  .recipe-card-meta { font-size: 12px; color: var(--gray2); margin-top: 4px; }
  .recipe-card-cooked { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; color: var(--red); font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

  .form-screen { background: var(--white); min-height: 100vh; }
  .form-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--black); }
  .form-input {
    padding: 12px 14px; border-radius: 0; border: 2px solid var(--black);
    font-size: 15px; font-family: 'DM Sans', sans-serif; background: var(--white);
    outline: none; transition: border-color 0.15s; color: var(--black);
  }
  .form-input:focus { border-color: var(--red); }
  .form-textarea { resize: vertical; min-height: 80px; }

  .tabs { display: flex; padding: 0 20px; gap: 0; border-bottom: 2px solid var(--black); }
  .tab { padding: 12px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; border: none; background: none; color: var(--gray2); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
  .tab.active { color: var(--black); border-bottom-color: var(--red); }

  .emoji-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .emoji-btn { font-size: 24px; padding: 8px; border-radius: 0; border: 2px solid transparent; cursor: pointer; background: var(--gray); transition: all 0.1s; }
  .emoji-btn.selected { border-color: var(--red); background: white; }
  .color-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .color-btn { width: 36px; height: 36px; border-radius: 0; border: 3px solid transparent; cursor: pointer; transition: all 0.1s; }
  .color-btn.selected { border-color: white; box-shadow: 0 0 0 2px var(--black); }

  .dynamic-list { display: flex; flex-direction: column; gap: 10px; }
  .dynamic-item { display: flex; gap: 8px; align-items: flex-start; }
  .remove-btn { padding: 12px 10px; border: none; background: none; cursor: pointer; color: var(--gray2); font-size: 18px; line-height: 1; flex-shrink: 0; }
  .remove-btn:hover { color: var(--red); }

  .cookbook-preview {
    border-radius: 0; aspect-ratio: 3/4; max-width: 140px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    margin: 0 auto; background: var(--black);
  }

  .detail-hero { background: var(--black); color: var(--white); padding: 36px 24px 28px; }
  .detail-meta { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
  .detail-meta-item { font-size: 13px; color: var(--gray2); }
  .detail-section { padding: 20px; }
  .detail-section h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--black); margin-bottom: 12px; }
  .ingredient-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--gray2); font-size: 15px; }
  .ingredient-qty { color: var(--gray2); font-size: 13px; }
  .step-preview { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--gray2); }
  .step-num { width: 24px; height: 24px; border-radius: 0; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; font-family: 'Barlow Condensed', sans-serif; }

  .checklist-item {
    display: flex; align-items: center; gap: 12px; padding: 14px 16px;
    border-radius: 0; border: 2px solid var(--black); background: white;
    cursor: pointer; transition: all 0.2s;
  }
  .checklist-item.checked { background: var(--gray); border-color: var(--gray2); }
  .checklist-item.checked .ci-name { text-decoration: line-through; color: var(--gray2); }
  .check-circle {
    width: 24px; height: 24px; border-radius: 0; border: 2px solid var(--black);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: white; transition: all 0.2s;
  }
  .checklist-item.checked .check-circle { background: var(--red); border-color: var(--red); }
  .ci-name { font-size: 15px; font-weight: 500; }
  .ci-qty { font-size: 12px; color: var(--gray2); margin-top: 1px; }
  .checklist-progress { height: 4px; background: var(--gray2); margin: 0 20px; overflow: hidden; }
  .checklist-progress-fill { height: 100%; background: var(--red); transition: width 0.3s ease; }

  .cook-screen { background: var(--black); min-height: 100vh; display: flex; flex-direction: column; color: var(--white); }
  .cook-header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; }
  .cook-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; }
  .cook-dots { display: flex; gap: 6px; }
  .cook-dot { width: 6px; height: 6px; border-radius: 0; background: rgba(255,255,255,0.2); transition: all 0.2s; }
  .cook-dot.active { background: var(--red); width: 18px; }
  .cook-dot.done { background: rgba(255,255,255,0.4); }
  .cook-steps { flex: 1; display: flex; flex-direction: column; padding: 0 24px; justify-content: center; }
  .cook-prev { padding: 20px 0 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .cook-prev-text { font-size: 14px; text-decoration: line-through; line-height: 1.5; color: rgba(255,255,255,0.2); }
  .cook-current { padding: 36px 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .cook-step-label { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--red); margin-bottom: 16px; font-weight: 700; }
  .cook-current-text { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; line-height: 1.05; font-weight: 700; text-transform: uppercase; }
  .cook-next { padding: 24px 0 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .cook-next-label { font-family: 'Barlow Condensed', sans-serif; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 8px; font-weight: 700; }
  .cook-next-text { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.3); }
  .cook-footer { padding: 20px 24px 40px; }
  .cook-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .cook-nav-btn {
    width: 52px; height: 52px; border-radius: 0; border: 2px solid rgba(255,255,255,0.15);
    background: transparent; color: var(--white); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.15s;
  }
  .cook-nav-btn:hover:not(:disabled) { border-color: var(--red); color: var(--red); }
  .cook-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  .timer-widget {
    background: var(--red);
    border-radius: 0; padding: 12px 16px; margin-top: 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .timer-display { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; color: white; }
  .timer-display.running { color: white; }
  .timer-display.done { color: var(--black); }
  .timer-start-btn { padding: 8px 16px; border-radius: 0; border: 2px solid white; background: transparent; color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.15s; }
  .timer-start-btn:hover { background: white; color: var(--red); }
  .timer-start-btn.running { border-color: rgba(255,255,255,0.4); color: rgba(255,255,255,0.4); }

  .done-screen { background: var(--black); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--white); padding: 40px 24px; text-align: center; }
  .done-emoji { font-size: 64px; margin-bottom: 24px; }
  .done-title { font-family: 'Barlow Condensed', sans-serif; font-size: 64px; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.95; }
  .done-sub { color: rgba(255,255,255,0.5); font-size: 16px; margin-bottom: 40px; }

  .scroll-body { overflow-y: auto; flex: 1; }
  .pb-safe { padding-bottom: 40px; }

  @media (min-width: 640px) {
    .hero { padding: 64px 48px 48px; }
    .hero-sm { padding: 48px 48px 36px; }
    .hero-title { font-size: 72px; }
    .back-row { padding: 20px 48px; }
    .card-grid { grid-template-columns: repeat(3, 1fr); padding: 28px 48px; gap: 12px; }
    .recipe-list { padding: 0 48px; }
    .form-body { padding: 24px 48px; }
    .tabs { padding: 0 48px; }
    .detail-hero { padding: 48px 48px 36px; }
    .detail-section { padding: 24px 48px; }
    .checklist-progress { margin: 0 48px; }
    .cook-screen { align-items: center; }
    .cook-header { width: 100%; max-width: 640px; }
    .cook-steps { max-width: 640px; width: 100%; }
    .cook-footer { width: 100%; max-width: 640px; }
    .done-screen { padding: 60px 48px; }
    .form-screen { max-width: 680px; margin: 0 auto; width: 100%; }
  }

  @media (min-width: 1024px) {
    .hero { padding: 96px 80px 72px; }
    .hero-sm { padding: 72px 80px 56px; }
    .hero-title { font-size: 104px; }
    .back-row { padding: 24px 80px; }
    .card-grid { grid-template-columns: repeat(4, 1fr); padding: 40px 80px; gap: 12px; max-width: 1280px; margin: 0 auto; }
    .recipe-list { padding: 0 80px; display: grid; grid-template-columns: 1fr 1fr; align-items: start; gap: 8px; }
    .form-body { padding: 32px 80px; }
    .tabs { padding: 0 80px; }
    .detail-hero { padding: 96px 80px 64px; }
    .detail-section { padding: 32px 80px; max-width: 900px; }
    .checklist-progress { margin: 0 80px; }
    .cook-header { max-width: 720px; padding: 28px 24px 0; }
    .cook-steps { max-width: 720px; }
    .cook-footer { max-width: 720px; }
    .cook-current-text { font-size: 48px; }
    .done-title { font-size: 88px; }
    .cookbook-card-name { font-size: 26px; }
  }
`;

const COOKBOOK_COLORS = ['#111111','#1a3a1a','#8B1A0A','#1a1a3a','#2A6B8C','#3D6B4F','#5B4FCF','#7A4B9C'];
const COOKBOOK_EMOJIS = ['📖','🍳','🥗','🍝','🍜','🥘','🍕','🌮','🍣','🥩','🥐','🧁','🫕','🍲','🥦','🍱'];

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

const SAMPLE_DATA = [{
  id: 'sample-1', name: 'Italian Nights', emoji: '🍝', color: '#111111',
  recipes: [{
    id: 'sample-r1', name: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with egg, pecorino, guanciale and black pepper.',
    time: 25, difficulty: 'Medium', servings: 2, cookedCount: 0,
    ingredients: [
      { id: 'i1', name: 'Spaghetti', qty: '200g' },
      { id: 'i2', name: 'Guanciale or pancetta', qty: '150g' },
      { id: 'i3', name: 'Egg yolks', qty: '4' },
      { id: 'i4', name: 'Pecorino Romano', qty: '60g grated' },
      { id: 'i5', name: 'Black pepper', qty: 'generous' },
    ],
    steps: [
      { id: 's1', text: 'Bring a large pot of well-salted water to a boil. Cook spaghetti until al dente, about 8-10 minutes.', timer: null },
      { id: 's2', text: 'Cook guanciale in a large pan over medium heat until crispy and fat has rendered out.', timer: 7 },
      { id: 's3', text: 'In a bowl, whisk together egg yolks and grated pecorino. Season generously with cracked black pepper.', timer: null },
      { id: 's4', text: 'Reserve 1 cup pasta water, drain pasta. Add pasta to the pan with guanciale, off the heat.', timer: null },
      { id: 's5', text: 'Add egg mixture, tossing quickly and adding pasta water a little at a time until you have a creamy sauce. Work fast — no scrambled eggs.', timer: null },
      { id: 's6', text: 'Serve immediately with more pecorino and cracked black pepper.', timer: null },
    ]
  }]
}];

function HomeScreen({ cookbooks, onOpenCookbook, onNewCookbook }) {
  return (
    <div className="screen">
      <div className="hero safe-top">
        <div className="hero-label">Your recipes</div>
        <h1 className="hero-title">Yes Chef</h1>
      </div>
      <div className="scroll-body">
        <div className="card-grid">
          {cookbooks.map(cb => (
            <div key={cb.id} className="cookbook-card" onClick={() => onOpenCookbook(cb.id)}>
              <span className="cookbook-card-emoji">{cb.emoji}</span>
              <div>
                <div className="cookbook-card-name">{cb.name}</div>
                <div className="cookbook-card-count">{cb.recipes.length} recipe{cb.recipes.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
          <div className="new-cookbook-card" onClick={onNewCookbook}>
            <span style={{ fontSize: 28 }}>+</span>
            <span>New cookbook</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewCookbookScreen({ onBack, onSave }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [color, setColor] = useState(COOKBOOK_COLORS[0]);

  return (
    <div className="form-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>
      <div className="hero hero-sm">
        <div className="cookbook-preview">
          <span style={{ fontSize: 36 }}>{emoji}</span>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white', marginTop: 8, textAlign: 'center', padding: '0 8px' }}>{name || 'My Cookbook'}</span>
        </div>
      </div>
      <div className="form-body scroll-body">
        <div className="form-field">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="e.g. Date Night" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Emoji</label>
          <div className="emoji-grid">
            {COOKBOOK_EMOJIS.map(e => (
              <button key={e} className={`emoji-btn${emoji === e ? ' selected' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-full" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), emoji, color })}>
          Create Cookbook
        </button>
      </div>
    </div>
  );
}

function CookbookScreen({ cookbook, onBack, onOpenRecipe, onNewRecipe }) {
  return (
    <div className="screen">
      <div className="hero hero-sm safe-top">
        <div style={{ marginBottom: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>← Back</div>
        <div style={{ fontSize: 36 }}>{cookbook.emoji}</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', fontSize: 40, marginTop: 8, color: 'white', letterSpacing: '0.01em', lineHeight: 0.95 }}>{cookbook.name}</h1>
        <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 6, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cookbook.recipes.length} recipe{cookbook.recipes.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="scroll-body pb-safe">
        <div style={{ padding: 20 }}>
          <button className="btn btn-primary btn-full" onClick={onNewRecipe}>+ Add Recipe</button>
        </div>
        {cookbook.recipes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray2)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🍳</p>
            <p>No recipes yet. Add your first one!</p>
          </div>
        )}
        <div className="recipe-list">
          {cookbook.recipes.map(r => (
            <div key={r.id} className="recipe-card" onClick={() => onOpenRecipe(r.id)}>
              <div className="recipe-card-info">
                <h3>{r.name}</h3>
                <div className="recipe-card-meta">{r.time} min · {r.difficulty} · {r.servings} servings</div>
                {r.cookedCount > 0 && <div className="recipe-card-cooked">Cooked {r.cookedCount}×</div>}
              </div>
              <span style={{ color: 'var(--gray2)', fontSize: 18 }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewRecipeScreen({ onBack, onSave }) {
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState([{ id: generateId(), name: '', qty: '' }]);
  const [steps, setSteps] = useState([{ id: generateId(), text: '', timer: null, hasTimer: false }]);

  const addIngredient = () => setIngredients(p => [...p, { id: generateId(), name: '', qty: '' }]);
  const removeIngredient = id => setIngredients(p => p.filter(i => i.id !== id));
  const updateIngredient = (id, field, val) => setIngredients(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));

  const addStep = () => setSteps(p => [...p, { id: generateId(), text: '', timer: null, hasTimer: false }]);
  const removeStep = id => setSteps(p => p.filter(s => s.id !== id));
  const updateStep = (id, field, val) => setSteps(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));

  const canSave = name.trim() && ingredients.some(i => i.name.trim()) && steps.some(s => s.text.trim());

  const handleSave = () => {
    onSave({
      name: name.trim(), description: description.trim(),
      time: parseInt(time) || 30, difficulty, servings,
      ingredients: ingredients.filter(i => i.name.trim()),
      steps: steps.filter(s => s.text.trim()).map(s => ({ ...s, timer: s.hasTimer ? (parseInt(s.timer) || null) : null })),
    });
  };

  return (
    <div className="form-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <button className="btn btn-red btn-sm" style={{ marginLeft: 'auto' }} disabled={!canSave} onClick={handleSave}>Save</button>
      </div>
      <div style={{ padding: '0 20px 12px', borderBottom: '2px solid var(--black)' }}>
        <input className="form-input" placeholder="Recipe name" value={name} onChange={e => setName(e.target.value)} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', border: 'none', padding: '12px 0', background: 'transparent', width: '100%' }} />
      </div>
      <div className="tabs">
        {['Details', 'Ingredients', 'Steps'].map((t, i) => (
          <button key={t} className={`tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>
      <div className="form-body scroll-body">
        {tab === 0 && <>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea className="form-input form-textarea" placeholder="A short description..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Time (min)</label>
              <input className="form-input" type="number" placeholder="30" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Servings</label>
              <input className="form-input" type="number" placeholder="2" value={servings} onChange={e => setServings(parseInt(e.target.value) || 2)} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Difficulty</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Easy', 'Medium', 'Hard'].map(d => (
                <button key={d} className={`btn btn-sm${difficulty === d ? ' btn-primary' : ' btn-ghost'}`} onClick={() => setDifficulty(d)}>{d}</button>
              ))}
            </div>
          </div>
        </>}
        {tab === 1 && <>
          <div className="dynamic-list">
            {ingredients.map((ing, idx) => (
              <div key={ing.id} className="dynamic-item">
                <input className="form-input" placeholder={`Ingredient ${idx + 1}`} value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} style={{ flex: 2 }} />
                <input className="form-input" placeholder="Qty" value={ing.qty} onChange={e => updateIngredient(ing.id, 'qty', e.target.value)} style={{ flex: 1 }} />
                {ingredients.length > 1 && <button className="remove-btn" onClick={() => removeIngredient(ing.id)}>×</button>}
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={addIngredient}>+ Add ingredient</button>
        </>}
        {tab === 2 && <>
          <div className="dynamic-list">
            {steps.map((step, idx) => (
              <div key={step.id} style={{ background: 'white', border: '2px solid var(--black)', borderRadius: 0, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div className="step-num">{idx + 1}</div>
                  <textarea className="form-input form-textarea" placeholder={`Step ${idx + 1}...`} value={step.text} onChange={e => updateStep(step.id, 'text', e.target.value)} style={{ flex: 1, minHeight: 70, fontSize: 14 }} />
                  {steps.length > 1 && <button className="remove-btn" onClick={() => removeStep(step.id)}>×</button>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--gray2)' }}>
                    <input type="checkbox" checked={step.hasTimer} onChange={e => updateStep(step.id, 'hasTimer', e.target.checked)} style={{ accentColor: 'var(--red)' }} />
                    Timer
                  </label>
                  {step.hasTimer && (
                    <input className="form-input" type="number" placeholder="min" value={step.timer || ''} onChange={e => updateStep(step.id, 'timer', e.target.value)} style={{ width: 72 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={addStep}>+ Add step</button>
        </>}
      </div>
    </div>
  );
}

function RecipeDetailScreen({ recipe, cookbook, onBack, onStartCook }) {
  return (
    <div className="screen">
      <div className="detail-hero safe-top">
        <div style={{ marginBottom: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>← {cookbook.name}</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', fontSize: 40, color: 'white', lineHeight: 0.95, letterSpacing: '0.01em' }}>{recipe.name}</h1>
        {recipe.description && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 8 }}>{recipe.description}</p>}
        <div className="detail-meta">
          <span className="detail-meta-item">⏱ {recipe.time} min</span>
          <span className="detail-meta-item">📊 {recipe.difficulty}</span>
          <span className="detail-meta-item">🍽 {recipe.servings} servings</span>
          {recipe.cookedCount > 0 && <span className="detail-meta-item">♻️ Cooked {recipe.cookedCount}×</span>}
        </div>
      </div>
      <div className="scroll-body pb-safe">
        <div className="detail-section">
          <h2>Ingredients</h2>
          {recipe.ingredients.map(ing => (
            <div key={ing.id} className="ingredient-item">
              <span>{ing.name}</span>
              <span className="ingredient-qty">{ing.qty}</span>
            </div>
          ))}
        </div>
        <div className="detail-section">
          <h2>Steps</h2>
          {recipe.steps.map((step, idx) => (
            <div key={step.id} className="step-preview">
              <div className="step-num">{idx + 1}</div>
              <div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{step.text}</div>
                {step.timer && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>⏱ {step.timer} min timer</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 20px 40px' }}>
          <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} onClick={onStartCook}>Start Cooking</button>
        </div>
      </div>
    </div>
  );
}

function PrepChecklistScreen({ recipe, onBack, onStart }) {
  const [checked, setChecked] = useState({});
  const [servings, setServings] = useState(recipe.servings);
  const scale = servings / recipe.servings;
  const toggle = id => setChecked(p => ({ ...p, [id]: !p[id] }));
  const allChecked = recipe.ingredients.every(i => checked[i.id]);
  const checkedCount = recipe.ingredients.filter(i => checked[i.id]).length;

  function scaleQty(qty) {
    if (!qty || scale === 1) return qty;
    const match = qty.match(/^(\d+(?:\.\d+)?)(.*)/);
    if (!match) return qty;
    const num = parseFloat(match[1]) * scale;
    return (Number.isInteger(num) ? num : num.toFixed(1)) + match[2];
  }

  return (
    <div className="screen">
      <div className="hero safe-top">
        <div style={{ marginBottom: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>← Back</div>
        <div className="hero-label">Before we start</div>
        <h1 className="hero-title">Grab your<br/>ingredients</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px', borderBottom: '1px solid var(--gray2)' }}>
        <span style={{ fontSize: 13, color: 'var(--gray2)', flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Servings</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ width: 32, height: 32, borderRadius: 0, border: '2px solid var(--black)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", minWidth: 20, textAlign: 'center' }}>{servings}</span>
          <button style={{ width: 32, height: 32, borderRadius: 0, border: '2px solid var(--black)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setServings(s => s + 1)}>+</button>
        </div>
      </div>
      <div className="checklist-progress" style={{ margin: '8px 20px' }}>
        <div className="checklist-progress-fill" style={{ width: `${(checkedCount / recipe.ingredients.length) * 100}%` }} />
      </div>
      <div className="scroll-body">
        <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recipe.ingredients.map(ing => (
            <div key={ing.id} className={`checklist-item${checked[ing.id] ? ' checked' : ''}`} onClick={() => toggle(ing.id)}>
              <div className="check-circle">
                {checked[ing.id] && <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div className="ci-name">{ing.name}</div>
                <div className="ci-qty">{scaleQty(ing.qty)}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 20px 40px' }}>
          <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} disabled={!allChecked} onClick={() => onStart(servings)}>
            {allChecked ? "Let's Cook! →" : `${checkedCount} of ${recipe.ingredients.length} confirmed`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TimerWidget({ minutes }) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(minutes * 60);
  const [done, setDone] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setSeconds(minutes * 60); setRunning(false); setDone(false); }, [minutes]);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds(s => { if (s <= 1) { clearInterval(ref.current); setRunning(false); setDone(true); return 0; } return s - 1; });
      }, 1000);
    }
    return () => clearInterval(ref.current);
  }, [running]);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const toggle = () => { if (done) { setSeconds(minutes * 60); setDone(false); } else { setRunning(r => !r); } };

  return (
    <div className="timer-widget">
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Timer</div>
        <div className={`timer-display${running ? ' running' : done ? ' done' : ''}`}>{done ? 'Done!' : fmt(seconds)}</div>
      </div>
      <button className={`timer-start-btn${running ? ' running' : ''}`} onClick={toggle}>
        {done ? 'Reset' : running ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}

function CookModeScreen({ recipe, onDone }) {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = recipe.steps;

  if (stepIdx >= steps.length) {
    return (
      <div className="done-screen">
        <div className="done-emoji">🎉</div>
        <h1 className="done-title">Bon appétit!</h1>
        <p className="done-sub">{recipe.name} is ready.</p>
        <button className="btn btn-red" style={{ width: '100%', maxWidth: 280, height: 52, fontSize: 18 }} onClick={onDone}>Finish & mark as cooked</button>
      </div>
    );
  }

  const current = steps[stepIdx];
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;
  const next = stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;

  return (
    <div className="cook-screen">
      <div className="cook-header safe-top">
        <span className="cook-title">{recipe.name}</span>
        <div className="cook-dots">
          {steps.map((_, i) => <div key={i} className={`cook-dot${i === stepIdx ? ' active' : i < stepIdx ? ' done' : ''}`} />)}
        </div>
      </div>
      <div className="cook-steps">
        {prev && (
          <div className="cook-prev">
            <div className="cook-prev-text">{prev.text}</div>
          </div>
        )}
        <div className="cook-current">
          <div className="cook-step-label">Step {stepIdx + 1} of {steps.length}</div>
          <p className="cook-current-text">{current.text}</p>
          {current.timer && <TimerWidget minutes={current.timer} />}
        </div>
        {next && (
          <div className="cook-next">
            <div className="cook-next-label">Up next</div>
            <div className="cook-next-text">{next.text}</div>
          </div>
        )}
      </div>
      <div className="cook-footer">
        <div className="cook-nav">
          <button className="cook-nav-btn" disabled={stepIdx === 0} onClick={() => setStepIdx(i => i - 1)}>←</button>
          <div style={{ flex: 1 }}>
            <button className="btn btn-red btn-full" onClick={() => setStepIdx(i => i + 1)}>
              {stepIdx === steps.length - 1 ? 'Finish' : 'Next step →'}
            </button>
          </div>
          <div style={{ width: 52 }} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [cookbooks, setCookbooks] = useLocalStorage('yeschef-cookbooks', SAMPLE_DATA);
  const [screen, setScreen] = useState({ name: 'home' });

  const navigate = (name, params = {}) => setScreen({ name, ...params });
  const getCookbook = id => cookbooks.find(cb => cb.id === id);
  const getRecipe = (cbId, rId) => getCookbook(cbId)?.recipes.find(r => r.id === rId);
  const updateCookbook = (cbId, fn) => setCookbooks(prev => prev.map(cb => cb.id === cbId ? fn(cb) : cb));

  const handleNewCookbook = data => {
    const newCb = { id: generateId(), recipes: [], ...data };
    setCookbooks(p => [...p, newCb]);
    navigate('cookbook', { cbId: newCb.id });
  };

  const handleNewRecipe = (cbId, data) => {
    const newRecipe = { id: generateId(), cookedCount: 0, ...data };
    updateCookbook(cbId, cb => ({ ...cb, recipes: [...cb.recipes, newRecipe] }));
    navigate('recipe', { cbId, rId: newRecipe.id });
  };

  const handleMarkCooked = (cbId, rId) => {
    updateCookbook(cbId, cb => ({
      ...cb,
      recipes: cb.recipes.map(r => r.id === rId ? { ...r, cookedCount: (r.cookedCount || 0) + 1 } : r)
    }));
    navigate('cookbook', { cbId });
  };

  const { name: s, cbId, rId } = screen;
  const cb = cbId ? getCookbook(cbId) : null;
  const recipe = (cbId && rId) ? getRecipe(cbId, rId) : null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        {s === 'home' && <HomeScreen cookbooks={cookbooks} onOpenCookbook={id => navigate('cookbook', { cbId: id })} onNewCookbook={() => navigate('new-cookbook')} />}
        {s === 'new-cookbook' && <NewCookbookScreen onBack={() => navigate('home')} onSave={handleNewCookbook} />}
        {s === 'cookbook' && cb && <CookbookScreen cookbook={cb} onBack={() => navigate('home')} onOpenRecipe={rId => navigate('recipe', { cbId, rId })} onNewRecipe={() => navigate('new-recipe', { cbId })} />}
        {s === 'new-recipe' && cb && <NewRecipeScreen onBack={() => navigate('cookbook', { cbId })} onSave={data => handleNewRecipe(cbId, data)} />}
        {s === 'recipe' && cb && recipe && <RecipeDetailScreen recipe={recipe} cookbook={cb} onBack={() => navigate('cookbook', { cbId })} onStartCook={() => navigate('prep', { cbId, rId })} />}
        {s === 'prep' && cb && recipe && <PrepChecklistScreen recipe={recipe} onBack={() => navigate('recipe', { cbId, rId })} onStart={() => navigate('cook', { cbId, rId })} />}
        {s === 'cook' && recipe && <CookModeScreen recipe={recipe} onDone={() => handleMarkCooked(cbId, rId)} />}
      </div>
    </>
  );
}
