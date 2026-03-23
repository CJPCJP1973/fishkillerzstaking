
-- Update transactions INSERT policy to allow listing_fee type
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'stake'::text, 'listing_fee'::text]))
  AND (status = 'pending'::text)
);
