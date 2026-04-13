-- Drop the existing policy
DROP POLICY IF EXISTS "Backers can create stakes" ON public.stakes;

-- Recreate with guards on boolean fields to prevent self-confirmation
CREATE POLICY "Backers can create stakes"
ON public.stakes
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = backer_id)
  AND has_role(auth.uid(), 'backer'::app_role)
  AND (amount > (0)::numeric)
  AND (amount <= (
    SELECT (s.stake_available - COALESCE(s.stake_sold, (0)::numeric))
    FROM sessions s
    WHERE s.id = stakes.session_id
  ))
  AND (deposit_confirmed IS NOT DISTINCT FROM false)
  AND (seller_confirmed IS NOT DISTINCT FROM false)
  AND (backer_confirmed IS NOT DISTINCT FROM false)
  AND (winnings_released IS NOT DISTINCT FROM false)
  AND (winnings_amount IS NULL)
);