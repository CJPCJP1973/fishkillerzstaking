
CREATE TABLE public.screenshot_hashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_hash text NOT NULL,
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  upload_type text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(file_hash)
);

ALTER TABLE public.screenshot_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can check hashes"
  ON public.screenshot_hashes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert own hashes"
  ON public.screenshot_hashes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can manage hashes"
  ON public.screenshot_hashes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
