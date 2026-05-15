-- Allow customers to delete their own delivery history
-- This is required for the "Clear History" feature to work.

CREATE POLICY "Users can delete their own deliveries" 
ON public.deliveries 
FOR DELETE 
USING (auth.uid() = customer_id);

-- Ensure RLS is enabled (it should be already)
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
