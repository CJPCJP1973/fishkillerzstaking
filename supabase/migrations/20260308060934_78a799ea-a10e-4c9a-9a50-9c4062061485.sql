
-- Add payment_mode to stakes table (fishdollarz or p2p)
ALTER TABLE public.stakes ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'p2p';

-- Add rake_rate to stakes (6% for fishdollarz, 8% for p2p)
ALTER TABLE public.stakes ADD COLUMN IF NOT EXISTS rake_rate numeric NOT NULL DEFAULT 0.08;

-- Add p2p verification fields to stakes
ALTER TABLE public.stakes ADD COLUMN IF NOT EXISTS seller_confirmed boolean DEFAULT false;
ALTER TABLE public.stakes ADD COLUMN IF NOT EXISTS backer_confirmed boolean DEFAULT false;

-- Add manual_rake_status to sessions for P2P mode
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS manual_rake_status text DEFAULT null;

-- Add reliability_score to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reliability_score integer NOT NULL DEFAULT 75;

-- Prevent users from changing their own reliability_score
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
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
    AND (NOT (reliability_score IS DISTINCT FROM (SELECT p.reliability_score FROM profiles p WHERE p.user_id = auth.uid())))
  );
