-- ============================================================
-- COMPREHENSIVE SCHEMA ALIGNMENT & BUSINESS RULES
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES ALIGNMENT
-- Rename phone to contact_number for consistency with user requirements
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles RENAME COLUMN phone TO contact_number;
    END IF;
END $$;

-- 2. DRIVERS ALIGNMENT
-- Add license_number
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT;

-- 3. VEHICLES TABLE (Standalone Entity)
CREATE TABLE IF NOT EXISTS vehicles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id      UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  plate_number   TEXT NOT NULL,
  vehicle_type   TEXT NOT NULL,
  vehicle_model  TEXT NOT NULL DEFAULT 'Not Specified',
  color          TEXT NOT NULL DEFAULT 'Not Specified',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing data from drivers to vehicles if not already done
INSERT INTO vehicles (driver_id, plate_number, vehicle_type)
SELECT id, plate_number, vehicle_type::text FROM drivers
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vehicles.driver_id = drivers.id);

-- 4. BUSINESS RULE 5: ONE ACTIVE DELIVERY AT A TIME
-- We use a trigger to strictly enforce that a driver cannot be assigned 
-- to a new delivery if they already have an active one.
CREATE OR REPLACE FUNCTION public.check_driver_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the driver already has an active delivery
    IF NEW.driver_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.deliveries 
        WHERE driver_id = NEW.driver_id 
        AND delivery_status IN ('pending', 'in_transit')
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Driver is already handling an active delivery.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_active_delivery ON public.deliveries;
CREATE TRIGGER ensure_single_active_delivery
  BEFORE INSERT OR UPDATE OF driver_id, delivery_status ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_driver_availability();

-- 5. BUSINESS RULE 7: AUTO-RECORD PAYMENT
-- Automatically insert a payment record when delivery is marked 'delivered'
CREATE OR REPLACE FUNCTION public.auto_create_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'delivered' AND OLD.delivery_status != 'delivered' THEN
        INSERT INTO public.payments (delivery_id, amount, payment_method, payment_status)
        VALUES (NEW.id, NEW.delivery_fee, NEW.payment_method::text, 'completed');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_delivery_completed_payment ON public.deliveries;
CREATE TRIGGER on_delivery_completed_payment
  AFTER UPDATE OF delivery_status ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_payment();

-- 6. RLS FOR VEHICLES
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read for vehicles" ON vehicles;
CREATE POLICY "Public read for vehicles" ON vehicles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Drivers can manage own vehicle" ON vehicles;
CREATE POLICY "Drivers can manage own vehicle" ON vehicles FOR ALL USING (auth.uid() = driver_id);

-- 7. CLEANUP OLD DRIVER COLUMNS
-- After migrating to vehicles, we can eventually drop these if desired, 
-- but keeping them for now to avoid breaking existing queries until code is updated.
-- ALTER TABLE drivers DROP COLUMN IF EXISTS plate_number;
-- ALTER TABLE drivers DROP COLUMN IF EXISTS vehicle_type;
