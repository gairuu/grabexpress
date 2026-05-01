-- ============================================================
-- TEST ACCOUNTS SEED SCRIPT
-- Paste this into Supabase SQL Editor and click "Run"
-- ============================================================

-- Note: This script assumes you have already run the main setup script.
-- It will insert profile records for our test accounts.
-- IMPORTANT: You still need to "Sign Up" these emails in the UI once 
-- with the password "password123" to create the actual Auth user.

-- 1. Create the Admin Profile (if doesn't exist)
-- Replace the UUID with a real one if you want, or just let the trigger handle it.
-- But since we want to ensure they have the right roles:

-- TIP: The best way to use these is to:
-- 1. Register admin@test.com in your app.
-- 2. Register driver@test.com in your app.
-- 3. Run this SQL to fix their roles and data:

UPDATE profiles SET role = 'admin' WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'driver' WHERE email = 'driver@test.com';

-- Ensure the driver is in the drivers table
INSERT INTO drivers (id, vehicle_type, plate_number, rating, is_available)
SELECT id, 'Motorcycle', 'GBX-2025', 4.9, true
FROM profiles 
WHERE email = 'driver@test.com'
ON CONFLICT (id) DO UPDATE SET is_available = true;
