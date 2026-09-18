CREATE POLICY "Public can view salon and supplier roles" ON public.user_roles FOR SELECT TO anon, authenticated USING (role IN ('salon','supplier'));
GRANT SELECT ON public.user_roles TO anon;