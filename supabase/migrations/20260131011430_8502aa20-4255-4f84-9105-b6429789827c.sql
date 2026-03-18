-- Create login_backgrounds table for managing login page backgrounds
CREATE TABLE public.login_backgrounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.login_backgrounds ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can manage login_backgrounds"
ON public.login_backgrounds
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create policy for public read (login page needs to read this without auth)
CREATE POLICY "Public can read active login_backgrounds"
ON public.login_backgrounds
FOR SELECT
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_login_backgrounds_updated_at
BEFORE UPDATE ON public.login_backgrounds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the default background
INSERT INTO public.login_backgrounds (name, image_url, is_active)
VALUES ('Gedung Bea Cukai Default', '/customs-building-bg.png', true);