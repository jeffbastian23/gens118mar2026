-- Add new columns to grading_big_data table
ALTER TABLE public.grading_big_data 
ADD COLUMN IF NOT EXISTS lokasi_pendidikan_terakhir text,
ADD COLUMN IF NOT EXISTS tmt_terakhir date;

-- Copy existing lokasi data to new column if needed
UPDATE public.grading_big_data 
SET lokasi_pendidikan_terakhir = lokasi 
WHERE lokasi IS NOT NULL AND lokasi_pendidikan_terakhir IS NULL;

-- Add new columns to grading_kep_salinan table for Permohonan feature
ALTER TABLE public.grading_kep_salinan
ADD COLUMN IF NOT EXISTS hal text,
ADD COLUMN IF NOT EXISTS pangkat_gol_tmt text,
ADD COLUMN IF NOT EXISTS pendidikan text,
ADD COLUMN IF NOT EXISTS jabatan_lama text,
ADD COLUMN IF NOT EXISTS grade_lama text,
ADD COLUMN IF NOT EXISTS jabatan_baru text,
ADD COLUMN IF NOT EXISTS grade_baru text,
ADD COLUMN IF NOT EXISTS tmt_peringkat_terakhir date;

-- Create permohonan_grading table for better structure
CREATE TABLE IF NOT EXISTS public.permohonan_grading (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_id uuid REFERENCES public.grading_big_data(id),
  no_urut integer,
  nomor_kep text NOT NULL,
  tanggal_kep date,
  hal text, -- Pertama/Kembali/Simulasi/Sidang
  nama_lengkap text NOT NULL,
  nip text,
  pangkat_gol_tmt text,
  pendidikan text,
  jabatan_lama text,
  grade_lama text,
  jabatan_baru text,
  grade_baru text,
  tmt_peringkat_terakhir date,
  keterangan text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by_email text
);

-- Enable RLS for permohonan_grading
ALTER TABLE public.permohonan_grading ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for permohonan_grading
CREATE POLICY "Authenticated users can view permohonan_grading" 
ON public.permohonan_grading 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert permohonan_grading" 
ON public.permohonan_grading 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update permohonan_grading" 
ON public.permohonan_grading 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete permohonan_grading" 
ON public.permohonan_grading 
FOR DELETE 
USING (true);

-- Create trigger for updated_at on permohonan_grading
CREATE TRIGGER update_permohonan_grading_updated_at
BEFORE UPDATE ON public.permohonan_grading
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();