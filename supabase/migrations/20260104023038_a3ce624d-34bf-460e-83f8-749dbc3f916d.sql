-- Create new berita_acara_sidang table with improved structure
CREATE TABLE public.berita_acara_sidang (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  nomor_ba TEXT,
  tanggal DATE,
  lokasi TEXT,
  satuan_kerja TEXT,
  nama_pimpinan TEXT,
  nip_pimpinan TEXT,
  kategori TEXT, -- 'PU_NAIK_TURUN_TETAP', 'PU_BELUM_REKOMENDASI', 'PK_NAIK_TETAP', 'PK_BELUM_REKOMENDASI', 'PTB_NAIK_TURUN_TETAP', 'PTB_BELUM_REKOMENDASI'
  peserta JSONB DEFAULT '[]'::jsonb, -- Array of {nama: string, nip: string}
  detail_kategori JSONB DEFAULT '{}'::jsonb, -- Dynamic fields based on kategori
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.berita_acara_sidang ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view berita_acara_sidang" 
ON public.berita_acara_sidang 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert berita_acara_sidang" 
ON public.berita_acara_sidang 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update berita_acara_sidang" 
ON public.berita_acara_sidang 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete berita_acara_sidang" 
ON public.berita_acara_sidang 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_berita_acara_sidang_updated_at
BEFORE UPDATE ON public.berita_acara_sidang
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();