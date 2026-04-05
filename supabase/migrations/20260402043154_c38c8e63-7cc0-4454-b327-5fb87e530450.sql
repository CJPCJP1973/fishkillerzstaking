-- Drop functions whose return types are changing
DROP FUNCTION IF EXISTS public.get_own_profile();
DROP FUNCTION IF EXISTS public.get_seller_leaderboard();
DROP FUNCTION IF EXISTS public.get_public_sessions();

-- 1. Recreate get_own_profile without seller_tier
CREATE FUNCTION public.get_own_profile()
 RETURNS TABLE(id uuid, user_id uuid, display_name text, username text, bio text, avatar_url text, balance numeric, seller_status text, seller_paid boolean, is_vip boolean, verified boolean, verification_status text, total_wins integer, total_staked numeric, win_rate numeric, completed_sessions integer, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, p.user_id, p.display_name, p.username, p.bio, p.avatar_url,
    p.balance, p.seller_status, p.seller_paid, p.is_vip,
    p.verified, p.verification_status,
    p.total_wins, p.total_staked, p.win_rate, p.completed_sessions,
    p.created_at, p.updated_at
  FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1;
$$;

-- 2. Recreate get_seller_leaderboard without seller_tier
CREATE FUNCTION public.get_seller_leaderboard()
 RETURNS TABLE(display_name text, username text, avatar_url text, is_vip boolean, completed_sessions integer, total_earnings numeric)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.display_name, p.username, p.avatar_url, p.is_vip, p.completed_sessions,
    COALESCE(SUM(s.platform_fee), 0)::numeric as total_earnings
  FROM public.profiles p
  LEFT JOIN public.sessions s ON s.shooter_id = p.user_id AND s.status = 'completed'
  WHERE p.seller_status = 'active' AND p.completed_sessions > 0 AND COALESCE(p.is_shadow_banned, false) = false
  GROUP BY p.user_id, p.display_name, p.username, p.avatar_url, p.is_vip, p.completed_sessions
  ORDER BY p.completed_sessions DESC, total_earnings DESC LIMIT 50;
$$;

-- 3. Recreate get_public_sessions without shooter_tier
CREATE FUNCTION public.get_public_sessions()
 RETURNS TABLE(id uuid, shooter_name text, platform text, agent_room text, total_buy_in numeric, stake_available numeric, stake_sold numeric, share_price numeric, end_time timestamp with time zone, status session_status, stream_url text, created_at timestamp with time zone, shooter_fraud_flags integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT s.id, s.shooter_name, s.platform, s.agent_room,
    s.total_buy_in, s.stake_available, s.stake_sold, s.share_price,
    s.end_time, s.status, s.stream_url, s.created_at,
    COALESCE(p.fraud_flags, 0)::integer as shooter_fraud_flags
  FROM public.sessions s
  LEFT JOIN public.profiles p ON p.user_id = s.shooter_id
  WHERE (COALESCE(p.is_shadow_banned, false) = false OR s.shooter_id = auth.uid())
  ORDER BY s.created_at DESC;
$$;

-- 4. Update check_profile_update_allowed (same return type, so CREATE OR REPLACE works)
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed(_user_id uuid, _new profiles)
 RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _old profiles;
BEGIN
  SELECT * INTO _old FROM profiles WHERE user_id = _user_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF _new.user_id IS DISTINCT FROM _old.user_id THEN RETURN false; END IF;
  IF _new.verified IS DISTINCT FROM _old.verified THEN RETURN false; END IF;
  IF _new.total_wins IS DISTINCT FROM _old.total_wins THEN RETURN false; END IF;
  IF _new.win_rate IS DISTINCT FROM _old.win_rate THEN RETURN false; END IF;
  IF _new.seller_status IS DISTINCT FROM _old.seller_status THEN RETURN false; END IF;
  IF _new.total_staked IS DISTINCT FROM _old.total_staked THEN RETURN false; END IF;
  IF _new.balance IS DISTINCT FROM _old.balance THEN RETURN false; END IF;
  IF _new.verification_status IS DISTINCT FROM _old.verification_status THEN RETURN false; END IF;
  IF _new.verification_note IS DISTINCT FROM _old.verification_note THEN RETURN false; END IF;
  IF _new.reliability_score IS DISTINCT FROM _old.reliability_score THEN RETURN false; END IF;
  IF _new.is_vip IS DISTINCT FROM _old.is_vip THEN RETURN false; END IF;
  IF _new.completed_sessions IS DISTINCT FROM _old.completed_sessions THEN RETURN false; END IF;
  IF _new.fraud_flags IS DISTINCT FROM _old.fraud_flags THEN RETURN false; END IF;
  IF _new.is_shadow_banned IS DISTINCT FROM _old.is_shadow_banned THEN RETURN false; END IF;
  IF _new.seller_paid IS DISTINCT FROM _old.seller_paid THEN RETURN false; END IF;
  RETURN true;
END;
$$;

-- 5. Update insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND (balance = (0)::numeric) AND (NOT (verified IS DISTINCT FROM false))
  AND (is_vip = false) AND (seller_status = 'none'::text) AND (fraud_flags = 0)
  AND (is_shadow_banned = false) AND (verification_status = 'none'::text)
  AND (completed_sessions = 0) AND (reliability_score = 75) AND (seller_paid = false)
);

-- 6. Drop the column
ALTER TABLE public.profiles DROP COLUMN seller_tier;