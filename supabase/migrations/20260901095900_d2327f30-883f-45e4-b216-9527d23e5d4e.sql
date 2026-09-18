-- 1) Column-level lockdown on public.profiles ------------------------------
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, business_name, owner_name, city, address, lat, lng, phone, avatar_url,
  cover_url, bio, category, subscription_active, subscription_expires_at,
  suspended, created_at, updated_at, is_featured, featured_until,
  featured_priority, plan_type, plan_tier, gallery_urls, blocked_at,
  verification_status, verified_at, at_home_service, subscription_plan,
  subscription_billing, subscription_state, subscription_started_at,
  auto_renew, is_approved, payments_enabled, is_primary_owner,
  first_membership_at, shipping_config, business_description,
  accept_app_payments, accept_onsite_payments, cancellation_fee_percent,
  cancellation_window_mins, amenities, min_advance_mins, same_day_closed_on,
  membership_level
) ON public.profiles TO anon;

GRANT SELECT (
  id, business_name, owner_name, email, city, address, lat, lng, phone,
  avatar_url, cover_url, bio, category, subscription_active,
  subscription_expires_at, suspended, created_at, updated_at, is_featured,
  featured_until, featured_priority, plan_type, plan_tier, gallery_urls,
  blocked_at, blocked_reason, verification_status, verification_docs,
  verified_at, rejection_reason, at_home_service, subscription_plan,
  subscription_billing, subscription_state, subscription_started_at,
  next_billing_at, auto_renew, wallet_balance, wallet_pending,
  accepted_terms_at, is_approved, payments_enabled, is_primary_owner,
  first_membership_at, shipping_config, business_description,
  notify_bookings, notify_messages, notify_payments, notify_marketing,
  notify_email, accept_app_payments, accept_onsite_payments,
  cancellation_fee_percent, cancellation_window_mins, amenities,
  min_advance_mins, same_day_closed_on, membership_level
) ON public.profiles TO authenticated;

-- writes: never let clients set banking / tax / Stripe / wallet fields
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (
  business_name, owner_name, email, city, address, lat, lng, phone,
  avatar_url, cover_url, bio, category, gallery_urls, at_home_service,
  business_description, shipping_config, notify_bookings, notify_messages,
  notify_payments, notify_marketing, notify_email, accept_app_payments,
  accept_onsite_payments, cancellation_fee_percent, cancellation_window_mins,
  amenities, min_advance_mins, same_day_closed_on, accepted_terms_at,
  verification_status, verification_docs, is_featured, featured_until,
  subscription_active, subscription_expires_at, subscription_plan,
  subscription_billing, subscription_state, subscription_started_at,
  auto_renew, plan_type, plan_tier, suspended, is_approved, blocked_at,
  blocked_reason, membership_level, next_billing_at
) ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;

-- 2) GDPR soft-delete marker -----------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
GRANT SELECT (deleted_at) ON public.profiles TO authenticated;

-- 3) Storage: owner-scoped writes for the products bucket ------------------
DROP POLICY IF EXISTS "products owner update" ON storage.objects;
DROP POLICY IF EXISTS "products owner delete" ON storage.objects;

CREATE POLICY "products owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "products owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Privileged routines: no public / client execute -----------------------
DO $$
DECLARE
  fn text;
  admin_only text[] := ARRAY[
    'admin_block_user(uuid,text)',
    'admin_unblock_user(uuid)',
    'admin_set_role(uuid,app_role,boolean)',
    'admin_set_salon_approved(uuid,boolean)',
    'super_admin_set_role(uuid,app_role,boolean)',
    'notify_admins(notification_type,jsonb)',
    'auto_cancel_unpaid_appointments()',
    'expire_featured()',
    'expire_promoted_articles()',
    'expire_stale_subscriptions()',
    'list_salon_ids()',
    'list_provider_roles()'
  ];
  anon_denied text[] := ARRAY[
    'has_role(uuid,app_role)',
    'is_super_admin(uuid)',
    'is_business_user(uuid)',
    'is_provider_user(uuid)',
    'get_user_role(uuid)',
    'is_article_author(uuid)',
    'accept_staff_invite(uuid)',
    'purchase_article_promotion(uuid,text)'
  ];
BEGIN
  FOREACH fn IN ARRAY admin_only LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;
  FOREACH fn IN ARRAY anon_denied LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
  END LOOP;
END $$;