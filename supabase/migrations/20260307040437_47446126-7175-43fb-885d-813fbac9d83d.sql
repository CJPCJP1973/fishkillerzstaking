
-- Add screenshot & OCR columns to sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS start_screenshot_url text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS end_screenshot_url text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ocr_start_amount numeric;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ocr_end_amount numeric;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ocr_confidence numeric;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0;

-- Create storage bucket for session screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('session-screenshots', 'session-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'session-screenshots');

-- Allow public read access
CREATE POLICY "Public read access for screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'session-screenshots');

-- Allow owners and admins to delete
CREATE POLICY "Owners and admins can delete screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'session-screenshots' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
