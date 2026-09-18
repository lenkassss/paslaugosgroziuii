
-- 1. Add rental_inquiry to notification_type enum (must be committed before use)
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'rental_inquiry';

-- 2. Rental inquiries table
CREATE TABLE IF NOT EXISTS public.rental_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rental_listings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rental_inquiries_owner_idx ON public.rental_inquiries(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rental_inquiries_sender_idx ON public.rental_inquiries(sender_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.rental_inquiries TO authenticated;
GRANT ALL ON public.rental_inquiries TO service_role;

ALTER TABLE public.rental_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads inquiries" ON public.rental_inquiries
  FOR SELECT TO authenticated USING (auth.uid() = owner_id OR auth.uid() = sender_id);
CREATE POLICY "Owner updates own inquiries" ON public.rental_inquiries
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Anyone signed-in creates inquiry" ON public.rental_inquiries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

CREATE TRIGGER trg_rental_inquiries_updated_at BEFORE UPDATE ON public.rental_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Relax profiles public SELECT — show approved OR subscribed salons
DROP POLICY IF EXISTS "Public view of active profiles" ON public.profiles;
CREATE POLICY "Public view of active profiles" ON public.profiles
  FOR SELECT USING (
    (
      COALESCE(suspended, false) = false
      AND blocked_at IS NULL
      AND (subscription_active = true OR is_approved = true)
    )
    OR auth.uid() = id
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. Global brands taxonomy
CREATE TABLE IF NOT EXISTS public.global_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  is_verified boolean NOT NULL DEFAULT true,
  suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS global_brands_name_lower_idx ON public.global_brands (lower(name));

GRANT SELECT ON public.global_brands TO anon, authenticated;
GRANT INSERT ON public.global_brands TO authenticated;
GRANT ALL ON public.global_brands TO service_role;

ALTER TABLE public.global_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands readable by all" ON public.global_brands
  FOR SELECT USING (true);
CREATE POLICY "Auth users suggest brand" ON public.global_brands
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = suggested_by AND is_verified = false
  );
CREATE POLICY "Admin manages brands" ON public.global_brands
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed popular brands
INSERT INTO public.global_brands (name, slug, is_verified) VALUES
  ('L''Oréal Professionnel', 'loreal-professionnel', true),
  ('Wella Professionals', 'wella-professionals', true),
  ('Schwarzkopf Professional', 'schwarzkopf-professional', true),
  ('Matrix', 'matrix', true),
  ('Olaplex', 'olaplex', true),
  ('Kérastase', 'kerastase', true),
  ('Redken', 'redken', true),
  ('Nashi Argan', 'nashi-argan', true),
  ('Alfaparf Milano', 'alfaparf-milano', true),
  ('Estel Professional', 'estel-professional', true),
  ('Victoria Vynn', 'victoria-vynn', true),
  ('Semilac', 'semilac', true),
  ('Indigo Nails', 'indigo-nails', true),
  ('OPI', 'opi', true),
  ('CND', 'cnd', true),
  ('Gehwol', 'gehwol', true),
  ('Depileve', 'depileve', true),
  ('Thuya', 'thuya', true)
ON CONFLICT (slug) DO NOTHING;

-- 5. products.brand_id FK
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.global_brands(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS products_brand_id_idx ON public.products(brand_id);
