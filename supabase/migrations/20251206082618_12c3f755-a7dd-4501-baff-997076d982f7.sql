-- Create table for user menu access permissions
CREATE TABLE public.user_menu_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed_menus text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable Row-Level Security
ALTER TABLE public.user_menu_access ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all user menu access
CREATE POLICY "Admins can manage user_menu_access"
ON public.user_menu_access
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Users can view their own menu access
CREATE POLICY "Users can view their own menu access"
ON public.user_menu_access
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_menu_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_menu_access_updated_at
BEFORE UPDATE ON public.user_menu_access
FOR EACH ROW
EXECUTE FUNCTION public.update_user_menu_access_updated_at();