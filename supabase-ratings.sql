-- ============================================================
-- GRABEXPRESS POST-DELIVERY RATING MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add Rating and Review columns to Deliveries table
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_review TEXT;

-- 2. Function to automatically recalculate and update a driver's average rating
CREATE OR REPLACE FUNCTION public.update_driver_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC(2,1);
BEGIN
  -- Only recalculate if a driver is assigned and a new rating was just added/updated
  IF NEW.driver_rating IS NOT NULL AND NEW.driver_id IS NOT NULL THEN
    
    -- Calculate the new average rating for this specific driver
    SELECT ROUND(AVG(driver_rating)::numeric, 1) INTO avg_rating
    FROM public.deliveries
    WHERE driver_id = NEW.driver_id AND driver_rating IS NOT NULL;
    
    -- Update the driver's profile with the new average
    UPDATE public.drivers
    SET rating = COALESCE(avg_rating, 5.0)
    WHERE id = NEW.driver_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_delivery_rated ON public.deliveries;
CREATE TRIGGER on_delivery_rated
  AFTER UPDATE OF driver_rating ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_rating();
