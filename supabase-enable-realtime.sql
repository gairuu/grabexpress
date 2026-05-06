-- ============================================================
-- ENABLE REALTIME FOR INSTANT UPDATES
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Enable replication for the deliveries table
ALTER publication supabase_realtime ADD TABLE deliveries;

-- 2. (Optional) Also enable for drivers if you want instant availability updates
-- ALTER publication supabase_realtime ADD TABLE drivers;
