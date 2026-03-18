-- Update RLS policy to allow authenticated users to insert assignments
DROP POLICY IF EXISTS "Only admins can insert assignments" ON public.assignments;

CREATE POLICY "Authenticated users can insert assignments"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (true);