-- ============================================================
-- GRABEXPRESS DATABASE SETUP
-- Paste this into Supabase SQL Editor and click "Run"
-- ============================================================

-- 1. CUSTOM TYPES
CREATE TYPE user_role AS ENUM ('customer', 'driver', 'admin');
CREATE TYPE delivery_status AS ENUM ('pending', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'ewallet');
CREATE TYPE vehicle_type AS ENUM ('Motorcycle', 'Car', 'Van');

-- 2. PROFILES TABLE
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  phone      TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role       user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. DRIVERS TABLE
CREATE TABLE drivers (
  id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type vehicle_type NOT NULL DEFAULT 'Motorcycle',
  plate_number TEXT NOT NULL DEFAULT '',
  rating       NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  is_available BOOLEAN NOT NULL DEFAULT false
);

-- 4. DELIVERIES TABLE
CREATE TABLE deliveries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id        UUID REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_location  TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  status           delivery_status NOT NULL DEFAULT 'pending',
  fee              NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method   payment_method NOT NULL DEFAULT 'cash',
  estimated_time   TEXT DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Drivers are viewable by everyone"
  ON drivers FOR SELECT USING (true);

CREATE POLICY "Drivers can update own record"
  ON drivers FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view relevant deliveries"
  ON deliveries FOR SELECT USING (
    customer_id = auth.uid()
    OR driver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers can create deliveries"
  ON deliveries FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Users can update relevant deliveries"
  ON deliveries FOR UPDATE USING (
    customer_id = auth.uid()
    OR driver_id = auth.uid()
  );
