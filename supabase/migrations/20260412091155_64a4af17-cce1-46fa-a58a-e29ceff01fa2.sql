-- Add UPDATE policy for session-screenshots bucket (scoped to participants)
CREATE POLICY "Session participants can update screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'session-screenshots'
  AND (
    is_session_shooter(auth.uid(), (storage.foldername(name))[1]::uuid)
    OR is_session_backer(auth.uid(), (storage.foldername(name))[1]::uuid)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Add UPDATE policy for user-ids bucket (scoped to owner)
CREATE POLICY "Users can update own ID"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-ids'
  AND (storage.foldername(name))[1] = auth.uid()::text
);