
-- Create corebase_db_goljab table
CREATE TABLE public.corebase_db_goljab (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL,
  golongan TEXT,
  pangkat TEXT,
  jabatan TEXT,
  unit TEXT,
  satuan_kerja TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corebase_db_goljab ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can read
CREATE POLICY "Authenticated users can read corebase_db_goljab"
ON public.corebase_db_goljab
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert corebase_db_goljab"
ON public.corebase_db_goljab
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update corebase_db_goljab"
ON public.corebase_db_goljab
FOR UPDATE
TO authenticated
USING (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete corebase_db_goljab"
ON public.corebase_db_goljab
FOR DELETE
TO authenticated
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_corebase_db_goljab_updated_at
BEFORE UPDATE ON public.corebase_db_goljab
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
