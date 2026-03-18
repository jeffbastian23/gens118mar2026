-- Add tracking fields to plh_kepala table
ALTER TABLE plh_kepala
ADD COLUMN IF NOT EXISTS konsep_masuk_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS konsep_masuk_by text,
ADD COLUMN IF NOT EXISTS proses_nd_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS proses_nd_by text,
ADD COLUMN IF NOT EXISTS proses_st_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS proses_st_by text,
ADD COLUMN IF NOT EXISTS selesai_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS selesai_by text,
ADD COLUMN IF NOT EXISTS no_satu_kemenkeu text,
ADD COLUMN IF NOT EXISTS tanggal_satu_kemenkeu date;

-- Backfill konsep_masuk_at with created_at for existing records
UPDATE plh_kepala
SET konsep_masuk_at = created_at
WHERE konsep_masuk_at IS NULL;