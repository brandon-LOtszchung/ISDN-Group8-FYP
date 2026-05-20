-- Migration: production schema gaps
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Link families to auth users
--    Each family is owned by the authenticated user who created it.
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_families_user_id
  ON public.families USING btree (user_id);

-- 2. Extended member profile columns
--    health_conditions, spice_level, favorite_cuisines, disliked_ingredients
--    are collected during onboarding / member edit and sent to the recipe AI.
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS health_conditions    TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spice_level          TEXT,
  ADD COLUMN IF NOT EXISTS favorite_cuisines    TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS disliked_ingredients TEXT[]  NOT NULL DEFAULT '{}';

-- 3. Recipe attribution on shopping list items
--    recipe_name links a shopping item back to the recipe that generated it,
--    used by the iOS "grouped by recipe" view.
ALTER TABLE public.shopping_list_items
  ADD COLUMN IF NOT EXISTS recipe_name TEXT;
