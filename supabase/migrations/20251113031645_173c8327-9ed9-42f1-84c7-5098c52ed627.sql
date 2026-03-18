-- Fix employees table RLS policies
-- Drop ALL existing public policies
DROP POLICY IF EXISTS "Allow public read access to employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to insert employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to update employees" ON employees;
DROP POLICY IF EXISTS "Allow authenticated users to delete employees" ON employees;

-- Create admin-only management policy
CREATE POLICY "Admins can manage employees"
ON employees FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow authenticated users to view only
CREATE POLICY "Authenticated users can view employees"
ON employees FOR SELECT TO authenticated
USING (true);