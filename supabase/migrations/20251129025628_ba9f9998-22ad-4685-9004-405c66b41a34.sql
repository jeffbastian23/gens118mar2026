-- Add alamat column to qr_presensi_events table
ALTER TABLE public.qr_presensi_events 
ADD COLUMN IF NOT EXISTS alamat TEXT DEFAULT NULL;