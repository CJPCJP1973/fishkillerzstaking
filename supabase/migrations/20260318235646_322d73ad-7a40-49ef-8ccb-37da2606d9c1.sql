
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  AND (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'stake'::text]))
  AND (status = 'pending'::text)
);
