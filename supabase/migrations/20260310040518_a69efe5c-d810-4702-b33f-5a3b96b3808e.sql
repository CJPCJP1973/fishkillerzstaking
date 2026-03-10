
CREATE TABLE public.ocr_scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  scanned_by uuid NOT NULL,
  start_amount numeric,
  end_amount numeric,
  confidence numeric,
  auto_flagged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ocr_scan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scan history"
  ON public.ocr_scan_history FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Shooters can view own session scans"
  ON public.ocr_scan_history FOR SELECT
  TO authenticated
  USING (is_session_shooter(auth.uid(), session_id));
