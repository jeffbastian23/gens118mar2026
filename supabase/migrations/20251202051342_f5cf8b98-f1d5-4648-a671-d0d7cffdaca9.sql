-- Create st_luar_kantor table for external assignments
CREATE TABLE IF NOT EXISTS public.st_luar_kantor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dasar_penugasan TEXT NOT NULL,
  employee_ids TEXT[] NOT NULL,
  pdf_dokumen TEXT,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  waktu_penugasan TEXT,
  lokasi_penugasan TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.st_luar_kantor ENABLE ROW LEVEL SECURITY;

-- Create policies for st_luar_kantor
CREATE POLICY "Allow authenticated users to view st_luar_kantor"
ON public.st_luar_kantor
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert st_luar_kantor"
ON public.st_luar_kantor
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update st_luar_kantor"
ON public.st_luar_kantor
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete st_luar_kantor"
ON public.st_luar_kantor
FOR DELETE
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_st_luar_kantor_tanggal ON public.st_luar_kantor(tanggal_mulai, tanggal_selesai);
CREATE INDEX idx_st_luar_kantor_created_at ON public.st_luar_kantor(created_at);

-- Add trigger for updating updated_at
CREATE TRIGGER update_st_luar_kantor_updated_at
BEFORE UPDATE ON public.st_luar_kantor
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();