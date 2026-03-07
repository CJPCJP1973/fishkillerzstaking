
-- Add balance column to profiles
ALTER TABLE public.profiles ADD COLUMN balance numeric NOT NULL DEFAULT 0;

-- Create transactions table for wallet movements
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'stake', 'payout')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'settled', 'rejected')),
  payment_method text CHECK (payment_method IN ('CashApp', 'Venmo', 'BTC', 'Chime', 'BTC Lightning')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own transactions (deposits/withdrawals)
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND type IN ('deposit', 'withdrawal'));

-- Admins can manage all transactions
CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add transaction_reference to payouts table
ALTER TABLE public.payouts ADD COLUMN transaction_reference text;
