-- Create tim_keuangan table (similar structure to tim_upk)
CREATE TABLE IF NOT EXISTS public.tim_keuangan (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  telepon text,
  tugas text,
  assignment_count integer DEFAULT 0,
  last_assigned_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tim_keuangan ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tim_keuangan (same pattern as tim_upk)
CREATE POLICY "Admins can manage tim_keuangan"
ON public.tim_keuangan
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sapu_jagat'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'sapu_jagat'::app_role));

CREATE POLICY "Authenticated users can view tim_keuangan"
ON public.tim_keuangan
FOR SELECT
TO authenticated
USING (true);

-- Insert initial data
INSERT INTO public.tim_keuangan (name, email) VALUES
  ('Hidayatul Lisnaini', 'hidayatul96@kemenkeu.go.id'),
  ('Muhamad Arfa Nuradhia Azhar', 'arfa.azhar@kemenkeu.go.id'),
  ('Freesia Putri Erwana', 'freesia.putri@kemenkeu.go.id');

-- Create trigger for updated_at
CREATE TRIGGER update_tim_keuangan_updated_at
  BEFORE UPDATE ON public.tim_keuangan
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();