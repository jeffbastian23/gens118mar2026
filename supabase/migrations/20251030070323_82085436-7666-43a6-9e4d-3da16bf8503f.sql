-- Add tanggal_mulai_kegiatan and tanggal_selesai_kegiatan columns to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS tanggal_mulai_kegiatan DATE,
ADD COLUMN IF NOT EXISTS tanggal_selesai_kegiatan DATE;

-- Update existing records to use hari_tanggal_kegiatan as default
UPDATE public.assignments 
SET tanggal_mulai_kegiatan = hari_tanggal_kegiatan,
    tanggal_selesai_kegiatan = hari_tanggal_kegiatan
WHERE tanggal_mulai_kegiatan IS NULL OR tanggal_selesai_kegiatan IS NULL;