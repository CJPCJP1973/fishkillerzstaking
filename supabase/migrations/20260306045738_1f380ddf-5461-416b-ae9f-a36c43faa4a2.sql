
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  stake_id uuid NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  backer_id uuid NOT NULL,
  backer_name text,
  backer_cashtag text,
  amount_owed numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all payouts"
  ON public.payouts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Backers can view their own payouts
CREATE POLICY "Backers can view own payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (auth.uid() = backer_id);

-- Shooters can view payouts for their sessions
CREATE POLICY "Shooters can view session payouts"
  ON public.payouts FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.sessions
    WHERE sessions.id = payouts.session_id AND sessions.shooter_id = auth.uid()
  ));
