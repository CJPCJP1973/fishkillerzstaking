
-- ============================================================
-- FIX 1: Restrict sessions SELECT — create a public view for
-- non-sensitive columns, tighten base table access
-- ============================================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Sessions viewable by all authenticated" ON public.sessions;

-- Shooters can see their own sessions (full row)
CREATE POLICY "Shooters can view own sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (shooter_id = auth.uid());

-- Backers can see sessions they have staked in (full row)
CREATE POLICY "Backers can view staked sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stakes
    WHERE stakes.session_id = sessions.id
      AND stakes.backer_id = auth.uid()
  ));

-- Create a public view with only non-sensitive columns
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

-- Allow all authenticated users to read the public view
-- (The view uses security_invoker, so we need a policy that
--  allows SELECT for the view's underlying query. We add a
--  restrictive=false (permissive) policy for authenticated on
--  sessions that only the view will practically use.)
-- Actually, security_invoker means the view runs as the calling user.
-- We need a permissive policy so the view works for all authenticated users.
-- Let's add a PERMISSIVE select policy that allows reading only the
-- columns exposed by the view. Since RLS is row-level not column-level,
-- we'll use a different approach: grant via a SECURITY DEFINER function.

-- Better approach: make the broad SELECT permissive so the view works,
-- but make the restrictive policies above also apply. Actually in PG,
-- RESTRICTIVE policies require ALL to pass. Let me reconsider.

-- The current policies on sessions are all RESTRICTIVE (Permissive: No).
-- With restrictive policies, ALL must pass. That's wrong for OR logic.
-- We need permissive policies for the OR pattern (shooter OR backer OR admin).

-- Let me fix: drop what we just created and redo as permissive policies.
DROP POLICY IF EXISTS "Shooters can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Backers can view staked sessions" ON public.sessions;

-- Recreate as PERMISSIVE
CREATE POLICY "Shooters can view own sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (shooter_id = auth.uid());

CREATE POLICY "Backers can view staked sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stakes
    WHERE stakes.session_id = sessions.id
      AND stakes.backer_id = auth.uid()
  ));

-- For the sessions_public view, all authenticated users need to read
-- the underlying sessions table. We use a SECURITY DEFINER wrapper function instead.
-- Drop the view and recreate without security_invoker.
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

-- Grant select on the view to authenticated and anon
GRANT SELECT ON public.sessions_public TO authenticated;
GRANT SELECT ON public.sessions_public TO anon;

-- ============================================================
-- FIX 2: Stake amount server-side validation
-- ============================================================

-- Add a CHECK constraint for positive amounts
ALTER TABLE public.stakes ADD CONSTRAINT stakes_amount_positive CHECK (amount > 0);

-- Drop old INSERT policy and recreate with amount validation
DROP POLICY IF EXISTS "Backers can create stakes" ON public.stakes;

CREATE POLICY "Backers can create stakes"
  ON public.stakes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = backer_id
    AND public.has_role(auth.uid(), 'backer')
    AND amount > 0
    AND amount <= (
      SELECT s.stake_available - COALESCE(s.stake_sold, 0)
      FROM public.sessions s WHERE s.id = session_id
    )
  );
