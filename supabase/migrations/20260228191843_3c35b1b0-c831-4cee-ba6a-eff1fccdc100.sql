-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'shooter', 'backer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT false,
  total_wins INTEGER DEFAULT 0,
  total_staked NUMERIC(12,2) DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by all authenticated" ON public.profiles
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session status enum
CREATE TYPE public.session_status AS ENUM ('pending', 'funding', 'live', 'completed', 'disputed', 'cancelled');

-- Sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shooter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shooter_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  agent_room TEXT NOT NULL,
  total_buy_in NUMERIC(12,2) NOT NULL,
  stake_available NUMERIC(12,2) NOT NULL,
  stake_sold NUMERIC(12,2) DEFAULT 0,
  end_time TIMESTAMPTZ NOT NULL,
  status session_status DEFAULT 'pending',
  stream_url TEXT,
  proof_url TEXT,
  winnings NUMERIC(12,2),
  admin_confirmed_deposit BOOLEAN DEFAULT false,
  admin_released_winnings BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT max_stake_75_percent CHECK (stake_available <= total_buy_in * 0.75)
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions viewable by all authenticated" ON public.sessions
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Shooters can create sessions" ON public.sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = shooter_id AND public.has_role(auth.uid(), 'shooter'));

CREATE POLICY "Shooters can update own sessions" ON public.sessions
FOR UPDATE USING (auth.uid() = shooter_id);

CREATE POLICY "Admins can manage all sessions" ON public.sessions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Stakes table
CREATE TABLE public.stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  backer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  deposit_confirmed BOOLEAN DEFAULT false,
  winnings_released BOOLEAN DEFAULT false,
  winnings_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backers can view own stakes" ON public.stakes
FOR SELECT TO authenticated USING (auth.uid() = backer_id);

CREATE POLICY "Session shooters can view stakes" ON public.stakes
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = stakes.session_id AND sessions.shooter_id = auth.uid())
);

CREATE POLICY "Backers can create stakes" ON public.stakes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = backer_id AND public.has_role(auth.uid(), 'backer'));

CREATE POLICY "Admins can manage all stakes" ON public.stakes
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Win feed table for live ticker
CREATE TABLE public.win_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  shooter_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.win_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Win feed viewable by all" ON public.win_feed
FOR SELECT USING (true);

CREATE POLICY "Admins can insert win feed" ON public.win_feed
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'backer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stakes_updated_at BEFORE UPDATE ON public.stakes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.win_feed;