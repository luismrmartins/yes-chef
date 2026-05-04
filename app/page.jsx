'use client';
import { useState, useEffect, useRef } from 'react';
import {
  getCookbooks, createCookbook, getRecipes, createRecipe, updateRecipe, incrementCookedCount,
  toggleFavourite, getFavouriteIds, getFavouriteRecipes,
  addRecipeToCookbook, addToShoppingList, getShoppingList,
  toggleShoppingItem, deleteShoppingItem, clearShoppingList, saveRecipeFeedback,
  getProfile, saveProfile,
  createEvent, getTimeline, toggleLike, getUserPublicProfile, uploadPostPhoto,
  getDiscoverPeople, getPeopleFollowingMeNotFollowedBack, searchUsers,
  followUser, unfollowUser, getFollowingIds,
  toggleRecipeLike, getRecipeLikes, getRecipeComments, addRecipeComment, deleteRecipeComment,
  setRecipePublic, copyRecipeToMyCookbook, getPublicRecipeDetail,
} from '../lib/db';
import { supabase } from '../lib/supabase';

const STYLES = `

  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --paper: #F5F3EF;
    --surface: #EDEAE4;
    --rule: #D8D4CC;
    --text-muted: #9A9590;
    --text-secondary: #6A6560;
    --text-primary: #1E1C1A;
    --ink: #0F0E0C;
    --blue: #1B4FD8;
    --blue-dark: #1240B0;
    --blue-pale: #E8EEFB;
    --white: #FFFFFF;
  }

  body { font-family: 'DM Mono', monospace; background: var(--paper); color: var(--text-primary); font-weight: 300; }
  .app { width: 100%; min-height: 100vh; position: relative; overflow-x: hidden; background: var(--paper); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 16px 24px; border-radius: 0; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
    letter-spacing: 0.12em; text-transform: uppercase; transition: all 0.15s ease;
  }
  .btn-primary { background: var(--blue); color: var(--white); border: none; }
  .btn-primary:hover { background: var(--blue-dark); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-red { background: var(--blue); color: var(--white); border: none; }
  .btn-red:hover { background: var(--blue-dark); }
  .btn-black { background: var(--ink); color: var(--white); border: none; }
  .btn-black:hover { opacity: 0.85; }
  .btn-ghost { background: transparent; color: var(--text-primary); border: 1px solid var(--text-primary); }
  .btn-ghost:hover { background: var(--surface); }
  .btn-sm { padding: 10px 16px; font-size: 10px; }
  .btn-full { width: 100%; }

  .screen { min-height: 100vh; display: flex; flex-direction: column; background: var(--paper); }
  .safe-top { padding-top: env(safe-area-inset-top, 0px); }

  .page-header { padding: 48px 28px 24px; border-bottom: 1px solid var(--rule); }
  .page-header.safe-top { padding-top: max(48px, calc(env(safe-area-inset-top, 0px) + 24px)); }
  .page-header-back { display: flex; align-items: center; gap: 0; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); cursor: pointer; margin-bottom: 20px; background: none; border: none; padding: 0; }
  .page-header-back:hover { color: var(--text-primary); }
  .page-header-title { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-muted); }
  .page-header-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 8px; font-weight: 300; }
  .page-header-meta { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.04em; color: var(--text-muted); margin-top: 8px; }

  .flat-list { display: flex; flex-direction: column; }
  .flat-row { display: flex; align-items: center; padding: 14px 28px; cursor: pointer; border-bottom: 1px solid var(--rule); transition: background 0.1s; }
  .flat-row:first-child { border-top: 1px solid var(--rule); }
  .flat-row:hover { background: var(--surface); }
  .flat-row-info { flex: 1; min-width: 0; }
  .flat-row-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 400; color: var(--text-primary); letter-spacing: 0.02em; line-height: 1.4; }
  .flat-row-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 300; }
  .flat-row-badge { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 300; }
  .flat-row-arrow { color: var(--rule); font-size: 14px; flex-shrink: 0; margin-left: 12px; }
  .flat-row-action { display: flex; align-items: center; padding: 14px 28px; cursor: pointer; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; gap: 8px; transition: all 0.15s; border-top: 1px solid var(--rule); }
  .flat-row-action:hover { color: var(--text-primary); }

  .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--paper); }
  .loading-logo { font-family: 'DM Mono', monospace; font-weight: 400; font-size: 14px; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1; color: var(--blue); }

  .hero { background: var(--paper); color: var(--text-primary); padding: 40px 28px 32px; border-bottom: 1px solid var(--rule); }
  .hero-sm { padding: 32px 28px 24px; }
  .hero-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
  .hero-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; line-height: 1.25; font-weight: 400; font-style: italic; letter-spacing: 0.01em; color: var(--text-primary); }

  .back-row { display: flex; align-items: center; gap: 8px; padding: 16px 28px; border-bottom: 1px solid var(--rule); }
  .back-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 10px; font-family: 'DM Mono', monospace; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; }
  .back-btn:hover { color: var(--text-primary); }

  .form-screen { background: var(--paper); min-height: 100vh; }
  .form-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; }
  .form-field { display: flex; flex-direction: column; gap: 8px; }
  .form-label { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); }
  .form-input { padding: 10px 0; border-radius: 0; border: none; border-bottom: 1px solid var(--rule); font-size: 13px; font-family: 'DM Mono', monospace; font-weight: 300; background: transparent; outline: none; transition: border-color 0.15s; color: var(--text-primary); letter-spacing: 0.02em; }
  .form-input:focus { border-bottom-color: var(--blue); }
  .form-textarea { resize: vertical; min-height: 80px; }

  .tabs { display: flex; padding: 0 28px; border-bottom: 1px solid var(--rule); }
  .tab { padding: 12px 16px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer; border: none; background: none; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
  .tab.active { color: var(--text-primary); border-bottom-color: var(--blue); }

  .color-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .color-btn { width: 36px; height: 36px; border: 2px solid transparent; cursor: pointer; transition: all 0.1s; border-radius: 0; }
  .color-btn.selected { border-color: white; box-shadow: 0 0 0 1px var(--text-primary); }

  .dynamic-list { display: flex; flex-direction: column; gap: 10px; }
  .dynamic-item { display: flex; gap: 8px; align-items: flex-start; }
  .remove-btn { padding: 12px 8px; border: none; background: none; cursor: pointer; color: var(--text-muted); font-size: 16px; line-height: 1; flex-shrink: 0; }
  .remove-btn:hover { color: var(--text-primary); }

  .cookbook-preview { aspect-ratio: 3/4; max-width: 120px; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; margin: 0 auto; background: var(--ink); padding: 14px; }
  .cookbook-preview-name { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 400; color: white; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.4; }

  .detail-hero { background: var(--paper); color: var(--text-primary); padding: 32px 28px 0; border-bottom: 1px solid var(--rule); }
  .detail-meta { display: flex; gap: 20px; margin-top: 12px; flex-wrap: wrap; padding-bottom: 20px; }
  .detail-meta-item { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }

  .recipe-actions { display: flex; border-bottom: 1px solid var(--rule); }
  .recipe-action-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 14px 4px; border: none; background: none; cursor: pointer; border-right: 1px solid var(--rule); transition: background 0.1s; }
  .recipe-action-btn:last-child { border-right: none; }
  .recipe-action-btn:hover { background: var(--surface); }
  .recipe-action-icon { font-size: 16px; line-height: 1; color: var(--text-muted); }
  .recipe-action-label { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); text-align: center; }
  .recipe-action-btn.active .recipe-action-icon { color: var(--blue); }
  .recipe-action-btn.active .recipe-action-label { color: var(--blue); }

  .detail-section { padding: 20px 28px; border-bottom: 1px solid var(--rule); }
  .detail-section h2 { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px; }
  .ingredient-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--rule); font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; letter-spacing: 0.02em; }
  .ingredient-qty { font-family: 'DM Mono', monospace; color: var(--text-muted); font-size: 11px; font-weight: 400; }
  .step-preview { display: flex; gap: 20px; padding: 12px 0; border-bottom: 1px solid var(--rule); }
  .step-num { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; color: var(--text-muted); width: 20px; flex-shrink: 0; margin-top: 3px; letter-spacing: 0.04em; }

  .checklist-item { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--rule); cursor: pointer; transition: all 0.15s; }
  .checklist-item:first-child { border-top: 1px solid var(--rule); }
  .checklist-item.checked .ci-name { text-decoration: line-through; color: var(--text-muted); }
  .check-circle { width: 14px; height: 14px; border: 1px solid var(--rule); display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: transparent; transition: all 0.15s; border-radius: 0; }
  .checklist-item.checked .check-circle { background: var(--blue); border-color: var(--blue); }
  .ci-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; letter-spacing: 0.02em; }
  .ci-qty { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .checklist-progress { height: 1px; background: var(--rule); overflow: hidden; }
  .checklist-progress-fill { height: 100%; background: var(--blue); transition: width 0.3s ease; }

  .cook-screen { background: var(--ink); min-height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; }
  .timers-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(300px, 88vw); background: var(--ink); border-left: 1px solid #252320; z-index: 50; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.22s cubic-bezier(.4,0,.2,1); }
  .timers-drawer.open { transform: translateX(0); }
  .ingr-drawer { position: absolute; top: 0; left: 0; bottom: 0; width: min(300px, 88vw); background: var(--ink); border-right: 1px solid #252320; z-index: 50; display: flex; flex-direction: column; transform: translateX(-100%); transition: transform 0.22s cubic-bezier(.4,0,.2,1); }
  .ingr-drawer.open { transform: translateX(0); }
  .timers-drawer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); z-index: 49; }
  .timers-drawer-head { padding: 20px 20px 14px; border-bottom: 1px solid #252320; display: flex; align-items: center; justify-content: space-between; }
  .timers-drawer-title { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.14em; color: #4A4845; }
  .timers-drawer-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #4A4845; padding: 0 4px; line-height: 1; }
  .timers-drawer-close:hover { color: #F5F3EF; }
  .timers-drawer-body { flex: 1; overflow-y: auto; }
  .timers-drawer-empty { padding: 40px 20px; text-align: center; color: #3A3835; font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; line-height: 2; }
  .cook-header { padding: 20px 20px 0; display: flex; align-items: center; justify-content: space-between; }
  .cook-dots { display: flex; gap: 4px; align-items: center; }
  .cook-dot { width: 4px; height: 4px; background: #252320; transition: all 0.2s; }
  .cook-dot.active { background: var(--blue); width: 14px; }
  .cook-dot.done { background: #3A3835; }
  .cook-steps { flex: 1; display: flex; flex-direction: column; padding: 0 28px; justify-content: center; }
  .cook-prev { padding: 20px 0 24px; border-bottom: 1px solid #252320; }
  .cook-prev-text { font-family: 'DM Mono', monospace; font-size: 14px; text-decoration: line-through; line-height: 1.6; color: #3A3835; font-weight: 300; letter-spacing: 0.02em; }
  .cook-current { padding: 36px 0; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .cook-step-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #4A4845; margin-bottom: 20px; }
  .cook-current-text { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 6vw, 38px); line-height: 1.55; font-weight: 300; font-style: italic; color: #F5F3EF; }
  .cook-next { padding: 24px 0 20px; border-top: 1px solid #252320; }
  .cook-next-label { font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #4A4845; margin-bottom: 10px; }
  .cook-next-text { font-family: 'DM Mono', monospace; font-size: 14px; line-height: 1.6; color: #3A3835; font-weight: 300; letter-spacing: 0.02em; }
  .cook-footer { padding: 20px 28px 40px; }
  .cook-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .cook-nav-btn { flex: 1; height: 44px; border: 1px solid #3A3835; background: transparent; color: #9A9590; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; font-family: 'DM Mono', monospace; font-weight: 300; transition: all 0.15s; border-radius: 0; }
  .cook-nav-btn:last-child { border-color: #F5F3EF; color: #F5F3EF; }
  .cook-nav-btn:hover:not(:disabled) { background: rgba(245,243,239,0.05); }
  .cook-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  .input-mode-toggle { display: flex; gap: 0; margin-bottom: 10px; border: 1px solid var(--rule); align-self: flex-start; }
  .input-mode-btn { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; padding: 6px 14px; border: none; background: none; cursor: pointer; color: var(--text-muted); transition: all 0.15s; }
  .input-mode-btn.active { background: var(--ink); color: var(--white); }
  .paste-hint { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); letter-spacing: 0.04em; }

  .profile-avatar { width: 30px; height: 30px; border-radius: 0; background: var(--surface); color: var(--text-muted); font-family: 'DM Mono', monospace; font-weight: 400; font-size: 11px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--rule); cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
  .profile-avatar:hover { background: var(--rule); }
  .unit-toggle { display: flex; border: 1px solid var(--rule); overflow: hidden; }
  .unit-btn { flex: 1; padding: 10px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; border: none; cursor: pointer; background: transparent; color: var(--text-muted); transition: all 0.15s; }
  .unit-btn.active { background: var(--ink); color: var(--white); }
  .logout-btn { display: flex; align-items: center; gap: 10px; padding: 16px 28px; border: none; background: none; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); border-top: 1px solid var(--rule); width: 100%; transition: color 0.15s; }
  .logout-btn:hover { color: var(--text-primary); }

  .auth-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 28px; background: var(--paper); }
  .auth-card { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 14px; }
  .auth-tabs { display: flex; border-bottom: 1px solid var(--rule); margin-bottom: 8px; }
  .auth-tab { flex: 1; padding: 10px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; cursor: pointer; border: none; background: none; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
  .auth-tab.active { color: var(--text-primary); border-bottom-color: var(--blue); }
  .auth-error { font-size: 11px; color: var(--text-primary); font-family: 'DM Mono', monospace; padding: 10px 12px; border: 1px solid var(--rule); background: var(--surface); letter-spacing: 0.02em; }

  .timer-widget { background: transparent; padding: 14px 0; margin-top: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
  .timer-display { font-family: 'DM Mono', monospace; font-size: 28px; font-weight: 400; font-variant-numeric: tabular-nums; color: var(--blue); }
  .timer-display.done { color: var(--text-primary); }
  .timer-start-btn { padding: 8px 14px; border: 1px solid var(--rule); background: transparent; color: var(--text-muted); font-size: 10px; font-weight: 400; cursor: pointer; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.12em; transition: all 0.15s; border-radius: 0; }
  .timer-start-btn:hover { background: var(--blue); color: white; border-color: var(--blue); }
  .timer-start-btn.running { background: var(--blue); color: white; border-color: var(--blue); }

  .cook-timer-btn { position: relative; background: none; border: 1px solid #3A3835; padding: 4px 10px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; flex-shrink: 0; transition: all 0.15s; color: #9A9590; border-radius: 0; }
  .cook-timer-btn.has-timers { border-color: var(--blue); color: var(--blue); }
  .cook-timer-badge { position: absolute; top: -6px; right: -6px; background: var(--blue); color: white; width: 14px; height: 14px; font-size: 9px; display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-weight: 400; border-radius: 0; }
  .timers-panel { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }
  .timers-panel-head { padding: 20px 28px 14px; border-bottom: 1px solid #252320; font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.14em; color: #4A4845; }
  .timers-empty { text-align: center; color: #3A3835; font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; padding: 60px 28px; line-height: 2; }
  .timer-row { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #252320; }
  .timer-row-info { flex: 1; min-width: 0; }
  .timer-row-step { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--blue); font-weight: 400; margin-bottom: 4px; }
  .timer-row-label { font-family: 'DM Mono', monospace; font-size: 11px; color: #3A3835; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-weight: 300; letter-spacing: 0.02em; }
  .timer-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .timer-row-display { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 400; font-variant-numeric: tabular-nums; color: #F5F3EF; line-height: 1; }
  .timer-row-display.done { color: var(--blue); }
  .timer-row-actions { display: flex; gap: 6px; }
  .timer-row-ctrl { padding: 4px 10px; border: 1px solid #3A3835; background: none; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.15s; color: #9A9590; border-radius: 0; }
  .timer-row-ctrl:hover { background: rgba(245,243,239,0.05); color: #F5F3EF; }
  .timer-row-remove { background: none; border: none; cursor: pointer; color: #3A3835; font-size: 16px; padding: 2px 6px; line-height: 1; }
  .timer-row-remove:hover { color: var(--blue); }
  .timer-launch { background: transparent; padding: 10px 0; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-top: 1px solid #252320; }
  .timer-launch-label { font-family: 'DM Mono', monospace; font-size: 10px; color: #4A4845; text-transform: uppercase; letter-spacing: 0.1em; }
  .timer-launch-btn { padding: 7px 14px; border: 1px solid #3A3835; background: none; color: #9A9590; font-size: 10px; font-weight: 400; cursor: pointer; font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap; flex-shrink: 0; border-radius: 0; }
  .timer-launch-btn.viewing { background: var(--blue); color: white; border-color: var(--blue); }

  .done-screen { background: var(--paper); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
  .done-title { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 300; font-style: italic; letter-spacing: 0.02em; line-height: 1.1; color: var(--text-primary); margin-bottom: 12px; }
  .done-sub { color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 300; margin-bottom: 40px; letter-spacing: 0.12em; text-transform: uppercase; }

  .star-row { display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--rule); }
  .star-label { flex: 1; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 300; color: var(--text-primary); letter-spacing: 0.04em; }
  .stars { display: flex; gap: 4px; }
  .star { font-size: 18px; cursor: pointer; color: var(--rule); transition: color 0.1s; background: none; border: none; padding: 2px; line-height: 1; }
  .star.filled { color: var(--blue); }
  .notes-field { width: 100%; border: none; border-bottom: 1px solid var(--rule); padding: 12px 0; font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; background: transparent; outline: none; resize: none; min-height: 60px; color: var(--text-primary); letter-spacing: 0.02em; }
  .notes-field:focus { border-bottom-color: var(--blue); }

  .shopping-group { padding: 0 28px; }
  .shopping-group-header { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-muted); padding: 16px 0 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; }
  .shopping-group-header:hover { color: var(--text-primary); }
  .shopping-group-toggle { font-size: 9px; opacity: 0.5; }
  .shopping-recipe-header { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; color: var(--text-muted); padding: 10px 0 6px; margin-top: 2px; border-top: 1px solid var(--rule); letter-spacing: 0.08em; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none; text-transform: uppercase; }
  .shopping-recipe-header:hover { color: var(--text-primary); }
  .shopping-item { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--rule); cursor: pointer; transition: opacity 0.15s; }
  .shopping-item:hover { opacity: 0.7; }
  .shopping-item.done .shopping-item-name { text-decoration: line-through; color: var(--text-muted); }
  .shopping-item-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; flex: 1; min-width: 0; letter-spacing: 0.02em; color: var(--text-primary); }
  .shopping-item-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .shopping-item-qty { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); font-weight: 400; }
  .shopping-item-delete { background: none; border: none; cursor: pointer; color: var(--rule); font-size: 16px; padding: 0; line-height: 1; }
  .shopping-item-delete:hover { color: var(--text-muted); }
  .shopping-item.done .shopping-item-qty { color: var(--rule); }

  .sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.22); z-index: 200; display: flex; align-items: flex-end; }
  .sheet { background: var(--paper); width: 100%; max-height: 75vh; overflow-y: auto; border-top: 1px solid var(--rule); }
  .sheet-handle { width: 32px; height: 2px; background: var(--rule); margin: 14px auto 4px; }
  .sheet-title { font-family: 'DM Mono', monospace; font-weight: 400; font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; padding: 8px 24px 14px; border-bottom: 1px solid var(--rule); color: var(--text-muted); }

  .cookbook-shelf { display: flex; overflow-x: auto; gap: 0; padding: 0; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-direction: column; }
  .cookbook-shelf::-webkit-scrollbar { display: none; }
  .cookbook-card { flex-shrink: 0; width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; cursor: pointer; scroll-snap-align: start; transition: background 0.1s; background: transparent; border-bottom: 1px solid var(--rule); border-radius: 0; }
  .cookbook-card:hover { background: var(--surface); }
  .cookbook-card-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 400; color: var(--text-primary); letter-spacing: 0.02em; }
  .cookbook-card-count { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); font-weight: 300; }
  .cookbook-card-new { border-bottom: 1px dashed var(--rule); }
  .cookbook-card-new-icon { font-size: 16px; color: var(--rule); line-height: 1; }
  .cookbook-card-new-label { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; }

  .tag-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .tag-pill { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 0; border: 1px solid var(--rule); color: var(--text-muted); cursor: pointer; background: transparent; transition: all 0.12s; }
  .tag-pill:hover { border-color: var(--text-primary); color: var(--text-primary); }
  .tag-pill.active { border-color: var(--blue); color: var(--blue); background: var(--blue-pale); }
  .tag-pill-display { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 0; border: 1px solid var(--rule); color: var(--text-muted); }

  .section-label { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); padding: 20px 28px 0; }

  .scroll-body { overflow-y: auto; flex: 1; }
  .pb-safe { padding-bottom: 40px; }

  @media (min-width: 520px) {
    .page-header { padding: 56px 36px 28px; }
    .flat-row { padding: 14px 36px; }
    .flat-row-action { padding: 14px 36px; }
    .back-row { padding: 16px 36px; }
    .form-body { padding: 24px 36px; }
    .tabs { padding: 0 36px; }
    .detail-hero { padding: 40px 36px 0; }
    .detail-section { padding: 20px 36px; }
    .shopping-group { padding: 0 36px; }
    .done-screen { padding: 60px 36px; }
    .home-section-label { padding: 16px 36px 8px; }
    .home-fav-row { padding: 11px 36px; }
    .home-shopping-header { padding: 0 36px; }
  }

  /* ── Home: top bar ──────────────────────────────────── */
  .home-header { background: var(--paper); border-bottom: 1px solid var(--rule); flex-shrink: 0; }
  .home-header-row { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 44px; }
  .home-icon-btn { background: none; border: none; cursor: pointer; padding: 8px; font-size: 14px; line-height: 1; color: var(--text-muted); transition: color 0.15s; display: flex; align-items: center; font-family: 'DM Mono', monospace; }
  .home-icon-btn:hover { color: var(--text-primary); }

  /* ── Home: 3-col layout ─────────────────────────────── */
  .home-wrapper { display: flex; flex-direction: column; height: 100vh; overflow: hidden; background: var(--paper); }
  .home-body { flex: 1; overflow: hidden; display: grid; grid-template-columns: 1fr 3fr 1fr; }
  .home-col { overflow-y: auto; border-right: 1px solid var(--rule); display: flex; flex-direction: column; min-width: 0; }
  .home-col:last-child { border-right: none; }
  .home-col-header { padding: 12px 18px; border-bottom: 1px solid var(--rule); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--paper); z-index: 1; }
  .home-col-title { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); }

  /* ── Home: cookbook list (left col) ─────────────────── */
  .home-cb-list { display: flex; flex-direction: column; }
  .home-cb-list-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border: none; background: none; cursor: pointer; text-align: left; width: 100%; border-bottom: 1px solid var(--rule); transition: background 0.1s; }
  .home-cb-list-row:hover { background: var(--surface); }
  .home-cb-list-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 400; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.02em; }
  .home-cb-list-count { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); flex-shrink: 0; margin-left: 8px; font-weight: 300; }
  .home-cb-new .home-cb-list-name { font-size: 10px; color: var(--text-muted); font-weight: 300; text-transform: uppercase; letter-spacing: 0.12em; }
  .home-cb-new:hover .home-cb-list-name { color: var(--text-primary); }
  .home-empty { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; padding: 24px 18px; line-height: 2; }

  /* ── Home: shopping list (right col) ────────────────── */
  .home-col-right .shopping-group { padding: 0; }
  .home-col-right .shopping-group-header { padding: 12px 16px 8px; }
  .home-col-right .shopping-recipe-header { padding: 6px 16px; }
  .home-col-right .shopping-item { padding: 10px 16px; }

  /* ── Home: mobile tab bar ───────────────────────────── */
  .home-tab-bar { display: none; flex-shrink: 0; }
  .home-tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 10px 4px; border: none; background: none; cursor: pointer; transition: color 0.15s; }
  .home-tab-btn:hover { opacity: 0.8; }
  .home-tab-icon { font-size: 14px; line-height: 1; color: var(--text-muted); font-family: 'DM Mono', monospace; }
  .home-tab-label { font-family: 'DM Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); }
  .home-tab-btn.active .home-tab-icon { color: var(--blue); }
  .home-tab-btn.active .home-tab-label { color: var(--blue); }

  @media (max-width: 767px) {
    .home-body { display: flex !important; flex-direction: column; overflow: visible; }
    .home-col { display: none; flex: 1; border-right: none; }
    .home-col.active { display: flex; }
    .home-col-right .shopping-group-header { padding: 12px 20px 8px; }
    .home-col-right .shopping-recipe-header { padding: 6px 20px; }
    .home-col-right .shopping-item { padding: 10px 20px; }
  }

  /* ── Two-panel cookbook layout ──────────────────────── */
  .cookbook-layout { display: flex; height: 100vh; overflow: hidden; background: var(--paper); }
  .recipe-list-panel { width: 260px; flex-shrink: 0; border-right: 1px solid var(--rule); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
  .recipe-detail-panel { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  .list-panel-header { padding: 24px 20px 14px; border-bottom: 1px solid var(--rule); flex-shrink: 0; }
  .list-panel-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; padding: 0; margin-bottom: 10px; }
  .list-panel-back:hover { color: var(--text-primary); }
  .list-panel-title { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-primary); line-height: 1.3; }
  .list-panel-count { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); margin-top: 4px; font-weight: 300; }
  .recipe-list-rows { flex: 1; overflow-y: auto; }
  .recipe-list-row { padding: 11px 20px; cursor: pointer; border-bottom: 1px solid var(--rule); transition: background 0.1s; }
  .recipe-list-row:hover { background: var(--surface); }
  .recipe-list-row.active { background: var(--surface); border-left: 2px solid var(--blue); padding-left: 18px; }
  .recipe-list-row-name { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 400; color: var(--text-primary); line-height: 1.4; letter-spacing: 0.02em; }
  .recipe-list-row-meta { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); margin-top: 2px; font-weight: 300; }
  .list-panel-footer { padding: 12px 16px; border-top: 1px solid var(--rule); flex-shrink: 0; }
  .detail-empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; min-height: 60vh; }
  .panel-mobile-back { display: none; }
  .panel-mobile-back-btn { background: none; border: none; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); padding: 14px 28px; display: block; }
  .panel-mobile-back-btn:hover { color: var(--text-primary); }

  @media (max-width: 639px) {
    .cookbook-layout { height: auto; overflow: visible; display: block; }
    .recipe-list-panel { width: 100%; height: auto; overflow: visible; border-right: none; }
    .recipe-detail-panel { display: none; }
    .cookbook-layout.has-detail .recipe-list-panel { display: none; }
    .cookbook-layout.has-detail .recipe-detail-panel { display: flex; flex-direction: column; min-height: 100vh; }
    .panel-mobile-back { display: block; border-bottom: 1px solid var(--rule); }
  }

  /* ── Recipe comments ────────────────────────────────── */
  .comments-section { padding: 20px 28px 8px; }
  .comment-item { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--rule); }
  .comment-avatar { width: 24px; height: 24px; border-radius: 0; background: var(--surface); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-weight: 400; font-size: 10px; flex-shrink: 0; margin-top: 1px; border: 1px solid var(--rule); }
  .comment-body { flex: 1; min-width: 0; }
  .comment-author { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .comment-text { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; color: var(--text-primary); line-height: 1.55; margin-top: 4px; letter-spacing: 0.02em; }
  .comment-time { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); margin-top: 4px; }
  .comment-delete { background: none; border: none; cursor: pointer; color: var(--rule); font-size: 14px; padding: 0 2px; line-height: 1; flex-shrink: 0; align-self: flex-start; margin-top: 2px; }
  .comment-delete:hover { color: var(--text-muted); }
  .comment-input-row { display: flex; gap: 0; margin-top: 14px; padding-bottom: 20px; }
  .comment-input { flex: 1; padding: 12px 0; border: none; border-bottom: 1px solid var(--rule); font-size: 13px; font-family: 'DM Mono', monospace; font-weight: 300; background: transparent; outline: none; resize: none; color: var(--text-primary); letter-spacing: 0.02em; }
  .comment-input:focus { border-bottom-color: var(--blue); }
  .comment-submit { padding: 0 16px; border: none; background: var(--blue); color: var(--white); font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; flex-shrink: 0; transition: background 0.15s; border-radius: 0; }
  .comment-submit:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── Bottom nav ──────────────────────────────────────── */
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--paper); border-top: 1px solid var(--rule); display: flex; z-index: 100; padding-bottom: env(safe-area-inset-bottom, 0px); }
  .bottom-nav-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 10px 4px; border: none; background: none; cursor: pointer; transition: color 0.15s; }
  .bottom-nav-btn:hover { opacity: 0.7; }
  .bottom-nav-icon { font-size: 16px; line-height: 1; color: var(--text-muted); }
  .bottom-nav-label { font-family: 'DM Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); }
  .bottom-nav-btn.active .bottom-nav-icon, .bottom-nav-btn.active .bottom-nav-label { color: var(--blue); }
  .pb-nav { padding-bottom: 72px !important; }

  /* ── Search screen ───────────────────────────────────── */
  .search-screen { min-height: 100vh; background: var(--paper); display: flex; flex-direction: column; }
  .search-input-wrap { padding: 0 28px 16px; }
  .search-input { width: 100%; padding: 10px 0; border: none; border-bottom: 1px solid var(--rule); font-size: 13px; font-family: 'DM Mono', monospace; font-weight: 300; background: transparent; outline: none; border-radius: 0; color: var(--text-primary); letter-spacing: 0.02em; }
  .search-input:focus { border-bottom-color: var(--blue); }
  .people-section-label { font-family: 'DM Mono', monospace; font-size: 9px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); padding: 12px 28px 4px; }
  .person-row { display: flex; align-items: center; padding: 12px 28px; border-bottom: 1px solid var(--rule); cursor: pointer; gap: 12px; transition: background 0.1s; }
  .person-row:hover { background: var(--surface); }
  .person-avatar { width: 32px; height: 32px; border-radius: 0; background: var(--surface); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-weight: 400; font-size: 12px; flex-shrink: 0; border: 1px solid var(--rule); }
  .person-info { flex: 1; min-width: 0; }
  .person-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 400; color: var(--text-primary); letter-spacing: 0.02em; }
  .person-handle { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .person-followers { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); margin-top: 1px; }
  .follow-btn { padding: 7px 14px; border: 1px solid var(--text-primary); background: transparent; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.15s; border-radius: 0; }
  .follow-btn:hover { background: var(--blue); color: var(--white); border-color: var(--blue); }
  .follow-btn.following { background: var(--blue); color: var(--white); border-color: var(--blue); }

  /* ── Timeline screen ─────────────────────────────────── */
  .timeline-screen { min-height: 100vh; background: var(--paper); display: flex; flex-direction: column; }
  .event-row { padding: 16px 28px; border-bottom: 1px solid var(--rule); }
  .event-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .event-avatar { width: 28px; height: 28px; border-radius: 0; background: var(--surface); color: var(--text-muted); display: flex; align-items: center; justify-content: center; font-family: 'DM Mono', monospace; font-weight: 400; font-size: 11px; flex-shrink: 0; cursor: pointer; border: 1px solid var(--rule); }
  .event-avatar:hover { background: var(--rule); }
  .event-meta { flex: 1; min-width: 0; }
  .event-name { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.08em; }
  .event-time { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); }
  .event-text { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; line-height: 1.6; color: var(--text-primary); margin-bottom: 6px; letter-spacing: 0.02em; }
  .event-post-text { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; line-height: 1.65; color: var(--text-primary); margin: 8px 0; letter-spacing: 0.02em; }
  .event-photo { width: 100%; max-height: 320px; object-fit: cover; margin: 10px 0; display: block; border: 1px solid var(--rule); }
  .event-actions { display: flex; align-items: center; gap: 16px; margin-top: 10px; }
  .like-btn { background: none; border: none; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; padding: 0; transition: color 0.15s; line-height: 1; letter-spacing: 0.04em; }
  .like-btn.liked { color: var(--blue); }
  .like-btn:hover { color: var(--blue); }
  .timeline-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 28px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; line-height: 2; }

  /* ── Post screen ─────────────────────────────────────── */
  .post-screen { min-height: 100vh; background: var(--paper); display: flex; flex-direction: column; }
  .photo-upload-area { display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed var(--rule); padding: 32px; cursor: pointer; gap: 8px; transition: border-color 0.15s; }
  .photo-upload-area:hover { border-color: var(--text-muted); }
  .photo-upload-icon { font-size: 20px; color: var(--rule); line-height: 1; }
  .photo-upload-label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-muted); }
  .photo-preview { position: relative; }
  .photo-preview img { width: 100%; max-height: 260px; object-fit: cover; display: block; border: 1px solid var(--rule); }
  .photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.55); color: white; border: none; cursor: pointer; width: 28px; height: 28px; border-radius: 0; font-size: 16px; display: flex; align-items: center; justify-content: center; }
  .char-count { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 4px; }

  /* ── App shell (mobile only) ────────────────────────── */
  .app-header { display: none; }
  .app-header-spacer { flex: 1; }
  .app-header-btn {
    width: 36px; height: 36px; background: none; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-primary); transition: opacity 0.15s;
  }
  .app-header-btn:hover { opacity: 0.6; }
  .app-footer { display: none; }
  .app-footer-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; border: none; background: none;
    cursor: pointer; color: var(--text-muted); position: relative;
    transition: color 0.15s;
  }
  .app-footer-tab.active { color: var(--blue); }
  .app-footer-tab.active::before {
    content: ''; position: absolute; top: 0; left: 12px; right: 12px;
    height: 2px; background: var(--blue);
  }
  .app-footer-label {
    font-family: 'DM Mono', monospace; font-weight: 300; font-size: 8px;
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .app-content-inner { }

  @media (max-width: 767px) {
    .app-header {
      display: flex; position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 100;
      background: var(--paper); border-bottom: 1px solid var(--rule);
      align-items: center; padding: 0 24px; gap: 8px;
    }
    .app-footer {
      display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 56px; z-index: 100;
      background: var(--paper); border-top: 1px solid var(--rule);
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .app-content {
      position: fixed; top: 52px; bottom: 56px; left: 0; right: 0;
      overflow-y: auto; -webkit-overflow-scrolling: touch; background: var(--paper);
    }
    .app-content-inner { max-width: 480px; margin: 0 auto; }
    .home-header { display: none; }
    .home-wrapper { height: auto !important; overflow: visible !important; }
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

function parseIngredientLine(line) {
  line = line.trim().replace(/^[-•*]\s*/, '');
  if (!line) return null;
  const match = line.match(/^([\d¼½¾⅓⅔⅛⅜⅝⅞]+(?:[\/\.]\d+)?(?:\s+\d+\/\d+)?)\s*(cups?|tbsps?|tablespoons?|tsps?|teaspoons?|fl\.?\s*oz|ounces?|oz|pounds?|lbs?|grams?|g|kilograms?|kg|millilitres?|milliliters?|ml|litres?|liters?|l|cloves?|pieces?|slices?|large|medium|small|bunch(?:es)?|handfuls?|pinch(?:es)?|cans?|stalks?|sprigs?|leaves?)\s*/i);
  if (match) return { qty: match[0].trim(), name: line.slice(match[0].length).trim() || line };
  const numOnly = line.match(/^(\d+(?:[\/\.]\d+)?)\s+/);
  if (numOnly) return { qty: numOnly[1], name: line.slice(numOnly[0].length).trim() };
  return { qty: '', name: line };
}

function convertQty(qty, toPreference) {
  if (!qty) return qty;
  const toMetric = { cup: [240,'ml'], cups: [240,'ml'], tbsp: [15,'ml'], tablespoon: [15,'ml'], tablespoons: [15,'ml'], tsp: [5,'ml'], teaspoon: [5,'ml'], teaspoons: [5,'ml'], 'fl oz': [30,'ml'], oz: [28.35,'g'], ounce: [28.35,'g'], ounces: [28.35,'g'], lb: [453.6,'g'], lbs: [453.6,'g'], pound: [453.6,'g'], pounds: [453.6,'g'] };
  const m = qty.match(/^([\d\.]+(?:\/[\d\.]+)?)\s*(.+)?$/);
  if (!m) return qty;
  let num = m[1].includes('/') ? parseFloat(m[1].split('/')[0]) / parseFloat(m[1].split('/')[1]) : parseFloat(m[1]);
  const unit = (m[2] || '').trim().toLowerCase();
  const round = n => Math.round(n * 10) / 10;
  if (toPreference === 'metric' && toMetric[unit]) {
    const [f, u] = toMetric[unit];
    return `${round(num * f)} ${u}`;
  }
  if (toPreference === 'imperial') {
    if (unit === 'ml') { if (num <= 5) return `${round(num/5)} tsp`; if (num <= 60) return `${round(num/15)} tbsp`; return `${round(num/240)} cups`; }
    if (unit === 'g') { return num >= 454 ? `${round(num/453.6)} lbs` : `${round(num/28.35)} oz`; }
    if (unit === 'kg') return `${round(num * 2.205)} lbs`;
    if (unit === 'l') return `${round(num * 4.227)} cups`;
  }
  return qty;
}

function parseStepsFromText(text) {
  return text.split(/\.(?:\s+|\s*\n|\s*$)/).map(s => s.trim()).filter(Boolean);
}

function ahUrl(name) { return `https://www.ah.nl/zoeken?query=${encodeURIComponent(name)}`; }

