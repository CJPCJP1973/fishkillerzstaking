-- Defensive lockdown: revoke EXECUTE from PUBLIC/anon/authenticated on every
-- SECURITY DEFINER function that should not be reachable from the PostgREST API,
-- then re-grant to only the intended roles. service_role + postgres always retain access.

-- Helper macro pattern: REVOKE ... FROM PUBLIC, anon, authenticated; then GRANT to intended set.

-- 1) Backend-only: trigger functions, queue plumbing, internal validators.
--    Triggers fire as the table owner regardless of caller grants, so we can safely
--    block all API-exposed roles here.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.handle_new_user()',
    'public.auto_ban_on_fraud_flags()',
    'public.auto_level_seller()',
    'public.journal_deposit_confirmed()',
    'public.journal_session_status()',
    'public.journal_stake_event()',
    'public.update_updated_at_column()',
    'public.validate_payment_profile_fields()',
    'public.validate_profile_fields()',
    'public.check_profile_update_allowed(uuid, public.profiles)',
    'public.move_to_dlq(text, text, bigint, jsonb)',
    'public.enqueue_email(text, jsonb)',
    'public.delete_email(text, bigint)',
    'public.read_email_batch(text, integer, integer)'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

-- 2) Admin-only RPCs: keep callable by authenticated (admins are authenticated
--    users; the function bodies enforce has_role(...,'admin')). Revoke from anon.
REVOKE ALL ON FUNCTION public.adjust_balance(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_balance(uuid, numeric) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_get_user_emails(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_emails(uuid[]) TO authenticated, service_role;

-- 3) Per-user RPCs and RLS helpers: authenticated only, never anon.
REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.start_seller_trial() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_seller_trial() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_session_shooter(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_session_shooter(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_session_backer(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_session_backer(uuid, uuid) TO authenticated, service_role;

-- 4) Intentionally public RPCs (marketplace, unsubscribe link). Re-assert grants.
REVOKE ALL ON FUNCTION public.get_public_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_sessions() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_public_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_seller_leaderboard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_seller_leaderboard() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_confirmed_agents() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_confirmed_agents() TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.consume_unsubscribe_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_unsubscribe_token(text) TO anon, authenticated, service_role;