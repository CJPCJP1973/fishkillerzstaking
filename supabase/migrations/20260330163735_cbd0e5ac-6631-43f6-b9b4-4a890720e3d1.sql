
-- 1. Remove public read access for session screenshots
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;

-- 2. Replace broad authenticated read with session-participant-scoped policy
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;
CREATE POLICY "Session participants can read screenshots" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'session-screenshots' AND (
      public.is_session_shooter(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR public.is_session_backer(auth.uid(), (storage.foldername(name))[1]::uuid)
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 3. Lock down email_send_log to admin-only
CREATE POLICY "Admins can manage email send log"
ON public.email_send_log
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
