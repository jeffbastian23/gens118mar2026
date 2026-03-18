-- Add new columns for comprehensive feedback survey to kunjungan_tamu table
ALTER TABLE public.kunjungan_tamu 
ADD COLUMN IF NOT EXISTS pendidikan TEXT,
ADD COLUMN IF NOT EXISTS layanan TEXT,
ADD COLUMN IF NOT EXISTS survey_responses JSONB;

-- Update feedback_rating constraint to allow 1-8 scale
ALTER TABLE public.kunjungan_tamu DROP CONSTRAINT IF EXISTS kunjungan_tamu_feedback_rating_check;
ALTER TABLE public.kunjungan_tamu ADD CONSTRAINT kunjungan_tamu_feedback_rating_check CHECK (feedback_rating >= 1 AND feedback_rating <= 8);

-- Add feedback_submitted_by to track who submitted the feedback
ALTER TABLE public.kunjungan_tamu 
ADD COLUMN IF NOT EXISTS feedback_submitted_by TEXT;

-- Add feedback_submitted_at timestamp
ALTER TABLE public.kunjungan_tamu 
ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies to allow user/super roles to update feedback fields only
DROP POLICY IF EXISTS "Users can update feedback on kunjungan_tamu" ON public.kunjungan_tamu;
CREATE POLICY "Users can update feedback on kunjungan_tamu"
ON public.kunjungan_tamu FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);