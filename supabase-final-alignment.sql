-- ============================================================
-- FINAL SCHEMA ALIGNMENT MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Align DRIVERS Table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT;
-- Change is_available (boolean) to status (text) to match "status" requirement
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
-- Ensure columns exist before trying to update/drop
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='drivers' AND column_name='is_available') THEN
        UPDATE drivers SET status = CASE WHEN is_available = true THEN 'available' ELSE 'busy' END;
        ALTER TABLE drivers DROP COLUMN is_available;
    END IF;
END $$;

-- 2. Create VEHICLES Table
CREATE TABLE IF NOT EXISTS vehicles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id      UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  plate_number   TEXT NOT NULL,
  vehicle_type   TEXT NOT NULL,
  vehicle_model  TEXT NOT NULL,
  color          TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 3. Align DELIVERIES Table
-- Use DO block to prevent errors if already renamed
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='created_at') THEN
        ALTER TABLE deliveries RENAME COLUMN created_at TO booking_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='status') THEN
        ALTER TABLE deliveries RENAME COLUMN status TO delivery_status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='fee') THEN
        ALTER TABLE deliveries RENAME COLUMN fee TO delivery_fee;
    END IF;
END $$;

-- 4. Align PAYMENTS Table
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='created_at') THEN
        ALTER TABLE payments RENAME COLUMN created_at TO payment_date;
    END IF;
END $$;

-- 5. RLS for Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read for vehicles" ON vehicles;
CREATE POLICY "Public read for vehicles" ON vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Drivers can manage own vehicle" ON vehicles;
CREATE POLICY "Drivers can manage own vehicle" ON vehicles FOR ALL USING (auth.uid() = driver_id);
