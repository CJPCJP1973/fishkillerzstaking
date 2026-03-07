
CREATE TABLE public.confirmed_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  platform text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.confirmed_agents ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read agents
CREATE POLICY "Agents viewable by all authenticated"
ON public.confirmed_agents FOR SELECT TO authenticated
USING (true);

-- Only admins can manage agents
CREATE POLICY "Admins can manage agents"
ON public.confirmed_agents FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
