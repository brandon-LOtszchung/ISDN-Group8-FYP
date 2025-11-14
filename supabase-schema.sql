-- Smart Fridge Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- FAMILIES TABLE
-- ============================================
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cooking_skill_level TEXT NOT NULL CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced')),
  budget_range TEXT NOT NULL CHECK (budget_range IN ('low', 'medium', 'high')),
  preferred_language TEXT NOT NULL CHECK (preferred_language IN ('en', 'zh-HK', 'fil', 'id')),
  meal_time_breakfast TIME DEFAULT '08:00',
  meal_time_lunch TIME DEFAULT '12:30',
  meal_time_dinner TIME DEFAULT '19:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FAMILY MEMBERS TABLE
-- ============================================
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  dietary_restrictions TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  health_conditions TEXT[] DEFAULT '{}',
  spice_level TEXT DEFAULT 'mild' CHECK (spice_level IN ('none', 'mild', 'medium', 'hot')),
  favorite_cuisines TEXT[] DEFAULT '{}',
  disliked_ingredients TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vegetables', 'fruits', 'meat', 'seafood', 'dairy', 'grains', 'condiments', 'beverages', 'snacks', 'frozen', 'canned', 'other')),
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  expiry_date DATE,
  confidence DECIMAL(3, 2) DEFAULT 0.95,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SHOPPING LIST TABLE
-- ============================================
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  alternatives TEXT[] DEFAULT '{}',
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, name, unit)
);

-- ============================================
-- SAVED RECIPES TABLE (Optional - for favorites)
-- ============================================
CREATE TABLE saved_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  recipe_data JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_inventory_family_id ON inventory_items(family_id);
CREATE INDEX idx_shopping_list_family_id ON shopping_list_items(family_id);
CREATE INDEX idx_saved_recipes_family_id ON saved_recipes(family_id);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_expiry ON inventory_items(expiry_date);

-- ============================================
-- TRIGGERS for Updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MOCK DATA - Default Family
-- ============================================
INSERT INTO families (id, name, cooking_skill_level, budget_range, preferred_language)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'The Lee Family', 'intermediate', 'medium', 'zh-HK');

-- Mock Family Members
INSERT INTO family_members (id, family_id, name, age, dietary_restrictions, allergies, spice_level, favorite_cuisines)
VALUES 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'John', 35, '{}', '{"nuts"}', 'medium', '{"chinese", "western"}'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Mary', 32, '{"vegetarian"}', '{}', 'mild', '{"chinese", "japanese"}'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Emma', 8, '{}', '{"dairyAllergy"}', 'none', '{"western", "japanese"}');

-- Mock Inventory Items
INSERT INTO inventory_items (family_id, name, category, quantity, unit, expiry_date, confidence)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Chicken Breast', 'meat', 2, 'pieces', CURRENT_DATE + INTERVAL '5 days', 0.95),
  ('00000000-0000-0000-0000-000000000001', 'Broccoli', 'vegetables', 1, 'head', CURRENT_DATE + INTERVAL '2 days', 0.92),
  ('00000000-0000-0000-0000-000000000001', 'Rice', 'grains', 500, 'g', NULL, 0.98),
  ('00000000-0000-0000-0000-000000000001', 'Soy Sauce', 'condiments', 1, 'bottle', NULL, 0.99),
  ('00000000-0000-0000-0000-000000000001', 'Eggs', 'dairy', 6, 'pieces', CURRENT_DATE + INTERVAL '10 days', 0.97),
  ('00000000-0000-0000-0000-000000000001', 'Tomatoes', 'vegetables', 3, 'pieces', CURRENT_DATE + INTERVAL '4 days', 0.94),
  ('00000000-0000-0000-0000-000000000001', 'Onion', 'vegetables', 2, 'pieces', NULL, 0.96),
  ('00000000-0000-0000-0000-000000000001', 'Garlic', 'vegetables', 1, 'bulb', NULL, 0.93);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Optional for MVP
-- ============================================
-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- For now, allow all access (you can add auth later)
CREATE POLICY "Allow all access to families" ON families FOR ALL USING (true);
CREATE POLICY "Allow all access to family_members" ON family_members FOR ALL USING (true);
CREATE POLICY "Allow all access to inventory_items" ON inventory_items FOR ALL USING (true);
CREATE POLICY "Allow all access to shopping_list_items" ON shopping_list_items FOR ALL USING (true);
CREATE POLICY "Allow all access to saved_recipes" ON saved_recipes FOR ALL USING (true);

-- ============================================
-- HELPER FUNCTIONS for Querying
-- ============================================
-- Function to get family with members
CREATE OR REPLACE FUNCTION get_family_with_members(family_id_param UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'id', f.id,
    'name', f.name,
    'cookingSkillLevel', f.cooking_skill_level,
    'budgetRange', f.budget_range,
    'preferredLanguage', f.preferred_language,
    'mealTimes', json_build_object(
      'breakfast', f.meal_time_breakfast,
      'lunch', f.meal_time_lunch,
      'dinner', f.meal_time_dinner
    ),
    'members', COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', fm.id,
          'name', fm.name,
          'age', fm.age,
          'dietaryRestrictions', fm.dietary_restrictions,
          'allergies', fm.allergies,
          'healthConditions', fm.health_conditions,
          'spiceLevel', fm.spice_level,
          'favoriteCuisines', fm.favorite_cuisines,
          'dislikedIngredients', fm.disliked_ingredients
        )
      )
      FROM family_members fm
      WHERE fm.family_id = f.id),
      '[]'::json
    ),
    'createdAt', f.created_at,
    'updatedAt', f.updated_at
  )
  FROM families f
  WHERE f.id = family_id_param;
$$ LANGUAGE SQL;

