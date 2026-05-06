-- ============================================================
-- FINAL SCHEMA ALIGNMENT - PROFILES
-- Run this in Supabase SQL Editor
-- ============================================================

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles RENAME COLUMN phone TO contact_number;
    END IF;
END $$;
