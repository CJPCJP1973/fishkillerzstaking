
-- 1. Harden adjust_balance: require admin role
CREATE OR REPLACE FUNCTION public.adjust_balance(target_uid uuid, delta numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  UPDATE profiles SET balance = balance + delta WHERE user_id = target_uid;
END;
$$;

-- 2. Drop the overly broad sessions SELECT policy
DROP POLICY IF EXISTS "All authenticated can browse sessions" ON public.sessions;
