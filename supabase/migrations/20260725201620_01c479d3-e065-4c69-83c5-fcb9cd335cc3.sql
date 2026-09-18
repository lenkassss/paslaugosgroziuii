
-- Lock down SECURITY DEFINER functions further. Keep only those genuinely needed by anon/authenticated.

-- Callable by anon (public token flows only):
--   cancel_appointment_by_token, get_appointment_by_token
-- Callable by authenticated (used inside RLS policies or app UI):
--   has_role, is_super_admin, get_user_role, has_active_highlight, is_article_author

-- Revoke from authenticated where not needed:
REVOKE ALL ON FUNCTION public.admin_block_user(uuid, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.admin_unblock_user(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.admin_set_salon_approved(uuid, boolean) FROM authenticated;
REVOKE ALL ON FUNCTION public.super_admin_set_role(uuid, app_role, boolean) FROM authenticated;

-- Grant back to authenticated so admins can still call via RPC (in-function role checks enforce auth):
GRANT EXECUTE ON FUNCTION public.admin_block_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_salon_approved(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.super_admin_set_role(uuid, app_role, boolean) TO authenticated;

-- Ensure the intended public-callable functions have proper grants:
REVOKE ALL ON FUNCTION public.cancel_appointment_by_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_appointment_by_token(uuid, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_appointment_by_token(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_appointment_by_token(uuid) TO anon, authenticated;

-- Helper functions used in RLS policies / UI — needed by authenticated:
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_active_highlight(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_highlight(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_article_author(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_article_author(uuid) TO authenticated;
