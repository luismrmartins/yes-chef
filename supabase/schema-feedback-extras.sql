-- ─────────────────────────────────────────────────────────────────────────────
-- schema-feedback-extras.sql
-- Adds two columns to recipe_feedback for the post-cook questionnaire:
--   left_app          enum-like text capturing whether the user left the app
--                     mid-cook ("none", "once_or_twice", "several")
--   improvement_notes free text from "what would have made this easier?"
-- Run as one block in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

alter table recipe_feedback
  add column if not exists left_app text;

alter table recipe_feedback
  add column if not exists improvement_notes text;
