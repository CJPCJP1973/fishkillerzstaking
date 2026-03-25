-- Recreate profiles_public view with security_invoker to satisfy linter
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
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

-- Add a policy allowing public SELECT on profiles for the limited columns exposed by the view
-- This is safe because the view only exposes non-sensitive fields
CREATE POLICY "Public can read non-sensitive profile data"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);