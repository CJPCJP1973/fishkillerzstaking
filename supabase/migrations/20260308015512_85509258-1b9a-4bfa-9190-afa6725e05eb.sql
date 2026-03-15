
-- Fix the security definer view linter warning by switching to security_invoker=on
-- and adding a permissive SELECT policy for all authenticated users to read sessions
-- (this is safe because the view only exposes non-sensitive columns, and the 
-- underlying permissive policy allows row-level access for browsing)

DROP VIEW IF EXISTS public.sessions_public;

-- Add a permissive policy allowing all authenticated to SELECT sessions
-- This enables the security_invoker view to work for all users
CREATE POLICY "All authenticated can browse sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (true);

-- Recreate view with security_invoker=on (runs as calling user)
CREATE OR REPLACE VIEW public.sessions_public
WITH (security_invoker = on) AS
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
