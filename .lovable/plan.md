

## Security Fixes Plan

### Findings to Address

1. **ERROR — Backer payment handles exposed to shooters**: The `payouts` table's "Shooters can view session payouts" SELECT policy lets shooters see `backer_cashtag` for all backers in their session. Shooters should see payout info but not payment handles.

2. **WARN — `confirmed_agents_public` view has no RLS**: It's a view over `confirmed_agents` exposing only `id`, `agent_name`, `created_at`. This is intentionally public data (agent names for session creation). Will replace with a `SECURITY DEFINER` function to make intent explicit and close the finding.

3. **WARN — Extension in public / Leaked password protection**: Pre-existing infrastructure items — will mark as acknowledged.

### Implementation

**Single SQL migration** with:

1. **Fix backer_cashtag exposure**: Create a `SECURITY DEFINER` function `shooter_get_session_payouts(_session_id uuid)` that returns payout rows for sessions the caller owns, but **excludes** `backer_cashtag`. Drop the "Shooters can view session payouts" RLS policy and replace it with a more restrictive one that only returns non-sensitive columns. Alternatively, simpler approach: create a Postgres view `payouts_shooter_view` excluding `backer_cashtag`, or use column-level security. Simplest: replace the shooter SELECT policy with one that uses a security-definer function returning rows without `backer_cashtag`.

   Actually the cleanest fix: Drop the "Shooters can view session payouts" policy entirely and create an RPC `get_session_payouts_for_shooter(_session_id uuid)` that returns all columns except `backer_cashtag`, with an ownership check.

2. **Fix `confirmed_agents_public`**: Drop the view and create an RPC `get_confirmed_agents()` returning `id, agent_name`. Update `CreateSessionForm.tsx` to use `supabase.rpc('get_confirmed_agents')`.

3. **Mark remaining warns** as acknowledged.

### File Changes

- **New migration**: Drop shooter payout policy, create `get_session_payouts_for_shooter` RPC, drop `confirmed_agents_public` view, create `get_confirmed_agents` RPC
- **Edit `src/components/CreateSessionForm.tsx`**: Switch from `.from("confirmed_agents_public")` to `.rpc("get_confirmed_agents")`
- **Edit `src/pages/Admin.tsx`**: No change needed (admin uses admin policy, not shooter policy)

### Technical Details

```sql
-- 1. Remove shooter access to backer_cashtag
DROP POLICY "Shooters can view session payouts" ON public.payouts;

CREATE OR REPLACE FUNCTION public.get_session_payouts_for_shooter(_session_id uuid)
RETURNS TABLE(id uuid, session_id uuid, stake_id uuid, backer_id uuid, backer_name text,
              amount_owed numeric, status text, created_at timestamptz, updated_at timestamptz,
              transaction_reference text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.session_id, p.stake_id, p.backer_id, p.backer_name,
         p.amount_owed, p.status, p.created_at, p.updated_at, p.transaction_reference
  FROM public.payouts p
  JOIN public.sessions s ON s.id = p.session_id
  WHERE p.session_id = _session_id AND s.shooter_id = auth.uid();
$$;

-- 2. Replace confirmed_agents_public view
DROP VIEW IF EXISTS public.confirmed_agents_public;

CREATE OR REPLACE FUNCTION public.get_confirmed_agents()
RETURNS TABLE(id uuid, agent_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT ca.id, ca.agent_name FROM public.confirmed_agents ca ORDER BY ca.agent_name;
$$;
```

