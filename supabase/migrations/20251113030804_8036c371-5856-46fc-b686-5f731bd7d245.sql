-- Secure cuti table - restrict access to admin users only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access to cuti" ON public.cuti;
DROP POLICY IF EXISTS "Allow authenticated users to insert cuti" ON public.cuti;
DROP POLICY IF EXISTS "Allow authenticated users to update cuti" ON public.cuti;
DROP POLICY IF EXISTS "Allow authenticated users to delete cuti" ON public.cuti;

-- Create new admin-only policy for cuti records
CREATE POLICY "Admins can manage cuti records"
ON public.cuti
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));