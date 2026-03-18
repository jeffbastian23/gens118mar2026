-- Create pensiun table
CREATE TABLE IF NOT EXISTS public.pensiun (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  usia_tahun INTEGER,
  masa_kerja_tahun INTEGER,
  jenjang_jabatan TEXT,
  jabatan TEXT,
  unit_organisasi TEXT
);

-- Create pendidikan table
CREATE TABLE IF NOT EXISTS public.pendidikan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  pendidikan TEXT,
  tahun_lulus INTEGER,
  lokasi_pendidikan TEXT,
  jurusan TEXT,
  nama_lembaga_pendidikan TEXT
);

-- Enable Row Level Security
ALTER TABLE public.pensiun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendidikan ENABLE ROW LEVEL SECURITY;

-- Create policies for pensiun
CREATE POLICY "Allow public read access to pensiun" 
ON public.pensiun 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert pensiun" 
ON public.pensiun 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pensiun" 
ON public.pensiun 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete pensiun" 
ON public.pensiun 
FOR DELETE 
USING (true);

-- Create policies for pendidikan
CREATE POLICY "Allow public read access to pendidikan" 
ON public.pendidikan 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert pendidikan" 
ON public.pendidikan 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pendidikan" 
ON public.pendidikan 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete pendidikan" 
ON public.pendidikan 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on pensiun
CREATE TRIGGER update_pensiun_updated_at
BEFORE UPDATE ON public.pensiun
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on pendidikan
CREATE TRIGGER update_pendidikan_updated_at
BEFORE UPDATE ON public.pendidikan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();