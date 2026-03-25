-- 1. Create admin-only function to get user emails from auth.users
CREATE OR REPLACE FUNCTION public.admin_get_user_emails(_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  RETURN QUERY
    SELECT u.id AS user_id, u.email::text
    FROM auth.users u
    WHERE u.id = ANY(_user_ids);
END;
$$;

-- 2. Drop email column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- 3. Update handle_new_user to stop inserting email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.payment_profiles (user_id) VALUES (NEW.id);

  -- Default role is backer
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'backer');

  RETURN NEW;
END;
$$;

-- 4. Add backer SELECT policy on ocr_scan_history
CREATE POLICY "Backers can view session scans"
  ON public.ocr_scan_history
  FOR SELECT
  TO authenticated
  USING (is_session_backer(auth.uid(), session_id));

-- 5. Remove listing_fee from transactions INSERT policy (leftover from listing fee removal)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id)
    AND (type = ANY (ARRAY['deposit'::text, 'withdrawal'::text, 'stake'::text]))
    AND (status = 'pending'::text)
  );