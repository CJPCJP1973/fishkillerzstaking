
-- 1. Drop the two broad screenshot storage policies that still exist
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;

-- 2. Enable RLS and add admin-only policy on email_send_state
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage email send state"
ON public.email_send_state FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
