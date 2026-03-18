-- Create syarat_kenaikan_pangkat table
CREATE TABLE public.syarat_kenaikan_pangkat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis_kenaikan TEXT NOT NULL CHECK (jenis_kenaikan IN ('regular', 'fungsional')),
  kode_kriteria TEXT NOT NULL,
  kriteria TEXT NOT NULL,
  deskripsi TEXT,
  is_active BOOLEAN DEFAULT true,
  no_urut INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.syarat_kenaikan_pangkat ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read for authenticated users" 
ON public.syarat_kenaikan_pangkat 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for admin users" 
ON public.syarat_kenaikan_pangkat 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_syarat_kenaikan_pangkat_updated_at
BEFORE UPDATE ON public.syarat_kenaikan_pangkat
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data for Regular criteria
INSERT INTO public.syarat_kenaikan_pangkat (jenis_kenaikan, kode_kriteria, kriteria, deskripsi, no_urut) VALUES
('regular', 'a', 'CPNS TMT < 1 Feb 2020', 'Calon Pegawai Negeri Sipil dengan Terhitung Mulai Tanggal sebelum 1 Februari 2020', 1),
('regular', 'b', 'PNS TMT Pangkat < 1 Feb 2020', 'Pegawai Negeri Sipil dengan TMT Pangkat sebelum 1 Februari 2020', 2),
('regular', 'c', 'Bukan Pejabat', 'Pegawai yang bukan merupakan pejabat struktural/fungsional', 3),
('regular', 'd', 'Tidak Melampaui Pendidikan', 'Kenaikan pangkat tidak melampaui tingkat pendidikan yang dimiliki', 4),
('regular', 'e', 'Tidak Melampaui Pangkat Atasan Langsung', 'Pangkat setelah kenaikan tidak melampaui pangkat atasan langsung', 5),
('regular', 'f', 'DP3 Minimal Baik 2024 & 2025', 'Daftar Penilaian Pelaksanaan Pekerjaan minimal kategori Baik pada tahun 2024 dan 2025', 6);

-- Insert placeholder for Fungsional criteria
INSERT INTO public.syarat_kenaikan_pangkat (jenis_kenaikan, kode_kriteria, kriteria, deskripsi, no_urut) VALUES
('fungsional', 'a', 'Memenuhi Angka Kredit', 'Memenuhi angka kredit kumulatif yang dipersyaratkan', 1),
('fungsional', 'b', 'Lulus Uji Kompetensi', 'Telah lulus uji kompetensi sesuai jenjang jabatan fungsional', 2),
('fungsional', 'c', 'Memiliki Sertifikasi', 'Memiliki sertifikasi profesional yang dipersyaratkan', 3);