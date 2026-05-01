-- ============================================================
-- GRABEXPRESS MIGRATION #2
-- Run this in Supabase SQL Editor AFTER the first script
-- ============================================================

-- Add name columns to deliveries for easier display
ALTER TABLE deliveries ADD COLUMN customer_name TEXT DEFAULT '';
ALTER TABLE deliveries ADD COLUMN driver_name TEXT DEFAULT '';

-- Allow drivers to insert their own driver record on signup
CREATE POLICY "Users can insert own driver record"
  ON drivers FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert profiles (for edge cases)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
