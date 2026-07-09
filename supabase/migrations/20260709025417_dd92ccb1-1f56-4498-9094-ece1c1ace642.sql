DROP POLICY IF EXISTS "Slot pools are viewable by everyone" ON public.slot_pools;
CREATE POLICY "Authenticated users can view slot pools"
ON public.slot_pools FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Win feed viewable by all" ON public.win_feed;
CREATE POLICY "Authenticated users can view win feed"
ON public.win_feed FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.slot_pools FROM anon;
REVOKE SELECT ON public.win_feed FROM anon;