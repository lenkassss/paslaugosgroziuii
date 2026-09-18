DROP POLICY IF EXISTS "Owners insert own model calls" ON public.model_calls;
CREATE POLICY "Owners insert own model calls" ON public.model_calls
FOR INSERT TO authenticated
WITH CHECK (provider_id = auth.uid() AND public.is_business_user(auth.uid()));