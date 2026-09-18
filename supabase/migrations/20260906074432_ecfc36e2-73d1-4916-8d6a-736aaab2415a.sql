ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#1a1a1a',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT NOT NULL DEFAULT '#f5f5f5',
  ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#c9a227',
  ADD COLUMN IF NOT EXISTS background_color TEXT NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS text_color TEXT NOT NULL DEFAULT '#141414',
  ADD COLUMN IF NOT EXISTS card_bg_color TEXT NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS primary_font TEXT NOT NULL DEFAULT 'Figtree',
  ADD COLUMN IF NOT EXISTS heading_font TEXT NOT NULL DEFAULT 'Outfit',
  ADD COLUMN IF NOT EXISTS base_font_size TEXT NOT NULL DEFAULT '16px',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS site_name TEXT NOT NULL DEFAULT 'PaslaugosGrožiui',
  ADD COLUMN IF NOT EXISTS footer_text TEXT,
  ADD COLUMN IF NOT EXISTS border_radius TEXT NOT NULL DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS button_style TEXT NOT NULL DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS sections JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section_id TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  body_text TEXT,
  image_url TEXT,
  button_text TEXT,
  button_link TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_slug, section_id)
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visi mato aktyvų turinį" ON public.site_content
  FOR SELECT USING (is_active = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin valdo turinį" ON public.site_content
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_content (page_slug, section_id, title, subtitle, body_text, button_text, button_link, sort_order)
VALUES
  ('home', 'hero', 'Grožio industrijos ekosistema', 'Naujienos, mokymai, akcijos ir rezervacijos vienoje vietoje.', NULL, 'Rasti laisvą laiką', '/search', 1),
  ('home', 'business_cta', 'Verslui', 'Salonams, meistrams, tiekėjams ir mokykloms', 'Prisijunk prie platformos ir pasiek tūkstančius klientų.', 'Sužinoti daugiau', '/for-business', 2),
  ('about', 'intro', 'Apie mus', 'Kas mes esame', 'PaslaugosGrožiui – Lietuvos grožio industrijos ekosistema.', NULL, NULL, 1),
  ('pricing', 'intro', 'Narystės', 'Skaidrios kainos', 'Pirmi du mėnesiai visoms narystėms nemokamai.', NULL, NULL, 1),
  ('duk', 'intro', 'Dažniausi klausimai', NULL, NULL, NULL, NULL, 1),
  ('footer', 'main', 'PaslaugosGrožiui', NULL, 'Grožio industrijos ekosistema', NULL, NULL, 1)
ON CONFLICT (page_slug, section_id) DO NOTHING;