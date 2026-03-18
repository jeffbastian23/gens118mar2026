-- Add column for storing finance verification rejection notes
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_catatan text;