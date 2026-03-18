-- Create table for Kelengkapan Data & Rekomendasi Hasil Simulasi (Simulasi)
CREATE TABLE IF NOT EXISTS public.grading_kelengkapan_simulasi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permohonan_id UUID REFERENCES public.permohonan_grading(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  jenis_kelengkapan TEXT, -- 'Kelengkapan Data' or 'Rekomendasi Hasil Simulasi'
  status TEXT DEFAULT 'Pending',
  catatan TEXT,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Kuesioner (Naik-Sidang)
CREATE TABLE IF NOT EXISTS public.grading_kuesioner (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permohonan_id UUID REFERENCES public.permohonan_grading(id) ON DELETE CASCADE,
  grading_id UUID REFERENCES public.grading_big_data(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  jenis_kuesioner TEXT, -- 'PTB', 'PK', 'PU'
  jawaban JSONB DEFAULT '{}',
  status TEXT DEFAULT 'Belum Diisi',
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Hasil Evaluasi PU/PK/PTB (Sidang)
CREATE TABLE IF NOT EXISTS public.grading_hasil_evaluasi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permohonan_id UUID REFERENCES public.permohonan_grading(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  jenis_evaluasi TEXT, -- 'PU', 'PK', 'PTB'
  hasil TEXT,
  nilai NUMERIC,
  catatan TEXT,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for Berita Acara Hasil Penilaian (Sidang)
CREATE TABLE IF NOT EXISTS public.grading_berita_acara (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permohonan_id UUID REFERENCES public.permohonan_grading(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  nomor_ba TEXT,
  tanggal_ba DATE,
  hasil_penilaian TEXT,
  kesimpulan TEXT,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.grading_kelengkapan_simulasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_kuesioner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_hasil_evaluasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_berita_acara ENABLE ROW LEVEL SECURITY;

-- RLS Policies for grading_kelengkapan_simulasi
CREATE POLICY "Authenticated users can view grading_kelengkapan_simulasi"
ON public.grading_kelengkapan_simulasi FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert grading_kelengkapan_simulasi"
ON public.grading_kelengkapan_simulasi FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update grading_kelengkapan_simulasi"
ON public.grading_kelengkapan_simulasi FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete grading_kelengkapan_simulasi"
ON public.grading_kelengkapan_simulasi FOR DELETE USING (true);

-- RLS Policies for grading_kuesioner
CREATE POLICY "Authenticated users can view grading_kuesioner"
ON public.grading_kuesioner FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert grading_kuesioner"
ON public.grading_kuesioner FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update grading_kuesioner"
ON public.grading_kuesioner FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete grading_kuesioner"
ON public.grading_kuesioner FOR DELETE USING (true);

-- RLS Policies for grading_hasil_evaluasi
CREATE POLICY "Authenticated users can view grading_hasil_evaluasi"
ON public.grading_hasil_evaluasi FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert grading_hasil_evaluasi"
ON public.grading_hasil_evaluasi FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update grading_hasil_evaluasi"
ON public.grading_hasil_evaluasi FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete grading_hasil_evaluasi"
ON public.grading_hasil_evaluasi FOR DELETE USING (true);

-- RLS Policies for grading_berita_acara
CREATE POLICY "Authenticated users can view grading_berita_acara"
ON public.grading_berita_acara FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert grading_berita_acara"
ON public.grading_berita_acara FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update grading_berita_acara"
ON public.grading_berita_acara FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete grading_berita_acara"
ON public.grading_berita_acara FOR DELETE USING (true);

-- Add update triggers
CREATE TRIGGER update_grading_kelengkapan_simulasi_updated_at
BEFORE UPDATE ON public.grading_kelengkapan_simulasi
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grading_kuesioner_updated_at
BEFORE UPDATE ON public.grading_kuesioner
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grading_hasil_evaluasi_updated_at
BEFORE UPDATE ON public.grading_hasil_evaluasi
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grading_berita_acara_updated_at
BEFORE UPDATE ON public.grading_berita_acara
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.grading_kelengkapan_simulasi IS 'Kelengkapan Data & Rekomendasi Hasil Simulasi for Grading Simulasi';
COMMENT ON TABLE public.grading_kuesioner IS 'Kuesioner for Grading Naik-Sidang';
COMMENT ON TABLE public.grading_hasil_evaluasi IS 'Hasil Evaluasi PU/PK/PTB for Grading Sidang';
COMMENT ON TABLE public.grading_berita_acara IS 'Berita Acara Hasil Penilaian for Grading Sidang';