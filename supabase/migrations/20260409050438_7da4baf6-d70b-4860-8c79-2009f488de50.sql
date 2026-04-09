-- Remove the two overly permissive storage SELECT policies on session-screenshots
-- Keep only the participant-scoped policy

DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;