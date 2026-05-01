-- ============================================================
-- REGISTER MOCK DRIVERS IN THE DATABASE
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Insert into Profiles first (Drivers reference Profiles)
INSERT INTO profiles (id, name, email, role)
VALUES 
  ('7b3c1b82-8b4d-4e9a-9e1a-8c1b8b4d4e9a', 'Ramon Delos Reyes', 'ramon@mock.com', 'driver'),
  ('8c4d2c93-9c5e-5f0b-0f2b-9d2c9c5e5f0b', 'Felix Torres', 'felix@mock.com', 'driver'),
  ('9d5e3d04-0d6f-6a1c-1a3c-0e3d0d6f6a1c', 'Noel Bautista', 'noel@mock.com', 'driver'),
  ('0e6f4e15-1e7a-7b2d-2b4d-1f4e1e7a7b2d', 'Rommel Castillo', 'rommel@mock.com', 'driver'),
  ('1f7a5f26-2f8b-8c3e-3c5e-2f5f2f8b8c3e', 'Danilo Mercado', 'danilo@mock.com', 'driver')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert into Drivers table
INSERT INTO drivers (id, vehicle_type, plate_number, rating, is_available)
VALUES 
  ('7b3c1b82-8b4d-4e9a-9e1a-8c1b8b4d4e9a', 'Motorcycle', 'ABC 1234', 4.9, true),
  ('8c4d2c93-9c5e-5f0b-0f2b-9d2c9c5e5f0b', 'Motorcycle', 'XYZ 5678', 4.7, true),
  ('9d5e3d04-0d6f-6a1c-1a3c-0e3d0d6f6a1c', 'Car', 'DEF 9012', 4.8, true),
  ('0e6f4e15-1e7a-7b2d-2b4d-1f4e1e7a7b2d', 'Van', 'GHI 3456', 4.6, true),
  ('1f7a5f26-2f8b-8c3e-3c5e-2f5f2f8b8c3e', 'Motorcycle', 'JKL 7890', 5.0, true)
ON CONFLICT (id) DO NOTHING;
