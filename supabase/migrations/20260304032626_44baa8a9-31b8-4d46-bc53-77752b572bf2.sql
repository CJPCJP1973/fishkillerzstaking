
-- Add seller enum value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Add username and seller_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seller_status TEXT NOT NULL DEFAULT 'none';

-- Set default usernames for existing rows
UPDATE public.profiles SET username = split_part(email, '@', 1) WHERE username IS NULL;

-- Make username NOT NULL and unique
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create payment_profiles table
CREATE TABLE IF NOT EXISTS public.payment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cashapp_tag TEXT,
  venmo_username TEXT,
  chime_handle TEXT,
  btc_address TEXT,
  btc_lightning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.payment_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment profile" ON public.payment_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own payment profile" ON public.payment_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment profile" ON public.payment_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment profiles" ON public.payment_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create seller_requests table
CREATE TABLE IF NOT EXISTS public.seller_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT
);

ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own seller request" ON public.seller_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own seller requests" ON public.seller_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all seller requests" ON public.seller_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seller requests" ON public.seller_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user trigger to also create payment_profiles and set username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Auto-assign admin and seller for the owner
  IF NEW.email = 'myshit0044@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seller');
    UPDATE public.profiles SET display_name = 'Christopher Preston', verified = true, seller_status = 'active' WHERE user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Add updated_at trigger for payment_profiles
CREATE TRIGGER update_payment_profiles_updated_at
  BEFORE UPDATE ON public.payment_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
