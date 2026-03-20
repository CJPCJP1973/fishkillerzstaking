
-- Create a function to deduct listing fee from FishDollarz balance atomically
CREATE OR REPLACE FUNCTION public.deduct_listing_fee(_user_id uuid, _fee numeric DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance numeric;
  _is_paid boolean;
  _session_count integer;
BEGIN
  IF _user_id IS NULL OR _user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if this is a free trial (first session and not paid)
  SELECT seller_paid INTO _is_paid FROM public.profiles WHERE user_id = _user_id;
  SELECT count(*) INTO _session_count FROM public.sessions WHERE shooter_id = _user_id;

  -- Free trial: first session is free
  IF _session_count = 0 AND NOT COALESCE(_is_paid, false) THEN
    RETURN;
  END IF;

  -- Check balance
  SELECT balance INTO _balance FROM public.profiles WHERE user_id = _user_id;
  IF _balance < _fee THEN
    RAISE EXCEPTION 'Insufficient FishDollarz balance. You need $% but have $%', _fee, _balance;
  END IF;

  -- Deduct fee
  UPDATE public.profiles SET balance = balance - _fee WHERE user_id = _user_id;

  -- Log the transaction
  INSERT INTO public.transactions (user_id, amount, type, status, payment_method, notes)
  VALUES (_user_id, _fee, 'listing_fee', 'completed', 'FishDollarz', 'Session listing fee');
END;
$$;
