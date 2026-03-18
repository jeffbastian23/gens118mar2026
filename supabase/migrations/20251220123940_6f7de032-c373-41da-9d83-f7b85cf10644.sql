-- Create mutasi table for employee mutation data
CREATE TABLE public.mutasi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_kep TEXT NOT NULL,
  tanggal_kep DATE NOT NULL,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  pangkat_golongan TEXT,
  unit_lama TEXT NOT NULL,
  unit_baru TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.mutasi ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view mutasi" 
ON public.mutasi 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert mutasi" 
ON public.mutasi 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update mutasi" 
ON public.mutasi 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete mutasi" 
ON public.mutasi 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mutasi_updated_at
BEFORE UPDATE ON public.mutasi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();