
-- 1. Drop overly broad SELECT policies on session-screenshots bucket
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;

-- 2. Enable RLS on realtime.messages and restrict topic subscriptions
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
