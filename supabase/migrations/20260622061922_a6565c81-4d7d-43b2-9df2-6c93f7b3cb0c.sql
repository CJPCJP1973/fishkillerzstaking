ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read own notification topics" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated can broadcast to allowed topics" ON realtime.messages;

CREATE POLICY "authenticated can read scoped realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() IN ('live-win-feed', 'ocr-realtime')
  OR realtime.topic() LIKE 'journal-%'
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
  OR realtime.topic() = ('public:notifications:user_id=eq.' || auth.uid()::text)
);

CREATE POLICY "authenticated can broadcast to public realtime topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() IN ('live-win-feed', 'ocr-realtime')
  OR realtime.topic() LIKE 'journal-%'
);