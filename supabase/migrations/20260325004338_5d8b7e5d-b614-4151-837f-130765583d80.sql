-- Replace security definer view with a security definer function
DROP VIEW IF EXISTS public.profiles_public;

-- Create function to get a public profile by username
CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  seller_status text,
  verified boolean,
  total_wins integer,
  total_staked numeric,
  win_rate numeric,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.avatar_url,
    p.bio,
    p.seller_status,
    p.verified,
    p.total_wins,
    p.total_staked,
    p.win_rate,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.username = _username
    AND COALESCE(p.is_shadow_banned, false) = false
  LIMIT 1;
$$;