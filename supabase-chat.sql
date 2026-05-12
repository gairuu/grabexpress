-- ============================================================
-- GRABEXPRESS LIVE CHAT MIGRATION
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Realtime for this table
ALTER publication supabase_realtime ADD TABLE public.messages;

-- 3. Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
CREATE POLICY "Users can view messages for their deliveries"
  ON public.messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.deliveries
      WHERE id = messages.delivery_id
      AND (customer_id = auth.uid() OR driver_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their deliveries"
  ON public.messages FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliveries
      WHERE id = delivery_id
      AND (customer_id = auth.uid() OR driver_id = auth.uid())
    )
    AND sender_id = auth.uid()
  );
