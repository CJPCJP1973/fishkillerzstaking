
DROP POLICY IF EXISTS "Shooters can update own sessions" ON public.sessions;

CREATE POLICY "Shooters can update own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = shooter_id)
WITH CHECK (
  (auth.uid() = shooter_id)
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
);
