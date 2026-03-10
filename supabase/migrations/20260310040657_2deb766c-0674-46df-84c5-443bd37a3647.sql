
CREATE OR REPLACE FUNCTION public.auto_ban_on_fraud_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.fraud_flags >= 3 AND OLD.fraud_flags < 3 AND NEW.seller_status IS DISTINCT FROM 'banned' THEN
    -- Ban the user
    NEW.seller_status := 'banned';

    -- Remove seller role
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'seller';

    -- Notify user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Account Banned 🚫',
      'Your account has been automatically banned after accumulating 3 fraud flags from suspicious screenshot activity. Contact support if you believe this is an error.',
      'error'
    );

    -- Flag all their active sessions as disputed
    UPDATE public.sessions
    SET status = 'disputed'
    WHERE shooter_id = NEW.user_id AND status IN ('pending', 'funding', 'live');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_ban_fraud_flags
  BEFORE UPDATE OF fraud_flags ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_ban_on_fraud_flags();
