-- Create FAQ table for Live Chat SDM
CREATE TABLE public.faq_sdm (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kategori TEXT NOT NULL,
  pertanyaan TEXT NOT NULL,
  jawaban TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_sdm ENABLE ROW LEVEL SECURITY;

-- RLS policies for FAQ
CREATE POLICY "Authenticated users can view faq_sdm"
ON public.faq_sdm FOR SELECT
USING (true);

CREATE POLICY "Admins can insert faq_sdm"
ON public.faq_sdm FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update faq_sdm"
ON public.faq_sdm FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete faq_sdm"
ON public.faq_sdm FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add tugas column to tim_upk table
ALTER TABLE public.tim_upk ADD COLUMN IF NOT EXISTS tugas TEXT;

-- Add telepon column to tim_upk table
ALTER TABLE public.tim_upk ADD COLUMN IF NOT EXISTS telepon TEXT;

-- Create trigger for updated_at
CREATE TRIGGER update_faq_sdm_updated_at
BEFORE UPDATE ON public.faq_sdm
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();