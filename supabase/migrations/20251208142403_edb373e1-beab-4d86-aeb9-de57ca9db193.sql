-- Drop existing restrictive policy for viewing stories
DROP POLICY IF EXISTS "Users can view stories from same role" ON public.stories;

-- Create new policy to allow all authenticated users to view all stories
CREATE POLICY "All authenticated users can view stories" 
ON public.stories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);