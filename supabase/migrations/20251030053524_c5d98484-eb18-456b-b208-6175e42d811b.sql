-- Create plh_kepala table for Acting Head assignments
CREATE TABLE public.plh_kepala (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unit_pemohon TEXT NOT NULL,
  unit_penerbit TEXT NOT NULL,
  nomor_naskah_dinas TEXT NOT NULL,
  tanggal DATE NOT NULL,
  perihal TEXT NOT NULL,
  employee_ids UUID[] NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.plh_kepala ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to plh_kepala"
ON public.plh_kepala
FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated users to insert plh_kepala"
ON public.plh_kepala
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update plh_kepala"
ON public.plh_kepala
FOR UPDATE
USING (true);

CREATE POLICY "Allow authenticated users to delete plh_kepala"
ON public.plh_kepala
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plh_kepala_updated_at
BEFORE UPDATE ON public.plh_kepala
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();