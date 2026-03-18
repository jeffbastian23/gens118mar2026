-- Create jadwal_sidang_grading table
CREATE TABLE public.jadwal_sidang_grading (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  hari_tanggal DATE NOT NULL,
  pukul TEXT,
  media TEXT,
  satuan_kerja TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.jadwal_sidang_grading ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view jadwal sidang grading" 
  ON public.jadwal_sidang_grading 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can insert jadwal sidang grading" 
  ON public.jadwal_sidang_grading 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update jadwal sidang grading" 
  ON public.jadwal_sidang_grading 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can delete jadwal sidang grading" 
  ON public.jadwal_sidang_grading 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jadwal_sidang_grading_updated_at
BEFORE UPDATE ON public.jadwal_sidang_grading
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.jadwal_sidang_grading IS 'Tabel untuk menyimpan jadwal sidang grading';