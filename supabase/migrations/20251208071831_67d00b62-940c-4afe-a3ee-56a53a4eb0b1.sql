-- Create table for Book Nomor Manual
CREATE TABLE public.book_nomor_manual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis_surat TEXT NOT NULL CHECK (jenis_surat IN ('SPKTNP', 'SPP', 'SPSA')),
  nomor_urut INTEGER NOT NULL,
  nomor_lengkap TEXT NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  perihal TEXT NOT NULL,
  kepada TEXT NOT NULL,
  nama_bidang TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for each jenis_surat type
CREATE SEQUENCE IF NOT EXISTS book_nomor_spktnp_seq START 1;
CREATE SEQUENCE IF NOT EXISTS book_nomor_spp_seq START 1;
CREATE SEQUENCE IF NOT EXISTS book_nomor_spsa_seq START 1;

-- Enable RLS
ALTER TABLE public.book_nomor_manual ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view book_nomor_manual" 
ON public.book_nomor_manual 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert book_nomor_manual" 
ON public.book_nomor_manual 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update book_nomor_manual" 
ON public.book_nomor_manual 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete book_nomor_manual" 
ON public.book_nomor_manual 
FOR DELETE 
USING (true);

-- Create function to get next number for each jenis_surat
CREATE OR REPLACE FUNCTION public.get_next_book_nomor(p_jenis_surat TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  current_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get the max nomor_urut for this jenis_surat in the current year
  SELECT COALESCE(MAX(nomor_urut), 0) + 1 INTO next_num
  FROM book_nomor_manual
  WHERE jenis_surat = p_jenis_surat
    AND EXTRACT(YEAR FROM tanggal) = current_year;
  
  RETURN next_num;
END;
$$;

-- Create function to generate full nomor_lengkap
CREATE OR REPLACE FUNCTION public.generate_book_nomor_lengkap(p_jenis_surat TEXT, p_nomor_urut INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  RETURN p_jenis_surat || '-' || p_nomor_urut || '/WBC.11/' || current_year;
END;
$$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_book_nomor_manual_updated_at
BEFORE UPDATE ON public.book_nomor_manual
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();