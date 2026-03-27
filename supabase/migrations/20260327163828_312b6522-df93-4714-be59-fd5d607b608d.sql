
-- Create a SECURITY DEFINER RPC for users to read their own profile
-- Excludes internal moderation fields: is_shadow_banned, fraud_flags, verification_note, reliability_score
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  username text,
  bio text,
  avatar_url text,
  balance numeric,
  seller_status text,
  seller_tier integer,
  seller_paid boolean,
  is_vip boolean,
  verified boolean,
  verification_status text,
  total_wins integer,
  total_staked numeric,
  win_rate numeric,
  completed_sessions integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id, p.user_id, p.display_name, p.username, p.bio, p.avatar_url,
    p.balance, p.seller_status, p.seller_tier, p.seller_paid, p.is_vip,
    p.verified, p.verification_status,
    p.total_wins, p.total_staked, p.win_rate, p.completed_sessions,
    p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

-- Drop the direct SELECT policy for profile owners.
-- The UPDATE policy subselects need SELECT access, so replace with a
-- narrower policy that still allows SELECT but only through the RPC pattern.
-- Actually we cannot drop it without breaking UPDATE subselects, so instead
-- we keep it but the frontend will use the RPC exclusively.
-- 
-- To truly block direct column access, revoke SELECT on sensitive columns.
-- However, the UPDATE WITH CHECK policy references these columns in subselects
-- which would break. So we replace the UPDATE policy to use a SECURITY DEFINER
-- function for immutability checks.

-- Step 1: Create immutability check function
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed(_user_id uuid, _new profiles)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _old profiles;
BEGIN
  SELECT * INTO _old FROM profiles WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN false; END IF;
  
  -- These fields must not change via user update
  IF _new.verified IS DISTINCT FROM _old.verified THEN RETURN false; END IF;
  IF _new.total_wins IS DISTINCT FROM _old.total_wins THEN RETURN false; END IF;
  IF _new.win_rate IS DISTINCT FROM _old.win_rate THEN RETURN false; END IF;
  IF _new.seller_status IS DISTINCT FROM _old.seller_status THEN RETURN false; END IF;
  IF _new.total_staked IS DISTINCT FROM _old.total_staked THEN RETURN false; END IF;
  IF _new.balance IS DISTINCT FROM _old.balance THEN RETURN false; END IF;
  IF _new.verification_status IS DISTINCT FROM _old.verification_status THEN RETURN false; END IF;
  IF _new.verification_note IS DISTINCT FROM _old.verification_note THEN RETURN false; END IF;
  IF _new.reliability_score IS DISTINCT FROM _old.reliability_score THEN RETURN false; END IF;
  IF _new.seller_tier IS DISTINCT FROM _old.seller_tier THEN RETURN false; END IF;
  IF _new.is_vip IS DISTINCT FROM _old.is_vip THEN RETURN false; END IF;
  IF _new.completed_sessions IS DISTINCT FROM _old.completed_sessions THEN RETURN false; END IF;
  IF _new.fraud_flags IS DISTINCT FROM _old.fraud_flags THEN RETURN false; END IF;
  IF _new.is_shadow_banned IS DISTINCT FROM _old.is_shadow_banned THEN RETURN false; END IF;
  IF _new.seller_paid IS DISTINCT FROM _old.seller_paid THEN RETURN false; END IF;
  
  RETURN true;
END;
$$;

-- Step 2: Replace the verbose UPDATE policy with one using the function
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND public.check_profile_update_allowed(auth.uid(), profiles)
);

-- Step 3: Drop the owner SELECT policy and replace with a restricted one
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- New policy: users can SELECT their own row but only non-sensitive columns
-- PostgreSQL RLS can't filter columns, so we keep row-level access for the
-- UPDATE trigger/function internals, but REVOKE column-level SELECT on sensitive fields.
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 4: Revoke SELECT on sensitive internal columns from authenticated role
-- The SECURITY DEFINER functions (get_own_profile, check_profile_update_allowed)
-- run as the function owner and bypass these restrictions.
REVOKE SELECT(is_shadow_banned, fraud_flags, verification_note, reliability_score) ON public.profiles FROM authenticated;
REVOKE SELECT(is_shadow_banned, fraud_flags, verification_note, reliability_score) ON public.profiles FROM anon;
