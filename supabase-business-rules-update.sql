-- 1. Add payment_status to deliveries
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' 
CHECK (payment_status IN ('unpaid', 'paid'));

-- 2. Update Admin Policies for Management
-- Allow admins to delete profiles
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to manage drivers
CREATE POLICY "Admins can manage drivers" 
ON public.drivers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
