
-- Remove the overly broad permissive policy we just added
DROP POLICY IF EXISTS "All authenticated can browse sessions" ON public.sessions;

-- Drop and recreate the view as security_invoker=off (SECURITY DEFINER)
-- This is intentional: the view only exposes non-sensitive columns
-- and allows all authenticated users to browse sessions without
-- granting them direct SELECT on the full sessions table
DROP VIEW IF EXISTS public.sessions_public;

CREATE OR REPLACE VIEW public.sessions_public
WITH (security_invoker = off) AS
  SELECT
    id,
    shooter_name,
    platform,
    agent_room,
    total_buy_in,
    stake_available,
    stake_sold,
    share_price,
    end_time,
    status,
    stream_url,
    created_at
  FROM public.sessions;

GRANT SELECT ON public.sessions_public TO authenticated;
GRANT SELECT ON public.sessions_public TO anon;
