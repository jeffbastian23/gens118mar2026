-- Create japri_teman table for contact data
CREATE TABLE public.japri_teman (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut integer NOT NULL,
  nama text NOT NULL,
  nip text,
  kontak text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.japri_teman ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view japri_teman" 
ON public.japri_teman 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert japri_teman" 
ON public.japri_teman 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update japri_teman" 
ON public.japri_teman 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete japri_teman" 
ON public.japri_teman 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_japri_teman_updated_at
BEFORE UPDATE ON public.japri_teman
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();