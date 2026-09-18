
DROP POLICY IF EXISTS "Public can register" ON public.event_registrations;
CREATE POLICY "Public can register"
ON public.event_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  article_id IS NOT NULL
  AND char_length(coalesce(name,'')) BETWEEN 1 AND 120
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND seats BETWEEN 1 AND 20
  AND status = 'pending'
);

DROP POLICY IF EXISTS "anyone can submit supplier request" ON public.supplier_requests;
CREATE POLICY "anyone can submit supplier request"
ON public.supplier_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(coalesce(company_name,'')) BETWEEN 1 AND 200
  AND char_length(coalesce(contact_name,'')) BETWEEN 1 AND 120
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(coalesce(products_description,'')) BETWEEN 5 AND 4000
  AND status = 'new'
);
