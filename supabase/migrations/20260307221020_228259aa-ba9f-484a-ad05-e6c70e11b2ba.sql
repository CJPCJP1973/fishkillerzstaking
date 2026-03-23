
-- Update the profiles UPDATE policy to also protect balance from self-modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    (auth.uid() = user_id)
    AND (NOT (verified IS DISTINCT FROM (SELECT p.verified FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (total_wins IS DISTINCT FROM (SELECT p.total_wins FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (win_rate IS DISTINCT FROM (SELECT p.win_rate FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (seller_status IS DISTINCT FROM (SELECT p.seller_status FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (total_staked IS DISTINCT FROM (SELECT p.total_staked FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (balance IS DISTINCT FROM (SELECT p.balance FROM profiles p WHERE p.user_id = auth.uid())))
  );
