
-- Revoke SELECT on sensitive moderation columns from authenticated and anon roles
REVOKE SELECT (fraud_flags, is_shadow_banned, reliability_score, verification_note) ON public.profiles FROM authenticated;
REVOKE SELECT (fraud_flags, is_shadow_banned, reliability_score, verification_note) ON public.profiles FROM anon;
