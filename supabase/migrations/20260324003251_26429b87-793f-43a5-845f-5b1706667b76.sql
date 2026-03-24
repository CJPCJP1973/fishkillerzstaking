
-- =====================================================
-- FIX 1: Change all {public} role RLS policies to {authenticated}
-- =====================================================

-- sessions: Backers can view staked sessions
DROP POLICY "Backers can view staked sessions" ON public.sessions;
CREATE POLICY "Backers can view staked sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (is_session_backer(auth.uid(), id));

-- user_roles: Admins can manage all roles
DROP POLICY "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles: Users can view their own roles
DROP POLICY "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- stakes: Session shooters can view stakes
DROP POLICY "Session shooters can view stakes" ON public.stakes;
CREATE POLICY "Session shooters can view stakes" ON public.stakes
  FOR SELECT TO authenticated
  USING (is_session_shooter(auth.uid(), session_id));

-- stakes: Admins can manage all stakes
DROP POLICY "Admins can manage all stakes" ON public.stakes;
CREATE POLICY "Admins can manage all stakes" ON public.stakes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- payment_profiles: Admins can view all payment profiles
DROP POLICY "Admins can view all payment profiles" ON public.payment_profiles;
CREATE POLICY "Admins can view all payment profiles" ON public.payment_profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- payment_profiles: Users can insert own payment profile
DROP POLICY "Users can insert own payment profile" ON public.payment_profiles;
CREATE POLICY "Users can insert own payment profile" ON public.payment_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- payment_profiles: Users can update own payment profile
DROP POLICY "Users can update own payment profile" ON public.payment_profiles;
CREATE POLICY "Users can update own payment profile" ON public.payment_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- payment_profiles: Users can view own payment profile
DROP POLICY "Users can view own payment profile" ON public.payment_profiles;
CREATE POLICY "Users can view own payment profile" ON public.payment_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- seller_requests: Admins can update seller requests
DROP POLICY "Admins can update seller requests" ON public.seller_requests;
CREATE POLICY "Admins can update seller requests" ON public.seller_requests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- seller_requests: Admins can view all seller requests
DROP POLICY "Admins can view all seller requests" ON public.seller_requests;
CREATE POLICY "Admins can view all seller requests" ON public.seller_requests
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- seller_requests: Users can insert own seller request
DROP POLICY "Users can insert own seller request" ON public.seller_requests;
CREATE POLICY "Users can insert own seller request" ON public.seller_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- seller_requests: Users can view own seller requests
DROP POLICY "Users can view own seller requests" ON public.seller_requests;
CREATE POLICY "Users can view own seller requests" ON public.seller_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- profiles: Users can insert own profile
DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id)
    AND (balance = (0)::numeric)
    AND (NOT (verified IS DISTINCT FROM false))
    AND (is_vip = false)
    AND (seller_status = 'none'::text)
    AND (seller_tier = 1)
    AND (fraud_flags = 0)
    AND (is_shadow_banned = false)
    AND (verification_status = 'none'::text)
    AND (completed_sessions = 0)
    AND (reliability_score = 75)
    AND (seller_paid = false)
  );

-- profiles: Users can update own profile
DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    (auth.uid() = user_id)
    AND (NOT (verified IS DISTINCT FROM (SELECT p.verified FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (total_wins IS DISTINCT FROM (SELECT p.total_wins FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (win_rate IS DISTINCT FROM (SELECT p.win_rate FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (seller_status IS DISTINCT FROM (SELECT p.seller_status FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (total_staked IS DISTINCT FROM (SELECT p.total_staked FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (balance IS DISTINCT FROM (SELECT p.balance FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (verification_status IS DISTINCT FROM (SELECT p.verification_status FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (verification_note IS DISTINCT FROM (SELECT p.verification_note FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (reliability_score IS DISTINCT FROM (SELECT p.reliability_score FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (seller_tier IS DISTINCT FROM (SELECT p.seller_tier FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (is_vip IS DISTINCT FROM (SELECT p.is_vip FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (completed_sessions IS DISTINCT FROM (SELECT p.completed_sessions FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (fraud_flags IS DISTINCT FROM (SELECT p.fraud_flags FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (is_shadow_banned IS DISTINCT FROM (SELECT p.is_shadow_banned FROM profiles p WHERE p.user_id = auth.uid())))
    AND (NOT (seller_paid IS DISTINCT FROM (SELECT p.seller_paid FROM profiles p WHERE p.user_id = auth.uid())))
  );

-- =====================================================
-- FIX 2: Set search_path on email queue functions
-- =====================================================

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;
