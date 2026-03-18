-- Add jenis_plh_plt column to plh_kepala table
ALTER TABLE public.plh_kepala 
ADD COLUMN IF NOT EXISTS jenis_plh_plt TEXT DEFAULT 'PLH';

-- Add comment to explain the column
COMMENT ON COLUMN public.plh_kepala.jenis_plh_plt IS 'Jenis penugasan: PLH (Pelaksana Harian) atau PLT (Pelaksana Tugas)';

-- Update existing records to have default value
UPDATE public.plh_kepala 
SET jenis_plh_plt = 'PLH' 
WHERE jenis_plh_plt IS NULL;