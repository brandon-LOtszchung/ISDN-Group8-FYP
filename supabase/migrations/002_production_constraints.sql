-- Migration: production constraints and performance fixes
-- Applied to project dpgxcyktcptsnihpitjr on 2026-05-04
-- Run after 001_production_schema.sql

-- ============================================================
-- Fix 1: quantity > 0 CHECK on inventory_items
-- ============================================================
ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_quantity_positive CHECK (quantity > 0);

-- ============================================================
-- Fix 2: quantity > 0 CHECK on shopping_list_items
-- ============================================================
ALTER TABLE public.shopping_list_items
  ADD CONSTRAINT shopping_list_items_quantity_positive CHECK (quantity > 0);

-- ============================================================
-- Fix 3: name non-empty CHECK on inventory_items
-- ============================================================
ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_name_nonempty CHECK (char_length(trim(name)) > 0);

-- ============================================================
-- Fix 4: name non-empty CHECK on shopping_list_items
-- ============================================================
ALTER TABLE public.shopping_list_items
  ADD CONSTRAINT shopping_list_items_name_nonempty CHECK (char_length(trim(name)) > 0);

-- ============================================================
-- Fix 5: expiry date index for efficient expiry queries
-- ============================================================
CREATE INDEX idx_inventory_items_expiry_date
  ON public.inventory_items (family_id, expiry_date ASC NULLS LAST);

-- ============================================================
-- Fix 6: RLS policies — remove wrapped SELECT auth.uid() subquery
-- Replaces policies that used (SELECT auth.uid() AS uid) with
-- the cleaner direct auth.uid() call for better query planning.
-- ============================================================
ALTER POLICY "Users manage own inventory" ON public.inventory_items
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));

ALTER POLICY "Users manage own family members" ON public.family_members
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));

ALTER POLICY "Users manage own shopping list" ON public.shopping_list_items
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));

ALTER POLICY "Users manage own saved recipes" ON public.saved_recipes
  USING (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()))
  WITH CHECK (family_id IN (SELECT id FROM families WHERE user_id = auth.uid()));

-- ============================================================
-- Fix 7: moddatetime extension + triggers for updated_at
-- Adds a second BEFORE UPDATE trigger using the standard
-- extensions.moddatetime() function alongside the existing
-- update_updated_at() triggers.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE OR REPLACE TRIGGER handle_updated_at_family_members
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_inventory_items
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE OR REPLACE TRIGGER handle_updated_at_shopping_list_items
  BEFORE UPDATE ON public.shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
