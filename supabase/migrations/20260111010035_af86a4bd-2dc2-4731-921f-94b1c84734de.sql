-- Fix RLS: allow 'super' to update assignments + allow creators to update their own assignments (before finalized)

-- 1) Replace admin-only update policy with admin OR super
DROP POLICY IF EXISTS "Admins can update assignments" ON public.assignments;
CREATE POLICY "Admins and super can update assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super')
);

-- 2) Allow assignment creator to update their own assignment until it's finalized (no_satu_kemenkeu still empty)
DROP POLICY IF EXISTS "Creators can update own assignments" ON public.assignments;
CREATE POLICY "Creators can update own assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (
  created_by_email = (auth.jwt() ->> 'email')
  AND (no_satu_kemenkeu IS NULL OR no_satu_kemenkeu = '')
)
WITH CHECK (
  created_by_email = (auth.jwt() ->> 'email')
  AND (no_satu_kemenkeu IS NULL OR no_satu_kemenkeu = '')
);
