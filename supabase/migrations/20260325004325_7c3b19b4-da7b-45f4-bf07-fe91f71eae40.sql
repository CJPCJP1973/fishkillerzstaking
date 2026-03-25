-- CRITICAL: Remove dangerous anon policy that exposes all profile columns
DROP POLICY IF EXISTS "Public can read non-sensitive profile data" ON public.profiles;

-- Recreate view WITHOUT security_invoker (security definer is correct here)
-- The view intentionally exposes only safe public fields and acts as the column filter
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
  SELECT
    id,
    display_name,
    username,
    avatar_url,
    bio,
    seller_status,
    verified,
    total_wins,
    total_staked,
    win_rate,
    created_at,
    updated_at
  FROM profiles;