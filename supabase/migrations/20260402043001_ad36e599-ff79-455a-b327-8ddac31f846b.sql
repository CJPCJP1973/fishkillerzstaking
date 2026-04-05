-- Add RLS policy for email_unsubscribe_tokens (admin-only access)
CREATE POLICY "Admins can manage unsubscribe tokens"
ON public.email_unsubscribe_tokens FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));