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
  setRecipePublic,
  publishRecipe, saveRecipeToLibrary, unsaveRecipe, isRecipeSaved, getSavedRecipeIds,
  getAnnotations, saveAnnotation, updateAnnotation, deleteAnnotation,
  getPublicRecipes, getRecipeWithAuthor, formatCount, searchPublicRecipes,
  getDailyPicks, getRandomSuggestions, getTrendingRecipes,
  addRecipePhoto, getRecipePhotos, deleteRecipePhoto, attachExistingPhotoToRecipe,
} from '../lib/db';
import { supabase } from '../lib/supabase';
import { track } from '../lib/analytics';

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
  .btn-red:disabled { background: var(--rule); color: var(--text-muted); cursor: not-allowed; opacity: 0.7; }
  .btn-red:disabled:hover { background: var(--rule); }
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

  /* ── Cook mode (light theme) ────────────────────────── */
  .cook-screen { background: var(--paper); height: 100vh; height: 100dvh; display: flex; flex-direction: column; position: relative; overflow: hidden; }
  .cook-header {
    height: 52px; padding: 0 24px; border-bottom: 1px solid var(--rule); background: var(--paper);
    display: flex; align-items: center; gap: 12px; flex-shrink: 0;
  }
  .cook-header-exit {
    background: none; border: none; cursor: pointer; padding: 0;
    font-family: 'DM Mono', monospace; font-size: 14px; color: var(--text-primary);
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  }
  .cook-header-title {
    flex: 1; text-align: center; font-family: 'DM Mono', monospace; font-weight: 400;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cook-header-counter {
    font-family: 'DM Mono', monospace; font-weight: 300; font-size: 11px;
    color: var(--text-secondary); min-width: 40px; text-align: right;
  }
  .cook-body { flex: 1; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; }
  .cook-prev {
    background: var(--paper); padding: 16px 24px; border-bottom: 1px solid var(--rule);
  }
  .cook-prev-label {
    font-family: 'DM Mono', monospace; font-weight: 400; font-size: 9px;
    letter-spacing: 0.14em; text-transform: uppercase; color: #B8B0A8; margin-bottom: 6px;
  }
  .cook-prev-text {
    font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; line-height: 1.6;
    color: #B8B0A8; text-decoration: line-through;
  }
  .cook-current {
    background: #FFFFFF; padding: 24px;
    border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
  }
  .cook-step-label {
    font-family: 'DM Mono', monospace; font-weight: 400; font-size: 9px;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--blue); margin-bottom: 14px;
  }
  .cook-current-text {
    font-family: 'Cormorant Garamond', serif; font-weight: 400; font-style: italic;
    font-size: 22px; line-height: 1.65; color: var(--text-primary); margin: 0;
  }
  .cook-next {
    background: var(--paper); padding: 16px 24px;
  }
  .cook-next-label {
    font-family: 'DM Mono', monospace; font-weight: 400; font-size: 9px;
    letter-spacing: 0.14em; text-transform: uppercase; color: #B8B0A8; margin-bottom: 6px;
  }
  .cook-next-text {
    font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 300; line-height: 1.6; color: #B8B0A8;
  }
  .cook-dots { display: flex; gap: 4px; align-items: center; justify-content: center; padding: 18px 24px 8px; }
  .cook-dot { width: 4px; height: 4px; background: #EDEAE4; transition: all 0.2s; }
  .cook-dot.active { background: var(--blue); width: 16px; }
  .cook-dot.done { background: var(--rule); }

  .cook-timer-widget {
    margin-top: 16px; background: var(--paper); border: 1px solid var(--rule);
    padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .cook-timer-display { font-family: 'DM Mono', monospace; font-weight: 400; font-size: 28px; color: var(--text-primary); line-height: 1; }
  .cook-timer-sub { font-family: 'DM Mono', monospace; font-weight: 300; font-size: 10px; color: var(--text-muted); margin-top: 4px; }
  .cook-timer-btn-w {
    background: transparent; border: 1px solid var(--rule); padding: 8px 14px; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
    text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); border-radius: 0;
  }
  .cook-timer-btn-w.running { border-color: var(--blue); color: var(--blue); }
  .cook-timer-btn-w.done { background: var(--blue); color: var(--white); border-color: var(--blue); }

  .cook-footer {
    height: calc(56px + env(safe-area-inset-bottom, 0px));
    padding: 8px 24px calc(8px + env(safe-area-inset-bottom, 0px));
    background: var(--paper); border-top: 1px solid var(--rule);
    display: flex; align-items: center; gap: 12px; flex-shrink: 0; z-index: 10;
  }
  .cook-nav-back {
    width: 56px; height: 40px; border: 1px solid var(--rule); background: transparent;
    cursor: pointer; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
    text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); border-radius: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .cook-nav-back:disabled { opacity: 0.3; cursor: not-allowed; }
  .cook-nav-next {
    flex: 1; height: 40px; border: none; background: var(--blue); color: var(--white);
    cursor: pointer; font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
    text-transform: uppercase; letter-spacing: 0.1em; border-radius: 0;
  }
  .cook-nav-next:hover { background: var(--blue-dark); }

  /* Old drawers — keep light-theme equivalents for ingredients/timers */
  .timers-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: min(320px, 88vw); background: var(--paper); border-left: 1px solid var(--rule); z-index: 50; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.22s cubic-bezier(.4,0,.2,1); }
  .timers-drawer.open { transform: translateX(0); }
  .ingr-drawer { position: absolute; top: 0; left: 0; bottom: 0; width: min(320px, 88vw); background: var(--paper); border-right: 1px solid var(--rule); z-index: 50; display: flex; flex-direction: column; transform: translateX(-100%); transition: transform 0.22s cubic-bezier(.4,0,.2,1); }
  .ingr-drawer.open { transform: translateX(0); }
  .timers-drawer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.25); z-index: 49; }
  .timers-drawer-head { padding: 20px 20px 14px; border-bottom: 1px solid var(--rule); display: flex; align-items: center; justify-content: space-between; }
  .timers-drawer-title { font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-muted); }
  .timers-drawer-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); padding: 0 4px; line-height: 1; }
  .timers-drawer-close:hover { color: var(--text-primary); }
  .timers-drawer-body { flex: 1; overflow-y: auto; }
  .timers-drawer-empty { padding: 40px 20px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; line-height: 2; }

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

  /* ── Cookbook list rows (single-column, no split panel) ───────────── */
  .recipe-list-rows { display: block; }
  .recipe-list-row { padding: 14px 24px; cursor: pointer; border-bottom: 1px solid var(--rule); transition: background 0.1s; background: transparent; }
  .recipe-list-row:hover { background: var(--surface); }
  .recipe-list-row-name { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 400; color: var(--text-primary); line-height: 1.4; letter-spacing: 0.02em; }
  .recipe-list-row-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 300; }

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

  /* ── Unified app shell (every screen, every width) ───── */
  .app-header {
    display: flex; position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 100;
    background: var(--paper); border-bottom: 1px solid var(--rule);
    align-items: center; padding: 0 24px; gap: 8px;
  }
  .app-header-spacer { flex: 1; }
  .app-header-btn {
    width: 36px; height: 36px; background: none; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-primary); transition: opacity 0.15s;
  }
  .app-header-btn:hover { opacity: 0.6; }
  .app-header-back {
    background: none; border: none; cursor: pointer; display: flex; align-items: center;
    gap: 6px; color: var(--text-primary); padding: 0;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
    text-transform: uppercase; letter-spacing: 0.1em; max-width: 40%;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .app-header-title {
    flex: 1; text-align: center; font-family: 'DM Mono', monospace; font-weight: 400;
    font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;
    margin: 0 auto;
  }
  .app-header-action {
    background: none; border: none; cursor: pointer; padding: 0;
    font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 400;
    text-transform: uppercase; letter-spacing: 0.1em; color: var(--blue);
    white-space: nowrap; max-width: 30%; overflow: hidden; text-overflow: ellipsis;
  }
  .app-footer {
    display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 56px; z-index: 100;
    background: var(--paper); border-top: 1px solid var(--rule);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
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
  .app-content {
    position: fixed; top: 52px; bottom: 56px; left: 0; right: 0;
    overflow-y: auto; -webkit-overflow-scrolling: touch; background: var(--paper);
  }
  .app-content-inner { max-width: 480px; margin: 0 auto; }
  .home-header { display: none; }
  .home-wrapper { height: auto !important; overflow: visible !important; }
  /* The 3-column desktop home layout is gone — only the active tab column shows. */
  .home-body { display: block !important; }
  .home-col { display: none; }
  .home-col.active { display: block; }

  /* ── Screen transitions ──────────────────────────────── */
  @keyframes screen-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes screen-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .screen-enter-drill { animation: screen-slide-in 200ms ease-out; }
  .screen-enter-fade { animation: screen-fade-in 150ms ease-out; }

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

// Whitelist of valid units. Single letters like "g" or "l" only match when
// they're a standalone token (followed by whitespace or end of string), so
// "1 garlic" no longer extracts "g" from "garlic".
const INGREDIENT_UNITS = [
  'kilograms', 'kilogram', 'kg', 'pounds', 'pound', 'lbs', 'lb',
  'ounces', 'ounce', 'oz', 'grams', 'gram', 'g',
  'tablespoons', 'tablespoon', 'tbsp', 'teaspoons', 'teaspoon', 'tsp',
  'litres', 'litre', 'liters', 'liter',
  'pints', 'pint', 'cups', 'cup',
  'fl\\s+oz',
  'ml', 'dl', 'cl', 'l',
  'pinches', 'pinch', 'handfuls', 'handful', 'bunches', 'bunch',
  'cloves', 'clove', 'slices', 'slice', 'pieces', 'piece',
  'sprigs', 'sprig', 'sheets', 'sheet', 'rashers', 'rasher',
  'cans', 'can', 'tins', 'tin', 'jars', 'jar', 'packs', 'pack', 'bags', 'bag',
];
const INGREDIENT_UNIT_PATTERN = [...INGREDIENT_UNITS].sort((a, b) => b.length - a.length).join('|');
const INGREDIENT_QTY_RE = new RegExp(
  `^([\\d./⅓⅔¼½¾⅛⅜⅝⅞]+(?:\\s+\\d+/\\d+)?)\\s*(?:(${INGREDIENT_UNIT_PATTERN})(?=\\s|$))?`,
  'i'
);

function parseIngredientLine(line) {
  line = line.trim().replace(/^[-•*]\s*/, '');
  if (!line) return null;
  const m = line.match(INGREDIENT_QTY_RE);
  if (!m || !m[1]) return { qty: '', name: line };
  const rest = line.slice(m[0].length).trim();
  if (!rest) return { qty: '', name: line };
  return { qty: m[0].trim(), name: rest };
}

function convertQty(qty, toPreference) {
  if (!qty) return qty;
  // Tablespoons and teaspoons are kept as-is in both directions — they're
  // universal kitchen measures, converting them to ml just makes recipes
  // harder to follow.
  const toMetric = { cup: [240,'ml'], cups: [240,'ml'], 'fl oz': [30,'ml'], oz: [28.35,'g'], ounce: [28.35,'g'], ounces: [28.35,'g'], lb: [453.6,'g'], lbs: [453.6,'g'], pound: [453.6,'g'], pounds: [453.6,'g'] };
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
    if (unit === 'ml') { if (num <= 60) return qty; return `${round(num/240)} cups`; }
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

function AppHeader(props) {
  // Variant B (drill-down): back arrow + label | centered title | optional right action
  if (props.variant === 'drill') {
    return (
      <header className="app-header">
        <button className="app-header-back" onClick={props.onBack}>
          <span aria-hidden>←</span>
          {props.backLabel && <span>{props.backLabel}</span>}
        </button>
        <span className="app-header-title">{props.title || ''}</span>
        {props.action ? (
          <button className="app-header-action" onClick={props.action.onClick}>{props.action.label}</button>
        ) : <span style={{ width: 1 }} />}
      </header>
    );
  }
  // Variant A (root): logo | spacer | search + profile
  return (
    <header className="app-header">
      <img src="/logo.png" alt="The Pass" style={{ height: 24, width: 'auto' }} />
      <div className="app-header-spacer" />
      <button className="app-header-btn" onClick={props.onSearch} aria-label="Search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <button className="app-header-btn" onClick={props.onProfile} aria-label="Profile">
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
      <button className={`app-footer-tab${activeTab === 'discover' ? ' active' : ''}`} onClick={() => onChangeTab('discover')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
        <span className="app-footer-label">Discover</span>
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

function HomeScreen({ cookbooks, shoppingList, onOpenCookbook, onNewCookbook, onToggleShoppingItem, onDeleteShoppingItem, onClearShoppingList, currentUserId, onOpenUser, activeTab, profileInitial, onOpenSearch, onOpenProfile, onOpenPublicRecipe, savedRecipeIds, onSaveToLibrary }) {
  const [collapsed, setCollapsed] = useState({});
  const [collapsedRecipes, setCollapsedRecipes] = useState({});
  const [events, setEvents] = useState(null);
  const [community, setCommunity] = useState(null);

  const togglePriority = (p) => setCollapsed(prev => ({ ...prev, [p]: !prev[p] }));
  const toggleRecipe = (key) => setCollapsedRecipes(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => { getTimeline().then(setEvents); }, [currentUserId]);
  useEffect(() => { getPublicRecipes(10, 0).then(setCommunity); }, [currentUserId]);

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
            <button className="home-cb-list-row" onClick={() => onOpenCookbook('community')}>
              <span className="home-cb-list-name">Community Recipes</span>
              <span className="home-cb-list-count" style={{ color: 'var(--blue)' }}>↗</span>
            </button>
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

          {community && community.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid var(--rule)' }}>
              <div style={{ padding: '20px 16px 10px', fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--text-muted)' }}>
                From the community
              </div>
              {community.map((r, i) => {
                const saved = savedRecipeIds?.has?.(r.id) ?? false;
                return (
                  <div
                    key={r.id}
                    onClick={() => onOpenPublicRecipe?.(r.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '14px 16px', cursor: 'pointer',
                      borderTop: i === 0 ? 'none' : '1px solid var(--rule)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic', fontSize: 16, color: 'var(--ink)', lineHeight: 1.25 }}>
                        {r.name}
                      </div>
                      {r.author && (
                        <div
                          onClick={(e) => { e.stopPropagation(); onOpenUser?.(r.author.id); }}
                          style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}
                        >
                          By @{r.author.username}
                        </div>
                      )}
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {[r.time && `${r.time} min`, r.difficulty].filter(Boolean).join(' · ')}
                      </div>
                      {r.cookedCount > 0 && (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          Cooked {formatCount(r.cookedCount)} time{r.cookedCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); !saved && onSaveToLibrary?.(r.id, null); }}
                      disabled={saved}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: saved ? 'default' : 'pointer',
                        fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 400,
                        color: saved ? 'var(--text-muted)' : 'var(--blue)',
                        textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, marginTop: 2,
                      }}
                    >
                      {saved ? '✓ Saved' : 'Save'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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

function DiscoverPickCard({ recipe, onOpen, onSave, saved }) {
  return (
    <div style={{ padding: '20px 20px', borderBottom: '1px solid var(--rule)' }}>
      <div onClick={onOpen} style={{ cursor: 'pointer' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic', fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>
          {recipe.name}
        </div>
        {recipe.author && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
            By @{recipe.author.username}
          </div>
        )}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {[recipe.time && `${recipe.time} min`, recipe.difficulty].filter(Boolean).join(' · ')}
        </div>
        {recipe.cookedCount > 0 && (
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Cooked {formatCount(recipe.cookedCount)} time{recipe.cookedCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button
          onClick={onSave}
          disabled={saved}
          style={{
            flex: 1, height: 40, border: '1px solid var(--text-primary)', background: 'transparent',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: saved ? 'var(--text-muted)' : 'var(--text-primary)',
            borderColor: saved ? 'var(--rule)' : 'var(--text-primary)',
            cursor: saved ? 'default' : 'pointer', borderRadius: 0,
          }}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
        <button
          onClick={onOpen}
          style={{
            flex: 1, height: 40, border: 'none', background: 'var(--blue)',
            color: 'var(--white)',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            cursor: 'pointer', borderRadius: 0,
          }}
        >
          Cook now →
        </button>
      </div>
    </div>
  );
}

function DiscoverScreen({ currentUserId, onOpenRecipe, onSaveToLibrary, savedRecipeIds }) {
  const [picks, setPicks] = useState(null);
  const [extras, setExtras] = useState([]);
  const [hasLoadedExtras, setHasLoadedExtras] = useState(false);
  const [trending, setTrending] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    track('discovery_opened');
    getDailyPicks(currentUserId, 5).then(setPicks);
    getTrendingRecipes(7, 10).then(setTrending);
  }, [currentUserId]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const shown = [...(picks || []), ...extras].map(r => r.id);
      const more = await getRandomSuggestions(currentUserId, 5, shown);
      setExtras(prev => [...prev, ...more]);
      setHasLoadedExtras(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="screen">
      <div className="page-header safe-top" style={{ paddingBottom: 16 }}>
        <div className="page-header-title">Discover</div>
        <div className="page-header-sub">{today}</div>
      </div>

      <div className="scroll-body pb-safe">
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-primary)' }}>Today's Picks</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Refreshes daily</div>
        </div>
        {picks === null ? (
          <div style={{ padding: '20px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>Loading…</div>
        ) : picks.length === 0 ? (
          <div style={{ padding: '20px', fontFamily: "'Courier Prime', 'Courier New', monospace", fontSize: 14, color: 'var(--text-muted)' }}>No picks today — you've cooked or saved everything we have!</div>
        ) : (
          picks.map(r => (
            <DiscoverPickCard
              key={r.id}
              recipe={r}
              onOpen={() => onOpenRecipe?.(r.id)}
              onSave={() => onSaveToLibrary?.(r.id, null)}
              saved={savedRecipeIds?.has?.(r.id) ?? false}
            />
          ))
        )}
        {extras.map(r => (
          <DiscoverPickCard
            key={r.id}
            recipe={r}
            onOpen={() => onOpenRecipe?.(r.id)}
            onSave={() => onSaveToLibrary?.(r.id, null)}
            saved={savedRecipeIds?.has?.(r.id) ?? false}
          />
        ))}
        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              width: '100%', height: 40, border: '1px solid var(--rule)', background: 'transparent',
              fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-primary)', cursor: loadingMore ? 'default' : 'pointer', borderRadius: 0,
            }}
          >
            {loadingMore ? '…' : (hasLoadedExtras ? '↻ Load more' : '↻ More suggestions')}
          </button>
        </div>

        <div style={{ padding: '20px 20px 8px', marginTop: 12, borderTop: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--text-primary)' }}>Trending This Week</div>
        </div>
        {trending === null ? (
          <div style={{ padding: '20px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)' }}>Loading…</div>
        ) : trending.length === 0 ? (
          <div style={{ padding: '20px', fontFamily: "'Courier Prime', 'Courier New', monospace", fontSize: 14, color: 'var(--text-muted)' }}>No trending recipes yet — be the first to cook!</div>
        ) : (
          trending.map(r => (
            <div key={r.id} className="flat-row" onClick={() => onOpenRecipe?.(r.id)}>
              <div className="flat-row-info">
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic', fontSize: 16, color: 'var(--ink)', lineHeight: 1.25 }}>
                  {r.name}
                </div>
                {r.author && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    By @{r.author.username}
                  </div>
                )}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {[r.time && `${r.time} min`, r.difficulty].filter(Boolean).join(' · ')}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Cooked {formatCount(r.weeklyCount)} time{r.weeklyCount !== 1 ? 's' : ''} this week
                </div>
              </div>
              <span className="flat-row-arrow">›</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CommunityCookbookScreen({ onBack, onOpenRecipe }) {
  const [query, setQuery] = useState('');
  const [timeBucket, setTimeBucket] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [recipes, setRecipes] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Reset pagination when filters change
  useEffect(() => {
    setRecipes([]);
    setPage(0);
    setHasMore(true);
  }, [query, timeBucket, difficulty]);

  useEffect(() => {
    const filters = { ...TIME_BUCKETS[timeBucket], ...(difficulty !== 'All' ? { difficulty } : {}) };
    setLoading(true);
    const t = setTimeout(() => {
      searchPublicRecipes(query, filters, page, 20).then(more => {
        setRecipes(prev => page === 0 ? more : [...prev, ...more]);
        setHasMore(more.length === 20);
        setLoading(false);
      });
      if (query.trim() && page === 0) track('search_performed');
    }, 250);
    return () => clearTimeout(t);
  }, [query, timeBucket, difficulty, page]);

  return (
    <div className="screen">
      <div className="page-header" style={{ paddingTop: 12 }}>
        <div className="page-header-sub">All public recipes from The Pass community</div>
      </div>
      <div className="search-input-wrap">
        <input
          className="search-input"
          placeholder="Search…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div style={{ padding: '6px 28px 4px', display: 'flex', flexWrap: 'wrap' }}>
        {Object.keys(TIME_BUCKETS).map(b => (
          <FilterPill key={b} label={b} active={timeBucket === b} onClick={() => setTimeBucket(b)} />
        ))}
      </div>
      <div style={{ padding: '0 28px 12px', display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--rule)' }}>
        {['All', 'Easy', 'Medium', 'Advanced'].map(d => (
          <FilterPill key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
        ))}
      </div>
      <div className="scroll-body pb-safe">
        {recipes.length === 0 && !loading ? (
          <div style={{ padding: '40px 28px', fontFamily: "'Courier Prime', 'Courier New', monospace", fontSize: 14, color: 'var(--text-muted)' }}>
            No recipes found
          </div>
        ) : (
          recipes.map(r => (
            <div key={r.id} className="flat-row" onClick={() => onOpenRecipe?.(r.id)}>
              <div className="flat-row-info">
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic', fontSize: 16, color: 'var(--ink)', lineHeight: 1.25 }}>
                  {r.name}
                </div>
                {r.author && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    By @{r.author.username}
                  </div>
                )}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {[r.time && `${r.time} min`, r.difficulty].filter(Boolean).join(' · ')}
                </div>
                {r.cookedCount > 0 && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Cooked {formatCount(r.cookedCount)} time{r.cookedCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <span className="flat-row-arrow">›</span>
            </div>
          ))
        )}
        {hasMore && recipes.length > 0 && (
          <div style={{ padding: '16px 20px' }}>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={loading}
              style={{
                width: '100%', height: 40, border: '1px solid var(--rule)', background: 'transparent',
                fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-primary)', cursor: loading ? 'default' : 'pointer', borderRadius: 0,
              }}
            >
              {loading ? '…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NewCookbookScreen({ onBack, onSave, saving }) {
  const [name, setName] = useState('');
  return (
    <div className="form-screen">
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

function CookbookScreen({ cookbook, onNewRecipe, onOpenRecipe }) {
  const recipes = cookbook.recipes || [];
  const isLoading = cookbook.recipes === null;

  return (
    <div className="screen">
      {isLoading ? (
        <div style={{ padding: '32px 24px', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading…</div>
      ) : recipes.length === 0 ? (
        <div style={{ padding: '60px 24px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          No recipes yet
        </div>
      ) : (
        <div className="recipe-list-rows">
          {recipes.map(r => (
            <div key={r.id} className="recipe-list-row" onClick={() => onOpenRecipe(r.id)}>
              <div className="recipe-list-row-name">{r.name}</div>
              <div className="recipe-list-row-meta">
                {r.time} min · {r.difficulty}
                {r.lastCookedAt ? ` · ${timeAgo(r.lastCookedAt)}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '20px 24px 28px' }}>
        <button className="btn btn-black btn-full" style={{ fontSize: 14, height: 44 }} onClick={onNewRecipe}>+ Add Recipe</button>
      </div>
    </div>
  );
}

function RecipeFormScreen({ initialData, onBack, onSave, saving, unitPreference = 'metric' }) {
  const isEdit = !!initialData;
  const [tab, setTab] = useState(0);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [time, setTime] = useState(initialData?.time || 30);
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Easy');
  const [servings, setServings] = useState(String(initialData?.servings ?? 2));
  const [tags, setTags] = useState(initialData?.tags || []);
  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length ? initialData.ingredients.map(i => ({ ...i, id: i.id || generateId() })) : [{ id: generateId(), name: '', qty: '' }]
  );
  const [steps, setSteps] = useState(
    initialData?.steps?.length ? initialData.steps.map(s => ({ ...s, id: s.id || generateId(), hasTimer: !!s.timer })) : [{ id: generateId(), text: '', timer: null, hasTimer: false }]
  );
  const [isPublic, setIsPublic] = useState(initialData?.isPublic || false);
  // Paste is the default for new recipes; existing recipes (edit mode) start
  // in one-by-one mode so users see what they already have.
  const [ingMode, setIngMode] = useState(isEdit ? 'manual' : 'paste');
  const [ingPaste, setIngPaste] = useState('');
  const [stepMode, setStepMode] = useState(isEdit ? 'manual' : 'paste');
  const [stepPaste, setStepPaste] = useState('');
  const [showStepHelp, setShowStepHelp] = useState(false);

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
  const moveStep = (idx, dir) => setSteps(p => {
    const j = idx + dir;
    if (j < 0 || j >= p.length) return p;
    const next = p.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    return next;
  });
  const insertStepAfter = (idx) => setSteps(p => {
    const next = p.slice();
    next.splice(idx + 1, 0, { id: generateId(), text: '', timer: null, hasTimer: false });
    return next;
  });

  // Treat unparsed paste content as "filled" so the Save button enables once
  // the user has clearly entered ingredients/steps even if they haven't hit
  // Apply yet. handleSave below applies any pending paste before saving.
  const detailsComplete = !!name.trim();
  const ingredientsComplete = ingredients.some(i => i.name.trim()) || (ingMode === 'paste' && ingPaste.trim().length > 0);
  const stepsComplete = steps.some(s => s.text.trim()) || (stepMode === 'paste' && stepPaste.trim().length > 0);
  const filledStepCount = steps.filter(s => s.text.trim()).length;

  const missing = [
    !detailsComplete && 'a name',
    !ingredientsComplete && 'an ingredient',
    !stepsComplete && 'a step',
  ].filter(Boolean);

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

  const canSave = detailsComplete && ingredientsComplete && stepsComplete;
  const handleSave = () => {
    // Auto-apply any unparsed paste content so a user who typed in the paste
    // box but didn't tap Apply doesn't hit a confusing validation error.
    let finalIngredients = ingredients;
    if (ingMode === 'paste' && ingPaste.trim()) {
      const parsed = ingPaste.split('\n').map(parseIngredientLine).filter(Boolean)
        .map(p => ({ id: generateId(), name: p.name, qty: convertQty(p.qty, unitPreference) }));
      if (parsed.length) finalIngredients = ingredients.some(i => i.name.trim()) ? [...ingredients, ...parsed] : parsed;
    }
    let finalSteps = steps;
    if (stepMode === 'paste' && stepPaste.trim()) {
      const parsed = parseStepsFromText(stepPaste).map(text => ({ id: generateId(), text, timer: null, hasTimer: false }));
      if (parsed.length) finalSteps = steps.some(s => s.text.trim()) ? [...steps, ...parsed] : parsed;
    }

    const ingredientsToSave = finalIngredients.filter(i => i.name.trim());
    const stepsToSave = finalSteps.filter(s => s.text.trim()).map(s => ({ ...s, timer: s.hasTimer ? (parseInt(s.timer) || null) : null }));

    if (!name.trim() || !ingredientsToSave.length || !stepsToSave.length) return;

    onSave({
      name: name.trim(), description: description.trim(),
      time: parseInt(time) || 30, difficulty,
      servings: parseInt(servings) || 1,
      tags, isPublic,
      ingredients: ingredientsToSave,
      steps: stepsToSave,
    });
  };

  const tabProgress = [
    { label: 'Details', complete: detailsComplete },
    { label: 'Ingredients', complete: ingredientsComplete },
    { label: 'Steps', complete: stepsComplete },
  ];

  return (
    <div className="form-screen">
      <div style={{ padding: '12px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, borderBottom: '1px solid var(--rule)' }}>
        {missing.length > 0 && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Add {missing.join(' + ')}
          </span>
        )}
        <button
          className="btn btn-red btn-sm"
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
        </button>
      </div>
      <div style={{ padding: '0 28px 12px', borderBottom: '1px solid var(--rule)' }}>
        <input className="form-input" placeholder="e.g. Spaghetti Carbonara" value={name} onChange={e => setName(e.target.value)} style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 28, fontWeight: 300, letterSpacing: '0.01em', border: 'none', padding: '12px 0', background: 'transparent', width: '100%' }} />
      </div>
      <div className="tabs">
        {tabProgress.map((t, i) => {
          const isCurrent = tab === i;
          const isComplete = t.complete && !isCurrent;
          const color = isComplete ? 'var(--blue)' : isCurrent ? 'var(--text-primary)' : 'var(--text-muted)';
          return (
            <button
              key={t.label}
              className="tab"
              onClick={() => setTab(i)}
              style={{ color, borderBottomColor: isCurrent ? 'var(--blue)' : 'transparent' }}
            >
              {isComplete && <span aria-hidden style={{ marginRight: 6 }}>✓</span>}
              {t.label}
              {i < 2 && <span aria-hidden style={{ marginLeft: 8, color: 'var(--text-muted)' }}>→</span>}
            </button>
          );
        })}
      </div>
      <div className="form-body scroll-body">
        {tab === 0 && <>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="A short description of the dish - what it is, where it's from, why you love it"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>Time</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 400, color: 'var(--text-primary)', textTransform: 'none', letterSpacing: 0 }}>
                {parseInt(time) || 5} minutes
              </span>
            </label>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={parseInt(time) || 5}
              onChange={e => setTime(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--blue)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              <span>5 min</span>
              <span>3 hours</span>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Servings</label>
            <input
              className="form-input"
              type="number"
              inputMode="numeric"
              placeholder="2"
              value={servings}
              onChange={e => setServings(e.target.value.replace(/[^\d]/g, ''))}
              onFocus={e => e.target.select()}
              onBlur={() => { if (!servings.trim()) setServings('2'); }}
            />
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
              {ingredients.map((ing) => (
                <div key={ing.id} className="dynamic-item">
                  <input className="form-input" placeholder="e.g. Spaghetti" value={ing.name} onChange={e => updateIngredient(ing.id, 'name', e.target.value)} style={{ flex: 2 }} />
                  <input className="form-input" placeholder="e.g. 320g" value={ing.qty} onChange={e => updateIngredient(ing.id, 'qty', e.target.value)} style={{ flex: 1 }} />
                  {ingredients.length > 1 && <button className="remove-btn" onClick={() => removeIngredient(ing.id)}>×</button>}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={addIngredient}>+ Add ingredient</button>
          </>}
        </>}
        {tab === 2 && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-secondary)' }}>
              Step {Math.max(filledStepCount, 1)} of {steps.length}
            </span>
            <button
              type="button"
              onClick={() => setShowStepHelp(v => !v)}
              aria-label="How to write a good step"
              style={{
                width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--rule)',
                background: showStepHelp ? 'var(--blue)' : 'transparent',
                color: showStepHelp ? 'var(--white)' : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12,
                fontWeight: 400, padding: 0, lineHeight: 1,
              }}
            >
              ?
            </button>
          </div>
          {showStepHelp && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', padding: '12px 14px', marginBottom: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 6 }}>
                How to write a good step
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
                Write one action per step. Start with a verb. Include temperatures, times, and visual cues — e.g. "Cook until golden brown, about 3 minutes."
              </p>
            </div>
          )}
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Move step up"
                      style={{
                        width: 24, height: 22, padding: 0, cursor: idx === 0 ? 'default' : 'pointer',
                        background: 'transparent', border: '1px solid var(--rule)',
                        color: idx === 0 ? 'var(--rule)' : 'var(--text-muted)',
                        fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1, borderRadius: 0,
                      }}
                    >↑</button>
                    <div className="step-num" style={{ margin: 0 }}>{idx + 1}</div>
                    <button
                      type="button"
                      onClick={() => moveStep(idx, 1)}
                      disabled={idx === steps.length - 1}
                      aria-label="Move step down"
                      style={{
                        width: 24, height: 22, padding: 0, cursor: idx === steps.length - 1 ? 'default' : 'pointer',
                        background: 'transparent', border: '1px solid var(--rule)',
                        color: idx === steps.length - 1 ? 'var(--rule)' : 'var(--text-muted)',
                        fontFamily: "'DM Mono', monospace", fontSize: 12, lineHeight: 1, borderRadius: 0,
                      }}
                    >↓</button>
                  </div>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Describe what to do in this step. Be specific — imagine explaining it to someone who has never cooked before."
                    value={step.text}
                    onChange={e => updateStep(step.id, 'text', e.target.value)}
                    style={{ flex: 1, minHeight: 70, fontSize: 14 }}
                  />
                  {steps.length > 1 && <button className="remove-btn" onClick={() => removeStep(step.id)}>×</button>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={step.hasTimer} onChange={e => updateStep(step.id, 'hasTimer', e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
                    Timer
                  </label>
                  {step.hasTimer && (
                    <input className="form-input" type="number" placeholder="min" value={step.timer || ''} onChange={e => updateStep(step.id, 'timer', e.target.value)} style={{ width: 72 }} />
                  )}
                  <button
                    type="button"
                    onClick={() => insertStepAfter(idx)}
                    style={{
                      marginLeft: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
                      textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--blue)',
                    }}
                  >
                    + Insert step below
                  </button>
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

function SavedToast() {
  return (
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginLeft: 8, opacity: 0.8 }}>Saved</span>
  );
}

function PublishConfirmSheet({ onConfirm, onCancel, busy }) {
  return (
    <div className="sheet-overlay" onClick={onCancel}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Publish recipe</div>
        <div style={{ padding: '20px 24px 8px', fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 300, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          Once published this recipe is locked and cannot be edited. Continue?
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '20px 24px 28px' }}>
          <button className="btn btn-primary" style={{ flex: 1, height: 44 }} onClick={onConfirm} disabled={busy}>
            {busy ? 'Publishing…' : 'Publish'}
          </button>
          <button className="btn btn-ghost" style={{ flex: 1, height: 44, color: 'var(--text-muted)', borderColor: 'var(--rule)' }} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RecipePhotosSection({ recipeId, currentUserId }) {
  const [photos, setPhotos] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getRecipePhotos(recipeId).then(p => { if (!cancelled) setPhotos(p); });
    return () => { cancelled = true; };
  }, [recipeId]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setPendingPreview(URL.createObjectURL(f));
    setCaption('');
  };

  const cancelPending = () => {
    setPendingFile(null);
    setPendingPreview(null);
    setCaption('');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const row = await addRecipePhoto(recipeId, pendingFile, caption.trim() || null);
      track('photo_uploaded');
      const refreshed = await getRecipePhotos(recipeId);
      setPhotos(refreshed);
      cancelPending();
      return row;
    } catch (err) {
      alert('Upload failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await deleteRecipePhoto(id);
      setPhotos(prev => (prev || []).filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + (err?.message || 'Unknown error'));
    }
  };

  if (photos === null) return null;
  const empty = photos.length === 0;

  return (
    <div style={{ padding: '14px 0 8px', borderBottom: '1px solid var(--rule)' }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />

      {empty && !pendingPreview && (
        <div style={{ padding: '0 20px' }}>
          <div
            onClick={() => currentUserId && fileRef.current?.click()}
            style={{
              height: 160, border: '1px dashed var(--rule)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: currentUserId ? 'pointer' : 'default',
            }}
          >
            ＋ Add a photo
          </div>
        </div>
      )}

      {!empty && !pendingPreview && (
        <>
          <div style={{ display: 'flex', overflowX: 'auto', gap: 12, padding: '0 20px 8px' }}>
            {photos.map(p => (
              <div key={p.id} style={{ flexShrink: 0, width: 280 }}>
                <div style={{ width: 280, height: 200, border: '1px solid var(--rule)', overflow: 'hidden', borderRadius: 0 }}>
                  <img src={p.photo_url} alt={p.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {p.caption && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                    {p.caption}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  {p.uploader && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)' }}>
                      @{p.uploader.username}
                    </div>
                  )}
                  {currentUserId === p.user_id && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}
                    >
                      delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {currentUserId && (
            <div style={{ padding: '4px 20px 0' }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '1px solid var(--rule)', background: 'transparent',
                  padding: '8px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11,
                  fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 0,
                }}
              >
                ＋ Add photo
              </button>
            </div>
          )}
        </>
      )}

      {pendingPreview && (
        <div style={{ padding: '0 20px' }}>
          <img src={pendingPreview} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', border: '1px solid var(--rule)' }} />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{
              width: '100%', marginTop: 8, padding: '8px 10px',
              border: '1px solid var(--rule)', background: 'var(--surface)',
              fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-primary)',
              borderRadius: 0, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                flex: 1, height: 40, border: 'none', background: 'var(--blue)',
                color: 'var(--white)', fontFamily: "'DM Mono', monospace", fontSize: 11,
                fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em',
                cursor: uploading ? 'default' : 'pointer', borderRadius: 0,
              }}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              onClick={cancelPending}
              disabled={uploading}
              style={{
                height: 40, padding: '0 16px', background: 'transparent',
                border: '1px solid var(--rule)', color: 'var(--text-muted)',
                fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                cursor: 'pointer', borderRadius: 0,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveToLibrarySheet({ recipeName, cookbooks, onSelect, onClose }) {
  const list = (cookbooks || []).filter(cb => cb.id !== 'favourites');
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">Save "{recipeName}" to…</div>
        <div className="flat-list">
          <div className="flat-row" onClick={() => onSelect(null)}>
            <div className="flat-row-info">
              <div className="flat-row-name">Library (uncategorised)</div>
            </div>
            <span className="flat-row-arrow">›</span>
          </div>
          {list.map(cb => (
            <div key={cb.id} className="flat-row" onClick={() => onSelect(cb.id)}>
              <div className="flat-row-info">
                <div className="flat-row-name">{cb.name}</div>
                <div className="flat-row-meta">{cb.recipeCount ?? 0} recipes</div>
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

function RecipeDetailScreen({
  recipe, cookbook, onBack, onStartCook, isFavourite, onToggleFavourite,
  onAddToCookbook, onOpenAddToList, inShoppingList, mobileBackToList,
  onEdit, currentUserId, onTogglePublic, onPublish, onOpenAuthor,
  myCookbooks, onSaveToLibrary, onUnsave, savedRow, savedToast,
}) {
  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(recipe.isPublic);
  const [author, setAuthor] = useState(recipe.author || null);
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [openInputs, setOpenInputs] = useState({}); // key -> bool
  const [savedFlash, setSavedFlash] = useState(null); // key currently flashing
  const [savePicker, setSavePicker] = useState(false);

  const isAuthor = !!currentUserId && currentUserId === recipe.userId;
  const isLocked = !!recipe.isLocked;
  const showSaveToLibrary = !isAuthor && recipe.isPublic;
  const showAnnotations = !isAuthor && !!savedRow;

  useEffect(() => {
    track('recipe_viewed');
    getRecipeLikes(recipe.id).then(({ count, likedByMe }) => {
      setLikeCount(count); setLikedByMe(likedByMe);
    });
    getRecipeComments(recipe.id).then(setComments);
  }, [recipe.id]);

  useEffect(() => { setIsPublic(recipe.isPublic); }, [recipe.isPublic]);
  useEffect(() => { setAuthor(recipe.author || null); }, [recipe.author, recipe.id]);

  // Fetch author profile if authorId is present and we don't have the object yet
  useEffect(() => {
    if (recipe.author || !recipe.authorId) return;
    let cancelled = false;
    supabase.from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', recipe.authorId).maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setAuthor(data); });
    return () => { cancelled = true; };
  }, [recipe.authorId, recipe.author]);

  // Fetch annotations when viewing as a saved non-author
  useEffect(() => {
    if (!showAnnotations || !currentUserId) { setAnnotations([]); return; }
    getAnnotations(recipe.id, currentUserId).then(setAnnotations);
  }, [recipe.id, currentUserId, showAnnotations]);

  const flashSaved = (key) => {
    setSavedFlash(key);
    setTimeout(() => setSavedFlash(curr => curr === key ? null : curr), 1500);
  };

  const persistAnnotation = async (existing, type, content, ingredientId, stepId, key) => {
    const trimmed = (content || '').trim();
    if (!trimmed) {
      if (existing) {
        await deleteAnnotation(existing.id);
        setAnnotations(prev => prev.filter(a => a.id !== existing.id));
        flashSaved(key);
      }
      return;
    }
    if (existing) {
      const updated = await updateAnnotation(existing.id, trimmed);
      setAnnotations(prev => prev.map(a => a.id === existing.id ? updated : a));
    } else {
      const created = await saveAnnotation(recipe.id, type, trimmed, ingredientId, stepId);
      setAnnotations(prev => [...prev, created]);
    }
    flashSaved(key);
  };

  const generalAnnotation = annotations.find(a => a.annotation_type === 'general');
  const stepNoteFor = (stepId) => annotations.find(a => a.annotation_type === 'step_note' && a.step_id === stepId);
  const ingSubFor = (ingId) => annotations.find(a => a.annotation_type === 'ingredient_sub' && a.ingredient_id === ingId);
  const ingQtyFor = (ingId) => annotations.find(a => a.annotation_type === 'ingredient_qty' && a.ingredient_id === ingId);

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
    if (isLocked) return;
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

  const handleConfirmPublish = async () => {
    setPublishing(true);
    try {
      await onPublish?.(recipe.id);
      setConfirmingPublish(false);
    } catch (err) {
      alert('Failed to publish: ' + (err?.message || 'Unknown error'));
    } finally {
      setPublishing(false);
    }
  };

  const authorHandle = author?.username;
  const authorLine = recipe.authorId && authorHandle ? (
    <div style={{ marginTop: 6, fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 11, color: 'var(--text-secondary)' }}>
      By <span
        onClick={() => onOpenAuthor && recipe.authorId && onOpenAuthor(recipe.authorId)}
        style={{ cursor: onOpenAuthor ? 'pointer' : 'default', color: 'var(--text-secondary)', textDecoration: 'underline dotted' }}
      >@{authorHandle}</span>
    </div>
  ) : null;
  const cookedLine = recipe.cookedCount > 0 ? (
    <div style={{ marginTop: 4, fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 11, color: 'var(--text-secondary)' }}>
      Cooked {formatCount(recipe.cookedCount)} time{recipe.cookedCount !== 1 ? 's' : ''}
    </div>
  ) : null;

  return (
    <div className="screen">
      <div className="detail-hero">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 40, color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '0.02em' }}>{recipe.name}</h1>
        {authorLine}
        {cookedLine}
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
          {recipe.cookedCount > 0 && <span className="detail-meta-item">Cooked {formatCount(recipe.cookedCount)} time{recipe.cookedCount !== 1 ? 's' : ''}</span>}
          {isAuthor && (recipe.lastCookedAt
            ? <span className="detail-meta-item">Last cooked {timeAgo(recipe.lastCookedAt)}</span>
            : <span className="detail-meta-item" style={{ color: 'var(--text-muted)' }}>Never cooked</span>
          )}
          {isAuthor && !isLocked && (
            <button onClick={handleTogglePublic} className="detail-meta-item" style={{ color: isPublic ? 'var(--blue)' : '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline dotted' }}>
              {isPublic ? '◎ Public' : '◉ Private'}
            </button>
          )}
        </div>
        {/* Lock / Publish status row — author only */}
        {isAuthor && (
          <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
            {isLocked ? (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ fontSize: 12 }}>🔒</span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Published</span>
              </div>
            ) : (
              <button onClick={() => setConfirmingPublish(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span aria-hidden style={{ fontSize: 12 }}>🔓</span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draft — Publish recipe</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action row: own recipes get the standard set; non-author public recipes get Save to library */}
      {isAuthor ? (
        <div className="recipe-actions">
          <button className={`recipe-action-btn${isFavourite ? ' active' : ''}`} onClick={() => onToggleFavourite(recipe.id)}>
            <span className="recipe-action-icon" style={isFavourite ? { color: 'var(--blue)' } : {}}>{isFavourite ? '♥' : '♡'}</span>
            <span className="recipe-action-label">Favourite</span>
          </button>
          <button className="recipe-action-btn" onClick={() => onAddToCookbook(recipe.id, cookbook?.id)}>
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
          {onEdit && !isLocked && (
            <button className="recipe-action-btn" onClick={onEdit}>
              <span className="recipe-action-icon">✎</span>
              <span className="recipe-action-label">Edit</span>
            </button>
          )}
        </div>
      ) : showSaveToLibrary ? (
        <div style={{ display: 'flex', gap: 12, padding: '14px 28px', borderBottom: '1px solid var(--rule)', alignItems: 'center' }}>
          {savedRow ? (
            <>
              <button onClick={() => setSavePicker(true)} style={{ flex: 1, border: '1px solid var(--text-primary)', background: 'transparent', padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 0 }}>
                ✓ Saved
              </button>
              <button onClick={() => onUnsave?.(recipe.id)} style={{ background: 'none', border: 'none', padding: '8px 4px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Unsave
              </button>
            </>
          ) : (
            <button onClick={() => setSavePicker(true)} style={{ flex: 1, border: '1px solid var(--text-primary)', background: 'transparent', padding: '12px 16px', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 0 }}>
              Save to library
            </button>
          )}
          <button className={`recipe-action-btn${likedByMe ? ' active' : ''}`} onClick={handleLike} style={{ flex: 'none', flexDirection: 'row', gap: 6, padding: '8px 12px', borderRight: 'none' }}>
            <span className="recipe-action-icon">{likedByMe ? '♥' : '♡'}</span>
            {likeCount > 0 && <span className="recipe-action-label">{likeCount}</span>}
          </button>
          {savedToast && <SavedToast />}
        </div>
      ) : null}

      <div className="scroll-body pb-safe">
        <RecipePhotosSection recipeId={recipe.id} currentUserId={currentUserId} />
        {/* General annotation — only shown when viewing as saved non-author */}
        {showAnnotations && (
          <div style={{ padding: '14px 28px 0' }}>
            {generalAnnotation ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--rule)', padding: '12px 14px', borderRadius: 0 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {generalAnnotation.content}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 12 }}>
                  {savedFlash === 'general' && <SavedToast />}
                  <button onClick={() => setOpenInputs(p => ({ ...p, general: true }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', textTransform: 'lowercase' }}>edit</button>
                </div>
                {openInputs.general && (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      autoFocus
                      defaultValue={generalAnnotation.content}
                      onBlur={async (e) => {
                        setOpenInputs(p => ({ ...p, general: false }));
                        await persistAnnotation(generalAnnotation, 'general', e.target.value, null, null, 'general');
                      }}
                      rows={3}
                      style={{ width: '100%', border: '1px solid var(--rule)', background: 'var(--paper)', padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--text-primary)', borderRadius: 0, outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                )}
              </div>
            ) : openInputs.general ? (
              <textarea
                autoFocus
                placeholder="My notes on this recipe…"
                onBlur={async (e) => {
                  setOpenInputs(p => ({ ...p, general: false }));
                  await persistAnnotation(null, 'general', e.target.value, null, null, 'general');
                }}
                rows={3}
                style={{ width: '100%', border: '1px solid var(--rule)', background: 'var(--surface)', padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--text-primary)', borderRadius: 0, outline: 'none', resize: 'vertical' }}
              />
            ) : (
              <button onClick={() => setOpenInputs(p => ({ ...p, general: true }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>＋ Add your notes</button>
            )}
          </div>
        )}

        <div className="detail-section">
          <h2>Ingredients</h2>
          {recipe.ingredients.map((ing, idx) => {
            const ingId = ing.id;
            const sub = showAnnotations && ingId ? ingSubFor(ingId) : null;
            const qty = showAnnotations && ingId ? ingQtyFor(ingId) : null;
            const qtyKey = `iq:${ingId}`;
            const subKey = `is:${ingId}`;
            return (
              <div key={ingId || idx} className="ingredient-item" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    {ing.qty && (
                      <span className="ingredient-qty" style={qty ? { color: 'var(--text-muted)', textDecoration: 'line-through', flexShrink: 0 } : { flexShrink: 0 }}>
                        {ing.qty}
                      </span>
                    )}
                    <span style={sub ? { color: 'var(--text-muted)', textDecoration: 'line-through' } : {}}>
                      {ing.name}
                    </span>
                  </div>
                  {qty && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 400, fontSize: 12, color: 'var(--blue)' }}>
                      {qty.content}
                    </div>
                  )}
                  {sub && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--blue)' }}>
                      {sub.content}
                    </div>
                  )}
                  {showAnnotations && openInputs[qtyKey] && (
                    <input
                      autoFocus
                      defaultValue={qty?.content || ''}
                      placeholder="My quantity"
                      onBlur={async (e) => {
                        setOpenInputs(p => ({ ...p, [qtyKey]: false }));
                        await persistAnnotation(qty, 'ingredient_qty', e.target.value, ingId, null, qtyKey);
                      }}
                      style={{ marginTop: 2, border: '1px solid var(--rule)', background: 'var(--surface)', padding: '4px 8px', fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 12, color: 'var(--text-primary)', borderRadius: 0, outline: 'none', maxWidth: 220 }}
                    />
                  )}
                  {showAnnotations && openInputs[subKey] && (
                    <input
                      autoFocus
                      defaultValue={sub?.content || ''}
                      placeholder="I use…"
                      onBlur={async (e) => {
                        setOpenInputs(p => ({ ...p, [subKey]: false }));
                        await persistAnnotation(sub, 'ingredient_sub', e.target.value, ingId, null, subKey);
                      }}
                      style={{ marginTop: 2, border: '1px solid var(--rule)', background: 'var(--surface)', padding: '4px 8px', fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--text-primary)', borderRadius: 0, outline: 'none', maxWidth: 260 }}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 10 }}>
                  <a href={ahUrl(ing.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: 'var(--blue)', textDecoration: 'none' }}>AH</a>
                  {showAnnotations && ingId && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setOpenInputs(p => ({ ...p, [qtyKey]: true }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)' }}>adjust</button>
                      <button onClick={() => setOpenInputs(p => ({ ...p, [subKey]: true }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)' }}>sub</button>
                    </div>
                  )}
                  {showAnnotations && (savedFlash === qtyKey || savedFlash === subKey) && <SavedToast />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="detail-section">
          <h2>Steps</h2>
          {recipe.steps.map((step, idx) => {
            const stepId = step.id;
            const note = showAnnotations && stepId ? stepNoteFor(stepId) : null;
            const noteKey = `sn:${stepId}`;
            return (
              <div key={stepId || idx} className="step-preview" style={{ flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div className="step-num">{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{step.text}</div>
                    {step.timer && <div style={{ fontSize: 12, color: 'var(--blue)', marginTop: 4, fontFamily: "'DM Mono', monospace" }}>{step.timer} min timer</div>}
                  </div>
                </div>
                {showAnnotations && stepId && (
                  <div style={{ paddingLeft: 40 }}>
                    {note && !openInputs[noteKey] ? (
                      <div style={{ borderLeft: '1px solid var(--blue)', paddingLeft: 10 }}>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {note.content}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                          <button onClick={() => setOpenInputs(p => ({ ...p, [noteKey]: true }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>edit</button>
                          <button onClick={async () => { await persistAnnotation(note, 'step_note', '', null, stepId, noteKey); }} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>delete</button>
                          {savedFlash === noteKey && <SavedToast />}
                        </div>
                      </div>
                    ) : openInputs[noteKey] ? (
                      <textarea
                        autoFocus
                        defaultValue={note?.content || ''}
                        placeholder="My note for this step…"
                        onBlur={async (e) => {
                          setOpenInputs(p => ({ ...p, [noteKey]: false }));
                          await persistAnnotation(note, 'step_note', e.target.value, null, stepId, noteKey);
                        }}
                        rows={2}
                        style={{ width: '100%', border: '1px solid var(--rule)', background: 'var(--surface)', padding: '8px 10px', fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--text-primary)', borderRadius: 0, outline: 'none', resize: 'vertical' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={() => setOpenInputs(p => ({ ...p, [noteKey]: true }))} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>＋ add note</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

      {confirmingPublish && (
        <PublishConfirmSheet
          busy={publishing}
          onConfirm={handleConfirmPublish}
          onCancel={() => !publishing && setConfirmingPublish(false)}
        />
      )}

      {savePicker && (
        <SaveToLibrarySheet
          recipeName={recipe.name}
          cookbooks={myCookbooks}
          onClose={() => setSavePicker(false)}
          onSelect={(cookbookId) => {
            setSavePicker(false);
            onSaveToLibrary?.(recipe.id, cookbookId);
          }}
        />
      )}
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

function PrepChecklistScreen({ recipe, onBack, onStart, currentUserId }) {
  const [checked, setChecked] = useState({});
  const [servings, setServings] = useState(recipe.servings);
  const [showWarning, setShowWarning] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const scale = servings / recipe.servings;
  const toggle = idx => { setChecked(p => ({ ...p, [idx]: !p[idx] })); setShowWarning(false); };
  const allChecked = recipe.ingredients.every((_, i) => checked[i]);
  const checkedCount = recipe.ingredients.filter((_, i) => checked[i]).length;
  const isAuthor = !!currentUserId && recipe.userId === currentUserId;

  useEffect(() => {
    if (!currentUserId || isAuthor) { setAnnotations([]); return; }
    getAnnotations(recipe.id, currentUserId).then(setAnnotations);
  }, [recipe.id, currentUserId, isAuthor]);

  const ingSubFor = (id) => annotations.find(a => a.annotation_type === 'ingredient_sub' && a.ingredient_id === id);
  const ingQtyFor = (id) => annotations.find(a => a.annotation_type === 'ingredient_qty' && a.ingredient_id === id);

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
          {recipe.ingredients.map((ing, idx) => {
            const sub = ing.id ? ingSubFor(ing.id) : null;
            const qty = ing.id ? ingQtyFor(ing.id) : null;
            return (
              <div key={ing.id || idx} className={`checklist-item${checked[idx] ? ' checked' : ''}`} onClick={() => toggle(idx)}>
                <div className="check-circle">
                  {checked[idx] && <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="ci-name" style={sub ? { color: 'var(--text-muted)', textDecoration: 'line-through' } : {}}>{ing.name}</div>
                  {sub && <div className="ci-name" style={{ color: 'var(--blue)' }}>{sub.content}</div>}
                  {qty
                    ? <>
                        <div className="ci-qty" style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{scaleQty(ing.qty)}</div>
                        <div className="ci-qty" style={{ color: 'var(--blue)' }}>{scaleQty(qty.content)}</div>
                      </>
                    : <div className="ci-qty">{scaleQty(ing.qty)}</div>
                  }
                </div>
                <a href={ahUrl(ing.name)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: 'var(--blue)', textDecoration: 'none', flexShrink: 0, padding: '4px 2px' }}>AH</a>
              </div>
            );
          })}
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

function CookModeScreen({ recipe, onFinish, currentUserId }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ingrOpen, setIngrOpen] = useState(false);
  const [timers, setTimers] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const steps = recipe.steps;
  const current = steps[stepIdx];
  const prev = stepIdx > 0 ? steps[stepIdx - 1] : null;
  const next = stepIdx < steps.length - 1 ? steps[stepIdx + 1] : null;
  const isAuthor = !!currentUserId && recipe.userId === currentUserId;

  useEffect(() => { track('cook_mode_started'); }, []);

  useEffect(() => {
    if (!currentUserId || isAuthor) { setAnnotations([]); return; }
    getAnnotations(recipe.id, currentUserId).then(setAnnotations);
  }, [recipe.id, currentUserId, isAuthor]);

  const stepNoteFor = (id) => annotations.find(a => a.annotation_type === 'step_note' && a.step_id === id);
  const ingSubFor = (id) => annotations.find(a => a.annotation_type === 'ingredient_sub' && a.ingredient_id === id);
  const ingQtyFor = (id) => annotations.find(a => a.annotation_type === 'ingredient_qty' && a.ingredient_id === id);
  const currentNote = current?.id ? stepNoteFor(current.id) : null;

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

  const stepTimer = current.timer ? timers.find(t => t.stepNum === stepIdx + 1) : null;
  const isLast = stepIdx === steps.length - 1;

  return (
    <div className="cook-screen">
      {/* Variant C header: ✕ exit | recipe name | step counter */}
      <div className="cook-header">
        <button className="cook-header-exit" onClick={onFinish} aria-label="Exit cook mode">✕</button>
        <span className="cook-header-title">{recipe.name}</span>
        <span className="cook-header-counter">{stepIdx + 1} / {steps.length}</span>
      </div>

      {/* Body: prev / current / next + dots */}
      <div className="cook-body">
        {prev && (
          <div className="cook-prev">
            <div className="cook-prev-label">Previous</div>
            <div className="cook-prev-text">{prev.text}</div>
          </div>
        )}
        <div className="cook-current">
          <div className="cook-step-label">Step {stepIdx + 1} of {steps.length}</div>
          <p className="cook-current-text">{current.text}</p>

          {currentNote && (
            <div style={{ marginTop: 14, borderLeft: '1px solid var(--blue)', paddingLeft: 12 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', fontSize: 12, color: 'var(--blue)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                {currentNote.content}
              </div>
            </div>
          )}

          {(() => {
            const mentioned = recipe.ingredients.filter(ing => ing.qty && matchIngToStep(ing.name, current.text));
            return mentioned.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', marginTop: 14 }}>
                {mentioned.map((ing, i) => {
                  const sub = ing.id ? ingSubFor(ing.id) : null;
                  const qty = ing.id ? ingQtyFor(ing.id) : null;
                  const displayQty = qty ? qty.content : ing.qty;
                  const displayName = sub ? sub.content : ing.name;
                  return (
                    <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--blue)', background: 'var(--blue-pale)', padding: '3px 8px', borderRadius: 0 }}>
                      {displayQty} {displayName}
                    </span>
                  );
                })}
              </div>
            ) : null;
          })()}

          {current.timer && (
            <div className="cook-timer-widget">
              <div>
                <div className="cook-timer-display">{stepTimer ? fmt(stepTimer.remaining) : `${String(current.timer).padStart(2, '0')}:00`}</div>
                <div className="cook-timer-sub">{current.timer} min timer</div>
              </div>
              {!stepTimer ? (
                <button className="cook-timer-btn-w" onClick={() => startTimer(current, stepIdx + 1)}>Start</button>
              ) : stepTimer.remaining === 0 ? (
                <button className="cook-timer-btn-w done" onClick={() => resetTimer(stepTimer.id)}>Done</button>
              ) : (
                <button className="cook-timer-btn-w running" onClick={() => toggleTimer(stepTimer.id)}>
                  {stepTimer.running ? 'Pause' : 'Resume'}
                </button>
              )}
            </div>
          )}
        </div>
        {next && (
          <div className="cook-next">
            <div className="cook-next-label">Next</div>
            <div className="cook-next-text">{next.text}</div>
          </div>
        )}

        <div className="cook-dots">
          {steps.map((_, i) => <div key={i} className={`cook-dot${i === stepIdx ? ' active' : i < stepIdx ? ' done' : ''}`} />)}
        </div>

        <div style={{ padding: '12px 24px 24px', display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => { setIngrOpen(true); setDrawerOpen(false); }} style={{ background: 'transparent', border: '1px solid var(--rule)', padding: '8px 14px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 0 }}>
            Ingredients ({recipe.ingredients.length})
          </button>
          <button onClick={() => { setDrawerOpen(true); setIngrOpen(false); }} style={{ background: 'transparent', border: '1px solid var(--rule)', padding: '8px 14px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, color: timers.length > 0 ? 'var(--blue)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: 0, borderColor: timers.length > 0 ? 'var(--blue)' : 'var(--rule)' }}>
            Timers{timers.length > 0 ? ` (${timers.length})` : ''}
          </button>
        </div>
      </div>

      {/* Cook nav — replaces the footer nav during cook mode */}
      <div className="cook-footer">
        <button className="cook-nav-back" disabled={stepIdx === 0} onClick={() => setStepIdx(i => i - 1)}>BACK</button>
        <button className="cook-nav-next" onClick={() => isLast ? onFinish() : setStepIdx(i => i + 1)}>
          {isLast ? 'FINISH' : 'NEXT'}
        </button>
      </div>

      {/* Ingredients drawer */}
      {ingrOpen && <div className="timers-drawer-overlay" onClick={() => setIngrOpen(false)} />}
      <div className={`ingr-drawer${ingrOpen ? ' open' : ''}`}>
        <div className="timers-drawer-head">
          <span className="timers-drawer-title">Ingredients</span>
          <button className="timers-drawer-close" onClick={() => setIngrOpen(false)}>×</button>
        </div>
        <div className="timers-drawer-body">
          {recipe.ingredients.map((ing, idx) => {
            const sub = ing.id ? ingSubFor(ing.id) : null;
            const qty = ing.id ? ingQtyFor(ing.id) : null;
            return (
              <div key={ing.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 20px', borderBottom: '1px solid var(--rule)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: sub ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: "'DM Mono', monospace", fontWeight: 400, textDecoration: sub ? 'line-through' : 'none' }}>{ing.name}</div>
                  {sub && <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 300, fontStyle: 'italic', color: 'var(--blue)', marginTop: 2 }}>{sub.content}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, marginLeft: 12 }}>
                  {ing.qty && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: qty ? 'var(--text-muted)' : 'var(--blue)', textDecoration: qty ? 'line-through' : 'none' }}>{ing.qty}</span>
                  )}
                  {qty && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--blue)', marginTop: 2 }}>{qty.content}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timers drawer */}
      {drawerOpen && <div className="timers-drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <div className={`timers-drawer${drawerOpen ? ' open' : ''}`}>
        <div className="timers-drawer-head">
          <span className="timers-drawer-title">Timers</span>
          <button className="timers-drawer-close" onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div className="timers-drawer-body">
          {timers.length === 0 ? (
            <div className="timers-drawer-empty">No timers yet.<br/>Start one from a step that has a timer.</div>
          ) : timers.map(t => (
            <div key={t.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Step {t.stepNum}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, color: t.remaining === 0 ? 'var(--blue)' : 'var(--text-primary)' }}>
                  {t.remaining === 0 ? 'Done!' : fmt(t.remaining)}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {t.remaining === 0
                    ? <button onClick={() => resetTimer(t.id)} style={{ background: 'transparent', border: '1px solid var(--rule)', padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reset</button>
                    : <button onClick={() => toggleTimer(t.id)} style={{ background: 'transparent', border: '1px solid var(--rule)', padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t.running ? 'Pause' : 'Resume'}</button>
                  }
                  <button onClick={() => removeTimer(t.id)} style={{ background: 'transparent', border: '1px solid var(--rule)', padding: '4px 10px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)' }}>×</button>
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

function RecipeSavedScreen({ recipe, onCookNow, onBackToCookbook }) {
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 28px', minHeight: '70vh', textAlign: 'center' }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontStyle: 'italic', fontSize: 'clamp(40px, 9vw, 56px)', letterSpacing: '0.02em', lineHeight: 1.05, color: 'var(--ink)', marginBottom: 12 }}>
        Recipe saved.
      </h1>
      {recipe?.name && (
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
          {recipe.name}
        </p>
      )}
      <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 300, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 36 }}>
        Ready to cook?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          className="btn btn-primary btn-full"
          style={{ height: 52, fontSize: 16 }}
          onClick={onCookNow}
        >
          Cook it now →
        </button>
        <button
          onClick={onBackToCookbook}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '12px 0' }}
        >
          Back to cookbook
        </button>
      </div>
    </div>
  );
}

const LEFT_APP_OPTIONS = [
  { value: 'none',           label: 'No, stayed in the app' },
  { value: 'once_or_twice',  label: 'Once or twice' },
  { value: 'several',        label: 'Several times' },
];

function FeedbackScreen({ recipe, onSave, onSkip }) {
  const [ease, setEase] = useState(0);
  const [taste, setTaste] = useState(0);
  const [overall, setOverall] = useState(0);
  const [notes, setNotes] = useState('');
  const [leftApp, setLeftApp] = useState(null);
  const [improvementNotes, setImprovementNotes] = useState('');

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

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 400, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
            Did you leave the app at any point while cooking?
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {LEFT_APP_OPTIONS.map(opt => {
              const active = leftApp === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setLeftApp(opt.value)}
                  style={{
                    padding: '8px 14px', borderRadius: 0, cursor: 'pointer',
                    fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    border: `1px solid ${active ? 'var(--blue)' : 'var(--rule)'}`,
                    color: active ? 'var(--blue)' : 'var(--text-secondary)',
                    background: active ? 'var(--blue-pale)' : 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 400, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
            What would have made this easier?
          </div>
          <textarea
            className="notes-field"
            placeholder="Missing information, confusing steps, anything at all..."
            value={improvementNotes}
            onChange={e => setImprovementNotes(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 400, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Any notes?</div>
          <textarea className="notes-field" placeholder="What would you do differently next time?" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="btn btn-primary btn-full"
            style={{ height: 52, fontSize: 18 }}
            onClick={() => onSave(ease, taste, overall, notes, { left_app: leftApp, improvement_notes: improvementNotes.trim() })}
          >
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

const TIME_BUCKETS = {
  All: {},
  Quick: { max_time: 20 },
  Medium: { min_time: 21, max_time: 45 },
  Long: { min_time: 46 },
};

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', padding: '6px 0', marginRight: 14, cursor: 'pointer',
        fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 400,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: active ? 'var(--blue)' : 'var(--text-muted)',
        borderBottom: active ? '1px solid var(--blue)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  );
}

function RecipesSearchTab({ onOpenRecipe }) {
  const [query, setQuery] = useState('');
  const [timeBucket, setTimeBucket] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [results, setResults] = useState(null);

  useEffect(() => {
    const filters = {
      ...TIME_BUCKETS[timeBucket],
      ...(difficulty !== 'All' ? { difficulty } : {}),
    };
    setResults(null);
    const t = setTimeout(() => {
      searchPublicRecipes(query, filters, 0, 20).then(setResults);
      if (query.trim()) track('search_performed');
    }, 250);
    return () => clearTimeout(t);
  }, [query, timeBucket, difficulty]);

  return (
    <>
      <div className="search-input-wrap">
        <input
          className="search-input"
          placeholder="Search recipes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div style={{ padding: '6px 28px 4px', display: 'flex', flexWrap: 'wrap' }}>
        {Object.keys(TIME_BUCKETS).map(b => (
          <FilterPill key={b} label={b} active={timeBucket === b} onClick={() => setTimeBucket(b)} />
        ))}
      </div>
      <div style={{ padding: '0 28px 12px', display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--rule)' }}>
        {['All', 'Easy', 'Medium', 'Advanced'].map(d => (
          <FilterPill key={d} label={d} active={difficulty === d} onClick={() => setDifficulty(d)} />
        ))}
      </div>
      <div className="scroll-body pb-safe">
        {results === null ? null : results.length === 0 ? (
          <div style={{ padding: '40px 28px', fontFamily: "'Courier Prime', 'Courier New', monospace", fontSize: 14, color: 'var(--text-muted)' }}>
            No recipes found
          </div>
        ) : (
          results.map(r => (
            <div key={r.id} className="flat-row" onClick={() => onOpenRecipe?.(r.id)}>
              <div className="flat-row-info">
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontStyle: 'italic', fontSize: 16, color: 'var(--ink)', lineHeight: 1.25 }}>
                  {r.name}
                </div>
                {r.author && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                    By @{r.author.username}
                  </div>
                )}
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {[r.time && `${r.time} min`, r.difficulty].filter(Boolean).join(' · ')}
                </div>
                {r.cookedCount > 0 && (
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Cooked {formatCount(r.cookedCount)} time{r.cookedCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <span className="flat-row-arrow">›</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function SearchScreen({ onBack, onOpenUser, currentUserId, onOpenRecipe }) {
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' | 'people'
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
      track('user_followed');
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
      <div className="page-header" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <button onClick={() => setActiveTab('recipes')} style={{
            background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: activeTab === 'recipes' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'recipes' ? '1px solid var(--text-primary)' : '1px solid transparent',
          }}>Recipes</button>
          <button onClick={() => setActiveTab('people')} style={{
            background: 'none', border: 'none', padding: '8px 0', cursor: 'pointer',
            fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 400,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            color: activeTab === 'people' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'people' ? '1px solid var(--text-primary)' : '1px solid transparent',
          }}>People</button>
        </div>
      </div>
      {activeTab === 'recipes' ? (
        <RecipesSearchTab onOpenRecipe={onOpenRecipe} />
      ) : (
      <>
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
      </>
      )}
    </div>
  );
}

function UserPublicProfileScreen({ userId, currentUserId, onBack, onOpenPublicRecipe }) {
  const [data, setData] = useState(null);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    getUserPublicProfile(userId).then(d => {
      setData(d);
      setFollowing(d.isFollowing);
    });
  }, [userId]);

  const handleFollow = async () => {
    if (following) { await unfollowUser(userId); setFollowing(false); }
    else { await followUser(userId); track('user_followed'); setFollowing(true); }
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
  const isOwnProfile = userId === currentUserId;
  const published = publicRecipes.filter(r => r.isLocked);
  const drafts = publicRecipes.filter(r => !r.isLocked); // public but not yet locked — own profile only

  return (
    <div className="screen">
      <div className="page-header" style={{ paddingTop: 24 }}>
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
        {!isOwnProfile && (
          <button className={`follow-btn${following ? ' following' : ''}`} onClick={handleFollow}>
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      <div className="scroll-body pb-safe">
        {published.length > 0 && (
          <>
            <div className="people-section-label">Published Recipes</div>
            {published.map(r => (
              <div key={r.id} className="flat-row" onClick={() => onOpenPublicRecipe?.(r.id)}>
                <div className="flat-row-info">
                  <div className="flat-row-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden style={{ fontSize: 12 }}>🔒</span>
                    <span>{r.name}</span>
                  </div>
                  <div className="flat-row-meta">
                    {[r.time && `${r.time} min`, r.difficulty, r.servings && `${r.servings} servings`].filter(Boolean).join(' · ')}
                  </div>
                  {r.cookedCount > 0 && (
                    <div className="flat-row-meta">Cooked {formatCount(r.cookedCount)} time{r.cookedCount !== 1 ? 's' : ''} by the community</div>
                  )}
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
        {isOwnProfile && drafts.length > 0 && (
          <>
            <div className="people-section-label">Public Drafts</div>
            {drafts.map(r => (
              <div key={r.id} className="flat-row" onClick={() => onOpenPublicRecipe?.(r.id)}>
                <div className="flat-row-info">
                  <div className="flat-row-name">{r.name}</div>
                  <div className="flat-row-meta">
                    {[r.time && `${r.time} min`, r.difficulty].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span className="flat-row-arrow">›</span>
              </div>
            ))}
          </>
        )}
        {isOwnProfile && cookbooks.length > 0 && (
          <>
            <div className="people-section-label">Personal Cookbooks</div>
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
        {!published.length && !(isOwnProfile && (drafts.length || cookbooks.length)) && (
          <div style={{ padding: '40px 28px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No published recipes yet</div>
        )}
      </div>
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
  const [addToRecipe, setAddToRecipe] = useState(false);
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
      if (uploadedUrl && addToRecipe) {
        try { await attachExistingPhotoToRecipe(recipe.id, uploadedUrl); }
        catch (err) { console.error('Failed to add photo to recipe:', err); }
      }
      await onPost(text.trim(), uploadedUrl);
    } catch (err) {
      console.error(err);
      setPosting(false);
    }
  };

  return (
    <div className="post-screen">
      <div style={{ display: 'none' }}>
        <button onClick={onSkip}>← Skip</button>
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
              <button className="photo-remove" onClick={() => { setPhoto(null); setPhotoPreview(null); setAddToRecipe(false); }}>×</button>
            </div>
          ) : (
            <div className="photo-upload-area" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              <span className="photo-upload-icon">&#128247;</span>
              <span className="photo-upload-label">Tap to add a photo</span>
            </div>
          )}
          {photoPreview && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={addToRecipe} onChange={e => setAddToRecipe(e.target.checked)} />
              Add this photo to the recipe
            </label>
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
  const [savedRecipes, setSavedRecipes] = useState([]); // [{ recipe_id, cookbook_id }]
  const [savedToastFor, setSavedToastFor] = useState(null);
  const [pendingSaveRecipeId, setPendingSaveRecipeId] = useState(null);
  const [publicRecipeView, setPublicRecipeView] = useState(null); // { recipe } loaded for 'public-recipe' screen

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
    Promise.all([getCookbooks(), getFavouriteIds(), getFavouriteRecipes(), getShoppingList(), getProfile(user.id), getSavedRecipeIds()])
      .then(([cbs, favIds, favRecs, shop, prof, saved]) => {
        setCookbooks(cbs);
        setFavouriteIds(new Set(favIds));
        setFavouriteRecipes(favRecs);
        setShoppingList(shop);
        setProfile(prof);
        setSavedRecipes(saved || []);
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
    } else if (tab === 'discover') {
      navigate('discover');
    } else {
      setMainTab(tab);
      if (screen.name !== 'home' && screen.name !== 'discover') navigate('home');
      else if (screen.name === 'discover') navigate('home');
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
      } else if (pendingSaveRecipeId) {
        await handleSaveToLibrary(pendingSaveRecipeId, newCb.id);
        setPendingSaveRecipeId(null);
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
      setScreen({ name: 'recipe-saved', cbId, rId: newRecipe.id });
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
    track('cook_mode_completed');
    navigate('done', { cbId, rId });
  };

  const handleSaveFeedback = async (cbId, rId, ease, taste, overall, notes, extras) => {
    await saveRecipeFeedback(rId, ease, taste, overall, notes, extras);
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

  const handlePublishRecipe = async (cbId, rId) => {
    try {
      await publishRecipe(rId);
      const now = new Date().toISOString();
      setRecipesMap(prev => ({
        ...prev,
        [cbId]: (prev[cbId] || []).map(r => r.id === rId
          ? { ...r, isPublic: true, isLocked: true, publishedAt: now, authorId: user.id }
          : r),
      }));
    } catch (err) {
      alert('Failed to publish: ' + (err?.message || 'Unknown error'));
      throw err;
    }
  };

  const handleSaveToLibrary = async (recipeId, cookbookId) => {
    if (cookbookId === 'new') {
      setPendingSaveRecipeId(recipeId);
      navigate('new-cookbook');
      return;
    }
    try {
      const row = await saveRecipeToLibrary(recipeId, cookbookId);
      track('recipe_saved');
      setSavedRecipes(prev => {
        const next = prev.filter(r => r.recipe_id !== recipeId);
        next.push({ recipe_id: recipeId, cookbook_id: cookbookId });
        return next;
      });
      setSavedToastFor(recipeId);
      setTimeout(() => setSavedToastFor(curr => curr === recipeId ? null : curr), 1500);
      return row;
    } catch (err) {
      alert('Failed to save: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleUnsaveRecipe = async (recipeId) => {
    try {
      await unsaveRecipe(recipeId);
      setSavedRecipes(prev => prev.filter(r => r.recipe_id !== recipeId));
    } catch (err) {
      alert('Failed to unsave: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleOpenAuthor = (authorId) => {
    if (!authorId) return;
    navigate('user-profile', { userId: authorId, _from: screen.name });
  };

  const handleOpenPublicRecipe = (recipeId) => {
    setPublicRecipeView(null);
    const returnTo = screen;
    navigate('public-recipe', { publicRecipeId: recipeId, _returnTo: returnTo });
    getRecipeWithAuthor(recipeId)
      .then(rec => setPublicRecipeView({ recipe: rec }))
      .catch(err => alert('Failed to load recipe: ' + (err?.message || 'Unknown error')));
  };

  const goBackFromPublicRecipe = () => {
    const ret = screen._returnTo;
    if (ret && ret.name) setScreen(ret);
    else navigate('home');
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
    if (s === 'discover') return 'discover';
    if (['cookbook', 'new-cookbook', 'new-recipe', 'edit-recipe', 'recipe', 'recipe-saved', 'prep', 'community-cookbook'].includes(s)) return 'cookbooks';
    if (s === 'public-recipe' || s === 'prep-public') return mainTab;
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
        <CookModeScreen recipe={recipe} currentUserId={user.id} onFinish={() => handleFinishCook(cbId, rId)} />
      </>
    );
  }

  if (s === 'cook-public' && publicRecipeView?.recipe) {
    return (
      <>
        <style>{STYLES}</style>
        <CookModeScreen
          recipe={publicRecipeView.recipe}
          currentUserId={user.id}
          onFinish={() => navigate('public-recipe', { publicRecipeId: screen.publicRecipeId, _returnTo: screen._returnTo })}
        />
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      {(() => {
        const drill = (() => {
          if (s === 'cookbook' && cb) return { variant: 'drill', backLabel: 'Cookbooks', title: cb.name, onBack: () => { setMainTab('cookbooks'); navigate('home'); }, action: { label: '+ Add', onClick: () => navigate('new-recipe', { cbId }) } };
          if (s === 'recipe' && cb) return { variant: 'drill', backLabel: cb.name || 'Back', title: recipe?.name || '', onBack: () => navigate('cookbook', { cbId }) };
          if (s === 'public-recipe') return { variant: 'drill', backLabel: 'Back', title: publicRecipeView?.recipe?.name || '', onBack: goBackFromPublicRecipe };
          if (s === 'community-cookbook') return { variant: 'drill', backLabel: 'Cookbooks', title: 'Community Recipes', onBack: () => { setMainTab('cookbooks'); navigate('home'); } };
          if (s === 'new-cookbook') return { variant: 'drill', backLabel: 'Back', title: 'New Cookbook', onBack: () => navigate('home') };
          if (s === 'new-recipe' && cb) return { variant: 'drill', backLabel: cb.name || 'Back', title: 'New Recipe', onBack: () => navigate('cookbook', { cbId }) };
          if (s === 'edit-recipe' && cb) return { variant: 'drill', backLabel: 'Back', title: 'Edit Recipe', onBack: () => navigate('cookbook', { cbId, rId }) };
          if (s === 'recipe-saved' && cb) return { variant: 'drill', backLabel: cb.name || 'Back', title: 'Saved', onBack: () => navigate('cookbook', { cbId }) };
          if (s === 'search') return { variant: 'drill', backLabel: 'Home', title: 'Search', onBack: () => navigate('home') };
          if (s === 'user-profile') return { variant: 'drill', backLabel: 'Back', title: '', onBack: () => navigate(screen._from || 'home') };
          if (s === 'profile') return { variant: 'drill', backLabel: 'Home', title: 'Profile', onBack: () => navigate('home') };
          if (s === 'prep' || s === 'prep-public') return { variant: 'drill', backLabel: 'Back', title: 'Prep', onBack: () => s === 'prep' ? navigate('recipe', { cbId, rId }) : navigate('public-recipe', { publicRecipeId: screen.publicRecipeId, _returnTo: screen._returnTo }) };
          if (s === 'feedback') return { variant: 'drill', backLabel: 'Back', title: 'Feedback', onBack: () => navigate('post', { cbId, rId }) };
          if (s === 'post') return { variant: 'drill', backLabel: 'Back', title: 'Share', onBack: () => navigate('recipe', { cbId, rId }) };
          if (s === 'done') return { variant: 'drill', backLabel: 'Back', title: 'Done', onBack: () => navigate('feedback', { cbId, rId }) };
          return null;
        })();
        return drill
          ? <AppHeader {...drill} />
          : <AppHeader onSearch={() => navigate('search')} onProfile={() => navigate('profile')} />;
      })()}
      <div className="app-content">
        <div className="app-content-inner">
          {s === 'home' && (
            <HomeScreen
              cookbooks={cookbooks}
              shoppingList={shoppingList}
              onOpenCookbook={id => id === 'community' ? navigate('community-cookbook') : navigate('cookbook', { cbId: id })}
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
              onOpenPublicRecipe={(rId) => handleOpenPublicRecipe(rId, 'home')}
              savedRecipeIds={new Set(savedRecipes.map(r => r.recipe_id))}
              onSaveToLibrary={handleSaveToLibrary}
            />
          )}
          {s === 'search' && (
            <SearchScreen
              onBack={() => navigate('home')}
              onOpenUser={userId => navigate('user-profile', { userId })}
              currentUserId={user.id}
              onOpenRecipe={(rId) => handleOpenPublicRecipe(rId)}
            />
          )}
          {s === 'discover' && (
            <DiscoverScreen
              currentUserId={user.id}
              onOpenRecipe={(rId) => handleOpenPublicRecipe(rId)}
              onSaveToLibrary={handleSaveToLibrary}
              savedRecipeIds={new Set(savedRecipes.map(r => r.recipe_id))}
            />
          )}
          {s === 'community-cookbook' && (
            <CommunityCookbookScreen
              onBack={() => { setMainTab('cookbooks'); navigate('home'); }}
              onOpenRecipe={(rId) => handleOpenPublicRecipe(rId)}
            />
          )}
          {s === 'user-profile' && screen.userId && (
            <UserPublicProfileScreen
              userId={screen.userId}
              currentUserId={user.id}
              onBack={() => navigate(screen._from || 'home')}
              onOpenPublicRecipe={(rId) => handleOpenPublicRecipe(rId, 'user-profile')}
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
              onNewRecipe={() => navigate('new-recipe', { cbId })}
              onOpenRecipe={(rId) => navigate('recipe', { cbId, rId })}
            />
          )}
          {s === 'new-recipe' && cb && <RecipeFormScreen onBack={() => navigate('cookbook', { cbId })} onSave={data => handleNewRecipe(cbId, data)} saving={saving} unitPreference={profile?.unit_preference || 'metric'} />}
          {s === 'recipe-saved' && cb && recipe && (
            <RecipeSavedScreen
              recipe={recipe}
              onCookNow={() => navigate('prep', { cbId, rId })}
              onBackToCookbook={() => navigate('cookbook', { cbId, rId })}
            />
          )}
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
              onPublish={(rId) => handlePublishRecipe(cbId, rId)}
              onOpenAuthor={handleOpenAuthor}
            />
          )}
          {s === 'public-recipe' && (
            publicRecipeView?.recipe ? (
              <RecipeDetailScreen
                recipe={publicRecipeView.recipe}
                cookbook={null}
                onBack={goBackFromPublicRecipe}
                onStartCook={() => navigate('prep-public', { publicRecipeId: screen.publicRecipeId, _returnTo: screen._returnTo })}
                currentUserId={user.id}
                onOpenAuthor={handleOpenAuthor}
                myCookbooks={cookbooks}
                onSaveToLibrary={handleSaveToLibrary}
                onUnsave={handleUnsaveRecipe}
                savedRow={savedRecipes.find(r => r.recipe_id === publicRecipeView.recipe.id) || null}
                savedToast={savedToastFor === publicRecipeView.recipe.id}
              />
            ) : (
              <div className="loading-screen">
                <img src="/logo.png" alt="The Pass" className="loading-logo" style={{ width: 220, height: 'auto' }} />
              </div>
            )
          )}
          {s === 'prep-public' && publicRecipeView?.recipe && <PrepChecklistScreen recipe={publicRecipeView.recipe} currentUserId={user.id} onBack={() => navigate('public-recipe', { publicRecipeId: screen.publicRecipeId, _returnTo: screen._returnTo })} onStart={() => navigate('cook-public', { publicRecipeId: screen.publicRecipeId, _returnTo: screen._returnTo })} />}
          {s === 'prep' && cb && recipe && <PrepChecklistScreen recipe={recipe} currentUserId={user.id} onBack={() => navigate('recipe', { cbId, rId })} onStart={() => navigate('cook', { cbId, rId })} />}
          {s === 'done' && recipe && <DoneScreen recipe={recipe} onContinue={() => navigate('feedback', { cbId, rId })} />}
          {s === 'feedback' && recipe && <FeedbackScreen recipe={recipe} onSave={(e, t, o, n, extras) => handleSaveFeedback(cbId, rId, e, t, o, n, extras)} onSkip={() => navigate('post', { cbId, rId })} />}
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
