-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;

-- Remove the overly permissive authenticated read policy
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;