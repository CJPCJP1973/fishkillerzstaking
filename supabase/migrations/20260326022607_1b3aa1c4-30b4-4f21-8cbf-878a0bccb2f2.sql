-- 1. Drop the shooter payout SELECT policy (exposes backer_cashtag)
DROP POLICY IF EXISTS "Shooters can view session payouts" ON public.payouts;

-- 2. Create a SECURITY DEFINER RPC for shooters to view payouts WITHOUT backer_cashtag
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
SET search_path TO 'public'
AS $$
  SELECT p.id, p.session_id, p.stake_id, p.backer_id, p.backer_name,
         p.amount_owed, p.status, p.created_at, p.updated_at, p.transaction_reference
  FROM public.payouts p
  JOIN public.sessions s ON s.id = p.session_id
  WHERE p.session_id = _session_id AND s.shooter_id = auth.uid();
$$;

-- 3. Drop the confirmed_agents_public view (no RLS possible on views)
DROP VIEW IF EXISTS public.confirmed_agents_public;

-- 4. Create a SECURITY DEFINER RPC to replace the view
CREATE OR REPLACE FUNCTION public.get_confirmed_agents()
RETURNS TABLE(id uuid, agent_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ca.id, ca.agent_name
  FROM public.confirmed_agents ca
  ORDER BY ca.agent_name;
$$;