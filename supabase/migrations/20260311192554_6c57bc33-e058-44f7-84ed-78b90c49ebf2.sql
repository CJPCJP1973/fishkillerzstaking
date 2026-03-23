
-- Fix 1: Scope session-screenshots uploads to session participants only
-- The folder structure is {session_id}/... so we check the user is shooter or backer of that session
DROP POLICY IF EXISTS "Authenticated users can upload screenshots" ON storage.objects;

CREATE POLICY "Session participants can upload screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'session-screenshots'
  AND (
    public.is_session_shooter(auth.uid(), ((storage.foldername(name))[1])::uuid)
    OR public.is_session_backer(auth.uid(), ((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- Fix 2: Replace blanket SELECT on screenshot_hashes with scoped policies
DROP POLICY IF EXISTS "Authenticated users can check hashes" ON public.screenshot_hashes;

CREATE POLICY "Users can check hashes for own sessions"
ON public.screenshot_hashes FOR SELECT TO authenticated
USING (
  public.is_session_shooter(auth.uid(), session_id)
  OR public.is_session_backer(auth.uid(), session_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Fix 3: Replace broad SELECT on confirmed_agents with admin-only for notes
-- Drop existing permissive SELECT that exposes notes to all
DROP POLICY IF EXISTS "Agents viewable by all authenticated" ON public.confirmed_agents;

-- Create a view that only exposes agent_name (no notes, no created_by)
CREATE OR REPLACE VIEW public.confirmed_agents_public
WITH (security_invoker = on) AS
  SELECT id, agent_name, created_at
  FROM public.confirmed_agents;

-- Re-add a SELECT policy scoped to only agent_name access via the view
-- Authenticated users can still see agent names through the view
CREATE POLICY "Agents viewable by all authenticated"
ON public.confirmed_agents FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);
