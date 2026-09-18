CREATE TABLE public.provider_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.global_brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (profile_id, brand_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_brands TO authenticated;
GRANT SELECT ON public.provider_brands TO anon;
GRANT ALL ON public.provider_brands TO service_role;

ALTER TABLE public.provider_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "provider_brands_public_read_anon" ON public.provider_brands
  FOR SELECT TO anon USING (true);
CREATE POLICY "provider_brands_public_read_auth" ON public.provider_brands
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider_brands_owner_insert" ON public.provider_brands
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "provider_brands_owner_delete" ON public.provider_brands
  FOR DELETE TO authenticated USING (profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "provider_brands_admin_update" ON public.provider_brands
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_provider_brands_profile ON public.provider_brands(profile_id);
CREATE INDEX idx_provider_brands_brand ON public.provider_brands(brand_id);

UPDATE public.site_settings
   SET features = COALESCE(features, '{}'::jsonb) || jsonb_build_object('public_b2c_store', false)
 WHERE id = 1 AND NOT (COALESCE(features, '{}'::jsonb) ? 'public_b2c_store');