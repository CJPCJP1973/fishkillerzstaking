
-- Create a security definer function to check if user is the shooter for a session
CREATE OR REPLACE FUNCTION public.is_session_shooter(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions
    WHERE id = _session_id AND shooter_id = _user_id
  )
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Session shooters can view stakes" ON public.stakes;

-- Recreate without the subquery on sessions (use security definer function instead)
CREATE POLICY "Session shooters can view stakes" ON public.stakes
  FOR SELECT
  USING (public.is_session_shooter(auth.uid(), session_id));

-- Also fix the sessions policy that references stakes to avoid the other direction
DROP POLICY IF EXISTS "Backers can view staked sessions" ON public.sessions;

-- Create a security definer function for checking if user has staked in a session
CREATE OR REPLACE FUNCTION public.is_session_backer(_user_id uuid, _session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stakes
    WHERE session_id = _session_id AND backer_id = _user_id
  )
$$;

CREATE POLICY "Backers can view staked sessions" ON public.sessions
  FOR SELECT
  USING (public.is_session_backer(auth.uid(), id));
