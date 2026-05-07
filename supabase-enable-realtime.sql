-- ============================================================
-- ENABLE REALTIME FOR INSTANT UPDATES
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable replication for the deliveries table
ALTER publication supabase_realtime ADD TABLE deliveries;

-- 2. Enable for drivers to get instant availability updates
ALTER publication supabase_realtime ADD TABLE drivers;

-- 3. Enable for profiles to get instant user data updates
ALTER publication supabase_realtime ADD TABLE profiles;

-- Note: If the above commands fail with "already exists", you can check with:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
