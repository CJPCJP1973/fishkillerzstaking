-- Recreate profiles_public view WITHOUT user_id (internal field)
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