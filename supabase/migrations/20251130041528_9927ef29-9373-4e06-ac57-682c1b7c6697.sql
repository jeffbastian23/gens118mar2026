-- Fix RLS policy to allow team recording
-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own footprint" ON digital_footprint;

-- Create new policy that allows authenticated users to insert records for anyone
CREATE POLICY "Authenticated users can insert footprint for anyone"
ON digital_footprint
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also update SELECT policy to allow users to view all footprints
DROP POLICY IF EXISTS "Users can view their own footprint" ON digital_footprint;

CREATE POLICY "Authenticated users can view all footprints"
ON digital_footprint
FOR SELECT
TO authenticated
USING (true);