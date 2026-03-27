
-- Fix: add user_id immutability check to prevent profile row reassignment
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

  -- user_id must never change
  IF _new.user_id IS DISTINCT FROM _old.user_id THEN RETURN false; END IF;

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
