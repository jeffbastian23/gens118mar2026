-- Add image_url field to news table
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create bank_issue table for Issue tracking in Agenda
CREATE TABLE public.bank_issue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no INTEGER,
  issue TEXT NOT NULL,
  solusi TEXT,
  uic TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.bank_issue ENABLE ROW LEVEL SECURITY;

-- Create policies for bank_issue
CREATE POLICY "Authenticated users can view bank_issue" 
ON public.bank_issue 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert bank_issue" 
ON public.bank_issue 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update bank_issue" 
ON public.bank_issue 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete bank_issue" 
ON public.bank_issue 
FOR DELETE 
USING (true);

-- Create trigger for update_updated_at
CREATE TRIGGER update_bank_issue_updated_at
  BEFORE UPDATE ON public.bank_issue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();