CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_name text,
  action_type text NOT NULL,
  target_session_id uuid,
  target_user_id uuid,
  description text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.admin_audit_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_admin_audit_log_session ON public.admin_audit_log (target_session_id);

CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type text,
  _description text,
  _target_session_id uuid DEFAULT NULL,
  _target_user_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _name text;
  _id uuid;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  SELECT COALESCE(p.display_name, p.username) INTO _name
  FROM public.profiles p WHERE p.user_id = _uid;

  INSERT INTO public.admin_audit_log (admin_id, admin_name, action_type, target_session_id, target_user_id, description, details)
  VALUES (_uid, _name, _action_type, _target_session_id, _target_user_id, _description, COALESCE(_details, '{}'::jsonb))
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;