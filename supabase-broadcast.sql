-- ============================================================
-- GRABEXPRESS DRIVER BROADCAST MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add broadcast_status to deliveries
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS broadcast_status TEXT DEFAULT 'searching' CHECK (broadcast_status IN ('searching', 'matched', 'timeout', 'none'));

-- 2. Ensure Realtime is enabled for deliveries (to listen for status changes)
-- This might already be enabled, but running it again is safe.
ALTER publication supabase_realtime ADD TABLE public.deliveries;
