-- Defensive: ensure no overly-broad storage SELECT policies remain on session-screenshots
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;

-- Restrict Realtime channel subscriptions: only authenticated users, scoped by topic ownership.
-- Topic conventions used by the app: public per-table channels keyed by row id or user id.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to subscribe only to their own notification topic OR to public session/win_feed topics
CREATE POLICY "authenticated can read own notification topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow public broadcast topics for sessions, win feed, and session journals
  (realtime.topic() LIKE 'public:sessions%')
  OR (realtime.topic() LIKE 'public:win_feed%')
  OR (realtime.topic() LIKE 'public:session_journal%')
  -- Notifications: topic must include the user's own id
  OR (realtime.topic() = 'public:notifications:user_id=eq.' || auth.uid()::text)
  OR (realtime.topic() LIKE 'public:notifications:%' AND realtime.topic() LIKE '%' || auth.uid()::text || '%')
);

CREATE POLICY "authenticated can broadcast to allowed topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'public:sessions%')
  OR (realtime.topic() LIKE 'public:win_feed%')
  OR (realtime.topic() LIKE 'public:session_journal%')
);
