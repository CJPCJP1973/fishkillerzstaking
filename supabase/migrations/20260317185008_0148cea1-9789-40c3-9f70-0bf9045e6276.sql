
-- Validation trigger for profiles table
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF length(NEW.display_name) > 50 THEN
    RAISE EXCEPTION 'Display name must be under 50 characters';
  END IF;
  IF length(NEW.username) > 30 OR length(NEW.username) < 3 THEN
    RAISE EXCEPTION 'Username must be 3-30 characters';
  END IF;
  IF NEW.username !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'Username can only contain lowercase letters, numbers, and underscores';
  END IF;
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 200 THEN
    RAISE EXCEPTION 'Bio must be under 200 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_profile_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_fields();

-- Validation trigger for payment_profiles table
CREATE OR REPLACE FUNCTION public.validate_payment_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.cashapp_tag IS NOT NULL AND length(NEW.cashapp_tag) > 30 THEN
    RAISE EXCEPTION 'CashApp tag must be under 30 characters';
  END IF;
  IF NEW.venmo_username IS NOT NULL AND length(NEW.venmo_username) > 30 THEN
    RAISE EXCEPTION 'Venmo username must be under 30 characters';
  END IF;
  IF NEW.chime_handle IS NOT NULL AND length(NEW.chime_handle) > 30 THEN
    RAISE EXCEPTION 'Chime handle must be under 30 characters';
  END IF;
  IF NEW.btc_address IS NOT NULL AND length(NEW.btc_address) > 100 THEN
    RAISE EXCEPTION 'Bitcoin address must be under 100 characters';
  END IF;
  IF NEW.btc_lightning IS NOT NULL AND length(NEW.btc_lightning) > 200 THEN
    RAISE EXCEPTION 'BTC Lightning address must be under 200 characters';
  END IF;
  IF NEW.cashapp_tag IS NOT NULL AND NEW.cashapp_tag !~ '^\$?[a-zA-Z0-9_-]{1,25}$' THEN
    RAISE EXCEPTION 'Invalid CashApp tag format';
  END IF;
  IF NEW.venmo_username IS NOT NULL AND NEW.venmo_username !~ '^@?[a-zA-Z0-9_-]{1,25}$' THEN
    RAISE EXCEPTION 'Invalid Venmo username format';
  END IF;
  IF NEW.btc_address IS NOT NULL AND NEW.btc_address !~ '^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}$' THEN
    RAISE EXCEPTION 'Invalid Bitcoin address format';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_payment_profile_fields
BEFORE INSERT OR UPDATE ON public.payment_profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_profile_fields();
