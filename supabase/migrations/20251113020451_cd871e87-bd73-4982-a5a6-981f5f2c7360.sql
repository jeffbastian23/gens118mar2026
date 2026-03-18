-- Secure absensi table - restrict access to HR admins only

-- Drop existing public and general authenticated user policies
DROP POLICY IF EXISTS "Allow public read access to absensi" ON public.absensi;
DROP POLICY IF EXISTS "Allow authenticated users to delete absensi" ON public.absensi;
DROP POLICY IF EXISTS "Allow authenticated users to insert absensi" ON public.absensi;
DROP POLICY IF EXISTS "Allow authenticated users to update absensi" ON public.absensi;

-- Create new policy: Only admins can access absensi data
CREATE POLICY "Admins can do everything on absensi"
ON public.absensi
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));