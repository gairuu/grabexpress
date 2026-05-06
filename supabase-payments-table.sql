-- ============================================================
-- CREATE PAYMENTS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id    UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'completed',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Admins and relevant users can view payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.id = payments.delivery_id
        AND (d.customer_id = auth.uid() OR d.driver_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow authenticated users to insert payments (triggered by delivery completion)
CREATE POLICY "Authenticated users can insert payments"
  ON payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
