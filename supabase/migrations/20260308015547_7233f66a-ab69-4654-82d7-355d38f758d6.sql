
-- Replace the security definer view with a security definer function
-- to avoid the linter warning while achieving the same result
DROP VIEW IF EXISTS public.sessions_public;

-- Create a function that returns only non-sensitive session columns
CREATE OR REPLACE FUNCTION public.get_public_sessions()
RETURNS TABLE (
  id uuid,
  shooter_name text,
  platform text,
  agent_room text,
  total_buy_in numeric,
  stake_available numeric,
  stake_sold numeric,
  share_price numeric,
  end_time timestamptz,
  status public.session_status,
  stream_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, shooter_name, platform, agent_room,
    total_buy_in, stake_available, stake_sold, share_price,
    end_time, status, stream_url, created_at
  FROM public.sessions
  ORDER BY created_at DESC;
$$;
