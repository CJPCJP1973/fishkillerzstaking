-- 1. Escrow columns on slot_pools
ALTER TABLE public.slot_pools
  ADD COLUMN IF NOT EXISTS admin_confirmed_deposit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_released_winnings boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS winnings numeric,
  ADD COLUMN IF NOT EXISTS deposit_proof_url text,
  ADD COLUMN IF NOT EXISTS payout_proof_url text;

-- 2. Seats table
CREATE TABLE IF NOT EXISTS public.slot_pool_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES public.slot_pools(id) ON DELETE CASCADE,
  backer_id uuid NOT NULL,
  seats integer NOT NULL DEFAULT 1 CHECK (seats > 0),
  amount numeric NOT NULL CHECK (amount > 0),
  payment_mode text NOT NULL DEFAULT 'p2p',
  payment_method text,
  deposit_confirmed boolean NOT NULL DEFAULT false,
  winnings_released boolean NOT NULL DEFAULT false,
  winnings_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.slot_pool_seats TO authenticated;
GRANT ALL ON public.slot_pool_seats TO service_role;

ALTER TABLE public.slot_pool_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backers view own seats"
ON public.slot_pool_seats FOR SELECT TO authenticated
USING (
  backer_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.slot_pools p WHERE p.id = pool_id AND p.owner_id = auth.uid())
);

CREATE POLICY "Backers buy seats for themselves"
ON public.slot_pool_seats FOR INSERT TO authenticated
WITH CHECK (
  backer_id = auth.uid()
  AND deposit_confirmed = false
  AND winnings_released = false
  AND winnings_amount IS NULL
);

CREATE POLICY "Admins manage seats"
ON public.slot_pool_seats FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Backers cancel unconfirmed seats"
ON public.slot_pool_seats FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (backer_id = auth.uid() AND deposit_confirmed = false)
);

CREATE TRIGGER update_slot_pool_seats_updated_at
BEFORE UPDATE ON public.slot_pool_seats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Keep seats_sold in sync (confirmed seats only)
CREATE OR REPLACE FUNCTION public.sync_slot_pool_seats_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pool uuid := COALESCE(NEW.pool_id, OLD.pool_id);
BEGIN
  UPDATE public.slot_pools p
  SET seats_sold = COALESCE((
    SELECT SUM(s.seats) FROM public.slot_pool_seats s
    WHERE s.pool_id = _pool AND s.deposit_confirmed = true
  ), 0)
  WHERE p.id = _pool;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_sync_slot_pool_seats_sold
AFTER INSERT OR UPDATE OR DELETE ON public.slot_pool_seats
FOR EACH ROW EXECUTE FUNCTION public.sync_slot_pool_seats_sold();