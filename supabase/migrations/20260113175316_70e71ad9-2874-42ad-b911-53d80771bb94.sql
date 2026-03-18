-- Add kep_salinan_id column to link lampiran/petikan to specific KEP
ALTER TABLE public.grading_petikan 
ADD COLUMN IF NOT EXISTS kep_salinan_id uuid REFERENCES grading_kep_salinan(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_grading_petikan_kep_salinan_id ON public.grading_petikan(kep_salinan_id);