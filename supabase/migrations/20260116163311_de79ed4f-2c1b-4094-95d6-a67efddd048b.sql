-- Create story_comments table for social media style comments on stories
CREATE TABLE public.story_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for story comments
CREATE POLICY "Anyone can view story comments" 
ON public.story_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.story_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own comments" 
ON public.story_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster story comment lookups
CREATE INDEX idx_story_comments_story_id ON public.story_comments(story_id);
CREATE INDEX idx_story_comments_created_at ON public.story_comments(created_at);