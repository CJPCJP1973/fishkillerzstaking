
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS agent_cashout_window text,
  ADD COLUMN IF NOT EXISTS agent_daily_limit text,
  ADD COLUMN IF NOT EXISTS seller_payout_agreement boolean NOT NULL DEFAULT false;
