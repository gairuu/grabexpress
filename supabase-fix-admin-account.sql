-- ============================================================
-- QUICK ADMIN ACCOUNT FIX
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Force update the admin account's role to 'admin'
UPDATE profiles 
SET role = 'admin', name = 'Admin' 
WHERE email = 'admin@gmail.com';

-- Step 2: Verify it worked (you should see role = 'admin' in the results)
SELECT id, name, email, role FROM profiles WHERE email = 'admin@gmail.com';
