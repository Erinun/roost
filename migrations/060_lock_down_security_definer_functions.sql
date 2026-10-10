-- =============================================================================
-- 060: Lock down SECURITY DEFINER functions
-- =============================================================================
-- By default every function in public is executable by anon/authenticated via
-- PostgREST /rest/v1/rpc — including admin actions like ban_user(). Revoke
-- everything, then re-grant only what the clients actually use.
-- service_role keeps EXECUTE for the backend.

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.sig);
  END LOOP;
END $$;

-- Functions the frontend calls via supabase.rpc() with a user token
GRANT EXECUTE ON FUNCTION public.award_points(uuid, point_action_type, integer, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_group(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activation_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remaining_activations(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rank(uuid, uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_premium_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_activation_request(uuid, uuid, activation_request_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_activation(uuid, uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users(text) TO authenticated;

-- Helper functions referenced inside RLS policies. Policies evaluate these as
-- the querying user's role, so authenticated needs EXECUTE for queries to work.
GRANT EXECUTE ON FUNCTION public.check_group_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_group_membership(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin_or_mod(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_public(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_moderator(uuid) TO authenticated;

-- Pin search_path (advisor: role mutable search_path)
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Future functions should not be client-callable by default
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
