-- Restrict marketplace product visibility to B2B roles only
DROP POLICY IF EXISTS "products anon read active" ON public.products;
DROP POLICY IF EXISTS "products b2b read active" ON public.products;

CREATE POLICY "products b2b read active"
  ON public.products FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      public.has_role(auth.uid(), 'salon') OR
      public.has_role(auth.uid(), 'staff') OR
      public.has_role(auth.uid(), 'supplier') OR
      public.has_role(auth.uid(), 'admin')
    )
  );

REVOKE SELECT ON public.products FROM anon;