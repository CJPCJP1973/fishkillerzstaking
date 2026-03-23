-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;

-- Recreate with bucket_id scoping
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'session-screenshots');

CREATE POLICY "Authenticated users can read screenshots"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'session-screenshots');