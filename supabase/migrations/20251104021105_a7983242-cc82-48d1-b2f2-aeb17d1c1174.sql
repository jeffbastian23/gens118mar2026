-- Add tracking columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN konsep_masuk_at timestamp with time zone,
ADD COLUMN konsep_masuk_by text,
ADD COLUMN proses_nd_at timestamp with time zone,
ADD COLUMN proses_nd_by text,
ADD COLUMN proses_st_at timestamp with time zone,
ADD COLUMN proses_st_by text,
ADD COLUMN selesai_at timestamp with time zone,
ADD COLUMN selesai_by text,
ADD COLUMN no_satu_kemenkeu text,
ADD COLUMN tanggal_satu_kemenkeu date;

-- Backfill konsep_masuk_at with created_at for existing records
UPDATE public.assignments
SET konsep_masuk_at = created_at
WHERE konsep_masuk_at IS NULL;