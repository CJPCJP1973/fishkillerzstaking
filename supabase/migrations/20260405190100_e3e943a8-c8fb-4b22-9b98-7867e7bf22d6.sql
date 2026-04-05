
-- Drop the two overly-permissive storage policies on session-screenshots bucket
-- Keep only the participant-scoped policy
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;
