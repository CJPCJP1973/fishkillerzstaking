
-- Fix 1: Restrict sellers from modifying sensitive session fields
DROP POLICY IF EXISTS "Shooters can update own sessions" ON public.sessions;
CREATE POLICY "Shooters can update own sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = shooter_id)
  WITH CHECK (
    auth.uid() = shooter_id
    AND status IS NOT DISTINCT FROM (SELECT s.status FROM public.sessions s WHERE s.id = sessions.id)
    AND winnings IS NOT DISTINCT FROM (SELECT s.winnings FROM public.sessions s WHERE s.id = sessions.id)
    AND platform_fee IS NOT DISTINCT FROM (SELECT s.platform_fee FROM public.sessions s WHERE s.id = sessions.id)
    AND manual_rake_status IS NOT DISTINCT FROM (SELECT s.manual_rake_status FROM public.sessions s WHERE s.id = sessions.id)
    AND stake_available IS NOT DISTINCT FROM (SELECT s.stake_available FROM public.sessions s WHERE s.id = sessions.id)
    AND stake_sold IS NOT DISTINCT FROM (SELECT s.stake_sold FROM public.sessions s WHERE s.id = sessions.id)
    AND admin_confirmed_deposit IS NOT DISTINCT FROM (SELECT s.admin_confirmed_deposit FROM public.sessions s WHERE s.id = sessions.id)
    AND admin_released_winnings IS NOT DISTINCT FROM (SELECT s.admin_released_winnings FROM public.sessions s WHERE s.id = sessions.id)
    AND ocr_start_amount IS NOT DISTINCT FROM (SELECT s.ocr_start_amount FROM public.sessions s WHERE s.id = sessions.id)
    AND ocr_end_amount IS NOT DISTINCT FROM (SELECT s.ocr_end_amount FROM public.sessions s WHERE s.id = sessions.id)
    AND ocr_confidence IS NOT DISTINCT FROM (SELECT s.ocr_confidence FROM public.sessions s WHERE s.id = sessions.id)
  );

-- Fix 2: Add seller_tier and is_vip to protected fields in profile update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT (verified IS DISTINCT FROM (SELECT p.verified FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (total_wins IS DISTINCT FROM (SELECT p.total_wins FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (win_rate IS DISTINCT FROM (SELECT p.win_rate FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (seller_status IS DISTINCT FROM (SELECT p.seller_status FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (total_staked IS DISTINCT FROM (SELECT p.total_staked FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (balance IS DISTINCT FROM (SELECT p.balance FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verification_status IS DISTINCT FROM (SELECT p.verification_status FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (verification_note IS DISTINCT FROM (SELECT p.verification_note FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (reliability_score IS DISTINCT FROM (SELECT p.reliability_score FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (seller_tier IS DISTINCT FROM (SELECT p.seller_tier FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (is_vip IS DISTINCT FROM (SELECT p.is_vip FROM profiles p WHERE p.user_id = auth.uid()))
    AND NOT (completed_sessions IS DISTINCT FROM (SELECT p.completed_sessions FROM profiles p WHERE p.user_id = auth.uid()))
  );
