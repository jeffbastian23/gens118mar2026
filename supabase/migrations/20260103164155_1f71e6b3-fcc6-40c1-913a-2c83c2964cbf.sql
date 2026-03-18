-- Create table for Format Hasil Evaluasi (PU/PK/PTB)
CREATE TABLE public.grading_format_hasil_evaluasi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis_evaluasi TEXT NOT NULL CHECK (jenis_evaluasi IN ('PU', 'PK', 'PTB')),
  satuan_kerja TEXT,
  no_urut INTEGER,
  nama_nip TEXT NOT NULL,
  pangkat_gol_ruang_tmt TEXT,
  pendidikan TEXT,
  jabatan_kedudukan TEXT,
  peringkat_lama TEXT,
  -- For PU fields
  pkt_y_minus_1 TEXT,
  pkt_y TEXT,
  kemampuan_kerja TEXT,
  -- For PK fields
  jabatan_tugas_kedudukan TEXT,
  predikat_kinerja_terakhir_peringkat_lama TEXT,
  akumulasi_masa_kerja_terakhir_peringkat_lama TEXT,
  akumulasi_masa_kerja_sd_tahun_y TEXT,
  predikat_kinerja_tahunan_y TEXT,
  -- Common fields
  lokasi TEXT,
  tanggal DATE,
  nama_atasan_dari_atasan_langsung TEXT,
  nip_atasan_dari_atasan_langsung TEXT,
  nama_atasan_langsung TEXT,
  nip_atasan_langsung TEXT,
  permohonan_id UUID REFERENCES public.permohonan_grading(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.grading_format_hasil_evaluasi ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view grading_format_hasil_evaluasi" 
ON public.grading_format_hasil_evaluasi 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert grading_format_hasil_evaluasi" 
ON public.grading_format_hasil_evaluasi 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update grading_format_hasil_evaluasi" 
ON public.grading_format_hasil_evaluasi 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete grading_format_hasil_evaluasi" 
ON public.grading_format_hasil_evaluasi 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_grading_format_hasil_evaluasi_updated_at
BEFORE UPDATE ON public.grading_format_hasil_evaluasi
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();