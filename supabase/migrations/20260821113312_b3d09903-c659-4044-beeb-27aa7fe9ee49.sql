ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS min_advance_mins integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS same_day_closed_on date,
  ADD COLUMN IF NOT EXISTS membership_level text NOT NULL DEFAULT 'pro';

CREATE TABLE IF NOT EXISTS public.classified_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  city text,
  price numeric,
  price_period text,
  images text[] NOT NULL DEFAULT '{}',
  contact_phone text,
  contact_email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.classified_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classified_listings TO authenticated;
GRANT ALL ON public.classified_listings TO service_role;

ALTER TABLE public.classified_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classifieds public read active"
  ON public.classified_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "classifieds owner read own"
  ON public.classified_listings FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "classifieds owner insert"
  ON public.classified_listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "classifieds owner update"
  ON public.classified_listings FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "classifieds owner delete"
  ON public.classified_listings FOR DELETE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_classifieds_updated
  BEFORE UPDATE ON public.classified_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS classified_listings_cat_idx ON public.classified_listings (category, is_active, created_at DESC);