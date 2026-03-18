-- Add feedback columns to surat_masuk table
ALTER TABLE public.surat_masuk 
ADD COLUMN IF NOT EXISTS feedback_rating INTEGER,
ADD COLUMN IF NOT EXISTS feedback_comment TEXT;

COMMENT ON COLUMN public.surat_masuk.feedback_rating IS 'Rating skala 2-5: 2=Buruk, 3=Cukup, 4=Baik, 5=Sangat Baik';
COMMENT ON COLUMN public.surat_masuk.feedback_comment IS 'Kritik dan saran (opsional)';