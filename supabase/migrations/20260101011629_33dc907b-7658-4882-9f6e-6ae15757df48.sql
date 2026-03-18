-- Add new columns to daftar_grade table
ALTER TABLE public.daftar_grade 
ADD COLUMN IF NOT EXISTS tugas_jabatan text,
ADD COLUMN IF NOT EXISTS syarat_pendidikan text,
ADD COLUMN IF NOT EXISTS syarat_golongan text;

-- Create new table for PU Syarat General (Golongan and Pendidikan limits)
CREATE TABLE IF NOT EXISTS public.pu_syarat_general (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis text NOT NULL, -- 'golongan' or 'pendidikan'
  syarat text NOT NULL, -- e.g., 'III/c - IV/e', 'S1,D4,S2,S3', etc.
  max_grade integer NOT NULL, -- max grade allowed
  no_urut integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_email text
);

-- Enable RLS on the new table
ALTER TABLE public.pu_syarat_general ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pu_syarat_general
CREATE POLICY "Authenticated users can view pu_syarat_general" 
ON public.pu_syarat_general 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert pu_syarat_general" 
ON public.pu_syarat_general 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update pu_syarat_general" 
ON public.pu_syarat_general 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete pu_syarat_general" 
ON public.pu_syarat_general 
FOR DELETE 
USING (true);

-- Insert default data for Syarat Golongan General (PU)
INSERT INTO public.pu_syarat_general (jenis, syarat, max_grade, no_urut) VALUES
('golongan', 'III/c - IV/e', 12, 1),
('golongan', 'III/b', 11, 2),
('golongan', 'III/a', 10, 3),
('golongan', 'II/d', 9, 4),
('golongan', 'II/c', 8, 5),
('golongan', 'II/b', 7, 6),
('golongan', 'II/a', 6, 7);

-- Insert default data for Syarat Pendidikan General (PU)
INSERT INTO public.pu_syarat_general (jenis, syarat, max_grade, no_urut) VALUES
('pendidikan', 'S1,D4,S2,S3', 12, 1),
('pendidikan', 'DIII/DII', 10, 2),
('pendidikan', 'DI', 8, 3),
('pendidikan', 'SLTA', 6, 4);

-- Add trigger for updating updated_at
CREATE TRIGGER update_pu_syarat_general_updated_at
BEFORE UPDATE ON public.pu_syarat_general
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();