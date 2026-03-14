
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
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
FROM public.profiles;
