
-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete seller requests
CREATE POLICY "Admins can delete seller requests"
ON public.seller_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete payment profiles
CREATE POLICY "Admins can delete payment profiles"
ON public.payment_profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
