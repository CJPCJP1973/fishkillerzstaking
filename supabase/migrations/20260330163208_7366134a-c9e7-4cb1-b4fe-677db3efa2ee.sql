
-- Admin-only policies for suppressed_emails
CREATE POLICY "Admins can manage suppressed emails"
ON public.suppressed_emails
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
