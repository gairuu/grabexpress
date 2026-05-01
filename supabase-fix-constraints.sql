-- ============================================================
-- REMOVE STRICT LOGIN REQUIREMENT FOR PROFILES
-- Run this in Supabase SQL Editor
-- ============================================================

-- This allows us to have mock drivers in the profiles table
-- without them needing to have a real email/password login.

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
