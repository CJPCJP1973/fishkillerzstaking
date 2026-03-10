
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public AS
SELECT
  id,
  user_id,
  display_name,
  username,
  bio,
  avatar_url,
  seller_status,
  total_wins,
  total_staked,
  win_rate,
  verified,
  fraud_flags,
  created_at,
  updated_at
FROM public.profiles;
