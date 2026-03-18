-- Add columns for recording officer and feedback
ALTER TABLE public.kunjungan_tamu 
ADD COLUMN IF NOT EXISTS recorded_by_name TEXT,
ADD COLUMN IF NOT EXISTS recorded_by_email TEXT,
ADD COLUMN IF NOT EXISTS feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5);