
CREATE TABLE public.slot_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL,
  buy_in numeric NOT NULL CHECK (buy_in > 0),
  seats integer NOT NULL CHECK (seats >= 2),
  seat_price numeric NOT NULL CHECK (seat_price > 0),
  seats_sold integer NOT NULL DEFAULT 0 CHECK (seats_sold >= 0),
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.slot_pools TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.slot_pools TO authenticated;
GRANT ALL ON public.slot_pools TO service_role;

ALTER TABLE public.slot_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slot pools are viewable by everyone"
  ON public.slot_pools FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own slot pools"
  ON public.slot_pools FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own slot pools"
  ON public.slot_pools FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners or admins can delete slot pools"
  ON public.slot_pools FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all slot pools"
  ON public.slot_pools FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_slot_pools_updated_at
  BEFORE UPDATE ON public.slot_pools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_slot_pools_owner ON public.slot_pools(owner_id);
CREATE INDEX idx_slot_pools_created ON public.slot_pools(created_at DESC);