function ProfileScreen({ user, onBack, onLogout }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [unitPreference, setUnitPreference] = useState('metric');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(profile => {
      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setUsername(profile.username || '');
        setUnitPreference(profile.unit_preference || 'metric');
      }
    });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Username is required'); return; }
    setError(''); setSaving(true); setSuccess(false);
    try {
      await saveProfile(user.id, { firstName, lastName, username, unitPreference, email });
      if (email !== user.email) {
        const { error: emailErr } = await supabase.auth.updateUser({ email });
        if (emailErr) throw emailErr;
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (firstName?.[0] || email?.[0] || '?').toUpperCase();

  return (
    <div className="form-screen">
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ink)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 18 }}>{initials}</div>
          <div className="page-header-title">Profile</div>
        </div>
      </div>
      <form onSubmit={handleSave}>
        <div className="form-body">
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">First name</label>
              <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label className="form-label">Last name</label>
              <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Username</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="form-field">
            <label className="form-label">Units</label>
            <div className="unit-toggle">
              <button type="button" className={`unit-btn${unitPreference === 'metric' ? ' active' : ''}`} onClick={() => setUnitPreference('metric')}>Metric</button>
              <button type="button" className={`unit-btn${unitPreference === 'imperial' ? ' active' : ''}`} onClick={() => setUnitPreference('imperial')}>Imperial</button>
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          {success && <div style={{ fontSize: 13, color: 'green', fontFamily: "'DM Mono', monospace" }}>Saved.</div>}
          <button className="btn btn-primary btn-full" type="submit" disabled={saving}>{saving ? '...' : 'Save changes'}</button>
        </div>
      </form>
      <button className="logout-btn" onClick={onLogout}>Sign out</button>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
      onAuth();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <img src="/logo.png" alt="The Pass" style={{ width: 300, height: 'auto' }} />
        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 11, color: 'var(--text-muted)', marginTop: 16, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Ready to serve.</div>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
          <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError(''); }}>Create account</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-field">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppLogo({ size = 16 }) {
  return (
    <img src="/logo.png" alt="The Pass" style={{ height: size, width: 'auto' }} />
  );
}

