GRANT SELECT (
  id, business_name, owner_name, city, address, phone, category, bio, business_description,
  avatar_url, cover_url, gallery_urls, lat, lng, amenities, at_home_service,
  verification_status, is_approved, is_featured, featured_priority, featured_until,
  subscription_active, membership_level, plan_tier, plan_type,
  min_advance_mins, same_day_closed_on, cancellation_fee_percent, cancellation_window_mins,
  accept_app_payments, accept_onsite_payments, suspended, blocked_at, deleted_at, created_at
) ON public.profiles TO anon;

GRANT EXECUTE ON FUNCTION public.list_provider_roles() TO anon;
GRANT EXECUTE ON FUNCTION public.list_salon_ids() TO anon;