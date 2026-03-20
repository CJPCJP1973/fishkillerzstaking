
-- Add seller_paid column to profiles
ALTER TABLE public.profiles ADD COLUMN seller_paid boolean NOT NULL DEFAULT false;

-- Mark existing active sellers as paid (they already went through the payment flow)
UPDATE public.profiles SET seller_paid = true WHERE seller_status = 'active';

-- Create RPC to start a free seller trial (grants seller role + active status without payment)
CREATE OR REPLACE FUNCTION public.start_seller_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _current_status text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT seller_status INTO _current_status FROM public.profiles WHERE user_id = _uid;

  IF _current_status = 'active' THEN
    RAISE EXCEPTION 'Already an active seller';
  END IF;

  IF _current_status = 'banned' THEN
    RAISE EXCEPTION 'Account is banned';
  END IF;

  -- Grant seller role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'seller')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Activate seller status with trial (unpaid)
  UPDATE public.profiles
  SET seller_status = 'active', seller_paid = false
  WHERE user_id = _uid;
END;
$$;

-- Update profiles UPDATE policy to lock seller_paid (only admin can change it)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id)
  AND (NOT (verified IS DISTINCT FROM (SELECT p.verified FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (total_wins IS DISTINCT FROM (SELECT p.total_wins FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (win_rate IS DISTINCT FROM (SELECT p.win_rate FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (seller_status IS DISTINCT FROM (SELECT p.seller_status FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (total_staked IS DISTINCT FROM (SELECT p.total_staked FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (balance IS DISTINCT FROM (SELECT p.balance FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (verification_status IS DISTINCT FROM (SELECT p.verification_status FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (verification_note IS DISTINCT FROM (SELECT p.verification_note FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (reliability_score IS DISTINCT FROM (SELECT p.reliability_score FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (seller_tier IS DISTINCT FROM (SELECT p.seller_tier FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (is_vip IS DISTINCT FROM (SELECT p.is_vip FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (completed_sessions IS DISTINCT FROM (SELECT p.completed_sessions FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (fraud_flags IS DISTINCT FROM (SELECT p.fraud_flags FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (is_shadow_banned IS DISTINCT FROM (SELECT p.is_shadow_banned FROM profiles p WHERE p.user_id = auth.uid())))
  AND (NOT (seller_paid IS DISTINCT FROM (SELECT p.seller_paid FROM profiles p WHERE p.user_id = auth.uid())))
);

-- Update profiles INSERT policy to include seller_paid = false
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() = user_id)
  AND (balance = 0::numeric)
  AND (NOT (verified IS DISTINCT FROM false))
  AND (is_vip = false)
  AND (seller_status = 'none'::text)
  AND (seller_tier = 1)
  AND (fraud_flags = 0)
  AND (is_shadow_banned = false)
  AND (verification_status = 'none'::text)
  AND (completed_sessions = 0)
  AND (reliability_score = 75)
  AND (seller_paid = false)
);
