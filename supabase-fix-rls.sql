-- ============================================================
-- FIX RLS POLICIES FOR DRIVER AVAILABILITY RESET
-- Run this in Supabase SQL Editor
-- ============================================================

-- Allow any authenticated user to update driver availability
-- (needed so customers can reset drivers to available during booking)
DROP POLICY IF EXISTS "Drivers can update own record" ON drivers;

CREATE POLICY "Authenticated users can update driver availability"
  ON drivers FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also ensure the mock drivers SQL scripts can run
-- (in case you haven't dropped the FK constraint yet)
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;
