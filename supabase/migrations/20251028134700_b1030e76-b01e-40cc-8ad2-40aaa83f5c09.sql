-- Add date range fields to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS tanggal_mulai_kegiatan text,
ADD COLUMN IF NOT EXISTS tanggal_selesai_kegiatan text;

-- Update existing records to use hari_tanggal_kegiatan as both start and end
UPDATE public.assignments 
SET tanggal_mulai_kegiatan = hari_tanggal_kegiatan,
    tanggal_selesai_kegiatan = hari_tanggal_kegiatan
WHERE tanggal_mulai_kegiatan IS NULL;