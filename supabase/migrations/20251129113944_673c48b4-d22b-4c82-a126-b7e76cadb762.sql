-- Add new columns to buku_bambu table for enhanced functionality
ALTER TABLE public.buku_bambu 
ADD COLUMN IF NOT EXISTS no_urut INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS foto_absen TEXT,
ADD COLUMN IF NOT EXISTS created_by_name TEXT,
ADD COLUMN IF NOT EXISTS created_by_email TEXT;