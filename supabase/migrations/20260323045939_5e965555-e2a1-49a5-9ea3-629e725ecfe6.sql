CREATE OR REPLACE FUNCTION public.auto_level_seller()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _shooter_id uuid;
  _count integer;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    _shooter_id := NEW.shooter_id;
    
    -- Count completed sessions
    SELECT count(*) INTO _count
    FROM public.sessions
    WHERE shooter_id = _shooter_id AND status = 'completed';

    -- Update completed_sessions count (no tier logic)
    UPDATE public.profiles
    SET completed_sessions = _count
    WHERE user_id = _shooter_id;
  END IF;
  RETURN NEW;
END;
$function$