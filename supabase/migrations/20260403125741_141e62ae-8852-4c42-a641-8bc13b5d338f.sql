-- Remove public read access policy on session-screenshots bucket
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;
