-- Add new columns to grading_big_data table
ALTER TABLE public.grading_big_data 
ADD COLUMN IF NOT EXISTS lampiran_kep TEXT,
ADD COLUMN IF NOT EXISTS tmt_pangkat DATE,
ADD COLUMN IF NOT EXISTS akumulasi_masa_kerja TEXT,
ADD COLUMN IF NOT EXISTS jabatan_baru TEXT,
ADD COLUMN IF NOT EXISTS upkp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS jenis TEXT,
ADD COLUMN IF NOT EXISTS rekomendasi TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.grading_big_data.lampiran_kep IS 'Lampiran KEP document reference';
COMMENT ON COLUMN public.grading_big_data.tmt_pangkat IS 'TMT Pangkat date';
COMMENT ON COLUMN public.grading_big_data.akumulasi_masa_kerja IS 'Accumulated work experience';
COMMENT ON COLUMN public.grading_big_data.jabatan_baru IS 'New position';
COMMENT ON COLUMN public.grading_big_data.upkp IS 'UPKP flag (Yes/No)';
COMMENT ON COLUMN public.grading_big_data.jenis IS 'Type: PU/PK/PTB/Pelaksana Tertentu';
COMMENT ON COLUMN public.grading_big_data.rekomendasi IS 'Recommendation: Naik/Tetap/Turun';