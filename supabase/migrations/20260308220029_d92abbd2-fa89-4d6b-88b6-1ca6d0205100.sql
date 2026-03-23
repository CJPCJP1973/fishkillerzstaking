
-- Add seller_tier and is_vip to profiles
ALTER TABLE public.profiles 
  ADD COLUMN seller_tier integer NOT NULL DEFAULT 1,
  ADD COLUMN is_vip boolean NOT NULL DEFAULT false,
  ADD COLUMN completed_sessions integer NOT NULL DEFAULT 0;

-- Function to auto-level a seller after session completion
CREATE OR REPLACE FUNCTION public.auto_level_seller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _shooter_id uuid;
  _count integer;
  _new_tier integer;
  _old_tier integer;
  _is_vip boolean;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    _shooter_id := NEW.shooter_id;
    
    -- Count completed sessions
    SELECT count(*) INTO _count
    FROM public.sessions
    WHERE shooter_id = _shooter_id AND status = 'completed';

    -- Get current tier and vip status
    SELECT seller_tier, is_vip INTO _old_tier, _is_vip
    FROM public.profiles
    WHERE user_id = _shooter_id;

    -- Determine new tier (VIP overrides if flagged)
    IF _is_vip THEN
      _new_tier := 4;
    ELSIF _count >= 10 THEN
      _new_tier := 3;
    ELSIF _count >= 5 THEN
      _new_tier := 2;
    ELSE
      _new_tier := 1;
    END IF;

    -- Update profile
    UPDATE public.profiles
    SET seller_tier = _new_tier, completed_sessions = _count
    WHERE user_id = _shooter_id;

    -- Send notification if tier changed
    IF _new_tier > _old_tier AND NOT _is_vip THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        _shooter_id,
        'Tier Upgraded!',
        CASE _new_tier
          WHEN 2 THEN 'You are now a SHARK! Max 50% stake, 6% rake.'
          WHEN 3 THEN 'You are now a KILLER WHALE! Max 75% stake, 4% rake.'
          ELSE 'Tier updated.'
        END,
        'tier_upgrade'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on session status update
CREATE TRIGGER trg_auto_level_seller
AFTER UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.auto_level_seller();
