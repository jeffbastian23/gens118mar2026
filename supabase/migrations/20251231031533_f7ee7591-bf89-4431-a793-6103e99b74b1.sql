-- Create table for On Air content (podcast/streaming)
CREATE TABLE public.on_air_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT NOT NULL DEFAULT 'audio',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.on_air_content ENABLE ROW LEVEL SECURITY;

-- Create policies for public viewing
CREATE POLICY "Everyone can view on air content"
ON public.on_air_content
FOR SELECT
TO authenticated
USING (true);

-- Create policies for admin insert/update/delete
CREATE POLICY "Authenticated users can insert on air content"
ON public.on_air_content
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update on air content"
ON public.on_air_content
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete on air content"
ON public.on_air_content
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_on_air_content_updated_at
BEFORE UPDATE ON public.on_air_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();