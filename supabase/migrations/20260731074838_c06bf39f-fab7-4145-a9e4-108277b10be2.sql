GRANT SELECT ON public.products TO anon;
DROP POLICY IF EXISTS "products public read active" ON public.products;
CREATE POLICY "products public read active"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);

DROP POLICY IF EXISTS "products authenticated read active" ON public.products;
CREATE POLICY "products authenticated read active"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);