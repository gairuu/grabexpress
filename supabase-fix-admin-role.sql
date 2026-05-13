-- FIX FOR ADMIN ROLE REGISTRATION
-- Run this in your Supabase SQL Editor

-- 1. Update the trigger function to be more reliable with metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role user_role;
BEGIN
  -- Extract role from metadata, default to 'customer' if missing or invalid
  new_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer');

  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'New User'),
    NEW.email,
    new_role
  )
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role, name = EXCLUDED.name;
  
  -- AUTOMATIC DRIVER SETUP
  -- If the role is driver, ensure they have a record in drivers and vehicles
  IF new_role = 'driver' THEN
    INSERT INTO public.drivers (id, status, rating, license_number)
    VALUES (NEW.id, 'available', 5.0, COALESCE(NEW.raw_user_meta_data ->> 'licenseNumber', 'PENDING'))
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.vehicles (driver_id, plate_number, vehicle_type, vehicle_model, color)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'plateNumber', 'PENDING'),
      COALESCE(NEW.raw_user_meta_data ->> 'vehicleType', 'Motorcycle'),
      'Not Specified',
      'Not Specified'
    )
    ON CONFLICT (driver_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. If you are already logged in as "admin" but the system says "CUSTOMER", 
-- run this to fix your specific account (replace with your email):
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
