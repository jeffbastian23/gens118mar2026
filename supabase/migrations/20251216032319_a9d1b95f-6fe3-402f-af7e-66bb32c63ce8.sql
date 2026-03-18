-- Create table for Realisasi Anggaran
CREATE TABLE public.realisasi_anggaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  kode_program TEXT,
  kode_kegiatan TEXT,
  kode_output TEXT,
  kode_sub_output TEXT,
  kode_komponen TEXT,
  kode_sub_komponen TEXT,
  kode_akun TEXT,
  uraian TEXT NOT NULL,
  pagu_revisi NUMERIC DEFAULT 0,
  lock_pagu NUMERIC DEFAULT 0,
  realisasi_periode_lalu NUMERIC DEFAULT 0,
  realisasi_periode_ini NUMERIC DEFAULT 0,
  realisasi_sd_periode NUMERIC DEFAULT 0,
  persentase NUMERIC DEFAULT 0,
  sisa_anggaran NUMERIC DEFAULT 0,
  level_hierarki INTEGER DEFAULT 0,
  tahun_anggaran INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  periode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.realisasi_anggaran ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view realisasi_anggaran"
ON public.realisasi_anggaran
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert realisasi_anggaran"
ON public.realisasi_anggaran
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update realisasi_anggaran"
ON public.realisasi_anggaran
FOR UPDATE
USING (true);

CREATE POLICY "Admins can delete realisasi_anggaran"
ON public.realisasi_anggaran
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_realisasi_anggaran_updated_at
BEFORE UPDATE ON public.realisasi_anggaran
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();