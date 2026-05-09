-- Safe token-based unsubscribe flow: SECURITY DEFINER function
-- so anon callers can consume an unsubscribe token without ever
-- being granted direct SELECT/UPDATE on email_unsubscribe_tokens.

CREATE OR REPLACE FUNCTION public.consume_unsubscribe_token(_token text)
RETURNS TABLE(success boolean, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.email_unsubscribe_tokens;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO _row
  FROM public.email_unsubscribe_tokens
  WHERE token = _token
  LIMIT 1;

  IF NOT FOUND OR _row.used_at IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::text;
    RETURN;
  END IF;

  UPDATE public.email_unsubscribe_tokens
  SET used_at = now()
  WHERE id = _row.id;

  INSERT INTO public.suppressed_emails (email, reason, metadata)
  VALUES (_row.email, 'user_unsubscribed', jsonb_build_object('token_id', _row.id))
  ON CONFLICT DO NOTHING;

  RETURN QUERY SELECT true, _row.email;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_unsubscribe_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_unsubscribe_token(text) TO anon, authenticated;