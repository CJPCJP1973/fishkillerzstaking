
-- Add verification fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_note text;

-- Create user-ids storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('user-ids', 'user-ids', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for user-ids bucket: users can upload to their own folder
CREATE POLICY "Users can upload own ID"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own ID"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-ids' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all IDs
CREATE POLICY "Admins can view all IDs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-ids' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete IDs
CREATE POLICY "Admins can delete IDs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-ids' AND public.has_role(auth.uid(), 'admin'));
