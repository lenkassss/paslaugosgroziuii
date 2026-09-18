-- 1) Nauja rolė
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'advertiser';

-- 2) Skelbimų struktūra
ALTER TABLE public.classified_listings
  ADD COLUMN IF NOT EXISTS listing_kind text NOT NULL DEFAULT 'pardavimai',
  ADD COLUMN IF NOT EXISTS subtype text,
  ADD COLUMN IF NOT EXISTS place_type text,
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS is_highlighted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS highlight_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_classified_filter
  ON public.classified_listings (listing_kind, subtype, service_category, city)
  WHERE is_active = true;

-- 3) Skelbikų anketos
CREATE TABLE IF NOT EXISTS public.advertiser_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  person_type text NOT NULL DEFAULT 'individual',
  business_name text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  social_links text,
  intent text,
  status text NOT NULL DEFAULT 'pending',
  rejection_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  listing_credits integer NOT NULL DEFAULT 1,
  subscription_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.advertiser_profiles TO authenticated;
GRANT ALL ON public.advertiser_profiles TO service_role;

ALTER TABLE public.advertiser_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skelbikas mato savo anketa"
  ON public.advertiser_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "Skelbikas kuria savo anketa"
  ON public.advertiser_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Administratorius tvarko anketas"
  ON public.advertiser_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_advertiser_profiles_updated_at
  BEFORE UPDATE ON public.advertiser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Pranešimas administratoriams apie naują anketą
CREATE OR REPLACE FUNCTION public.on_advertiser_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_admins(
    'admin_supplier_pending'::notification_type,
    jsonb_build_object('kind', 'advertiser', 'id', NEW.id, 'name', COALESCE(NEW.business_name, NEW.full_name))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_advertiser_submitted
  AFTER INSERT ON public.advertiser_profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_advertiser_submitted();