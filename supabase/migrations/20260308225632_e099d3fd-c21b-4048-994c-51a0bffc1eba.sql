
-- Session Journal table
CREATE TABLE public.session_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id uuid,
  author_name text NOT NULL DEFAULT 'System',
  message text NOT NULL,
  entry_type text NOT NULL DEFAULT 'note',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_journal ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage journal" ON public.session_journal
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Shooters can view journal for their sessions
CREATE POLICY "Shooters can view session journal" ON public.session_journal
  FOR SELECT TO authenticated
  USING (public.is_session_shooter(auth.uid(), session_id));

-- Backers can view journal for sessions they staked
CREATE POLICY "Backers can view session journal" ON public.session_journal
  FOR SELECT TO authenticated
  USING (public.is_session_backer(auth.uid(), session_id));

-- Shooters can post notes
CREATE POLICY "Shooters can post journal notes" ON public.session_journal
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND entry_type = 'note'
    AND public.is_session_shooter(auth.uid(), session_id)
  );

-- Backers can post notes
CREATE POLICY "Backers can post journal notes" ON public.session_journal
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND entry_type = 'note'
    AND public.is_session_backer(auth.uid(), session_id)
  );

-- Trigger function to log system events
CREATE OR REPLACE FUNCTION public.journal_stake_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
BEGIN
  SELECT COALESCE(p.display_name, p.username) INTO _name
  FROM public.profiles p WHERE p.user_id = NEW.backer_id;

  INSERT INTO public.session_journal (session_id, user_id, author_name, message, entry_type)
  VALUES (
    NEW.session_id,
    NULL,
    'System',
    'Stake of $' || NEW.amount || ' submitted by ' || COALESCE(_name, 'Unknown') ||
    CASE WHEN NEW.deposit_confirmed THEN ' (auto-confirmed via FishDollarz)' ELSE ' (pending P2P verification)' END,
    'system'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_journal_stake_created
AFTER INSERT ON public.stakes
FOR EACH ROW EXECUTE FUNCTION public.journal_stake_event();

-- Trigger for session status changes
CREATE OR REPLACE FUNCTION public.journal_session_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.session_journal (session_id, user_id, author_name, message, entry_type)
    VALUES (
      NEW.id,
      NULL,
      'System',
      'Session status changed to ' || UPPER(NEW.status::text),
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_journal_session_status
AFTER UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.journal_session_status();

-- Trigger for deposit confirmation
CREATE OR REPLACE FUNCTION public.journal_deposit_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _name text;
BEGIN
  IF NEW.deposit_confirmed = true AND OLD.deposit_confirmed IS DISTINCT FROM true THEN
    SELECT COALESCE(p.display_name, p.username) INTO _name
    FROM public.profiles p WHERE p.user_id = NEW.backer_id;

    INSERT INTO public.session_journal (session_id, user_id, author_name, message, entry_type)
    VALUES (
      NEW.session_id,
      NULL,
      'System',
      'Deposit confirmed for ' || COALESCE(_name, 'Unknown') || ' ($' || NEW.amount || ')',
      'system'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_journal_deposit_confirmed
AFTER UPDATE ON public.stakes
FOR EACH ROW EXECUTE FUNCTION public.journal_deposit_confirmed();
