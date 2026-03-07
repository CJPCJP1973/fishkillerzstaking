
-- Fix 1: Profile update privilege escalation - restrict which columns users can modify
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND verified IS NOT DISTINCT FROM (SELECT p.verified FROM public.profiles p WHERE p.user_id = auth.uid())
  AND total_wins IS NOT DISTINCT FROM (SELECT p.total_wins FROM public.profiles p WHERE p.user_id = auth.uid())
  AND win_rate IS NOT DISTINCT FROM (SELECT p.win_rate FROM public.profiles p WHERE p.user_id = auth.uid())
  AND seller_status IS NOT DISTINCT FROM (SELECT p.seller_status FROM public.profiles p WHERE p.user_id = auth.uid())
  AND total_staked IS NOT DISTINCT FROM (SELECT p.total_staked FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- Fix 2: Email exposure - replace open SELECT with two policies
-- Non-admins can see profiles but not email (enforced via a secure view)
-- Keep existing policy for now but create a secure view for non-admin access

DROP POLICY IF EXISTS "Profiles viewable by all authenticated" ON public.profiles;

-- Admins can see everything including email
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can see their own full profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Create a public view without email for general browsing
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, user_id, display_name, username, bio, avatar_url, verified, seller_status, total_staked, total_wins, win_rate, created_at, updated_at
FROM public.profiles;

-- Everyone can read the public view (no email column)
GRANT SELECT ON public.profiles_public TO authenticated;
