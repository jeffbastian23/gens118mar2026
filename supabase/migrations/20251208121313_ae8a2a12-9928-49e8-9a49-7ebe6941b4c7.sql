-- Create stories table for Instagram-like stories feature
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_name TEXT,
  user_role TEXT,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  views_count INTEGER DEFAULT 0,
  viewed_by TEXT[] DEFAULT '{}'::TEXT[]
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies for stories
CREATE POLICY "Users can view stories from same role"
ON public.stories
FOR SELECT
USING (
  user_role = (
    SELECT role::TEXT FROM public.user_roles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can create their own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
ON public.stories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.stories IS 'Instagram-like stories for same-role users';
COMMENT ON COLUMN public.stories.expires_at IS 'Story expires after 24 hours';
COMMENT ON COLUMN public.stories.viewed_by IS 'Array of user emails who viewed the story';