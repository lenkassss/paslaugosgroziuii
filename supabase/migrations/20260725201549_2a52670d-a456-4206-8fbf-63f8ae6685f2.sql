
-- 1) Appointments: remove anon PII exposure. Server functions use service role or authenticated context, so we no longer need a broad SELECT policy.
DROP POLICY IF EXISTS "Slot occupancy base access" ON public.appointments;

-- Allow the booking client to read back their own appointment (by cancel token flow uses SECURITY DEFINER function, so no policy needed).
CREATE POLICY "Client reads own appointment"
ON public.appointments
FOR SELECT
TO authenticated
USING (client_user_id = auth.uid());

-- 2) Appointments: restrict inserts to authenticated users tied to their own account (or NULL client_user_id for salon-created bookings by the salon owner).
DROP POLICY IF EXISTS "Anyone can book with valid target" ON public.appointments;

CREATE POLICY "Authenticated books valid appointment"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  salon_id IS NOT NULL
  AND appointment_date >= CURRENT_DATE
  AND status IN ('pending','confirmed')
  AND (
    client_user_id = auth.uid()
    OR auth.uid() = salon_id
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- 3) salon_reviews: require authentication; reviewer_name stays informational.
DROP POLICY IF EXISTS "Anyone can write review" ON public.salon_reviews;

CREATE POLICY "Authenticated writes review"
ON public.salon_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  salon_id IS NOT NULL
  AND rating_stars BETWEEN 1 AND 5
  AND char_length(coalesce(reviewer_name,'')) BETWEEN 1 AND 80
  AND char_length(coalesce(text_comment,'')) <= 2000
);

-- 4) user_roles: stop exposing salon/supplier role mapping publicly. Public salon discovery already uses public.profiles.
DROP POLICY IF EXISTS "Public can view salon and supplier roles" ON public.user_roles;

-- 5) Storage: prevent listing files in public buckets while keeping direct public URL access (which does not go through storage.objects SELECT).
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "covers public read" ON storage.objects;
DROP POLICY IF EXISTS "gallery public read" ON storage.objects;
DROP POLICY IF EXISTS "anyone reads product images" ON storage.objects;

-- 6) SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated where not needed.
-- Trigger-only functions (never called via API):
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_comment_report() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_comment_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_comment_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_article_promoted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_profile_featured() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_comment_vote_counters() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_super_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_profile_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_grant_super_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_first_week_featured() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_primary_owner() FROM PUBLIC, anon, authenticated;

-- Admin-only functions: revoke from anon (in-function checks still gate authenticated callers).
REVOKE ALL ON FUNCTION public.admin_block_user(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_unblock_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_salon_approved(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.super_admin_set_role(uuid, app_role, boolean) FROM PUBLIC, anon;

-- Maintenance/cron functions: revoke from anon and authenticated.
REVOKE ALL ON FUNCTION public.expire_stale_subscriptions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_cancel_unpaid_appointments() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_featured() FROM PUBLIC, anon, authenticated;

-- Ad counters: called from server side; not needed by anon/authenticated directly.
REVOKE ALL ON FUNCTION public.bump_ad_click(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bump_ad_impression(uuid) FROM PUBLIC, anon, authenticated;
