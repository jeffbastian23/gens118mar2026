-- Add nomor_surat and hal columns to buku_bambu table
ALTER TABLE public.buku_bambu
ADD COLUMN IF NOT EXISTS nomor_surat TEXT,
ADD COLUMN IF NOT EXISTS hal TEXT;