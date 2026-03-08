
-- 1. Fix profiles UPDATE policy to protect verification_status and verification_note
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
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
);

-- 2. Add admin UPDATE policy on profiles (fixes admin panel broken writes)
CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Drop broad sessions SELECT policy exposing all columns
DROP POLICY IF EXISTS "All authenticated can browse sessions" ON public.sessions;

-- 4. Make session-screenshots bucket private
UPDATE storage.buckets SET public = false WHERE id = 'session-screenshots';

-- 5. Create atomic balance adjustment function
CREATE OR REPLACE FUNCTION public.adjust_balance(target_uid uuid, delta numeric)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles SET balance = balance + delta WHERE user_id = target_uid;
$$;

-- 6. Remove hardcoded admin email from handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.payment_profiles (user_id) VALUES (NEW.id);

  -- Default role is backer
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'backer');

  RETURN NEW;
END;
$$;
