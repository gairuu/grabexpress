-- 1. Add 'arrived' to the delivery_status enum
-- Note: PostgreSQL doesn't allow adding values to enums inside a transaction easily in some versions, 
-- but this is the standard way to do it in Supabase.
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'arrived' AFTER 'in_transit';

-- 2. Ensure RLS allows the new status updates
-- (Already handled by previous policies, but good to keep in mind)
