-- ============================================================
-- Security Hardening: RLS Functions & Policies
-- Date: 2026-04-29
-- ============================================================

-- 1. Fix backer_cashtag exposure - Create secure RPC function
CREATE OR REPLACE FUNCTION public.get_session_payouts_for_shooter(_session_id uuid)
RETURNS TABLE(
  id uuid,
  session_id uuid,
  stake_id uuid,
  backer_id uuid,
  backer_name text,
  amount_owed numeric,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  transaction_reference text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.session_id,
    p.stake_id,
    p.backer_id,
    p.backer_name,
    p.amount_owed,
    p.status,
    p.created_at,
    p.updated_at,
    p.transaction_reference
  FROM public.payouts p
  JOIN public.sessions s ON s.id = p.session_id
  WHERE p.session_id = _session_id 
    AND s.shooter_id = auth.uid();
$$;

-- 2. Create public agents RPC function (replaces view)
DROP VIEW IF EXISTS public.confirmed_agents_public CASCADE;

CREATE OR REPLACE FUNCTION public.get_confirmed_agents()
RETURNS TABLE(
  id uuid,
  agent_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, agent_name
  FROM public.confirmed_agents
  WHERE is_active = true;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_session_payouts_for_shooter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_confirmed_agents() TO anonymous, authenticated;
