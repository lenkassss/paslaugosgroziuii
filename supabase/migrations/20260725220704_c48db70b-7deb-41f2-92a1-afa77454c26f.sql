-- Split public read policies away from admin/security-definer checks.
-- Anonymous users cannot execute role-checking functions by design, so public policies
-- must not contain public.has_role(...) branches.

DROP POLICY IF EXISTS "ads public read active" ON public.ad_slots;
CREATE POLICY "ads anon read active"
ON public.ad_slots
FOR SELECT
TO anon
USING (is_active = true);
CREATE POLICY "ads auth read active own or admin"
ON public.ad_slots
FOR SELECT
TO authenticated
USING ((is_active = true) OR (auth.uid() = advertiser_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "articles readable by all" ON public.articles;
CREATE POLICY "articles anon read published"
ON public.articles
FOR SELECT
TO anon
USING (status = 'published');
CREATE POLICY "articles auth read published own or admin"
ON public.articles
FOR SELECT
TO authenticated
USING ((status = 'published') OR (auth.uid() = author_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public view of active profiles" ON public.profiles;
CREATE POLICY "profiles anon read approved"
ON public.profiles
FOR SELECT
TO anon
USING (
  COALESCE(suspended, false) = false
  AND blocked_at IS NULL
  AND ((subscription_active = true) OR (is_approved = true))
);
CREATE POLICY "profiles auth read approved own or admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (
    COALESCE(suspended, false) = false
    AND blocked_at IS NULL
    AND ((subscription_active = true) OR (is_approved = true))
  )
  OR (auth.uid() = id)
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Visible or own or admin can view" ON public.article_comments;
CREATE POLICY "article comments anon read visible"
ON public.article_comments
FOR SELECT
TO anon
USING (status = 'visible');
CREATE POLICY "article comments auth read visible own or admin"
ON public.article_comments
FOR SELECT
TO authenticated
USING ((status = 'visible') OR (user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view active rentals" ON public.rental_listings;
CREATE POLICY "rentals b2b read active own or admin"
ON public.rental_listings
FOR SELECT
TO authenticated
USING (
  (owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR (
    is_active = true
    AND (
      public.has_role(auth.uid(), 'salon')
      OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'supplier')
    )
  )
);

DROP POLICY IF EXISTS "Public view active staff" ON public.salon_staff;
CREATE POLICY "salon staff anon read active"
ON public.salon_staff
FOR SELECT
TO anon
USING (is_active = true);
CREATE POLICY "salon staff auth read active own salon or admin"
ON public.salon_staff
FOR SELECT
TO authenticated
USING ((is_active = true) OR (auth.uid() = salon_id) OR (auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));
