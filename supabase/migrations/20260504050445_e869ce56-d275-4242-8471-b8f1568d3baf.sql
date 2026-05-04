-- 1. Drop unused RPC
DROP FUNCTION IF EXISTS public.get_session_payouts_for_shooter(uuid);

-- 2. Reset & re-grant EXECUTE per role intent

-- Public (anon + authenticated) reads
REVOKE EXECUTE ON FUNCTION public.get_public_sessions() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_public_sessions() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_public_profile(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_seller_leaderboard() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_seller_leaderboard() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_confirmed_agents() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_confirmed_agents() TO anon, authenticated;

-- Authenticated-only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_own_profile() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.start_seller_trial() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.start_seller_trial() TO authenticated;

-- Admin-gated (function checks has_role internally; still requires auth)
REVOKE EXECUTE ON FUNCTION public.adjust_balance(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.adjust_balance(uuid, numeric) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_user_emails(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_user_emails(uuid[]) TO authenticated;

-- RLS helpers (authenticated only — invoked inside policies)
REVOKE EXECUTE ON FUNCTION public.is_session_shooter(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.is_session_shooter(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_session_backer(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.is_session_backer(uuid, uuid) TO authenticated;

-- Service-role only (email queue infra)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT  EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT  EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT  EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- Trigger-only / internal helpers — never callable as RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_ban_on_fraud_flags() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_level_seller() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.journal_deposit_confirmed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.journal_session_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.journal_stake_event() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_profile_update_allowed(uuid, public.profiles) FROM PUBLIC, anon, authenticated;
