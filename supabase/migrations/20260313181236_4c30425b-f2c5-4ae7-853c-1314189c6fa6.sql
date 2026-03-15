
DROP POLICY "Users can update own profile" ON public.profiles;

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
);
