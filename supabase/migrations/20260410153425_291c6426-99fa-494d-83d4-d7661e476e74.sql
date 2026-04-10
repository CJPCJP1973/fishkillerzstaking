-- Remove overly permissive public read policy (idempotent)
DROP POLICY IF EXISTS "Public read access for screenshots" ON storage.objects;

-- Remove overly permissive authenticated read policy (idempotent)
DROP POLICY IF EXISTS "Authenticated users can read screenshots" ON storage.objects;