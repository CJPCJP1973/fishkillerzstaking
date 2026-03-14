
DROP POLICY "Sellers can create sessions" ON public.sessions;

CREATE POLICY "Sellers can create sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = shooter_id)
  AND has_role(auth.uid(), 'seller'::app_role)
  AND (admin_confirmed_deposit IS NOT DISTINCT FROM false)
  AND (admin_released_winnings IS NOT DISTINCT FROM false)
  AND (status IS NOT DISTINCT FROM 'pending'::session_status)
  AND (winnings IS NULL)
  AND (platform_fee IS NOT DISTINCT FROM 0)
  AND (ocr_start_amount IS NULL)
  AND (ocr_end_amount IS NULL)
  AND (ocr_confidence IS NULL)
  AND (manual_rake_status IS NULL)
  AND (stake_sold IS NOT DISTINCT FROM 0)
);
