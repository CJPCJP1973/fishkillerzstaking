-- Update the handle_new_user function to auto-assign admin+shooter for the owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
  
  -- Default role is backer
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'backer');
  
  -- Auto-assign admin and shooter for the owner
  IF NEW.email = 'myshit0044@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'shooter');
    UPDATE public.profiles SET display_name = 'Christopher Preston', verified = true WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;