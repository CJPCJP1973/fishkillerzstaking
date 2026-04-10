-- Replace the shooter update policy to also freeze proof URLs after admin actions
DROP POLICY IF EXISTS "Shooters can update own sessions" ON public.sessions;

CREATE POLICY "Shooters can update own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = shooter_id)
WITH CHECK (
  (auth.uid() = shooter_id)
  -- Existing field locks (status, winnings, platform_fee, etc.)
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
  -- NEW: Freeze proof/stream URLs once admin has confirmed deposit or released winnings
  AND (
    CASE WHEN (SELECT s.admin_confirmed_deposit FROM sessions s WHERE s.id = sessions.id) = true
              OR (SELECT s.admin_released_winnings FROM sessions s WHERE s.id = sessions.id) = true
    THEN
      (NOT (deposit_proof_url IS DISTINCT FROM (SELECT s.deposit_proof_url FROM sessions s WHERE s.id = sessions.id)))
      AND (NOT (payout_proof_url IS DISTINCT FROM (SELECT s.payout_proof_url FROM sessions s WHERE s.id = sessions.id)))
      AND (NOT (proof_url IS DISTINCT FROM (SELECT s.proof_url FROM sessions s WHERE s.id = sessions.id)))
      AND (NOT (start_screenshot_url IS DISTINCT FROM (SELECT s.start_screenshot_url FROM sessions s WHERE s.id = sessions.id)))
      AND (NOT (end_screenshot_url IS DISTINCT FROM (SELECT s.end_screenshot_url FROM sessions s WHERE s.id = sessions.id)))
      AND (NOT (stream_url IS DISTINCT FROM (SELECT s.stream_url FROM sessions s WHERE s.id = sessions.id)))
    ELSE true
    END
  )
);