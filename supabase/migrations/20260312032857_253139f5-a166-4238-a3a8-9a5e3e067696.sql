
-- Enable RLS on the confirmed_agents_public view
ALTER VIEW public.confirmed_agents_public SET (security_invoker = true);

-- Enable RLS on underlying table's view access - add policy for authenticated users to read via the view
-- Since security_invoker means the caller's permissions apply, we need to allow authenticated users to SELECT from confirmed_agents
-- But we don't want to change confirmed_agents policies. Instead, let's make the view security_barrier and add RLS on it.

-- Actually, for a view with security_invoker = true, the underlying table's RLS applies.
-- The confirmed_agents table only allows admin SELECT. But we WANT authenticated users to see agents.
-- So we need to add a SELECT policy on confirmed_agents for authenticated users.

CREATE POLICY "Authenticated users can view agents"
ON public.confirmed_agents
FOR SELECT
TO authenticated
USING (true);
