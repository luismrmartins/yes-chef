'use client';
import { useState, useEffect, useRef } from 'react';
import { getCookbooks, createCookbook, getRecipes, createRecipe, incrementCookedCount } from '../lib/db';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Courier+Prime:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --red: #FB3B00;
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
  .btn-primary:hover { background: #d43200; }
  .btn-primary:disabled { background: var(--gray2); cursor: not-allowed; }
  .btn-red { background: var(--red); color: var(--white); }
  .btn-red:hover { background: #d43200; }
  .btn-black { background: var(--black); color: var(--white); }
  .btn-black:hover { background: #333; }
  .btn-ghost { background: transparent; color: var(--black); border: 2px solid var(--black); border-radius: 4px; }
  .btn-ghost:hover { background: var(--gray); }
  .btn-sm { padding: 8px 16px; font-size: 14px; }
  .btn-full { width: 100%; }

  .screen { min-height: 100vh; display: flex; flex-direction: column; }
  .safe-top { padding-top: env(safe-area-inset-top, 0px); }

  .screen-red { background: var(--red); }

  .page-header { padding: 48px 24px 28px; }
  .page-header.safe-top { padding-top: max(48px, calc(env(safe-area-inset-top, 0px) + 16px)); }
  .page-header-back { display: flex; align-items: center; gap: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888888; cursor: pointer; margin-bottom: 16px; background: none; border: none; padding: 0; }
  .page-header-back:hover { opacity: 0.7; }
  .page-header-title { font-family: 'Barlow Condensed', sans-serif; font-size: 56px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.92; color: var(--black); }
  .page-header-sub { font-size: 15px; color: #888888; margin-top: 8px; }
  .page-header-meta { font-family: 'Courier Prime', monospace; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #888888; margin-top: 8px; }

  .flat-list { display: flex; flex-direction: column; }
  .flat-row { display: flex; align-items: center; padding: 20px 24px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.15); transition: opacity 0.15s; }
  .flat-row:first-child { border-top: 1px solid rgba(255,255,255,0.15); }
  .flat-row:hover { opacity: 0.65; }
  .flat-row-info { flex: 1; min-width: 0; }
  .flat-row-name { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.01em; line-height: 1; }
  .flat-row-meta { font-family: 'Courier Prime', monospace; font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px; }
  .flat-row-badge { font-family: 'Courier Prime', monospace; font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 4px; }
  .flat-row-arrow { color: rgba(255,255,255,0.3); font-size: 20px; flex-shrink: 0; margin-left: 12px; }
  .flat-row-action { display: flex; align-items: center; padding: 20px 24px; cursor: pointer; color: rgba(255,255,255,0.5); font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; gap: 8px; transition: opacity 0.15s; border-top: 1px solid rgba(255,255,255,0.15); }
  .flat-row-action:hover { opacity: 0.7; }

  .screen-white { background: var(--white); }
  .screen-white .flat-row { border-bottom: 1px solid #EEEEEE; }
  .screen-white .flat-row:first-child { border-top: 1px solid #EEEEEE; }
  .screen-white .flat-row-name { color: var(--black); }
  .screen-white .flat-row-meta { color: #888888; }
  .screen-white .flat-row-badge { color: #888888; }
  .screen-white .flat-row-arrow { color: #CCCCCC; }
  .screen-white .flat-row-action { color: #888888; border-top: 1px solid #EEEEEE; }
  .screen-white .page-header-sub { color: #888888; }

  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--white); }
  .loading-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 64px; text-transform: uppercase; letter-spacing: -0.02em; line-height: 0.85; }
  .loading-logo .yes { display: block; color: var(--red); }
  .loading-logo .chef { display: block; color: var(--black); }

  .hero { background: var(--white); color: var(--black); padding: 48px 24px 36px; border-bottom: 1px solid #EEEEEE; }
  .hero-sm { padding: 36px 24px 28px; }
  .hero-label { font-family: 'Courier Prime', monospace; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--red); margin-bottom: 8px; font-weight: 700; }
  .hero-title { font-family: 'Barlow Condensed', sans-serif; font-size: 56px; line-height: 0.92; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; color: var(--black); }

  .back-row { display: flex; align-items: center; gap: 8px; padding: 16px 20px; border-bottom: 2px solid var(--black); }
  .back-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--black); font-size: 13px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .back-btn:hover { color: var(--red); }

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

  .color-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .color-btn { width: 44px; height: 44px; border-radius: 0; border: 3px solid transparent; cursor: pointer; transition: all 0.1s; }
  .color-btn.selected { border-color: white; box-shadow: 0 0 0 2px var(--black); }

  .dynamic-list { display: flex; flex-direction: column; gap: 10px; }
  .dynamic-item { display: flex; gap: 8px; align-items: flex-start; }
  .remove-btn { padding: 12px 10px; border: none; background: none; cursor: pointer; color: var(--gray2); font-size: 18px; line-height: 1; flex-shrink: 0; }
  .remove-btn:hover { color: var(--red); }

  .cookbook-preview {
    border-radius: 0; aspect-ratio: 3/4; max-width: 120px;
    display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end;
    margin: 0 auto; background: var(--black); padding: 14px;
  }
  .cookbook-preview-name { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1; }

  .detail-hero { background: var(--white); color: var(--black); padding: 36px 24px 28px; border-bottom: 1px solid #EEEEEE; }
  .detail-meta { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
  .detail-meta-item { font-family: 'Courier Prime', monospace; font-size: 13px; color: #888888; }
  .detail-section { padding: 20px; }
  .detail-section h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--black); margin-bottom: 12px; }
  .ingredient-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--gray2); font-size: 15px; }
  .ingredient-qty { font-family: 'Courier Prime', monospace; color: var(--gray2); font-size: 13px; }
  .step-preview { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--gray2); }
  .step-num { width: 24px; height: 24px; border-radius: 0; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; font-family: 'Courier Prime', monospace; }

  .checklist-item {
    display: flex; align-items: center; gap: 12px; padding: 14px 0;
    border-bottom: 1px solid #EEEEEE; background: transparent;
    cursor: pointer; transition: all 0.2s;
  }
  .checklist-item:first-child { border-top: 1px solid #EEEEEE; }
  .checklist-item.checked .ci-name { text-decoration: line-through; color: var(--gray2); }
  .check-circle {
    width: 22px; height: 22px; border-radius: 0; border: 2px solid var(--black);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: white; transition: all 0.2s;
  }
  .checklist-item.checked .check-circle { background: var(--red); border-color: var(--red); }
  .ci-name { font-size: 15px; font-weight: 500; }
  .ci-qty { font-family: 'Courier Prime', monospace; font-size: 12px; color: var(--gray2); margin-top: 1px; }
  .checklist-progress { height: 4px; background: var(--gray2); overflow: hidden; }
  .checklist-progress-fill { height: 100%; background: var(--red); transition: width 0.3s ease; }

  .cook-screen { background: var(--white); min-height: 100vh; display: flex; flex-direction: column; color: var(--black); }
  .cook-header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; }
  .cook-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 20px; text-transform: uppercase; letter-spacing: -0.02em; line-height: 0.85; display: inline-flex; flex-direction: column; align-items: flex-start; }
  .cook-logo .yes { color: var(--red); font-size: 16px; }
  .cook-logo .chef { color: #888888; font-size: 16px; }
  .cook-dots { display: flex; gap: 6px; }
  .cook-dot { width: 6px; height: 6px; border-radius: 0; background: #DDDDDD; transition: all 0.2s; }
  .cook-dot.active { background: var(--red); width: 18px; }
  .cook-dot.done { background: #BBBBBB; }
  .cook-steps { flex: 1; display: flex; flex-direction: column; padding: 0 24px; justify-content: center; }
  .cook-prev { padding: 20px 0 24px; border-bottom: 1px solid #EEEEEE; }
  .cook-prev-text { font-size: 14px; text-decoration: line-through; line-height: 1.5; color: #CCCCCC; }
  .cook-current { padding: 36px 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .cook-step-label { font-family: 'Courier Prime', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red); margin-bottom: 16px; font-weight: 700; }
  .cook-current-text { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; line-height: 1.05; font-weight: 700; text-transform: uppercase; color: var(--black); }
  .cook-next { padding: 24px 0 20px; border-top: 1px solid #EEEEEE; }
  .cook-next-label { font-family: 'Courier Prime', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #AAAAAA; margin-bottom: 8px; font-weight: 700; }
  .cook-next-text { font-size: 14px; line-height: 1.5; color: #AAAAAA; }
  .cook-footer { padding: 20px 24px 40px; }
  .cook-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .cook-nav-btn {
    width: 52px; height: 52px; border-radius: 0; border: 2px solid #DDDDDD;
    background: transparent; color: var(--black); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.15s;
  }
  .cook-nav-btn:hover:not(:disabled) { border-color: var(--red); color: var(--red); }
  .cook-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  .timer-widget {
    background: #FFF5F2; border-radius: 0; padding: 12px 16px; margin-top: 16px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    border-left: 3px solid var(--red);
  }
  .timer-display { font-family: 'Courier Prime', monospace; font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--red); }
  .timer-display.done { color: var(--black); }
  .timer-start-btn { padding: 8px 16px; border-radius: 0; border: 2px solid var(--red); background: transparent; color: var(--red); font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.15s; }
  .timer-start-btn:hover { background: var(--red); color: white; }
  .timer-start-btn.running { border-color: rgba(251,59,0,0.35); color: rgba(251,59,0,0.35); }

  .done-screen { background: var(--white); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--black); padding: 40px 24px; text-align: center; }
  .done-title { font-family: 'Barlow Condensed', sans-serif; font-size: 64px; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.95; color: var(--black); }
  .done-sub { color: #888888; font-size: 16px; margin-bottom: 40px; }

  .scroll-body { overflow-y: auto; flex: 1; }
  .pb-safe { padding-bottom: 40px; }

  @media (min-width: 640px) {
    .page-header { padding: 64px 48px 36px; }
    .page-header-title { font-size: 72px; }
    .flat-row { padding: 24px 48px; }
    .flat-row-action { padding: 24px 48px; }
    .flat-row-name { font-size: 36px; }
    .back-row { padding: 20px 48px; }
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
    .page-header { padding: 96px 80px 48px; }
    .page-header-title { font-size: 104px; }
    .flat-row { padding: 28px 80px; }
    .flat-row-action { padding: 28px 80px; }
    .flat-row-name { font-size: 44px; }
    .back-row { padding: 24px 80px; }
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
  }
`;

const COOKBOOK_COLORS = ['#111111','#1a1a2e','#1a3a1a','#3a1a1a','#2A6B8C','#5B4FCF','#7A4B9C','#8B1A0A'];

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function HomeScreen({ cookbooks, onOpenCookbook, onNewCookbook }) {
  return (
    <div className="screen screen-white">
      <div className="page-header safe-top">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(64px, 12vw, 88px)', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85 }}>
            <div style={{ color: 'var(--red)' }}>YES</div>
            <div style={{ color: 'var(--black)' }}>CHEF</div>
          </div>
        </div>
        <p className="page-header-sub">What are we cooking tonight?</p>
      </div>
      <div className="scroll-body">
        <div className="flat-list">
          {cookbooks.map(cb => (
            <div key={cb.id} className="flat-row" onClick={() => onOpenCookbook(cb.id)}>
              <div className="flat-row-info">
                <div className="flat-row-name">{cb.name}</div>
                {cb.recipeCount !== undefined && (
                  <div className="flat-row-meta">{cb.recipeCount} recipe{cb.recipeCount !== 1 ? 's' : ''}</div>
                )}
              </div>
              <span className="flat-row-arrow">›</span>
            </div>
          ))}
          <div className="flat-row-action" onClick={onNewCookbook}>
            <span>+</span>
            <span>New cookbook</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewCookbookScreen({ onBack, onSave, saving }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COOKBOOK_COLORS[0]);

  return (
    <div className="form-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>
      <div className="hero hero-sm" style={{ background: color }}>
        <div className="cookbook-preview" style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="cookbook-preview-name">{name || 'My Cookbook'}</div>
        </div>
      </div>
      <div className="form-body scroll-body">
        <div className="form-field">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="e.g. Date Night" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-field">
          <label className="form-label">Color</label>
          <div className="color-grid">
            {COOKBOOK_COLORS.map(c => (
              <button key={c} className={`color-btn${color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-full" disabled={!name.trim() || saving} onClick={() => onSave({ name: name.trim(), color })}>
          {saving ? 'Creating...' : 'Create Cookbook'}
        </button>
      </div>
    </div>
  );
}

function CookbookScreen({ cookbook, onBack, onOpenRecipe, onNewRecipe }) {
  const recipes = cookbook.recipes;
  const isLoading = recipes === null;

  return (
    <div className="screen screen-white">
      <div className="page-header safe-top">
        <button className="page-header-back" onClick={onBack}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 24, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', verticalAlign: 'middle', marginRight: 8 }}>
            <span style={{ color: 'var(--red)', fontSize: 18 }}>YES</span>
            <span style={{ color: '#888888', fontSize: 18 }}>CHEF</span>
          </div>
        </button>
        <h1 className="page-header-title">{cookbook.name}</h1>
        {!isLoading && (
          <p className="page-header-meta">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
        )}
      </div>
      <div className="scroll-body" style={{ display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="loading-text">Loading...</span>
          </div>
        ) : recipes.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCCCCC', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 14 }}>
            No recipes yet
          </div>
        ) : (
          <div className="flat-list">
            {recipes.map(r => (
              <div key={r.id} className="flat-row" onClick={() => onOpenRecipe(r.id)}>
                <div className="flat-row-info">
                  <div className="flat-row-name">{r.name}</div>
                  <div className="flat-row-meta">{r.time} min · {r.difficulty} · {r.servings} servings</div>
                  {r.cookedCount > 0 && <div className="flat-row-badge">Cooked {r.cookedCount}×</div>}
                </div>
                <span className="flat-row-arrow">›</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: '24px 24px 40px', marginTop: 'auto' }}>
          <button className="btn btn-black btn-full" style={{ height: 52, fontSize: 18 }} onClick={onNewRecipe}>+ Add Recipe</button>
        </div>
      </div>
    </div>
  );
}

function NewRecipeScreen({ onBack, onSave, saving }) {
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
        <button className="btn btn-red btn-sm" style={{ marginLeft: 'auto' }} disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save'}
        </button>
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
              <div key={step.id} style={{ borderBottom: '1px solid #EEEEEE', paddingBottom: 12 }}>
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
        <div style={{ marginBottom: 12, cursor: 'pointer', color: '#888888', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--red)', fontSize: 16 }}>YES</span>
            <span style={{ color: '#888888', fontSize: 16 }}>CHEF</span>
          </div>
          <span>/ {cookbook.name}</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', fontSize: 40, color: 'var(--black)', lineHeight: 0.95, letterSpacing: '0.01em' }}>{recipe.name}</h1>
        {recipe.description && <p style={{ color: '#888888', fontSize: 14, marginTop: 8 }}>{recipe.description}</p>}
        <div className="detail-meta">
          <span className="detail-meta-item">{recipe.time} min</span>
          <span className="detail-meta-item">{recipe.difficulty}</span>
          <span className="detail-meta-item">{recipe.servings} servings</span>
          {recipe.cookedCount > 0 && <span className="detail-meta-item">Cooked {recipe.cookedCount}×</span>}
        </div>
      </div>
      <div className="scroll-body pb-safe">
        <div className="detail-section">
          <h2>Ingredients</h2>
          {recipe.ingredients.map((ing, idx) => (
            <div key={ing.id || idx} className="ingredient-item">
              <span>{ing.name}</span>
              <span className="ingredient-qty">{ing.qty}</span>
            </div>
          ))}
        </div>
        <div className="detail-section">
          <h2>Steps</h2>
          {recipe.steps.map((step, idx) => (
            <div key={step.id || idx} className="step-preview">
              <div className="step-num">{idx + 1}</div>
              <div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{step.text}</div>
                {step.timer && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{step.timer} min timer</div>}
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
  const allChecked = recipe.ingredients.every((_, i) => checked[i]);
  const checkedCount = recipe.ingredients.filter((_, i) => checked[i]).length;

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
        <div style={{ marginBottom: 12, cursor: 'pointer', color: '#888888', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--red)', fontSize: 16 }}>YES</span>
            <span style={{ color: '#888888', fontSize: 16 }}>CHEF</span>
          </div>
          <span>/ Back</span>
        </div>
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
        <div style={{ padding: '0 20px' }}>
          {recipe.ingredients.map((ing, idx) => (
            <div key={ing.id || idx} className={`checklist-item${checked[idx] ? ' checked' : ''}`} onClick={() => toggle(idx)}>
              <div className="check-circle">
                {checked[idx] && <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>✓</span>}
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
            {allChecked ? "Let's Cook!" : `${checkedCount} of ${recipe.ingredients.length} confirmed`}
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
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: '#888888', marginBottom: 2 }}>Timer</div>
        <div className={`timer-display${done ? ' done' : ''}`}>{done ? 'Done!' : fmt(seconds)}</div>
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
        <div className="cook-logo">
          <span className="yes">YES</span>
          <span className="chef">CHEF</span>
        </div>
        <div className="cook-dots">
          {steps.map((_, i) => <div key={i} className={`cook-dot${i === stepIdx ? ' active' : i < stepIdx ? ' done' : ''}`} />)}
        </div>
      </div>
      <div className="cook-steps">
        {prev && <div className="cook-prev"><div className="cook-prev-text">{prev.text}</div></div>}
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
  const [cookbooks, setCookbooks] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [screen, setScreen] = useState({ name: 'home' });

  useEffect(() => {
    getCookbooks().then(data => {
      setCookbooks(data);
      setLoading(false);
    });
  }, []);

  const navigate = (name, params = {}) => {
    setScreen({ name, ...params });
    if (name === 'cookbook' && params.cbId && recipesMap[params.cbId] === undefined) {
      setRecipesMap(prev => ({ ...prev, [params.cbId]: null }));
      getRecipes(params.cbId).then(recipes => {
        setRecipesMap(prev => ({ ...prev, [params.cbId]: recipes }));
      });
    }
  };

  const getCookbook = id => {
    const cb = cookbooks.find(c => c.id === id);
    if (!cb) return null;
    return { ...cb, recipes: recipesMap[id] ?? null };
  };

  const getRecipe = (cbId, rId) => (recipesMap[cbId] || []).find(r => r.id === rId);

  const handleNewCookbook = async ({ name, color }) => {
    setSaving(true);
    try {
      const newCb = await createCookbook(name, color);
      setCookbooks(p => [...p, newCb]);
      setRecipesMap(prev => ({ ...prev, [newCb.id]: [] }));
      setScreen({ name: 'cookbook', cbId: newCb.id });
    } finally {
      setSaving(false);
    }
  };

  const handleNewRecipe = async (cbId, data) => {
    setSaving(true);
    try {
      const newRecipe = await createRecipe(cbId, data);
      setRecipesMap(prev => ({ ...prev, [cbId]: [...(prev[cbId] || []), newRecipe] }));
      setCookbooks(prev => prev.map(cb =>
        cb.id === cbId ? { ...cb, recipeCount: (cb.recipeCount || 0) + 1 } : cb
      ));
      setScreen({ name: 'recipe', cbId, rId: newRecipe.id });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkCooked = async (cbId, rId) => {
    await incrementCookedCount(rId);
    setRecipesMap(prev => ({
      ...prev,
      [cbId]: (prev[cbId] || []).map(r =>
        r.id === rId ? { ...r, cookedCount: (r.cookedCount || 0) + 1 } : r
      ),
    }));
    setScreen({ name: 'cookbook', cbId });
  };

  const { name: s, cbId, rId } = screen;
  const cb = cbId ? getCookbook(cbId) : null;
  const recipe = (cbId && rId) ? getRecipe(cbId, rId) : null;

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="loading-screen">
          <div className="loading-logo">
            <span className="yes">YES</span>
            <span className="chef">CHEF</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        {s === 'home' && <HomeScreen cookbooks={cookbooks} onOpenCookbook={id => navigate('cookbook', { cbId: id })} onNewCookbook={() => navigate('new-cookbook')} />}
        {s === 'new-cookbook' && <NewCookbookScreen onBack={() => navigate('home')} onSave={handleNewCookbook} saving={saving} />}
        {s === 'cookbook' && cb && <CookbookScreen cookbook={cb} onBack={() => navigate('home')} onOpenRecipe={rId => navigate('recipe', { cbId, rId })} onNewRecipe={() => navigate('new-recipe', { cbId })} />}
        {s === 'new-recipe' && cb && <NewRecipeScreen onBack={() => navigate('cookbook', { cbId })} onSave={data => handleNewRecipe(cbId, data)} saving={saving} />}
        {s === 'recipe' && cb && recipe && <RecipeDetailScreen recipe={recipe} cookbook={cb} onBack={() => navigate('cookbook', { cbId })} onStartCook={() => navigate('prep', { cbId, rId })} />}
        {s === 'prep' && cb && recipe && <PrepChecklistScreen recipe={recipe} onBack={() => navigate('recipe', { cbId, rId })} onStart={() => navigate('cook', { cbId, rId })} />}
        {s === 'cook' && recipe && <CookModeScreen recipe={recipe} onDone={() => handleMarkCooked(cbId, rId)} />}
      </div>
    </>
  );
}
