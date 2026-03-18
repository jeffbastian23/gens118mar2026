-- Create aktivasi_cortax table for storing Coretax activation data
CREATE TABLE public.aktivasi_cortax (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor integer,
  nama_lengkap text NOT NULL,
  nip text NOT NULL,
  pangkat text,
  unit text,
  bagian_bidang text,
  login_portal text DEFAULT 'TIDAK',
  status_kode_otorisasi text DEFAULT 'BELUM KODE OTORISASI',
  bukti_registrasi text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.aktivasi_cortax ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view aktivasi_cortax" 
ON public.aktivasi_cortax 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert aktivasi_cortax" 
ON public.aktivasi_cortax 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update aktivasi_cortax" 
ON public.aktivasi_cortax 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete aktivasi_cortax" 
ON public.aktivasi_cortax 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_aktivasi_cortax_updated_at
BEFORE UPDATE ON public.aktivasi_cortax
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();