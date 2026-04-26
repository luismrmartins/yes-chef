'use client';
import { useState, useEffect, useRef } from 'react';
import {
  getCookbooks, createCookbook, getRecipes, createRecipe, incrementCookedCount,
  toggleFavourite, getFavouriteIds, getFavouriteRecipes,
  addRecipeToCookbook, addToShoppingList, getShoppingList,
  toggleShoppingItem, deleteShoppingItem, clearShoppingList, saveRecipeFeedback,
} from '../lib/db';

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

  body { font-family: 'DM Sans', sans-serif; background: var(--white); color: var(--black); min-height: 100vh; }

  .app { width: 100%; min-height: 100vh; position: relative; overflow-x: hidden; background: var(--white); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 24px; border-radius: 0; border: none; cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; transition: all 0.15s ease;
  }
  .btn-primary { background: var(--red); color: var(--white); }
  .btn-primary:hover { background: #d43200; }
  .btn-primary:disabled { background: var(--gray2); cursor: not-allowed; }
  .btn-red { background: var(--red); color: var(--white); }
  .btn-red:hover { background: #d43200; }
  .btn-black { background: var(--black); color: var(--white); }
  .btn-black:hover { background: #333; }
  .btn-ghost { background: transparent; color: var(--black); border: 2px solid var(--black); }
  .btn-ghost:hover { background: var(--gray); }
  .btn-sm { padding: 8px 16px; font-size: 14px; }
  .btn-full { width: 100%; }

  .screen { min-height: 100vh; display: flex; flex-direction: column; background: var(--white); }
  .safe-top { padding-top: env(safe-area-inset-top, 0px); }

  .page-header { padding: 40px 28px 24px; }
  .page-header.safe-top { padding-top: max(40px, calc(env(safe-area-inset-top, 0px) + 16px)); }
  .page-header-back { display: flex; align-items: center; gap: 0; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; cursor: pointer; margin-bottom: 16px; background: none; border: none; padding: 0; }
  .page-header-back:hover { opacity: 0.7; }
  .page-header-title { font-family: 'Barlow Condensed', sans-serif; font-size: 40px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.92; color: var(--black); }
  .page-header-sub { font-size: 14px; color: #999; margin-top: 8px; }
  .page-header-meta { font-family: 'Courier Prime', monospace; font-size: 12px; letter-spacing: 0.06em; color: #999; margin-top: 8px; }

  .flat-list { display: flex; flex-direction: column; }
  .flat-row { display: flex; align-items: center; padding: 18px 28px; cursor: pointer; border-bottom: 1px solid #EEEEEE; transition: opacity 0.15s; }
  .flat-row:first-child { border-top: 1px solid #EEEEEE; }
  .flat-row:hover { opacity: 0.65; }
  .flat-row-info { flex: 1; min-width: 0; }
  .flat-row-name { font-family: 'Barlow Condensed', sans-serif; font-size: 26px; font-weight: 700; color: var(--black); text-transform: uppercase; letter-spacing: 0.01em; line-height: 1; }
  .flat-row-meta { font-family: 'Courier Prime', monospace; font-size: 12px; color: #999; margin-top: 4px; }
  .flat-row-badge { font-family: 'Courier Prime', monospace; font-size: 11px; color: #999; margin-top: 3px; }
  .flat-row-arrow { color: #CCC; font-size: 18px; flex-shrink: 0; margin-left: 12px; }
  .flat-row-action { display: flex; align-items: center; padding: 18px 28px; cursor: pointer; color: #888; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; gap: 8px; transition: opacity 0.15s; border-top: 1px solid #EEEEEE; }
  .flat-row-action:hover { opacity: 0.7; }

  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--white); }
  .loading-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; font-size: 64px; text-transform: uppercase; letter-spacing: -0.02em; line-height: 0.85; }
  .loading-logo .yes { display: block; color: var(--red); }
  .loading-logo .chef { display: block; color: var(--black); }

  .hero { background: var(--white); color: var(--black); padding: 40px 28px 32px; border-bottom: 1px solid #EEEEEE; }
  .hero-sm { padding: 32px 28px 24px; }
  .hero-label { font-family: 'Courier Prime', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--red); margin-bottom: 8px; font-weight: 700; }
  .hero-title { font-family: 'Barlow Condensed', sans-serif; font-size: 44px; line-height: 0.92; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; color: var(--black); }

  .back-row { display: flex; align-items: center; gap: 8px; padding: 16px 28px; border-bottom: 1px solid #EEEEEE; }
  .back-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--black); font-size: 13px; font-family: 'Barlow Condensed', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .back-btn:hover { color: var(--red); }

  .form-screen { background: var(--white); min-height: 100vh; }
  .form-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 16px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--black); }
  .form-input { padding: 12px 14px; border-radius: 0; border: 2px solid var(--black); font-size: 15px; font-family: 'DM Sans', sans-serif; background: var(--white); outline: none; transition: border-color 0.15s; color: var(--black); }
  .form-input:focus { border-color: var(--red); }
  .form-textarea { resize: vertical; min-height: 80px; }

  .tabs { display: flex; padding: 0 28px; border-bottom: 2px solid var(--black); }
  .tab { padding: 12px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; border: none; background: none; color: var(--gray2); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
  .tab.active { color: var(--black); border-bottom-color: var(--red); }

  .color-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .color-btn { width: 44px; height: 44px; border: 3px solid transparent; cursor: pointer; transition: all 0.1s; }
  .color-btn.selected { border-color: white; box-shadow: 0 0 0 2px var(--black); }

  .dynamic-list { display: flex; flex-direction: column; gap: 10px; }
  .dynamic-item { display: flex; gap: 8px; align-items: flex-start; }
  .remove-btn { padding: 12px 10px; border: none; background: none; cursor: pointer; color: var(--gray2); font-size: 18px; line-height: 1; flex-shrink: 0; }
  .remove-btn:hover { color: var(--red); }

  .cookbook-preview { aspect-ratio: 3/4; max-width: 120px; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; margin: 0 auto; background: var(--black); padding: 14px; }
  .cookbook-preview-name { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; color: white; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1; }

  .detail-hero { background: var(--white); color: var(--black); padding: 32px 28px 0; border-bottom: 1px solid #EEEEEE; }
  .detail-meta { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; padding-bottom: 20px; }
  .detail-meta-item { font-family: 'Courier Prime', monospace; font-size: 12px; color: #999; }

  .recipe-actions { display: flex; border-bottom: 1px solid #EEEEEE; }
  .recipe-action-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 14px 4px; border: none; background: none; cursor: pointer; border-right: 1px solid #EEEEEE; transition: opacity 0.15s; }
  .recipe-action-btn:last-child { border-right: none; }
  .recipe-action-btn:hover { opacity: 0.7; }
  .recipe-action-icon { font-size: 18px; line-height: 1; }
  .recipe-action-label { font-family: 'Courier Prime', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; text-align: center; }
  .recipe-action-btn.active .recipe-action-icon { color: var(--red); }
  .recipe-action-btn.active .recipe-action-label { color: var(--red); }

  .detail-section { padding: 20px 28px; }
  .detail-section h2 { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin-bottom: 12px; }
  .ingredient-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #EEEEEE; font-size: 15px; }
  .ingredient-qty { font-family: 'Courier Prime', monospace; color: #888; font-size: 13px; }
  .step-preview { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #EEEEEE; }
  .step-num { width: 24px; height: 24px; background: var(--red); color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; font-family: 'Courier Prime', monospace; }

  .checklist-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid #EEEEEE; cursor: pointer; transition: all 0.2s; }
  .checklist-item:first-child { border-top: 1px solid #EEEEEE; }
  .checklist-item.checked .ci-name { text-decoration: line-through; color: var(--gray2); }
  .check-circle { width: 22px; height: 22px; border: 2px solid var(--black); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: white; transition: all 0.2s; }
  .checklist-item.checked .check-circle { background: var(--red); border-color: var(--red); }
  .ci-name { font-size: 15px; font-weight: 500; }
  .ci-qty { font-family: 'Courier Prime', monospace; font-size: 12px; color: var(--gray2); margin-top: 1px; }
  .checklist-progress { height: 4px; background: var(--gray2); overflow: hidden; }
  .checklist-progress-fill { height: 100%; background: var(--red); transition: width 0.3s ease; }

  .cook-screen { background: var(--white); min-height: 100vh; display: flex; flex-direction: column; }
  .cook-header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; }
  .cook-logo { font-family: 'Barlow Condensed', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; line-height: 0.85; display: inline-flex; flex-direction: column; align-items: flex-start; }
  .cook-logo .yes { color: var(--red); font-size: 16px; }
  .cook-logo .chef { color: #888; font-size: 16px; }
  .cook-dots { display: flex; gap: 6px; }
  .cook-dot { width: 6px; height: 6px; background: #DDD; transition: all 0.2s; }
  .cook-dot.active { background: var(--red); width: 18px; }
  .cook-dot.done { background: #BBB; }
  .cook-steps { flex: 1; display: flex; flex-direction: column; padding: 0 24px; justify-content: center; }
  .cook-prev { padding: 20px 0 24px; border-bottom: 1px solid #EEEEEE; }
  .cook-prev-text { font-size: 14px; text-decoration: line-through; line-height: 1.5; color: #CCC; }
  .cook-current { padding: 36px 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .cook-step-label { font-family: 'Courier Prime', monospace; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red); margin-bottom: 16px; font-weight: 700; }
  .cook-current-text { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; line-height: 1.05; font-weight: 700; text-transform: uppercase; color: var(--black); }
  .cook-next { padding: 24px 0 20px; border-top: 1px solid #EEEEEE; }
  .cook-next-label { font-family: 'Courier Prime', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #AAA; margin-bottom: 8px; font-weight: 700; }
  .cook-next-text { font-size: 14px; line-height: 1.5; color: #AAA; }
  .cook-footer { padding: 20px 24px 40px; }
  .cook-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .cook-nav-btn { width: 52px; height: 52px; border: 2px solid #DDD; background: transparent; color: var(--black); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.15s; }
  .cook-nav-btn:hover:not(:disabled) { border-color: var(--red); color: var(--red); }
  .cook-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  .timer-widget { background: #FFF5F2; padding: 12px 16px; margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-left: 3px solid var(--red); }
  .timer-display { font-family: 'Courier Prime', monospace; font-size: 28px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--red); }
  .timer-display.done { color: var(--black); }
  .timer-start-btn { padding: 8px 16px; border: 2px solid var(--red); background: transparent; color: var(--red); font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; transition: all 0.15s; }
  .timer-start-btn:hover { background: var(--red); color: white; }
  .timer-start-btn.running { border-color: rgba(251,59,0,0.35); color: rgba(251,59,0,0.35); }

  .done-screen { background: var(--white); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
  .done-title { font-family: 'Barlow Condensed', sans-serif; font-size: 64px; font-weight: 700; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.95; color: var(--black); margin-bottom: 8px; }
  .done-sub { color: #888; font-size: 16px; margin-bottom: 40px; }

  .star-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid #EEEEEE; }
  .star-label { flex: 1; font-size: 15px; color: var(--black); }
  .stars { display: flex; gap: 4px; }
  .star { font-size: 22px; cursor: pointer; color: #DDD; transition: color 0.1s; background: none; border: none; padding: 2px; line-height: 1; }
  .star.filled { color: var(--red); }
  .notes-field { width: 100%; border: none; border-bottom: 2px solid #EEEEEE; padding: 12px 0; font-family: 'DM Sans', sans-serif; font-size: 15px; background: transparent; outline: none; resize: none; min-height: 60px; color: var(--black); }
  .notes-field:focus { border-bottom-color: var(--red); }

  .shopping-group { padding: 0 28px; }
  .shopping-group-header { font-family: 'Courier Prime', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--red); padding: 16px 0 8px; }
  .shopping-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #EEEEEE; cursor: pointer; transition: opacity 0.15s; }
  .shopping-item:hover { opacity: 0.7; }
  .shopping-item.done .shopping-item-name { text-decoration: line-through; color: #CCC; }
  .shopping-item-name { font-size: 15px; flex: 1; min-width: 0; }
  .shopping-item-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .shopping-item-qty { font-family: 'Courier Prime', monospace; font-size: 13px; color: #888; }
  .shopping-item-delete { background: none; border: none; cursor: pointer; color: #CCC; font-size: 17px; padding: 0; line-height: 1; }
  .shopping-item-delete:hover { color: #999; }
  .shopping-item.done .shopping-item-qty { color: #DDD; }

  .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 200; display: flex; align-items: flex-end; }
  .sheet { background: white; width: 100%; max-height: 75vh; overflow-y: auto; }
  .sheet-handle { width: 40px; height: 4px; background: #DDD; border-radius: 2px; margin: 14px auto 4px; }
  .sheet-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 24px 14px; border-bottom: 1px solid #EEEEEE; color: var(--black); }

  .cookbook-shelf { display: flex; overflow-x: auto; gap: 12px; padding: 4px 28px 24px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .cookbook-shelf::-webkit-scrollbar { display: none; }
  .cookbook-card { flex-shrink: 0; width: 140px; height: 180px; display: flex; flex-direction: column; justify-content: flex-end; padding: 14px; cursor: pointer; scroll-snap-align: start; transition: opacity 0.15s; background: transparent; border: 2px solid var(--black); border-radius: 14px; }
  .cookbook-card:hover { opacity: 0.72; }
  .cookbook-card-name { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 700; color: var(--black); text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.1; }
  .cookbook-card-count { font-family: 'Courier Prime', monospace; font-size: 11px; color: #999; margin-top: 5px; }
  .cookbook-card-new { background: transparent; border: 2px dashed #DDD; border-radius: 14px; align-items: center; justify-content: center; gap: 6px; }
  .cookbook-card-new-icon { font-size: 28px; color: #CCC; line-height: 1; }
  .cookbook-card-new-label { font-family: 'Courier Prime', monospace; font-size: 11px; color: #BBB; text-transform: uppercase; letter-spacing: 0.08em; }

  .tag-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .tag-pill { font-family: 'Courier Prime', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 10px; border-radius: 100px; border: 1.5px solid #DDD; color: #888; cursor: pointer; background: transparent; transition: all 0.12s; }
  .tag-pill:hover { border-color: var(--black); color: var(--black); }
  .tag-pill.active { border-color: var(--red); color: var(--red); background: transparent; }
  .tag-pill-display { font-family: 'Courier Prime', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 100px; border: 1.5px solid #DDD; color: #999; }

  .section-label { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #999; padding: 20px 28px 0; }

  .scroll-body { overflow-y: auto; flex: 1; }
  .pb-safe { padding-bottom: 40px; }

  @media (min-width: 520px) {
    .page-header { padding: 48px 36px 28px; }
    .page-header-title { font-size: 52px; }
    .flat-row { padding: 20px 36px; }
    .flat-row-action { padding: 20px 36px; }
    .back-row { padding: 16px 36px; }
    .form-body { padding: 24px 36px; }
    .tabs { padding: 0 36px; }
    .detail-hero { padding: 40px 36px 0; }
    .detail-section { padding: 22px 36px; }
    .shopping-group { padding: 0 36px; }
    .checklist-progress { margin: 8px 36px; }
    .done-screen { padding: 60px 36px; }
    .done-title { font-size: 72px; }
    .home-cb-grid { gap: 8px; }
    .home-section-label { padding: 16px 36px 8px; }
    .home-fav-row { padding: 11px 36px; }
    .home-shopping-header { padding: 0 36px; }
  }

  /* ── Home: cookbook buttons ─────────────────────────── */
  .home-cb-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 28px 4px; }
  .home-cb-btn { font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 18px; border: 1.5px solid var(--black); border-radius: 100px; background: transparent; cursor: pointer; text-align: left; color: var(--black); transition: all 0.12s; display: flex; align-items: baseline; gap: 6px; }
  .home-cb-btn:hover { background: var(--black); color: var(--white); }
  .home-cb-btn:hover .cb-btn-count { color: rgba(255,255,255,0.55); }
  .home-cb-btn.cb-new { border-color: #CCC; border-style: dashed; color: #AAA; }
  .home-cb-btn.cb-new:hover { background: var(--black); color: var(--white); border-color: var(--black); border-style: solid; }
  .cb-btn-count { font-family: 'Courier Prime', monospace; font-size: 10px; color: #999; font-weight: 400; text-transform: none; letter-spacing: 0; }

  /* ── Home: sections ─────────────────────────────────── */
  .home-section { margin-top: 8px; border-top: 1px solid #EEEEEE; }
  .home-section-label { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #999; padding: 16px 28px 8px; }
  .home-fav-row { display: flex; align-items: center; padding: 11px 28px; cursor: pointer; border-bottom: 1px solid #F5F5F5; transition: opacity 0.12s; }
  .home-fav-row:last-child { border-bottom: none; }
  .home-fav-row:hover { opacity: 0.7; }
  .home-fav-name { font-size: 15px; font-weight: 500; color: var(--black); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .home-fav-meta { font-family: 'Courier Prime', monospace; font-size: 11px; color: #BBB; flex-shrink: 0; margin-left: 10px; }
  .home-shopping-header { display: flex; align-items: center; padding: 0 28px; }

  /* ── Two-panel cookbook layout ──────────────────────── */
  .cookbook-layout { display: flex; height: 100vh; overflow: hidden; background: var(--white); }
  .recipe-list-panel { width: 260px; flex-shrink: 0; border-right: 1px solid #EEEEEE; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .recipe-detail-panel { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .list-panel-header { padding: 24px 20px 14px; border-bottom: 1px solid #EEEEEE; flex-shrink: 0; }
  .list-panel-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #999; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 0; margin-bottom: 10px; }
  .list-panel-back:hover { color: var(--black); }
  .list-panel-title { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.01em; color: var(--black); line-height: 1; }
  .list-panel-count { font-family: 'Courier Prime', monospace; font-size: 11px; color: #999; margin-top: 3px; }
  .recipe-list-rows { flex: 1; overflow-y: auto; }
  .recipe-list-row { padding: 11px 20px; cursor: pointer; border-bottom: 1px solid #F5F5F5; transition: all 0.1s; }
  .recipe-list-row:hover { background: #FAFAFA; }
  .recipe-list-row.active { background: #F5F5F5; border-left: 3px solid var(--red); padding-left: 17px; }
  .recipe-list-row-name { font-size: 14px; font-weight: 500; color: var(--black); line-height: 1.25; }
  .recipe-list-row-meta { font-family: 'Courier Prime', monospace; font-size: 10px; color: #BBB; margin-top: 2px; }
  .list-panel-footer { padding: 12px 16px; border-top: 1px solid #EEEEEE; flex-shrink: 0; }
  .detail-empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: #CCC; font-family: 'Courier Prime', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; min-height: 60vh; }
  .panel-mobile-back { display: none; }
  .panel-mobile-back-btn { background: none; border: none; cursor: pointer; font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #888; padding: 14px 28px; display: block; }
  .panel-mobile-back-btn:hover { color: var(--black); }

  @media (max-width: 639px) {
    .cookbook-layout { height: auto; overflow: visible; display: block; }
    .recipe-list-panel { width: 100%; height: auto; overflow: visible; border-right: none; }
    .recipe-detail-panel { display: none; }
    .cookbook-layout.has-detail .recipe-list-panel { display: none; }
    .cookbook-layout.has-detail .recipe-detail-panel { display: flex; flex-direction: column; min-height: 100vh; }
    .panel-mobile-back { display: block; border-bottom: 1px solid #EEEEEE; }
  }
`;

const COOKBOOK_COLORS = ['#111111','#1a1a2e','#1a3a1a','#3a1a1a','#2A6B8C','#5B4FCF','#7A4B9C','#8B1A0A'];
const PRESET_TAGS = ['Vegan', 'Vegetarian', 'Spicy', 'Sweet', 'Quick', 'Comfort', 'Healthy', 'Gluten-free', 'Dairy-free', 'Low-carb'];

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function generateId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function YesChefLogo({ yesColor = 'var(--red)', chefColor = 'var(--black)', size = 18 }) {
  return (
    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: size, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <span style={{ color: yesColor }}>YES</span>
      <span style={{ color: chefColor }}>CHEF</span>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <button key={n} className={`star${value >= n ? ' filled' : ''}`} onClick={() => onChange(n)}>★</button>
      ))}
    </div>
  );
}

const PRIORITY_ORDER = ['today', 'this_week', 'eventually'];
const PRIORITY_LABELS = { today: 'Today', this_week: 'This Week', eventually: 'Eventually' };

function HomeScreen({ cookbooks, favouriteRecipes, shoppingList, onOpenCookbook, onNewCookbook, onOpenRecipe, onToggleShoppingItem, onDeleteShoppingItem, onClearShoppingList }) {
  const byPriority = PRIORITY_ORDER
    .map(p => ({ priority: p, label: PRIORITY_LABELS[p], items: shoppingList.filter(i => (i.priority || 'eventually') === p) }))
    .filter(g => g.items.length > 0);
  const unchecked = shoppingList.filter(i => !i.checked).length;

  return (
    <div className="screen">
      <div className="page-header safe-top">
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 'clamp(40px, 8vw, 60px)', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 0.85 }}>
            <div style={{ color: 'var(--red)' }}>YES</div>
            <div style={{ color: 'var(--black)' }}>CHEF</div>
          </div>
        </div>
        <p className="page-header-sub">What are we cooking today?</p>
      </div>

      <div className="scroll-body pb-safe">
        {/* Cookbook buttons */}
        <div className="home-cb-grid">
          {cookbooks.map(cb => (
            <button key={cb.id} className="home-cb-btn" onClick={() => onOpenCookbook(cb.id)}>
              {cb.name}
              <span className="cb-btn-count">{cb.recipeCount ?? 0}</span>
            </button>
          ))}
          <button className="home-cb-btn cb-new" onClick={onNewCookbook}>+ New</button>
        </div>

        {/* Favourites */}
        {favouriteRecipes.length > 0 && (
          <div className="home-section">
            <div className="home-section-label">Favourites</div>
            {favouriteRecipes.map(r => (
              <div key={r.id} className="home-fav-row" onClick={() => onOpenRecipe(r)}>
                <span className="home-fav-name">{r.name}</span>
                <span className="home-fav-meta">{r.time} min · {r.difficulty}</span>
              </div>
            ))}
          </div>
        )}

        {/* Shopping list */}
        <div className="home-section">
          <div className="home-shopping-header" style={{ paddingTop: 16, paddingBottom: shoppingList.length ? 8 : 0 }}>
            <span className="home-section-label" style={{ padding: 0, flex: 1 }}>Shopping List</span>
            {unchecked > 0 && <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#999' }}>{unchecked} to buy</span>}
          </div>
          {shoppingList.length === 0 ? (
            <div style={{ padding: '8px 28px 28px', fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#CCC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nothing to buy yet</div>
          ) : (
            <>
              {byPriority.map(({ priority, label, items }) => (
                <div key={priority} className="shopping-group">
                  <div className="shopping-group-header">{label}</div>
                  {items.map(item => (
                    <div key={item.id} className={`shopping-item${item.checked ? ' done' : ''}`} onClick={() => onToggleShoppingItem(item.id, item.checked)}>
                      <span className="shopping-item-name">{item.ingredient_name}</span>
                      <div className="shopping-item-right">
                        <span className="shopping-item-qty">{item.qty}</span>
                        <button className="shopping-item-delete" onClick={e => { e.stopPropagation(); onDeleteShoppingItem(item.id); }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ padding: '12px 28px 32px', textAlign: 'center' }}>
                <button onClick={onClearShoppingList} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 12, color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear list</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NewCookbookScreen({ onBack, onSave, saving }) {
  const [name, setName] = useState('');
  return (
    <div className="form-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>
      <div className="form-body scroll-body">
        <div style={{ paddingTop: 12, paddingBottom: 8 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 32, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--black)' }}>New Cookbook</div>
        </div>
        <div className="form-field">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="e.g. Date Night" value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <button className="btn btn-primary btn-full" disabled={!name.trim() || saving} onClick={() => onSave({ name: name.trim() })}>
          {saving ? 'Creating...' : 'Create Cookbook'}
        </button>
      </div>
    </div>
  );
}

function CookbookScreen({ cookbook, onBack, onNewRecipe, onStartCook, favouriteIds, onToggleFavourite, onAddToCookbook, onOpenAddToList, shoppingRecipeIds, initialRecipeId }) {
  const [selectedId, setSelectedId] = useState(initialRecipeId || null);
  const recipes = cookbook.recipes || [];
  const isLoading = cookbook.recipes === null;
  const selectedRecipe = recipes.find(r => r.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId && recipes.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 640) {
      setSelectedId(recipes[0].id);
    }
  }, [recipes.length]);

  return (
    <div className={`cookbook-layout${selectedId ? ' has-detail' : ''}`}>
      {/* Left panel — recipe list */}
      <div className="recipe-list-panel">
        <div className="list-panel-header safe-top">
          <button className="list-panel-back" onClick={onBack}>
            <YesChefLogo chefColor="#999" size={13} />
          </button>
          <div className="list-panel-title">{cookbook.name}</div>
          {!isLoading && <div className="list-panel-count">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</div>}
        </div>
        <div className="recipe-list-rows">
          {isLoading ? (
            <div style={{ padding: '20px', color: '#CCC', fontFamily: "'Courier Prime', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading…</div>
          ) : recipes.length === 0 ? (
            <div style={{ padding: '20px', color: '#CCC', fontFamily: "'Courier Prime', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No recipes yet</div>
          ) : recipes.map(r => (
            <div key={r.id} className={`recipe-list-row${selectedId === r.id ? ' active' : ''}`} onClick={() => setSelectedId(r.id)}>
              <div className="recipe-list-row-name">{r.name}</div>
              <div className="recipe-list-row-meta">
                {r.time} min · {r.difficulty}
                {r.lastCookedAt ? ` · ${timeAgo(r.lastCookedAt)}` : ''}
              </div>
            </div>
          ))}
        </div>
        <div className="list-panel-footer">
          <button className="btn btn-black btn-full" style={{ fontSize: 14, height: 40 }} onClick={onNewRecipe}>+ Add Recipe</button>
        </div>
      </div>

      {/* Right panel — recipe detail */}
      <div className="recipe-detail-panel">
        {selectedRecipe ? (
          <RecipeDetailScreen
            recipe={selectedRecipe}
            cookbook={cookbook}
            onBack={onBack}
            onStartCook={() => onStartCook(selectedId)}
            isFavourite={favouriteIds.has(selectedRecipe.id)}
            onToggleFavourite={onToggleFavourite}
            onAddToCookbook={onAddToCookbook}
            onOpenAddToList={onOpenAddToList}
            inShoppingList={shoppingRecipeIds.has(selectedRecipe.id)}
            mobileBackToList={() => setSelectedId(null)}
          />
        ) : (
          <div className="detail-empty-state">
            {isLoading ? 'Loading…' : recipes.length === 0 ? 'Add your first recipe →' : '← Select a recipe'}
          </div>
        )}
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
  const [tags, setTags] = useState([]);
  const [ingredients, setIngredients] = useState([{ id: generateId(), name: '', qty: '' }]);
  const [steps, setSteps] = useState([{ id: generateId(), text: '', timer: null, hasTimer: false }]);
  const toggleTag = (tag) => setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);

  const addIngredient = () => setIngredients(p => [...p, { id: generateId(), name: '', qty: '' }]);
  const removeIngredient = id => setIngredients(p => p.filter(i => i.id !== id));
  const updateIngredient = (id, field, val) => setIngredients(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addStep = () => setSteps(p => [...p, { id: generateId(), text: '', timer: null, hasTimer: false }]);
  const removeStep = id => setSteps(p => p.filter(s => s.id !== id));
  const updateStep = (id, field, val) => setSteps(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));
  const canSave = name.trim() && ingredients.some(i => i.name.trim()) && steps.some(s => s.text.trim());

  const handleSave = () => onSave({
    name: name.trim(), description: description.trim(),
    time: parseInt(time) || 30, difficulty, servings, tags,
    ingredients: ingredients.filter(i => i.name.trim()),
    steps: steps.filter(s => s.text.trim()).map(s => ({ ...s, timer: s.hasTimer ? (parseInt(s.timer) || null) : null })),
  });

  return (
    <div className="form-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <button className="btn btn-red btn-sm" style={{ marginLeft: 'auto' }} disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div style={{ padding: '0 28px 12px', borderBottom: '2px solid var(--black)' }}>
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
          <div className="form-field">
            <label className="form-label">Tags</label>
            <div className="tag-pills">
              {PRESET_TAGS.map(tag => (
                <button key={tag} className={`tag-pill${tags.includes(tag) ? ' active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#888' }}>
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

function RecipeDetailScreen({ recipe, cookbook, onBack, onStartCook, isFavourite, onToggleFavourite, onAddToCookbook, onOpenAddToList, inShoppingList, mobileBackToList }) {

  return (
    <div className="screen">
      {mobileBackToList && (
        <div className="panel-mobile-back">
          <button className="panel-mobile-back-btn" onClick={mobileBackToList}>← Recipes</button>
        </div>
      )}
      <div className="detail-hero safe-top">
        <div style={{ marginBottom: 12, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>
          <YesChefLogo chefColor="#888" size={16} />
          <span>/ {cookbook.name}</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', fontSize: 40, color: 'var(--black)', lineHeight: 0.95, letterSpacing: '0.01em' }}>{recipe.name}</h1>
        {recipe.description && <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>{recipe.description}</p>}
        {recipe.tags?.length > 0 && (
          <div className="tag-pills" style={{ marginTop: 10 }}>
            {recipe.tags.map(tag => <span key={tag} className="tag-pill-display">{tag}</span>)}
          </div>
        )}
        <div className="detail-meta">
          <span className="detail-meta-item">{recipe.time} min</span>
          <span className="detail-meta-item">{recipe.difficulty}</span>
          <span className="detail-meta-item">{recipe.servings} servings</span>
          {recipe.cookedCount > 0 && <span className="detail-meta-item">Cooked {recipe.cookedCount}×</span>}
          {recipe.lastCookedAt
            ? <span className="detail-meta-item">Last cooked {timeAgo(recipe.lastCookedAt)}</span>
            : <span className="detail-meta-item" style={{ color: '#CCC' }}>Never cooked</span>
          }
        </div>
      </div>

      <div className="recipe-actions">
        <button className={`recipe-action-btn${isFavourite ? ' active' : ''}`} onClick={() => onToggleFavourite(recipe.id)}>
          <span className="recipe-action-icon" style={isFavourite ? { color: 'var(--red)' } : {}}>{isFavourite ? '♥' : '♡'}</span>
          <span className="recipe-action-label">Favourite</span>
        </button>
        <button className="recipe-action-btn" onClick={() => onAddToCookbook(recipe.id, cookbook.id)}>
          <span className="recipe-action-icon">＋</span>
          <span className="recipe-action-label">Add to Cookbook</span>
        </button>
        <button className={`recipe-action-btn${inShoppingList ? ' active' : ''}`} onClick={() => !inShoppingList && onOpenAddToList(recipe)}>
          <span className="recipe-action-icon" style={inShoppingList ? { color: 'var(--red)' } : {}}>{inShoppingList ? '✓' : '+'}</span>
          <span className="recipe-action-label">{inShoppingList ? 'On List' : 'Add to List'}</span>
        </button>
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
                {step.timer && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, fontFamily: "'Courier Prime', monospace" }}>{step.timer} min timer</div>}
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

function AddToCookbookSheet({ cookbooks, currentCbId, onSelect, onClose }) {
  const available = cookbooks.filter(cb => cb.id !== currentCbId && cb.id !== 'favourites');
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Add to Cookbook</div>
        <div className="flat-list">
          {available.map(cb => (
            <div key={cb.id} className="flat-row" onClick={() => onSelect(cb.id)}>
              <div className="flat-row-info">
                <div className="flat-row-name">{cb.name}</div>
              </div>
              <span className="flat-row-arrow">›</span>
            </div>
          ))}
          <div className="flat-row-action" onClick={() => onSelect('new')}>
            <span>+</span><span>New Cookbook</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddToListSheet({ recipe, onSelect, onClose }) {
  const options = [
    { value: 'today', label: 'Today', sub: 'Shopping today' },
    { value: 'this_week', label: 'This Week', sub: 'Planning ahead' },
    { value: 'eventually', label: 'Eventually', sub: 'Someday soon' },
  ];
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">When are you cooking this?</div>
        {options.map(({ value, label, sub }) => (
          <div key={value} className="flat-row" onClick={() => onSelect(value)}>
            <div className="flat-row-info">
              <div className="flat-row-name">{label}</div>
              <div className="flat-row-meta">{sub}</div>
            </div>
            <span className="flat-row-arrow">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrepChecklistScreen({ recipe, onBack, onStart }) {
  const [checked, setChecked] = useState({});
  const [servings, setServings] = useState(recipe.servings);
  const [showWarning, setShowWarning] = useState(false);
  const scale = servings / recipe.servings;
  const toggle = idx => { setChecked(p => ({ ...p, [idx]: !p[idx] })); setShowWarning(false); };
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
        <div style={{ marginBottom: 12, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }} onClick={onBack}>
          <YesChefLogo chefColor="#888" size={16} />
          <span>/ Back</span>
        </div>
        <div className="hero-label">Before we start</div>
        <h1 className="hero-title">Grab your<br/>ingredients</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px', borderBottom: '1px solid #EEEEEE' }}>
        <span style={{ fontSize: 13, color: '#888', flex: 1, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Servings</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ width: 32, height: 32, border: '2px solid var(--black)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", minWidth: 20, textAlign: 'center' }}>{servings}</span>
          <button style={{ width: 32, height: 32, border: '2px solid var(--black)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setServings(s => s + 1)}>+</button>
        </div>
      </div>
      <div className="checklist-progress" style={{ margin: '8px 20px' }}>
        <div className="checklist-progress-fill" style={{ width: `${(checkedCount / recipe.ingredients.length) * 100}%` }} />
      </div>
      <div className="scroll-body">
        <div style={{ padding: '12px 20px' }}>
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
          {showWarning ? (
            <div style={{ background: '#FFF5F2', borderLeft: '3px solid var(--red)', padding: '16px', marginBottom: 12 }}>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--black)', marginBottom: 14 }}>
                It looks like you haven't confirmed all your ingredients. Do you still want to continue?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ flex: 1, height: 44, fontSize: 15 }} onClick={() => onStart(servings)}>Continue anyway</button>
                <button className="btn btn-ghost" style={{ flex: 1, height: 44, fontSize: 15 }} onClick={() => setShowWarning(false)}>Go back</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} onClick={() => allChecked ? onStart(servings) : setShowWarning(true)}>
              {allChecked ? "Let's Cook!" : `${checkedCount} of ${recipe.ingredients.length} confirmed`}
            </button>
          )}
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
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Courier Prime', monospace", fontWeight: 700, color: '#888', marginBottom: 2 }}>Timer</div>
        <div className={`timer-display${done ? ' done' : ''}`}>{done ? 'Done!' : fmt(seconds)}</div>
      </div>
      <button className={`timer-start-btn${running ? ' running' : ''}`} onClick={toggle}>
        {done ? 'Reset' : running ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}

function CookModeScreen({ recipe, onFinish }) {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = recipe.steps;
  const current = steps[stepIdx];
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;
  const next = stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;

  return (
    <div className="cook-screen">
      <div className="cook-header safe-top">
        <div className="cook-logo"><span className="yes">YES</span><span className="chef">CHEF</span></div>
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
            <button className="btn btn-red btn-full" onClick={() => stepIdx === steps.length - 1 ? onFinish() : setStepIdx(i => i + 1)}>
              {stepIdx === steps.length - 1 ? 'Finish →' : 'Next step →'}
            </button>
          </div>
          <div style={{ width: 52 }} />
        </div>
      </div>
    </div>
  );
}

function DoneScreen({ recipe, onContinue }) {
  return (
    <div className="done-screen">
      <h1 className="done-title">Bon<br/>appétit!</h1>
      <p className="done-sub">{recipe.name} is ready.</p>
      <button className="btn btn-black" style={{ width: '100%', maxWidth: 280, height: 52, fontSize: 18 }} onClick={onContinue}>
        How did it go? →
      </button>
    </div>
  );
}

function FeedbackScreen({ recipe, onSave, onSkip }) {
  const [ease, setEase] = useState(0);
  const [taste, setTaste] = useState(0);
  const [overall, setOverall] = useState(0);
  const [notes, setNotes] = useState('');

  return (
    <div className="screen">
      <div style={{ padding: '48px 24px 32px' }} className="safe-top">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 'clamp(48px, 10vw, 72px)', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 0.92, color: 'var(--black)' }}>How did<br/>it go?</h1>
        <p style={{ fontSize: 15, color: '#888', marginTop: 10 }}>Quick feedback on your cook</p>
      </div>
      <div className="scroll-body pb-safe" style={{ padding: '0 24px' }}>
        <div style={{ borderTop: '1px solid #EEEEEE' }}>
          {[['Ease of cooking', ease, setEase], ['Taste', taste, setTaste], ['Overall score', overall, setOverall]].map(([label, val, set]) => (
            <div key={label} className="star-row">
              <span className="star-label">{label}</span>
              <StarRating value={val} onChange={set} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--black)', marginBottom: 8 }}>Any notes?</div>
          <textarea className="notes-field" placeholder="What would you do differently next time?" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} onClick={() => onSave(ease, taste, overall, notes)}>
            Save feedback
          </button>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Courier Prime', monospace", fontSize: 13, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0' }}>
            Skip
          </button>
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
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [favouriteRecipes, setFavouriteRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [pendingAddRecipeId, setPendingAddRecipeId] = useState(null);

  useEffect(() => {
    Promise.all([getCookbooks(), getFavouriteIds(), getFavouriteRecipes(), getShoppingList()])
      .then(([cbs, favIds, favRecs, shop]) => {
        setCookbooks(cbs);
        setFavouriteIds(new Set(favIds));
        setFavouriteRecipes(favRecs);
        setShoppingList(shop);
        setLoading(false);
      });
  }, []);

  const navigate = (name, params = {}) => {
    setScreen({ name, ...params });
    if (name === 'cookbook' && params.cbId) {
      if (params.cbId === 'favourites' && recipesMap['favourites'] === undefined) {
        setRecipesMap(prev => ({ ...prev, favourites: null }));
        getFavouriteRecipes().then(recipes => setRecipesMap(prev => ({ ...prev, favourites: recipes })));
      } else if (params.cbId !== 'favourites' && recipesMap[params.cbId] === undefined) {
        setRecipesMap(prev => ({ ...prev, [params.cbId]: null }));
        getRecipes(params.cbId).then(recipes => setRecipesMap(prev => ({ ...prev, [params.cbId]: recipes })));
      }
    }
  };

  const getCookbook = id => {
    if (id === 'favourites') return { id: 'favourites', name: 'Favourites', isFavourites: true, recipes: recipesMap['favourites'] ?? null };
    const cb = cookbooks.find(c => c.id === id);
    if (!cb) return null;
    return { ...cb, recipes: recipesMap[id] ?? null };
  };

  const getRecipe = (cbId, rId) => (recipesMap[cbId] || []).find(r => r.id === rId);

  const handleNewCookbook = async ({ name }) => {
    setSaving(true);
    try {
      const newCb = await createCookbook(name, null);
      setCookbooks(p => [...p, newCb]);
      if (pendingAddRecipeId) {
        await addRecipeToCookbook(pendingAddRecipeId, newCb.id);
        setPendingAddRecipeId(null);
        setRecipesMap(prev => ({ ...prev, [newCb.id]: null }));
        getRecipes(newCb.id).then(recipes => setRecipesMap(prev => ({ ...prev, [newCb.id]: recipes })));
      } else {
        setRecipesMap(prev => ({ ...prev, [newCb.id]: [] }));
      }
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
      setCookbooks(prev => prev.map(cb => cb.id === cbId ? { ...cb, recipeCount: (cb.recipeCount || 0) + 1 } : cb));
      setScreen({ name: 'recipe', cbId, rId: newRecipe.id });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavourite = async (recipeId) => {
    const isNowFav = await toggleFavourite(recipeId);
    setFavouriteIds(prev => {
      const next = new Set(prev);
      isNowFav ? next.add(recipeId) : next.delete(recipeId);
      return next;
    });
    if (isNowFav) {
      let found = null;
      for (const recipes of Object.values(recipesMap)) {
        if (Array.isArray(recipes)) { found = recipes.find(r => r.id === recipeId); if (found) break; }
      }
      if (found) setFavouriteRecipes(prev => [...prev, found]);
    } else {
      setFavouriteRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
    setRecipesMap(prev => ({ ...prev, favourites: undefined }));
  };

  const handleOpenAddToCookbook = (recipeId, currentCbId) => {
    setSheet({ type: 'addToCookbook', recipeId, currentCbId });
  };

  const handleSelectCookbookForAdd = async (cookbookId) => {
    const recipeId = sheet.recipeId;
    setSheet(null);
    if (cookbookId === 'new') {
      setPendingAddRecipeId(recipeId);
      navigate('new-cookbook');
      return;
    }
    await addRecipeToCookbook(recipeId, cookbookId);
    setRecipesMap(prev => ({ ...prev, [cookbookId]: undefined }));
  };

  const handleOpenAddToList = (recipe) => {
    setSheet({ type: 'addToList', recipe });
  };

  const handleAddToShoppingList = async (recipe, priority) => {
    await addToShoppingList(recipe.id, recipe.name, recipe.ingredients, priority);
    const updated = await getShoppingList();
    setShoppingList(updated);
    setSheet(null);
  };

  const handleToggleShoppingItem = async (id, currentChecked) => {
    setShoppingList(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    await toggleShoppingItem(id, currentChecked);
  };

  const handleDeleteShoppingItem = async (id) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
    await deleteShoppingItem(id);
  };

  const handleClearShoppingList = async () => {
    setShoppingList([]);
    await clearShoppingList();
  };

  const handleFinishCook = async (cbId, rId) => {
    const now = new Date().toISOString();
    await incrementCookedCount(rId);
    setRecipesMap(prev => ({
      ...prev,
      [cbId]: (prev[cbId] || []).map(r => r.id === rId ? { ...r, cookedCount: (r.cookedCount || 0) + 1, lastCookedAt: now } : r),
    }));
    navigate('done', { cbId, rId });
  };

  const handleSaveFeedback = async (cbId, rId, ease, taste, overall, notes) => {
    await saveRecipeFeedback(rId, ease, taste, overall, notes);
    navigate('recipe', { cbId, rId });
  };

  const { name: s, cbId, rId } = screen;
  const cb = cbId ? getCookbook(cbId) : null;
  const recipe = (cbId && rId) ? getRecipe(cbId, rId) : null;
  const shoppingRecipeIds = new Set(shoppingList.map(i => i.recipe_id).filter(Boolean));

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="loading-screen">
          <div className="loading-logo"><span className="yes">YES</span><span className="chef">CHEF</span></div>
        </div>
      </>
    );
  }

  const handleOpenRecipe = (recipe) => {
    navigate('cookbook', { cbId: recipe.cookbookId, rId: recipe.id });
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        {s === 'home' && (
          <HomeScreen
            cookbooks={cookbooks}
            favouriteRecipes={favouriteRecipes}
            shoppingList={shoppingList}
            onOpenCookbook={id => navigate('cookbook', { cbId: id })}
            onNewCookbook={() => navigate('new-cookbook')}
            onOpenRecipe={handleOpenRecipe}
            onToggleShoppingItem={handleToggleShoppingItem}
            onDeleteShoppingItem={handleDeleteShoppingItem}
            onClearShoppingList={handleClearShoppingList}
          />
        )}
        {s === 'new-cookbook' && <NewCookbookScreen onBack={() => navigate('home')} onSave={handleNewCookbook} saving={saving} />}
        {s === 'cookbook' && cb && (
          <CookbookScreen
            cookbook={cb}
            onBack={() => navigate('home')}
            onNewRecipe={() => navigate('new-recipe', { cbId })}
            onStartCook={(rId) => navigate('prep', { cbId: cb.id, rId })}
            favouriteIds={favouriteIds}
            onToggleFavourite={handleToggleFavourite}
            onAddToCookbook={handleOpenAddToCookbook}
            onOpenAddToList={handleOpenAddToList}
            shoppingRecipeIds={shoppingRecipeIds}
            initialRecipeId={rId || null}
          />
        )}
        {s === 'new-recipe' && cb && <NewRecipeScreen onBack={() => navigate('cookbook', { cbId })} onSave={data => handleNewRecipe(cbId, data)} saving={saving} />}
        {s === 'recipe' && cb && recipe && (
          <RecipeDetailScreen
            recipe={recipe} cookbook={cb}
            onBack={() => navigate('cookbook', { cbId, rId })}
            onStartCook={() => navigate('prep', { cbId, rId })}
            isFavourite={favouriteIds.has(recipe.id)}
            onToggleFavourite={handleToggleFavourite}
            onAddToCookbook={handleOpenAddToCookbook}
            onOpenAddToList={handleOpenAddToList}
            inShoppingList={shoppingRecipeIds.has(recipe.id)}
          />
        )}
        {s === 'prep' && cb && recipe && <PrepChecklistScreen recipe={recipe} onBack={() => navigate('recipe', { cbId, rId })} onStart={() => navigate('cook', { cbId, rId })} />}
        {s === 'cook' && recipe && <CookModeScreen recipe={recipe} onFinish={() => handleFinishCook(cbId, rId)} />}
        {s === 'done' && recipe && <DoneScreen recipe={recipe} onContinue={() => navigate('feedback', { cbId, rId })} />}
        {s === 'feedback' && recipe && <FeedbackScreen recipe={recipe} onSave={(e, t, o, n) => handleSaveFeedback(cbId, rId, e, t, o, n)} onSkip={() => navigate('recipe', { cbId, rId })} />}

        {sheet?.type === 'addToCookbook' && (
          <AddToCookbookSheet cookbooks={cookbooks} currentCbId={sheet.currentCbId} onSelect={handleSelectCookbookForAdd} onClose={() => setSheet(null)} />
        )}
        {sheet?.type === 'addToList' && (
          <AddToListSheet recipe={sheet.recipe} onSelect={(priority) => handleAddToShoppingList(sheet.recipe, priority)} onClose={() => setSheet(null)} />
        )}
      </div>
    </>
  );
}
