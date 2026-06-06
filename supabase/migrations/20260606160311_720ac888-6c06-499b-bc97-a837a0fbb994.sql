
-- Drop overly broad SELECT policies on session-screenshots bucket
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;

-- Tighten screenshot_hashes INSERT to session participants only
DROP POLICY IF EXISTS "Authenticated users can insert own hashes" ON public.screenshot_hashes;
CREATE POLICY "Session participants can insert hashes"
ON public.screenshot_hashes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = uploaded_by
  AND (
    public.is_session_shooter(auth.uid(), session_id)
    OR public.is_session_backer(auth.uid(), session_id)
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Realtime channel topic restriction
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated can read own notification topics" ON realtime.messages;
CREATE POLICY "authenticated can read own notification topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  (realtime.topic() LIKE 'public:sessions%')
  OR (realtime.topic() LIKE 'public:win_feed%')
  OR (realtime.topic() LIKE 'public:session_journal%')
  OR (realtime.topic() = 'public:notifications:user_id=eq.' || auth.uid()::text)
);
