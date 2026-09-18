DROP POLICY IF EXISTS "B2B members view feed" ON public.b2b_feed;
CREATE POLICY "B2B members view feed"
ON public.b2b_feed
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (
      public.has_role(auth.uid(), 'salon')
      OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'supplier')
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.subscription_active = true
        AND NOT p.suspended
    )
  )
);

DROP POLICY IF EXISTS "B2B members post" ON public.b2b_feed;
CREATE POLICY "B2B members post"
ON public.b2b_feed
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (
    public.has_role(auth.uid(), 'salon')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'supplier')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.subscription_active = true
      AND NOT p.suspended
  )
);

DROP POLICY IF EXISTS "B2B members view replies" ON public.b2b_replies;
CREATE POLICY "B2B members view replies"
ON public.b2b_replies
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    (
      public.has_role(auth.uid(), 'salon')
      OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'supplier')
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.subscription_active = true
        AND NOT p.suspended
    )
  )
);

DROP POLICY IF EXISTS "B2B members reply" ON public.b2b_replies;
CREATE POLICY "B2B members reply"
ON public.b2b_replies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = replier_id
  AND (
    public.has_role(auth.uid(), 'salon')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'supplier')
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.subscription_active = true
      AND NOT p.suspended
  )
);

DROP POLICY IF EXISTS "products b2b read active" ON public.products;
CREATE POLICY "products b2b read active"
ON public.products
FOR SELECT
TO authenticated
USING (
  (
    is_active = true
    AND (
      public.has_role(auth.uid(), 'salon')
      OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'supplier')
      OR public.has_role(auth.uid(), 'admin')
    )
  )
  OR auth.uid() = supplier_id
);

DROP POLICY IF EXISTS "Owners create rentals" ON public.rental_listings;
CREATE POLICY "Owners create rentals"
ON public.rental_listings
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = auth.uid()
  AND (
    public.has_role(auth.uid(), 'salon')
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'supplier')
    OR public.has_role(auth.uid(), 'admin')
  )
);