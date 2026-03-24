-- Drop the unused deduct_listing_fee function
DROP FUNCTION IF EXISTS public.deduct_listing_fee(uuid, numeric);

-- Fix RLS policies: change from public to authenticated role

-- email_send_log
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
CREATE POLICY "Service role can insert send log" ON public.email_send_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
CREATE POLICY "Service role can read send log" ON public.email_send_log
  FOR SELECT TO authenticated
  USING (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
CREATE POLICY "Service role can update send log" ON public.email_send_log
  FOR UPDATE TO authenticated
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- email_send_state
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role can manage send state" ON public.email_send_state
  FOR ALL TO authenticated
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- email_unsubscribe_tokens
DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens
  FOR UPDATE TO authenticated
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens
  FOR SELECT TO authenticated
  USING (auth.role() = 'service_role'::text);

-- suppressed_emails
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can insert suppressed emails" ON public.suppressed_emails
  FOR INSERT TO authenticated
  WITH CHECK (auth.role() = 'service_role'::text);

DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can read suppressed emails" ON public.suppressed_emails
  FOR SELECT TO authenticated
  USING (auth.role() = 'service_role'::text);