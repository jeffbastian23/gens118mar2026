-- Add new columns to grading_big_data table
ALTER TABLE public.grading_big_data 
ADD COLUMN IF NOT EXISTS grade_baru TEXT,
ADD COLUMN IF NOT EXISTS akumulasi_terakhir TEXT,
ADD COLUMN IF NOT EXISTS tmt_peringkat_baru DATE,
ADD COLUMN IF NOT EXISTS kemampuan_kerja TEXT,
ADD COLUMN IF NOT EXISTS atasan_langsung_id UUID,
ADD COLUMN IF NOT EXISTS atasan_langsung_nama TEXT,
ADD COLUMN IF NOT EXISTS atasan_dari_atasan_id UUID,
ADD COLUMN IF NOT EXISTS atasan_dari_atasan_nama TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.grading_big_data.grade_baru IS 'New grade calculated from rekomendasi';
COMMENT ON COLUMN public.grading_big_data.akumulasi_terakhir IS 'Latest accumulated work experience';
COMMENT ON COLUMN public.grading_big_data.tmt_peringkat_baru IS 'TMT for new grade ranking';
COMMENT ON COLUMN public.grading_big_data.kemampuan_kerja IS 'Work capability: Memenuhi/Tidak Memenuhi';
COMMENT ON COLUMN public.grading_big_data.atasan_langsung_id IS 'Direct supervisor employee ID';
COMMENT ON COLUMN public.grading_big_data.atasan_langsung_nama IS 'Direct supervisor name';
COMMENT ON COLUMN public.grading_big_data.atasan_dari_atasan_id IS 'Supervisor of supervisor employee ID';
COMMENT ON COLUMN public.grading_big_data.atasan_dari_atasan_nama IS 'Supervisor of supervisor name';

-- Create daftar_grade table for grade reference
CREATE TABLE IF NOT EXISTS public.daftar_grade (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  klaster TEXT NOT NULL,
  grade INTEGER NOT NULL,
  jabatan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS for daftar_grade
ALTER TABLE public.daftar_grade ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daftar_grade
CREATE POLICY "Authenticated users can view daftar_grade" 
ON public.daftar_grade 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert daftar_grade" 
ON public.daftar_grade 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update daftar_grade" 
ON public.daftar_grade 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete daftar_grade" 
ON public.daftar_grade 
FOR DELETE 
USING (true);