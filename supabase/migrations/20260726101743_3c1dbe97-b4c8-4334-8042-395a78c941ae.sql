
-- ============================================================
-- 1. STANDARD SERVICES TAXONOMY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.standard_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS standard_services_name_lower_idx ON public.standard_services (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS standard_services_slug_idx ON public.standard_services (slug);
CREATE INDEX IF NOT EXISTS standard_services_category_idx ON public.standard_services (category, sort_order);

GRANT SELECT ON public.standard_services TO anon, authenticated;
GRANT ALL ON public.standard_services TO service_role;
ALTER TABLE public.standard_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads standard services" ON public.standard_services;
CREATE POLICY "Public reads standard services" ON public.standard_services
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manages standard services" ON public.standard_services;
CREATE POLICY "Admin manages standard services" ON public.standard_services
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS standard_services_updated_at ON public.standard_services;
CREATE TRIGGER standard_services_updated_at BEFORE UPDATE ON public.standard_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link salon-level services to a standard entry
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS standard_service_id UUID
  REFERENCES public.standard_services(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS services_standard_id_idx ON public.services (standard_service_id);

-- Seed the standard catalogue
INSERT INTO public.standard_services (name, slug, category, synonyms, sort_order) VALUES
  ('Manikiūras (klasikinis)', 'manikiuras-klasikinis', 'Nagai', ARRAY['manikiuras','higieninis manikiuras'], 10),
  ('Gelinis lakavimas', 'gelinis-lakavimas', 'Nagai', ARRAY['shellac','geliniai nagai','gel polish'], 20),
  ('Nagų priauginimas', 'nagu-prauginimas', 'Nagai', ARRAY['akrilo nagai','gelio priauginimas','tips'], 30),
  ('Akrilo nagai', 'akrilo-nagai', 'Nagai', ARRAY['acrylic','akrilas'], 40),
  ('Pedikiūras', 'pedikiuras', 'Nagai', ARRAY['classic pedicure','SPA pedikiūras'], 50),
  ('Kojų gelinis lakavimas', 'koju-gelinis-lakavimas', 'Nagai', ARRAY['pedikiūro gelis'], 60),
  ('Moteriškas kirpimas', 'moteriskas-kirpimas', 'Plaukai', ARRAY['moters kirpimas','plaukų kirpimas'], 100),
  ('Vyriškas kirpimas', 'vyriskas-kirpimas', 'Plaukai', ARRAY['vyru kirpimas','barzda'], 110),
  ('Plaukų dažymas (viena spalva)', 'plauku-dazymas', 'Plaukai', ARRAY['dažymas','plauku spalvinimas'], 120),
  ('Balayage / šatiruotė', 'balayage', 'Plaukai', ARRAY['balayage','ombre','šatiruotė'], 130),
  ('Sruogelės (folijos)', 'sruogeles', 'Plaukai', ARRAY['highlights','sruogos','folija'], 140),
  ('Plaukų priežiūros procedūra', 'plauku-prieziura', 'Plaukai', ARRAY['keratinas','botoxas','kaukė'], 150),
  ('Blakstienų priauginimas', 'blakstienu-prauginimas', 'Blakstienos', ARRAY['blakstienos','lash extensions','1D 2D 3D'], 200),
  ('Blakstienų laminavimas', 'blakstienu-laminavimas', 'Blakstienos', ARRAY['lash lift','laminavimas'], 210),
  ('Antakių formavimas', 'antakiu-formavimas', 'Antakiai', ARRAY['antakiai','formavimas','pincetas'], 220),
  ('Antakių dažymas', 'antakiu-dazymas', 'Antakiai', ARRAY['brow tint'], 230),
  ('Antakių laminavimas', 'antakiu-laminavimas', 'Antakiai', ARRAY['brow lamination'], 240),
  ('Makiažas (dienos / vakaro)', 'makiazas', 'Makiažas', ARRAY['makeup','makiažas','proginis'], 300),
  ('Klasikinis veido valymas', 'veido-valymas', 'Kosmetologija', ARRAY['kosmetologija','veidas'], 400),
  ('Depiliacija vašku', 'depiliacija-vasku', 'Depiliacija', ARRAY['wax','vaškas','depiliacija'], 500),
  ('Lazerinė epiliacija', 'lazerine-epiliacija', 'Depiliacija', ARRAY['lazeris','laser hair removal'], 510),
  ('Klasikinis masažas', 'masazas', 'Masažas', ARRAY['massage','atpalaiduojantis masažas'], 600)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. ORDERS EXTENSIONS (shipping + payment method + tracking)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.shipping_method AS ENUM ('omniva','dpd','courier','pickup','free');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('demo_card','invoice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_method public.shipping_method DEFAULT 'omniva',
  ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method NOT NULL DEFAULT 'demo_card',
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS brand_snapshot TEXT;

-- Profiles: shipping config + bank details
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS shipping_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_iban TEXT,
  ADD COLUMN IF NOT EXISTS bank_beneficiary TEXT,
  ADD COLUMN IF NOT EXISTS company_code TEXT,
  ADD COLUMN IF NOT EXISTS vat_code TEXT;

-- ============================================================
-- 3. NOTIFICATION TYPES
-- ============================================================
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'b2b_order_new';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'b2b_order_shipped';
EXCEPTION WHEN others THEN NULL; END $$;

-- ============================================================
-- 4. PRODUCT VISIBILITY (b2b read all active)
-- ============================================================
DROP POLICY IF EXISTS "products b2b read active" ON public.products;
CREATE POLICY "products b2b read active" ON public.products
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Allow anon to see products too (public marketplace preview, still gated at checkout)
DROP POLICY IF EXISTS "products anon read active" ON public.products;
CREATE POLICY "products anon read active" ON public.products
  FOR SELECT TO anon
  USING (is_active = true);

-- ============================================================
-- 5. Approve visible demo salons so search returns them
-- ============================================================
UPDATE public.profiles
   SET is_approved = true
 WHERE subscription_active = true
   AND business_name IS NOT NULL
   AND blocked_at IS NULL
   AND suspended = false
   AND is_approved = false;
