-- Add feedback_comment column to kunjungan_tamu table
ALTER TABLE public.kunjungan_tamu 
ADD COLUMN IF NOT EXISTS feedback_comment text;