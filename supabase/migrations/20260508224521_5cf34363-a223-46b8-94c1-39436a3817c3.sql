-- Rename misleading policy on confirmed_agents (its USING clause restricts to admins,
-- but the public list is exposed via the get_confirmed_agents SECURITY DEFINER RPC).
ALTER POLICY "Agents viewable by all authenticated" ON public.confirmed_agents
  RENAME TO "Admins can view confirmed agents directly";