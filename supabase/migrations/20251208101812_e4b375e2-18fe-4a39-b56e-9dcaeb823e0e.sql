-- Add rating and feedback columns to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS rating_penilaian integer CHECK (rating_penilaian >= 1 AND rating_penilaian <= 4),
ADD COLUMN IF NOT EXISTS saran_feedback text,
ADD COLUMN IF NOT EXISTS rating_by text,
ADD COLUMN IF NOT EXISTS rating_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.assignments.rating_penilaian IS 'Rating penilaian skala 1-4 bintang';
COMMENT ON COLUMN public.assignments.saran_feedback IS 'Saran/komentar feedback dari pengguna';
COMMENT ON COLUMN public.assignments.rating_by IS 'Email user yang memberikan rating';
COMMENT ON COLUMN public.assignments.rating_at IS 'Waktu pemberian rating';