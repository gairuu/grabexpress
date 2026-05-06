-- ============================================================
-- FIX: MARK DRIVERS AS AVAILABLE BY DEFAULT
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Change the default for future signups
ALTER TABLE drivers ALTER COLUMN is_available SET DEFAULT true;

-- 2. Update existing drivers (like Lhord Kent) to be available right now
UPDATE drivers SET is_available = true;
