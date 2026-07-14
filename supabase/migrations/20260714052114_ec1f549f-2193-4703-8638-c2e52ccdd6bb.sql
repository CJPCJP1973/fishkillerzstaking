
-- 1. Sessions: require seller role on updates (in addition to ownership)
DROP POLICY IF EXISTS "Shooters can update own sessions" ON public.sessions;
CREATE POLICY "Shooters can update own sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = shooter_id AND has_role(auth.uid(), 'seller'::app_role))
  WITH CHECK (
    auth.uid() = shooter_id
    AND has_role(auth.uid(), 'seller'::app_role)
    AND (NOT (status IS DISTINCT FROM (SELECT s.status FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (winnings IS DISTINCT FROM (SELECT s.winnings FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (platform_fee IS DISTINCT FROM (SELECT s.platform_fee FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (manual_rake_status IS DISTINCT FROM (SELECT s.manual_rake_status FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (stake_available IS DISTINCT FROM (SELECT s.stake_available FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (stake_sold IS DISTINCT FROM (SELECT s.stake_sold FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (admin_confirmed_deposit IS DISTINCT FROM (SELECT s.admin_confirmed_deposit FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (admin_released_winnings IS DISTINCT FROM (SELECT s.admin_released_winnings FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (ocr_start_amount IS DISTINCT FROM (SELECT s.ocr_start_amount FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (ocr_end_amount IS DISTINCT FROM (SELECT s.ocr_end_amount FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (ocr_confidence IS DISTINCT FROM (SELECT s.ocr_confidence FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (share_price IS DISTINCT FROM (SELECT s.share_price FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (total_buy_in IS DISTINCT FROM (SELECT s.total_buy_in FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (seller_payout_agreement IS DISTINCT FROM (SELECT s.seller_payout_agreement FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (agent_cashout_window IS DISTINCT FROM (SELECT s.agent_cashout_window FROM sessions s WHERE s.id = sessions.id)))
    AND (NOT (agent_daily_limit IS DISTINCT FROM (SELECT s.agent_daily_limit FROM sessions s WHERE s.id = sessions.id)))
    AND CASE
      WHEN (((SELECT s.admin_confirmed_deposit FROM sessions s WHERE s.id = sessions.id) = true)
         OR ((SELECT s.admin_released_winnings FROM sessions s WHERE s.id = sessions.id) = true))
      THEN
        (NOT (deposit_proof_url IS DISTINCT FROM (SELECT s.deposit_proof_url FROM sessions s WHERE s.id = sessions.id)))
        AND (NOT (payout_proof_url IS DISTINCT FROM (SELECT s.payout_proof_url FROM sessions s WHERE s.id = sessions.id)))
        AND (NOT (proof_url IS DISTINCT FROM (SELECT s.proof_url FROM sessions s WHERE s.id = sessions.id)))
        AND (NOT (start_screenshot_url IS DISTINCT FROM (SELECT s.start_screenshot_url FROM sessions s WHERE s.id = sessions.id)))
        AND (NOT (end_screenshot_url IS DISTINCT FROM (SELECT s.end_screenshot_url FROM sessions s WHERE s.id = sessions.id)))
        AND (NOT (stream_url IS DISTINCT FROM (SELECT s.stream_url FROM sessions s WHERE s.id = sessions.id)))
      ELSE true
    END
  );

-- 2. Stakes: enforce WITH CHECK on admin ALL policy
DROP POLICY IF EXISTS "Admins can manage all stakes" ON public.stakes;
CREATE POLICY "Admins can manage all stakes"
  ON public.stakes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Transactions: harden INSERT with positive amount + role requirement
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'stake'::text])
    AND status = 'pending'::text
    AND amount > 0
    AND (has_role(auth.uid(), 'backer'::app_role) OR has_role(auth.uid(), 'seller'::app_role))
  );

-- 4. Payouts: allow shooters to view payouts on their own sessions (read-only)
CREATE POLICY "Shooters can view payouts on own sessions"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (is_session_shooter(auth.uid(), session_id));

-- 5. Slot pools: require seller role for creation
DROP POLICY IF EXISTS "Users can create their own slot pools" ON public.slot_pools;
CREATE POLICY "Sellers can create their own slot pools"
  ON public.slot_pools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id AND has_role(auth.uid(), 'seller'::app_role));
