ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accept_app_payments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accept_onsite_payments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancellation_fee_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_window_mins integer NOT NULL DEFAULT 1440,
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_card_last4 text,
  ADD COLUMN IF NOT EXISTS guarantee_card_last4 text;

CREATE TABLE IF NOT EXISTS public.payment_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand text NOT NULL DEFAULT 'Visa',
  last4 text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  holder text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_cards TO authenticated;
GRANT ALL ON public.payment_cards TO service_role;

ALTER TABLE public.payment_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own cards" ON public.payment_cards;
CREATE POLICY "Users manage own cards" ON public.payment_cards
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);