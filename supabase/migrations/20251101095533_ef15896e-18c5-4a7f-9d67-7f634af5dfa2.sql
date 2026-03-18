-- Add new columns to plh_kepala table for additional fields
ALTER TABLE public.plh_kepala
ADD COLUMN IF NOT EXISTS dasar_penugasan TEXT,
ADD COLUMN IF NOT EXISTS tanggal_plh_mulai DATE,
ADD COLUMN IF NOT EXISTS tanggal_plh_selesai DATE,
ADD COLUMN IF NOT EXISTS pejabat_unit_pemohon_id UUID,
ADD COLUMN IF NOT EXISTS pejabat_unit_penerbit_id UUID;

-- Update existing records to move nomor_naskah_dinas to dasar_penugasan if dasar_penugasan is null
UPDATE public.plh_kepala
SET dasar_penugasan = nomor_naskah_dinas
WHERE dasar_penugasan IS NULL;