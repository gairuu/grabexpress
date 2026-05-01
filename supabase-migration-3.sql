-- ============================================================
-- ADD EXTRA COLUMNS TO DELIVERIES TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS sender_phone TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS item_size TEXT,
ADD COLUMN IF NOT EXISTS item_weight NUMERIC,
ADD COLUMN IF NOT EXISTS item_type TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
