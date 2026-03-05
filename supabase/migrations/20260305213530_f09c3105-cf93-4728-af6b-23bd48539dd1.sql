-- Fix sessions INSERT policy to use 'seller' role instead of 'shooter'
DROP POLICY IF EXISTS "Shooters can create sessions" ON public.sessions;
CREATE POLICY "Sellers can create sessions" ON public.sessions FOR INSERT TO authenticated
WITH CHECK ((auth.uid() = shooter_id) AND has_role(auth.uid(), 'seller'::app_role));

-- Allow admins to delete sessions
DROP POLICY IF EXISTS "Admins can manage all sessions" ON public.sessions;
CREATE POLICY "Admins can manage all sessions" ON public.sessions FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));