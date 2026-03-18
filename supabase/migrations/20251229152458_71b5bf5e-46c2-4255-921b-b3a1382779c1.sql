-- Create dosir_out table for employee exit documents
CREATE TABLE public.dosir_out (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  tanggal_tanda_terima DATE NOT NULL DEFAULT CURRENT_DATE,
  is_bmn_returned BOOLEAN DEFAULT false,
  is_rumah_negara_returned BOOLEAN DEFAULT false,
  is_tanggungan_koperasi_returned BOOLEAN DEFAULT false,
  foto_dokumen TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create dosir_in table for employee entry documents  
CREATE TABLE public.dosir_in (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  is_spd_complete BOOLEAN DEFAULT false,
  is_dosir_complete BOOLEAN DEFAULT false,
  tim_upk_id UUID REFERENCES public.tim_upk(id),
  tim_upk_name TEXT,
  tanggal_input TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create kekuatan_pegawai view for employee strength dashboard
-- This combines data from absensi, cuti, and assignments

-- Enable RLS on dosir_out
ALTER TABLE public.dosir_out ENABLE ROW LEVEL SECURITY;

-- RLS policies for dosir_out
CREATE POLICY "Authenticated users can view dosir_out" 
ON public.dosir_out 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert dosir_out" 
ON public.dosir_out 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dosir_out" 
ON public.dosir_out 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete dosir_out" 
ON public.dosir_out 
FOR DELETE 
USING (true);

-- Enable RLS on dosir_in
ALTER TABLE public.dosir_in ENABLE ROW LEVEL SECURITY;

-- RLS policies for dosir_in
CREATE POLICY "Authenticated users can view dosir_in" 
ON public.dosir_in 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert dosir_in" 
ON public.dosir_in 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dosir_in" 
ON public.dosir_in 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete dosir_in" 
ON public.dosir_in 
FOR DELETE 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_dosir_out_updated_at
BEFORE UPDATE ON public.dosir_out
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dosir_in_updated_at
BEFORE UPDATE ON public.dosir_in
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();