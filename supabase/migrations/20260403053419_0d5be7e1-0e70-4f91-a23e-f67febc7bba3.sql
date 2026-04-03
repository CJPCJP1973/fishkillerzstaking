-- Revoke column-level SELECT on sensitive moderation fields from authenticated and anon roles
-- This prevents direct table queries from seeing these fields while admin policies still work
REVOKE SELECT (fraud_flags, is_shadow_banned, verification_note, reliability_score) ON public.profiles FROM authenticated;
REVOKE SELECT (fraud_flags, is_shadow_banned, verification_note, reliability_score) ON public.profiles FROM anon;