function AppHeader({ onSearch, onProfile }) {
  return (
    <header className="app-header">
      <img src="/logo.png" alt="The Pass" style={{ height: 28, width: 'auto' }} />
      <div className="app-header-spacer" />
      <button className="app-header-btn" onClick={onSearch} aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <button className="app-header-btn" onClick={onProfile} aria-label="Profile">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
    </header>
  );
}

function AppFooter({ activeTab, onChangeTab }) {
  return (
    <nav className="app-footer">
      <button className={`app-footer-tab${activeTab === 'feed' ? ' active' : ''}`} onClick={() => onChangeTab('feed')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="app-footer-label">Home</span>
      </button>
      <button className={`app-footer-tab${activeTab === 'cookbooks' ? ' active' : ''}`} onClick={() => onChangeTab('cookbooks')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span className="app-footer-label">Cookbooks</span>
      </button>
      <button className={`app-footer-tab${activeTab === 'shopping' ? ' active' : ''}`} onClick={() => onChangeTab('shopping')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span className="app-footer-label">Shopping</span>
      </button>
      <button className={`app-footer-tab${activeTab === 'profile' ? ' active' : ''}`} onClick={() => onChangeTab('profile')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <span className="app-footer-label">Profile</span>
      </button>
    </nav>
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

function HomeScreen({ cookbooks, shoppingList, onOpenCookbook, onNewCookbook, onToggleShoppingItem, onDeleteShoppingItem, onClearShoppingList, currentUserId, onOpenUser, activeTab, profileInitial, onOpenSearch, onOpenProfile }) {
  const [collapsed, setCollapsed] = useState({});
  const [collapsedRecipes, setCollapsedRecipes] = useState({});
  const [events, setEvents] = useState(null);

  const togglePriority = (p) => setCollapsed(prev => ({ ...prev, [p]: !prev[p] }));
  const toggleRecipe = (key) => setCollapsedRecipes(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => { getTimeline().then(setEvents); }, [currentUserId]);

  const handleLike = async (eventId) => {
    const isNowLiked = await toggleLike(eventId);
    setEvents(prev => prev?.map(e => e.id === eventId
      ? { ...e, likedByMe: isNowLiked, likeCount: isNowLiked ? e.likeCount + 1 : e.likeCount - 1 }
      : e
    ));
  };

  const renderEvent = (event) => {
    const { id, type, userProfile, targetProfile, recipe, post_text, photo_url, created_at, likeCount, likedByMe } = event;
    const name = userProfile?.display_name || userProfile?.username || 'Someone';
    const initial = name[0].toUpperCase();
    let text = null;
    if (type === 'followed_you' && targetProfile) {
      const tname = targetProfile.display_name || targetProfile.username;
      text = <><strong>{name}</strong> followed <strong>{tname}</strong></>;
    } else if (type === 'cooked_recipe' && recipe) {
      text = <><strong>{name}</strong> cooked <strong>{recipe.name}</strong></>;
    } else if (type === 'posted') {
      text = <><strong>{name}</strong> posted a cook</>;
    }
    return (
      <div key={id} className="event-row">
        <div className="event-header">
          <div className="event-avatar" onClick={() => userProfile && onOpenUser(userProfile.id)}>{initial}</div>
          <div className="event-meta">
            <div className="event-name">{name}</div>
            <div className="event-time">{timeAgo(created_at)}</div>
          </div>
        </div>
        {text && <div className="event-text">{text}</div>}
        {post_text && <div className="event-post-text">{post_text}</div>}
        {photo_url && <img className="event-photo" src={photo_url} alt="" />}
        <div className="event-actions">
          <button className={`like-btn${likedByMe ? ' liked' : ''}`} onClick={() => handleLike(id)}>
            {likedByMe ? '♥' : '♡'}{likeCount > 0 ? ` ${likeCount}` : ''}
          </button>
        </div>
      </div>
    );
  };

  const byPriority = PRIORITY_ORDER.map(p => {
    const items = shoppingList.filter(i => (i.priority || 'eventually') === p);
    const byRecipe = items.reduce((acc, item) => {
      const key = item.recipe_name || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    return { priority: p, label: PRIORITY_LABELS[p], byRecipe, count: items.length };
  }).filter(g => g.count > 0);
  const unchecked = shoppingList.filter(i => !i.checked).length;

  return (
    <div className="home-wrapper">
      {/* Desktop header — hidden on mobile, replaced by AppHeader */}
      <div className="home-header">
        <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
        <div className="home-header-row">
          <button className="home-icon-btn" onClick={onOpenSearch}>⌕</button>
          <img src="/logo.png" alt="The Pass" style={{ height: 26, width: 'auto' }} />
          <button className="profile-avatar" onClick={onOpenProfile}>{profileInitial}</button>
        </div>
      </div>

      {/* 3-column body — on mobile shows only the active col */}
      <div className="home-body">

        {/* Left col: Cookbooks */}
        <div className={`home-col home-col-left${activeTab === 'cookbooks' ? ' active' : ''}`}>
          <div className="home-col-header">
            <span className="home-col-title">Cookbooks</span>
          </div>
          <div className="home-cb-list">
            {cookbooks.map(cb => (
              <button key={cb.id} className="home-cb-list-row" onClick={() => onOpenCookbook(cb.id)}>
                <span className="home-cb-list-name">{cb.name}</span>
                <span className="home-cb-list-count">{cb.recipeCount ?? 0}</span>
              </button>
            ))}
            <button className="home-cb-list-row home-cb-new" onClick={onNewCookbook}>
              <span className="home-cb-list-name">+ New Cookbook</span>
            </button>
          </div>
        </div>

        {/* Center col: Feed */}
        <div className={`home-col home-col-center${activeTab === 'feed' ? ' active' : ''}`}>
          <div className="home-col-header">
            <span className="home-col-title">Home</span>
          </div>
          {events === null ? (
            <div className="home-empty">Loading...</div>
          ) : events.length === 0 ? (
            <div className="home-empty">Nothing yet.<br />Follow people to see their activity.</div>
          ) : events.map(renderEvent)}
        </div>

        {/* Right col: Shopping List */}
        <div className={`home-col home-col-right${activeTab === 'shopping' ? ' active' : ''}`}>
          <div className="home-col-header">
            <span className="home-col-title">Shopping List</span>
            {unchecked > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-secondary)' }}>{unchecked} to buy</span>}
          </div>
          {shoppingList.length === 0 ? (
            <div className="home-empty">Your list is empty.</div>
          ) : (
            <>
              {byPriority.map(({ priority, label, byRecipe }) => (
                <div key={priority} className="shopping-group">
                  <div className="shopping-group-header" onClick={() => togglePriority(priority)}>
                    <span>{label}</span>
                    <span className="shopping-group-toggle">{collapsed[priority] ? '▶' : '▼'}</span>
                  </div>
                  {!collapsed[priority] && Object.entries(byRecipe).map(([recipeName, recipeItems]) => (
                    <div key={recipeName}>
                      <div className="shopping-recipe-header" onClick={() => toggleRecipe(`${priority}:${recipeName}`)}>
                        <span>{recipeName}</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-secondary)' }}>{collapsedRecipes[`${priority}:${recipeName}`] ? '▶' : '▼'}</span>
                      </div>
                      {!collapsedRecipes[`${priority}:${recipeName}`] && recipeItems.map(item => (
                        <div key={item.id} className={`shopping-item${item.checked ? ' done' : ''}`} onClick={() => onToggleShoppingItem(item.id, item.checked)}>
                          <span className="shopping-item-name">{item.ingredient_name}</span>
                          <div className="shopping-item-right">
                            <span className="shopping-item-qty">{item.qty}</span>
                            <a href={ahUrl(item.ingredient_name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: 'var(--blue)', textDecoration: 'none' }}>AH →</a>
                            <button className="shopping-item-delete" onClick={e => { e.stopPropagation(); onDeleteShoppingItem(item.id); }}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ padding: '12px 16px 32px', textAlign: 'center' }}>
                <button onClick={onClearShoppingList} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clear list</button>
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
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 32, letterSpacing: '0.01em', color: 'var(--ink)' }}>New Cookbook</div>
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

function CookbookScreen({ cookbook, onBack, onNewRecipe, onStartCook, favouriteIds, onToggleFavourite, onAddToCookbook, onOpenAddToList, shoppingRecipeIds, initialRecipeId, onEditRecipe, currentUserId, onTogglePublic }) {
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
            <AppLogo size={22} />
          </button>
          <div className="list-panel-title">{cookbook.name}</div>
          {!isLoading && <div className="list-panel-count">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</div>}
        </div>
        <div className="recipe-list-rows">
          {isLoading ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading…</div>
          ) : recipes.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No recipes yet</div>
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
            onEdit={onEditRecipe ? () => onEditRecipe(cookbook.id, selectedId) : undefined}
            currentUserId={currentUserId}
            onTogglePublic={onTogglePublic ? (rId, isPublic) => onTogglePublic(cookbook.id, rId, isPublic) : undefined}
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

function RecipeFormScreen({ initialData, onBack, onSave, saving, unitPreference = 'metric' }) {
  const isEdit = !!initialData;
  const [tab, setTab] = useState(0);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [time, setTime] = useState(initialData?.time?.toString() || '');
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Easy');
  const [servings, setServings] = useState(initialData?.servings || 2);
  const [tags, setTags] = useState(initialData?.tags || []);
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length ? initialData.ingredients.map(i => ({ ...i, id: i.id || generateId() })) : [{ id: generateId(), name: '', qty: '' }]
  );
  const [steps, setSteps] = useState(
    initialData?.steps?.length ? initialData.steps.map(s => ({ ...s, id: s.id || generateId(), hasTimer: !!s.timer })) : [{ id: generateId(), text: '', timer: null, hasTimer: false }]
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  const [ingMode, setIngMode] = useState('manual');
  const [ingPaste, setIngPaste] = useState('');
  const [stepMode, setStepMode] = useState('manual');
  const [stepPaste, setStepPaste] = useState('');

  const [customTagInput, setCustomTagInput] = useState('');
  const toggleTag = (tag) => setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
  const addCustomTag = () => {
    const t = customTagInput.trim();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setCustomTagInput('');
  };
  const addIngredient = () => setIngredients(p => [...p, { id: generateId(), name: '', qty: '' }]);
  const removeIngredient = id => setIngredients(p => p.filter(i => i.id !== id));
  const updateIngredient = (id, field, val) => setIngredients(p => p.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addStep = () => setSteps(p => [...p, { id: generateId(), text: '', timer: null, hasTimer: false }]);
  const removeStep = id => setSteps(p => p.filter(s => s.id !== id));
  const updateStep = (id, field, val) => setSteps(p => p.map(s => s.id === id ? { ...s, [field]: val } : s));

  const applyIngPaste = () => {
    const parsed = ingPaste.split('\n').map(parseIngredientLine).filter(Boolean)
      .map(p => ({ id: generateId(), name: p.name, qty: convertQty(p.qty, unitPreference) }));
    if (!parsed.length) return;
    setIngredients(prev => prev.some(i => i.name.trim()) ? [...prev, ...parsed] : parsed);
    setIngMode('manual'); setIngPaste('');
  };

  const applyStepPaste = () => {
    const parsed = parseStepsFromText(stepPaste).map(text => ({ id: generateId(), text, timer: null, hasTimer: false }));
    if (!parsed.length) return;
    setSteps(prev => prev.some(s => s.text.trim()) ? [...prev, ...parsed] : parsed);
    setStepMode('manual'); setStepPaste('');
  };

  const canSave = name.trim() && ingredients.some(i => i.name.trim()) && steps.some(s => s.text.trim());
  const handleSave = () => onSave({
    name: name.trim(), description: description.trim(),
    time: parseInt(time) || 30, difficulty, servings, tags, isPublic,
    ingredients: ingredients.filter(i => i.name.trim()),
    steps: steps.filter(s => s.text.trim()).map(s => ({ ...s, timer: s.hasTimer ? (parseInt(s.timer) || null) : null })),
  });

  return (
    <div className="form-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <button className="btn btn-red btn-sm" style={{ marginLeft: 'auto' }} disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
        </button>
      </div>
      <div style={{ padding: '0 28px 12px', borderBottom: '1px solid var(--rule)' }}>
        <input className="form-input" placeholder="Recipe name" value={name} onChange={e => setName(e.target.value)} style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 28, fontWeight: 300, letterSpacing: '0.01em', border: 'none', padding: '12px 0', background: 'transparent', width: '100%' }} />
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
            <label className="form-label">Visibility</label>
            <div className="unit-toggle">
              <button type="button" className={`unit-btn${!isPublic ? ' active' : ''}`} onClick={() => setIsPublic(false)}>Private</button>
              <button type="button" className={`unit-btn${isPublic ? ' active' : ''}`} onClick={() => setIsPublic(true)}>Public</button>
            </div>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.04em' }}>
              {isPublic ? 'Visible to everyone on the platform.' : 'Only visible to you.'}
            </p>
          </div>
          <div className="form-field">
            <label className="form-label">Tags</label>
            <div className="tag-pills">
              {PRESET_TAGS.map(tag => (
                <button key={tag} className={`tag-pill${tags.includes(tag) ? ' active' : ''}`} onClick={() => toggleTag(tag)}>{tag}</button>
              ))}
              {tags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                <button key={tag} className="tag-pill active" onClick={() => toggleTag(tag)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {tag} <span style={{ fontSize: 10, opacity: 0.7 }}>×</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                className="form-input"
                placeholder="Add custom tag..."
                value={customTagInput}
                onChange={e => setCustomTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
                style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={addCustomTag} disabled={!customTagInput.trim()}>+</button>
            </div>
          </div>
        </>}
        {tab === 1 && <>
          <div className="input-mode-toggle">
            <button className={`input-mode-btn${ingMode === 'manual' ? ' active' : ''}`} onClick={() => setIngMode('manual')}>One by one</button>
            <button className={`input-mode-btn${ingMode === 'paste' ? ' active' : ''}`} onClick={() => setIngMode('paste')}>Paste</button>
          </div>
          {ingMode === 'paste' ? <>
            <p className="paste-hint">One ingredient per line. Quantities are auto-detected and converted to {unitPreference}.</p>
            <textarea className="form-input form-textarea" placeholder={"2 cups flour\n1/2 tsp salt\n100g butter"} value={ingPaste} onChange={e => setIngPaste(e.target.value)} style={{ minHeight: 140, fontSize: 14 }} />
            <button className="btn btn-black btn-sm" style={{ alignSelf: 'flex-start' }} onClick={applyIngPaste} disabled={!ingPaste.trim()}>Apply</button>
          </> : <>
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: 8 }} onClick={() => setIngredients(p => p.map(i => ({ ...i, qty: convertQty(i.qty, unitPreference) })))}>
              Convert all to {unitPreference}
            </button>
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
        </>}
        {tab === 2 && <>
          <div className="input-mode-toggle">
            <button className={`input-mode-btn${stepMode === 'manual' ? ' active' : ''}`} onClick={() => setStepMode('manual')}>One by one</button>
            <button className={`input-mode-btn${stepMode === 'paste' ? ' active' : ''}`} onClick={() => setStepMode('paste')}>Paste</button>
          </div>
          {stepMode === 'paste' ? <>
            <p className="paste-hint">Each sentence ending with a period becomes a step.</p>
            <textarea className="form-input form-textarea" placeholder={"Preheat the oven to 180°C. Mix the flour and butter. Bake for 25 minutes."} value={stepPaste} onChange={e => setStepPaste(e.target.value)} style={{ minHeight: 140, fontSize: 14 }} />
            <button className="btn btn-black btn-sm" style={{ alignSelf: 'flex-start' }} onClick={applyStepPaste} disabled={!stepPaste.trim()}>Apply</button>
          </> : <>
          <div className="dynamic-list">
            {steps.map((step, idx) => (
              <div key={step.id} style={{ borderBottom: '1px solid #EEEEEE', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div className="step-num">{idx + 1}</div>
                  <textarea className="form-input form-textarea" placeholder={`Step ${idx + 1}...`} value={step.text} onChange={e => updateStep(step.id, 'text', e.target.value)} style={{ flex: 1, minHeight: 70, fontSize: 14 }} />
                  {steps.length > 1 && <button className="remove-btn" onClick={() => removeStep(step.id)}>×</button>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={step.hasTimer} onChange={e => updateStep(step.id, 'hasTimer', e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
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
        </>}
      </div>
    </div>
  );
}

function RecipeDetailScreen({ recipe, cookbook, onBack, onStartCook, isFavourite, onToggleFavourite, onAddToCookbook, onOpenAddToList, inShoppingList, mobileBackToList, onEdit, currentUserId, onTogglePublic }) {
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.isPublic);

  useEffect(() => {
    getRecipeLikes(recipe.id).then(({ count, likedByMe }) => {
      setLikeCount(count);
      setLikedByMe(likedByMe);
    });
    getRecipeComments(recipe.id).then(setComments);
  }, [recipe.id]);

  const handleLike = async () => {
    const isNowLiked = await toggleRecipeLike(recipe.id);
    setLikedByMe(isNowLiked);
    setLikeCount(prev => isNowLiked ? prev + 1 : prev - 1);
  };

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addRecipeComment(recipe.id, commentText);
      const updated = await getRecipeComments(recipe.id);
      setComments(updated);
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteRecipeComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleTogglePublic = async () => {
    const next = !isPublic;
    setIsPublic(next);
    try {
      await setRecipePublic(recipe.id, next);
      onTogglePublic?.(recipe.id, next);
    } catch (err) {
      setIsPublic(!next);
      alert('Failed to update visibility: ' + (err?.message || 'Unknown error'));
    }
  };

  return (
    <div className="screen">
      {mobileBackToList && (
        <div className="panel-mobile-back">
          <button className="panel-mobile-back-btn" onClick={mobileBackToList}>← Recipes</button>
        </div>
      )}
      <div className="detail-hero safe-top">
        <div style={{ marginBottom: 12, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em' }} onClick={onBack}>
          <AppLogo size={22} />
          <span>/ {cookbook.name}</span>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 40, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '0.02em' }}>{recipe.name}</h1>
        {recipe.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{recipe.description}</p>}
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
            : <span className="detail-meta-item" style={{ color: 'var(--text-muted)' }}>Never cooked</span>
          }
          <button onClick={handleTogglePublic} className="detail-meta-item" style={{ color: isPublic ? 'var(--blue)' : '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline dotted' }}>
            {isPublic ? '◎ Public' : '◉ Private'}
          </button>
        </div>
      </div>

      <div className="recipe-actions">
        <button className={`recipe-action-btn${isFavourite ? ' active' : ''}`} onClick={() => onToggleFavourite(recipe.id)}>
          <span className="recipe-action-icon" style={isFavourite ? { color: 'var(--blue)' } : {}}>{isFavourite ? '♥' : '♡'}</span>
          <span className="recipe-action-label">Favourite</span>
        </button>
        <button className="recipe-action-btn" onClick={() => onAddToCookbook(recipe.id, cookbook.id)}>
          <span className="recipe-action-icon">＋</span>
          <span className="recipe-action-label">Add to Cookbook</span>
        </button>
        <button className={`recipe-action-btn${inShoppingList ? ' active' : ''}`} onClick={() => !inShoppingList && onOpenAddToList(recipe)}>
          <span className="recipe-action-icon" style={inShoppingList ? { color: 'var(--blue)' } : {}}>{inShoppingList ? '✓' : '+'}</span>
          <span className="recipe-action-label">{inShoppingList ? 'On List' : 'Add to List'}</span>
        </button>
        <button className={`recipe-action-btn${likedByMe ? ' active' : ''}`} onClick={handleLike}>
          <span className="recipe-action-icon">{likedByMe ? '♥' : '♡'}</span>
          <span className="recipe-action-label">{likeCount > 0 ? likeCount : 'Like'}</span>
        </button>
        {onEdit && (
          <button className="recipe-action-btn" onClick={onEdit}>
            <span className="recipe-action-icon">✎</span>
            <span className="recipe-action-label">Edit</span>
          </button>
        )}
      </div>

      <div className="scroll-body pb-safe">
        <div className="detail-section">
          <h2>Ingredients</h2>
          {recipe.ingredients.map((ing, idx) => (
            <div key={ing.id || idx} className="ingredient-item">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1, minWidth: 0 }}>
                {ing.qty && <span className="ingredient-qty" style={{ flexShrink: 0 }}>{ing.qty}</span>}
                <span>{ing.name}</span>
              </div>
              <a href={ahUrl(ing.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: 'var(--blue)', textDecoration: 'none', flexShrink: 0, marginLeft: 10 }}>AH</a>
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
                {step.timer && <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{step.timer} min timer</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '0 20px 40px' }}>
          <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} onClick={onStartCook}>Start Cooking</button>
        </div>

        <div className="comments-section">
          <h2 style={{ fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-muted)', marginBottom: 16 }}>
            Comments{comments.length > 0 ? ` (${comments.length})` : ''}
          </h2>
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar">{(c.profiles?.display_name || c.profiles?.username || '?')[0].toUpperCase()}</div>
              <div className="comment-body">
                <div className="comment-author">{c.profiles?.display_name || c.profiles?.username || 'Unknown'}</div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-time">{timeAgo(c.created_at)}</div>
              </div>
              {currentUserId && c.user_id === currentUserId && (
                <button className="comment-delete" onClick={() => handleDeleteComment(c.id)}>×</button>
              )}
            </div>
          ))}
          {currentUserId && (
            <div className="comment-input-row">
              <textarea
                className="comment-input"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={2}
              />
              <button className="comment-submit" onClick={handleComment} disabled={submitting || !commentText.trim()}>Post</button>
            </div>
          )}
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
        <div style={{ marginBottom: 12, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em' }} onClick={onBack}>
          <AppLogo size={22} />
          <span>/ Back</span>
        </div>
        <div className="hero-label">Before we start</div>
        <h1 className="hero-title">Grab your<br/>ingredients</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px', borderBottom: '1px solid #EEEEEE' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, fontFamily: "'DM Mono', monospace", fontWeight: 300 }}>Servings</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{ width: 32, height: 32, border: '1px solid var(--ink)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
          <span style={{ fontSize: 18, fontWeight: 400, fontFamily: "'DM Mono', monospace", minWidth: 20, textAlign: 'center' }}>{servings}</span>
          <button style={{ width: 32, height: 32, border: '1px solid var(--ink)', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setServings(s => s + 1)}>+</button>
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
              <a href={ahUrl(ing.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: 'var(--blue)', textDecoration: 'none', flexShrink: 0, padding: '4px 2px' }}>AH</a>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 20px 40px' }}>
          {showWarning ? (
            <div style={{ background: 'transparent', borderLeft: '2px solid var(--blue)', padding: '16px', marginBottom: 12 }}>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-primary)', marginBottom: 14 }}>
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
        <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 2 }}>Timer</div>
        <div className={`timer-display${done ? ' done' : ''}`}>{done ? 'Done!' : fmt(seconds)}</div>
      </div>
      <button className={`timer-start-btn${running ? ' running' : ''}`} onClick={toggle}>
        {done ? 'Reset' : running ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}

function matchIngToStep(ingName, stepText) {
  const norm = s => s.toLowerCase().replace(/[^a-z\s]/g, '');
  const variants = w => {
    const vs = [w, w + 's', w + 'es', w + 'ed', w + 'ing'];
    if (w.endsWith('y') && w.length > 2) vs.push(w.slice(0, -1) + 'ies');
    if (w.endsWith('e') && w.length > 3) vs.push(w.slice(0, -1) + 'ing');
    return vs;
  };
  const stepWords = new Set(norm(stepText).split(/\s+/));
  const ingWords = norm(ingName).split(/\s+/).filter(w => w.length >= 3);
  return ingWords.length > 0 && ingWords.some(iw => variants(iw).some(v => stepWords.has(v)));
}

function CookModeScreen({ recipe, onFinish }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ingrOpen, setIngrOpen] = useState(false);
  const [timers, setTimers] = useState([]);
  const steps = recipe.steps;
  const current = steps[stepIdx];
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;
  const next = stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;

  useEffect(() => {
    const id = setInterval(() => {
      setTimers(ts => ts.map(t => {
        if (!t.running || t.remaining <= 0) return t;
        const remaining = t.remaining - 1;
        return { ...t, remaining, running: remaining > 0 };
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const startTimer = (step, num) => setTimers(ts => [...ts, { id: generateId(), stepNum: num, label: step.text, totalSeconds: step.timer * 60, remaining: step.timer * 60, running: true }]);
  const toggleTimer = id => setTimers(ts => ts.map(t => t.id === id ? { ...t, running: !t.running } : t));
  const resetTimer = id => setTimers(ts => ts.map(t => t.id === id ? { ...t, remaining: t.totalSeconds, running: false } : t));
  const removeTimer = id => setTimers(ts => ts.filter(t => t.id !== id));
  const stepTimerActive = current.timer && timers.some(t => t.stepNum === stepIdx + 1 && t.remaining > 0);

  return (
    <div className="cook-screen">
      {/* Main cook view — always rendered */}
      <div className="cook-header safe-top">
        <img src="/logo.png" alt="The Pass" style={{ height: 22, width: 'auto', opacity: 0.4 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="cook-dots">
            {steps.map((_, i) => <div key={i} className={`cook-dot${i === stepIdx ? ' active' : i < stepIdx ? ' done' : ''}`} />)}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cook-timer-btn" onClick={() => { setIngrOpen(o => !o); setDrawerOpen(false); }}>
              {recipe.ingredients.length}
            </button>
            <button className={`cook-timer-btn${timers.length > 0 ? ' has-timers' : ''}`} onClick={() => { setDrawerOpen(o => !o); setIngrOpen(false); }}>
              ⏱{timers.length > 0 && <span className="cook-timer-badge">{timers.length}</span>}
            </button>
          </div>
        </div>
      </div>
      <div className="cook-steps">
        {prev && <div className="cook-prev"><div className="cook-prev-text">{prev.text}</div></div>}
        <div className="cook-current">
          <div className="cook-step-label">Step {stepIdx + 1} of {steps.length}</div>
          <p className="cook-current-text">{current.text}</p>
          {(() => {
            const mentioned = recipe.ingredients.filter(ing =>
              ing.qty && matchIngToStep(ing.name, current.text)
            );
            return mentioned.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', marginTop: 14 }}>
                {mentioned.map((ing, i) => (
                  <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#E8EEFB', background: 'rgba(27,79,216,0.18)', padding: '3px 8px', borderRadius: 0 }}>
                    {ing.qty} {ing.name}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
          {current.timer && (
            <div className="timer-launch">
              <span className="timer-launch-label">{current.timer} min timer</span>
              {stepTimerActive
                ? <button className="timer-launch-btn viewing" onClick={() => setDrawerOpen(true)}>View timers</button>
                : <button className="timer-launch-btn" onClick={() => { startTimer(current, stepIdx + 1); setDrawerOpen(true); }}>Start timer</button>
              }
            </div>
          )}
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

      {/* Timers drawer — overlays from the right */}
      {ingrOpen && <div className="timers-drawer-overlay" onClick={() => setIngrOpen(false)} />}
      <div className={`ingr-drawer${ingrOpen ? ' open' : ''}`}>
        <div className="timers-drawer-head">
          <span className="timers-drawer-title">Ingredients</span>
          <button className="timers-drawer-close" onClick={() => setIngrOpen(false)}>×</button>
        </div>
        <div className="timers-drawer-body">
          {recipe.ingredients.map((ing, idx) => (
            <div key={ing.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 15, color: '#E8EEFB', fontWeight: 300 }}>{ing.name}</span>
              {ing.qty && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--blue)', flexShrink: 0, marginLeft: 12 }}>{ing.qty}</span>}
            </div>
          ))}
        </div>
      </div>

      {drawerOpen && <div className="timers-drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <div className={`timers-drawer${drawerOpen ? ' open' : ''}`}>
        <div className="timers-drawer-head">
          <span className="timers-drawer-title">Timers</span>
          <button className="timers-drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div className="timers-drawer-body">
          {timers.length === 0 ? (
            <div className="timers-drawer-empty">No timers yet.<br/>Tap "Start timer" on any<br/>step that has a timer.</div>
          ) : timers.map(t => (
            <div key={t.id} className="timer-row">
              <div className="timer-row-info">
                <div className="timer-row-step">Step {t.stepNum}</div>
                <div className="timer-row-label">{t.label}</div>
              </div>
              <div className="timer-row-right">
                <div className={`timer-row-display${t.remaining === 0 ? ' done' : ''}`}>
                  {t.remaining === 0 ? 'Done!' : fmt(t.remaining)}
                </div>
                <div className="timer-row-actions">
                  {t.remaining === 0
                    ? <button className="timer-row-ctrl" onClick={() => resetTimer(t.id)}>Reset</button>
                    : <button className="timer-row-ctrl" onClick={() => toggleTimer(t.id)}>{t.running ? 'Pause' : 'Resume'}</button>
                  }
                  <button className="timer-row-remove" onClick={() => removeTimer(t.id)}>×</button>
                </div>
              </div>
            </div>
          ))}
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
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(44px, 10vw, 64px)', letterSpacing: '0.02em', lineHeight: 1.05, color: 'var(--ink)' }}>How did<br/>it go?</h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10 }}>Quick feedback on your cook</p>
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
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 400, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Any notes?</div>
          <textarea className="notes-field" placeholder="What would you do differently next time?" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} onClick={() => onSave(ease, taste, overall, notes)}>
            Save feedback
          </button>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0' }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomNav({ tab, onHome, onTimeline }) {
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-btn${tab === 'home' ? ' active' : ''}`} onClick={onHome}>
        <span className="bottom-nav-icon">&#8962;</span>
        <span className="bottom-nav-label">Home</span>
      </button>
      <button className={`bottom-nav-btn${tab === 'timeline' ? ' active' : ''}`} onClick={onTimeline}>
        <span className="bottom-nav-icon">&#9685;</span>
        <span className="bottom-nav-label">Timeline</span>
      </button>
    </nav>
  );
}

function SearchScreen({ onBack, onOpenUser, currentUserId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [followingMe, setFollowingMe] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDiscoverPeople(),
      getPeopleFollowingMeNotFollowedBack(),
      getFollowingIds(currentUserId),
    ]).then(([disc, fme, fids]) => {
      setDiscover(disc);
      setFollowingMe(fme);
      setFollowingIds(new Set(fids));
      setLoading(false);
    });
  }, [currentUserId]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => searchUsers(query).then(setResults), 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    if (followingIds.has(userId)) {
      await unfollowUser(userId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(userId); return n; });
    } else {
      await followUser(userId);
      setFollowingIds(prev => new Set([...prev, userId]));
    }
  };

  const renderPerson = (person) => (
    <div key={person.id} className="person-row" onClick={() => onOpenUser(person.id)}>
      <div className="person-avatar">{(person.display_name || person.username || '?')[0].toUpperCase()}</div>
      <div className="person-info">
        <div className="person-name">{person.display_name || person.username}</div>
        <div className="person-handle">@{person.username}</div>
        {person.followerCount != null && (
          <div className="person-followers">{person.followerCount} follower{person.followerCount !== 1 ? 's' : ''}</div>
        )}
      </div>
      {person.id !== currentUserId && (
        <button className={`follow-btn${followingIds.has(person.id) ? ' following' : ''}`} onClick={e => handleFollow(person.id, e)}>
          {followingIds.has(person.id) ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );

  return (
    <div className="search-screen">
      <div className="page-header safe-top" style={{ paddingBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <button className="back-btn" onClick={onBack}>← Back</button>
        </div>
        <div className="page-header-title">Find People</div>
      </div>
      <div className="search-input-wrap">
        <input className="search-input" placeholder="Search by name or @username..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
      </div>
      <div className="scroll-body pb-safe">
        {query.trim() ? (
          results.length === 0 ? (
            <div style={{ padding: '40px 28px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No results</div>
          ) : results.map(renderPerson)
        ) : loading ? null : (
          <>
            {followingMe.length > 0 && (
              <>
                <div className="people-section-label">Following you</div>
                {followingMe.map(renderPerson)}
              </>
            )}
            {discover.length > 0 && (
              <>
                <div className="people-section-label">Discover</div>
                {discover.map(renderPerson)}
              </>
            )}
            {!followingMe.length && !discover.length && (
              <div style={{ padding: '40px 28px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No one to discover yet</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UserPublicProfileScreen({ userId, currentUserId, onBack, myCookbooks, onRecipeSaved }) {
  const [data, setData] = useState(null);
  const [following, setFollowing] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(null);
  const [pickingFor, setPickingFor] = useState(null);
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [previewDetail, setPreviewDetail] = useState(null);

  useEffect(() => {
    getUserPublicProfile(userId).then(d => {
      setData(d);
      setFollowing(d.isFollowing);
    });
  }, [userId]);

  const handleFollow = async () => {
    if (following) {
      await unfollowUser(userId);
      setFollowing(false);
    } else {
      await followUser(userId);
      setFollowing(true);
    }
  };

  const openPreview = (r) => {
    setPreviewRecipe(r);
    setPreviewDetail(null);
    getPublicRecipeDetail(r.id).then(setPreviewDetail).catch(() => {});
  };

  const closePreview = () => { setPreviewRecipe(null); setPreviewDetail(null); };

  const handleSaveRecipe = async (recipe, cookbookId) => {
    setSavingRecipe(recipe.id);
    setPickingFor(null);
    try {
      await copyRecipeToMyCookbook(recipe.id, cookbookId);
      onRecipeSaved?.(cookbookId);
      closePreview();
    } catch (err) {
      alert('Failed to save recipe: ' + (err?.message || 'Unknown error'));
    } finally {
      setSavingRecipe(null);
    }
  };

  if (!data) {
    return (
      <div className="loading-screen">
        <img src="/logo.png" alt="The Pass" className="loading-logo" style={{ width: 220, height: 'auto' }} />
      </div>
    );
  }

  const { profile, cookbooks, followCounts, publicRecipes } = data;
  const initial = (profile?.display_name || profile?.username || '?')[0].toUpperCase();

  return (
    <div className="screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onBack}>← Back</button>
      </div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--ink)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 22 }}>{initial}</div>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 22, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{profile?.display_name || profile?.username}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-secondary)' }}>@{profile?.username}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 400, fontSize: 15 }}>{followCounts.followers}</span> followers
          </span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 400, fontSize: 15 }}>{followCounts.following}</span> following
          </span>
        </div>
        {userId !== currentUserId && (
          <button className={`follow-btn${following ? ' following' : ''}`} onClick={handleFollow}>
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      <div className="scroll-body pb-safe">
        {publicRecipes.length > 0 && (
          <>
            <div className="people-section-label">Recipes</div>
            {publicRecipes.map(r => (
              <div key={r.id} className="flat-row" onClick={() => openPreview(r)}>
                <div className="flat-row-info">
                  <div className="flat-row-name">{r.name}</div>
                  <div className="flat-row-meta">
                    {[r.time && `${r.time} min`, r.difficulty, r.servings && `${r.servings} servings`].filter(Boolean).join(' · ')}
                  </div>
                  {r.tags?.length > 0 && (
                    <div className="tag-pills" style={{ marginTop: 4 }}>
                      {r.tags.map(t => <span key={t} className="tag-pill-display">{t}</span>)}
                    </div>
                  )}
                </div>
                <span className="flat-row-arrow">›</span>
              </div>
            ))}
          </>
        )}
        {cookbooks.length > 0 && (
          <>
            <div className="people-section-label">Cookbooks</div>
            {cookbooks.map(cb => (
              <div key={cb.id} className="flat-row" style={{ cursor: 'default' }}>
                <div className="flat-row-info">
                  <div className="flat-row-name">{cb.name}</div>
                  <div className="flat-row-meta">{cb.recipeCount} recipe{cb.recipeCount !== 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </>
        )}
        {!publicRecipes.length && !cookbooks.length && (
          <div style={{ padding: '40px 28px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No public recipes yet</div>
        )}
      </div>

      {pickingFor && (
        <div className="sheet-overlay" onClick={() => setPickingFor(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">Save "{pickingFor.name}" to…</div>
            <div className="flat-list">
              {(myCookbooks || []).filter(cb => cb.id !== 'favourites').map(cb => (
                <div key={cb.id} className="flat-row" onClick={() => handleSaveRecipe(pickingFor, cb.id)}>
                  <div className="flat-row-info">
                    <div className="flat-row-name">{cb.name}</div>
                    <div className="flat-row-meta">{cb.recipeCount ?? 0} recipes</div>
                  </div>
                  <span className="flat-row-arrow">›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {previewRecipe && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, borderBottom: '1px solid var(--rule)', flexShrink: 0, gap: 12 }}>
            <button onClick={closePreview} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)', padding: 0 }}>← Back</button>
            {userId !== currentUserId && myCookbooks?.length > 0 && (
              <button
                onClick={() => setPickingFor(previewDetail || previewRecipe)}
                disabled={savingRecipe === previewRecipe.id}
                style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--blue)', color: 'var(--blue)', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 18px', cursor: 'pointer' }}
              >
                {savingRecipe === previewRecipe.id ? 'Saving…' : 'Save to Cookbook'}
              </button>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!previewDetail ? (
              <div style={{ padding: 40, textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loading…</div>
            ) : (
              <>
                <div className="detail-hero safe-top">
                  <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 40, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '0.02em' }}>{previewDetail.name}</h1>
                  {previewDetail.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>{previewDetail.description}</p>}
                  {previewDetail.tags?.length > 0 && (
                    <div className="tag-pills" style={{ marginTop: 10 }}>
                      {previewDetail.tags.map(t => <span key={t} className="tag-pill-display">{t}</span>)}
                    </div>
                  )}
                  <div className="detail-meta">
                    <span className="detail-meta-item">{previewDetail.time} min</span>
                    <span className="detail-meta-item">{previewDetail.difficulty}</span>
                    <span className="detail-meta-item">{previewDetail.servings} servings</span>
                  </div>
                </div>
                <div className="detail-section">
                  <h2>Ingredients</h2>
                  {previewDetail.ingredients.map((ing, idx) => (
                    <div key={ing.id || idx} className="ingredient-item">
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1 }}>
                        {ing.qty && <span className="ingredient-qty" style={{ flexShrink: 0 }}>{ing.qty}</span>}
                        <span>{ing.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="detail-section">
                  <h2>Steps</h2>
                  {previewDetail.steps.map((step, idx) => (
                    <div key={step.id || idx} className="step-preview">
                      <div className="step-num">{idx + 1}</div>
                      <div>
                        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{step.text}</div>
                        {step.timer && <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{step.timer} min timer</div>}
                      </div>
                    </div>
                  ))}
                </div>
                {userId !== currentUserId && myCookbooks?.length > 0 && (
                  <div style={{ padding: '0 20px 40px' }}>
                    <button className="btn btn-primary btn-full" style={{ height: 52, fontSize: 18 }} onClick={() => setPickingFor(previewDetail)}>
                      Save to Cookbook
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineScreen({ currentUserId, onOpenUser }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    getTimeline().then(setEvents);
  }, []);

  const handleLike = async (eventId) => {
    const isNowLiked = await toggleLike(eventId);
    setEvents(prev => prev.map(e => e.id === eventId
      ? { ...e, likedByMe: isNowLiked, likeCount: isNowLiked ? e.likeCount + 1 : e.likeCount - 1 }
      : e
    ));
  };

  const renderEvent = (event) => {
    const { id, type, userProfile, targetProfile, recipe, post_text, photo_url, created_at, likeCount, likedByMe } = event;
    const name = userProfile?.display_name || userProfile?.username || 'Someone';
    const initial = name[0].toUpperCase();

    let text = null;
    if (type === 'followed_you' && targetProfile) {
      const tname = targetProfile.display_name || targetProfile.username;
      text = <><strong>{name}</strong> followed <strong>{tname}</strong></>;
    } else if (type === 'cooked_recipe' && recipe) {
      text = <><strong>{name}</strong> cooked <strong>{recipe.name}</strong></>;
    } else if (type === 'posted') {
      text = <><strong>{name}</strong> posted a cook</>;
    } else {
      text = <strong>{name}</strong>;
    }

    return (
      <div key={id} className="event-row">
        <div className="event-header">
          <div className="event-avatar" onClick={() => userProfile && onOpenUser(userProfile.id)}>{initial}</div>
          <div className="event-meta">
            <div className="event-name">{name}</div>
            <div className="event-time">{timeAgo(created_at)}</div>
          </div>
        </div>
        {text && <div className="event-text">{text}</div>}
        {post_text && <div className="event-post-text">{post_text}</div>}
        {photo_url && <img className="event-photo" src={photo_url} alt="" />}
        <div className="event-actions">
          <button className={`like-btn${likedByMe ? ' liked' : ''}`} onClick={() => handleLike(id)}>
            {likedByMe ? '♥' : '♡'}{likeCount > 0 ? ` ${likeCount}` : ''}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="timeline-screen" style={{ paddingBottom: 72 }}>
      <div className="page-header safe-top">
        <div className="page-header-title">Timeline</div>
      </div>
      {events === null ? (
        <div style={{ padding: '40px 28px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div className="timeline-empty">Nothing here yet.<br/>Follow people to see<br/>their activity.</div>
      ) : (
        <div>{events.map(renderEvent)}</div>
      )}
    </div>
  );
}

function PostScreen({ recipe, onPost, onSkip }) {
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);
  const MAX_CHARS = 300;

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      let uploadedUrl = null;
      if (photo) uploadedUrl = await uploadPostPhoto(photo);
      await onPost(text.trim(), uploadedUrl);
    } catch (err) {
      console.error(err);
      setPosting(false);
    }
  };

  return (
    <div className="post-screen">
      <div className="back-row safe-top">
        <button className="back-btn" onClick={onSkip}>← Skip</button>
      </div>
      <div className="page-header" style={{ paddingTop: 12 }}>
        <div className="page-header-title">Share your cook</div>
        <p className="page-header-sub">{recipe.name}</p>
      </div>
      <div className="form-body scroll-body pb-safe" style={{ flex: 1 }}>
        <div className="form-field">
          <label className="form-label">How did it go?</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Any tweaks? Worth making again?"
            value={text}
            onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
            style={{ minHeight: 100 }}
          />
          <div className="char-count">{text.length}/{MAX_CHARS}</div>
        </div>
        <div className="form-field">
          <label className="form-label">Photo (optional)</label>
          {photoPreview ? (
            <div className="photo-preview">
              <img src={photoPreview} alt="Post" />
              <button className="photo-remove" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>×</button>
            </div>
          ) : (
            <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              <span className="photo-upload-icon">&#128247;</span>
              <span className="photo-upload-label">Tap to add a photo</span>
            </div>
          )}
        </div>
        <button
          className="btn btn-primary btn-full"
          style={{ height: 52, fontSize: 18 }}
          disabled={(!text.trim() && !photo) || posting}
          onClick={handlePost}
        >
          {posting ? 'Posting...' : 'Post to timeline'}
        </button>
        <button onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 0', alignSelf: 'center' }}>
          Skip
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = no user
  const [profile, setProfile] = useState(null);
  const [cookbooks, setCookbooks] = useState([]);
  const [recipesMap, setRecipesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [screen, setScreen] = useState({ name: 'home' });
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [favouriteRecipes, setFavouriteRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [mainTab, setMainTab] = useState('feed');
  const [pendingAddRecipeId, setPendingAddRecipeId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([getCookbooks(), getFavouriteIds(), getFavouriteRecipes(), getShoppingList(), getProfile(user.id)])
      .then(([cbs, favIds, favRecs, shop, prof]) => {
        setCookbooks(cbs);
        setFavouriteIds(new Set(favIds));
        setFavouriteRecipes(favRecs);
        setShoppingList(shop);
        setProfile(prof);
        setLoading(false);
      });
  }, [user]);

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

  const handleTabChange = (tab) => {
    if (tab === 'profile') {
      navigate('profile');
    } else {
      setMainTab(tab);
      if (screen.name !== 'home') navigate('home');
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
    await createEvent('cooked_recipe', { recipeId: rId });
    navigate('done', { cbId, rId });
  };

  const handleSaveFeedback = async (cbId, rId, ease, taste, overall, notes) => {
    await saveRecipeFeedback(rId, ease, taste, overall, notes);
    navigate('post', { cbId, rId });
  };

  const handlePost = async (cbId, rId, postText, photoUrl) => {
    await createEvent('posted', { recipeId: rId, postText: postText || null, photoUrl: photoUrl || null });
    navigate('recipe', { cbId, rId });
  };

  const handleEditRecipe = async (cbId, rId, data) => {
    setSaving(true);
    try {
      await updateRecipe(rId, data);
      const updated = await getRecipes(cbId);
      setRecipesMap(prev => ({ ...prev, [cbId]: updated }));
      navigate('cookbook', { cbId, rId });
    } catch (err) {
      alert('Failed to save recipe: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRecipePublic = (cbId, rId, isPublic) => {
    setRecipesMap(prev => ({
      ...prev,
      [cbId]: (prev[cbId] || []).map(r => r.id === rId ? { ...r, isPublic } : r),
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const profileInitial = (profile?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase();

  const { name: s, cbId, rId } = screen;
  const cb = cbId ? getCookbook(cbId) : null;
  const recipe = (cbId && rId) ? getRecipe(cbId, rId) : null;
  const shoppingRecipeIds = new Set(shoppingList.map(i => i.recipe_id).filter(Boolean));

  const activeFooterTab = (() => {
    if (s === 'profile') return 'profile';
    if (['cookbook', 'new-cookbook', 'new-recipe', 'edit-recipe', 'recipe', 'prep'].includes(s)) return 'cookbooks';
    if (s === 'home') return mainTab;
    return mainTab;
  })();

  if (user === undefined) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="loading-screen">
          <img src="/logo.png" alt="The Pass" className="loading-logo" style={{ width: 220, height: 'auto' }} />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{STYLES}</style>
        <AuthScreen onAuth={() => setLoading(true)} />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="loading-screen">
          <img src="/logo.png" alt="The Pass" className="loading-logo" style={{ width: 220, height: 'auto' }} />
        </div>
      </>
    );
  }

  const handleOpenRecipe = (recipe) => {
    navigate('cookbook', { cbId: recipe.cookbookId, rId: recipe.id });
  };

  if (s === 'cook' && recipe) {
    return (
      <>
        <style>{STYLES}</style>
        <CookModeScreen recipe={recipe} onFinish={() => handleFinishCook(cbId, rId)} />
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <AppHeader onSearch={() => navigate('search')} onProfile={() => navigate('profile')} />
      <div className="app-content">
        <div className="app-content-inner">
          {s === 'home' && (
            <HomeScreen
              cookbooks={cookbooks}
              shoppingList={shoppingList}
              onOpenCookbook={id => navigate('cookbook', { cbId: id })}
              onNewCookbook={() => navigate('new-cookbook')}
              onToggleShoppingItem={handleToggleShoppingItem}
              onDeleteShoppingItem={handleDeleteShoppingItem}
              onClearShoppingList={handleClearShoppingList}
              currentUserId={user.id}
              onOpenUser={userId => navigate('user-profile', { userId })}
              activeTab={mainTab}
              profileInitial={profileInitial}
              onOpenSearch={() => navigate('search')}
              onOpenProfile={() => navigate('profile')}
            />
          )}
          {s === 'search' && (
            <SearchScreen
              onBack={() => navigate('home')}
              onOpenUser={userId => navigate('user-profile', { userId })}
              currentUserId={user.id}
            />
          )}
          {s === 'user-profile' && screen.userId && (
            <UserPublicProfileScreen
              userId={screen.userId}
              currentUserId={user.id}
              onBack={() => navigate(screen._from || 'home')}
              myCookbooks={cookbooks}
              onRecipeSaved={(cbId) => {
                getRecipes(cbId).then(recipes => setRecipesMap(prev => ({ ...prev, [cbId]: recipes })));
              }}
            />
          )}
          {s === 'profile' && (
            <ProfileScreen
              user={user}
              onBack={() => navigate('home')}
              onLogout={handleLogout}
            />
          )}
          {s === 'new-cookbook' && <NewCookbookScreen onBack={() => navigate('home')} onSave={handleNewCookbook} saving={saving} />}
          {s === 'cookbook' && cb && (
            <CookbookScreen
              cookbook={cb}
              onBack={() => { setMainTab('cookbooks'); navigate('home'); }}
              onNewRecipe={() => navigate('new-recipe', { cbId })}
              onStartCook={(rId) => navigate('prep', { cbId: cb.id, rId })}
              favouriteIds={favouriteIds}
              onToggleFavourite={handleToggleFavourite}
              onAddToCookbook={handleOpenAddToCookbook}
              onOpenAddToList={handleOpenAddToList}
              shoppingRecipeIds={shoppingRecipeIds}
              initialRecipeId={rId || null}
              onEditRecipe={(cbId, rId) => navigate('edit-recipe', { cbId, rId })}
              currentUserId={user.id}
              onTogglePublic={handleToggleRecipePublic}
            />
          )}
          {s === 'new-recipe' && cb && <RecipeFormScreen onBack={() => navigate('cookbook', { cbId })} onSave={data => handleNewRecipe(cbId, data)} saving={saving} unitPreference={profile?.unit_preference || 'metric'} />}
          {s === 'edit-recipe' && cb && recipe && <RecipeFormScreen initialData={recipe} onBack={() => navigate('cookbook', { cbId, rId })} onSave={data => handleEditRecipe(cbId, rId, data)} saving={saving} unitPreference={profile?.unit_preference || 'metric'} />}
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
              onEdit={() => navigate('edit-recipe', { cbId, rId })}
              currentUserId={user.id}
              onTogglePublic={(rId, isPublic) => handleToggleRecipePublic(cbId, rId, isPublic)}
            />
          )}
          {s === 'prep' && cb && recipe && <PrepChecklistScreen recipe={recipe} onBack={() => navigate('recipe', { cbId, rId })} onStart={() => navigate('cook', { cbId, rId })} />}
          {s === 'done' && recipe && <DoneScreen recipe={recipe} onContinue={() => navigate('feedback', { cbId, rId })} />}
          {s === 'feedback' && recipe && <FeedbackScreen recipe={recipe} onSave={(e, t, o, n) => handleSaveFeedback(cbId, rId, e, t, o, n)} onSkip={() => navigate('post', { cbId, rId })} />}
          {s === 'post' && recipe && <PostScreen recipe={recipe} onPost={(text, url) => handlePost(cbId, rId, text, url)} onSkip={() => navigate('recipe', { cbId, rId })} />}
        </div>
      </div>
      <AppFooter activeTab={activeFooterTab} onChangeTab={handleTabChange} />
      {sheet?.type === 'addToCookbook' && (
        <AddToCookbookSheet cookbooks={cookbooks} currentCbId={sheet.currentCbId} onSelect={handleSelectCookbookForAdd} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'addToList' && (
        <AddToListSheet recipe={sheet.recipe} onSelect={(priority) => handleAddToShoppingList(sheet.recipe, priority)} onClose={() => setSheet(null)} />
      )}
    </>
  );
}
