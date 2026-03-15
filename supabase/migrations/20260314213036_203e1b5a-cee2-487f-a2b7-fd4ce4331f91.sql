
DROP POLICY "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() = user_id)
  AND (balance = 0)
  AND (verified IS NOT DISTINCT FROM false)
  AND (is_vip = false)
  AND (seller_status = 'none')
  AND (seller_tier = 1)
  AND (fraud_flags = 0)
  AND (is_shadow_banned = false)
  AND (verification_status = 'none')
  AND (completed_sessions = 0)
  AND (reliability_score = 75)
);
