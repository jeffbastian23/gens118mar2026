-- Create grading_big_data table
CREATE TABLE public.grading_big_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  nip TEXT NOT NULL,
  pangkat_golongan TEXT,
  pendidikan TEXT,
  lokasi TEXT,
  eselon_iii TEXT,
  eselon_iv TEXT,
  jabatan TEXT,
  grade TEXT,
  pkt_2024 TEXT,
  pkt_2025 TEXT,
  hukuman_disiplin BOOLEAN DEFAULT false,
  tugas_belajar BOOLEAN DEFAULT false,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grading_kep_salinan table
CREATE TABLE public.grading_kep_salinan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_id UUID REFERENCES public.grading_big_data(id) ON DELETE SET NULL,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  nomor_kep TEXT NOT NULL,
  tanggal_kep DATE,
  jenis_dokumen TEXT,
  keterangan TEXT,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create grading_petikan table
CREATE TABLE public.grading_petikan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grading_id UUID REFERENCES public.grading_big_data(id) ON DELETE SET NULL,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  nomor_petikan TEXT NOT NULL,
  tanggal_petikan DATE,
  keterangan TEXT,
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grading_big_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_kep_salinan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_petikan ENABLE ROW LEVEL SECURITY;

-- RLS policies for grading_big_data
CREATE POLICY "Authenticated users can view grading_big_data" ON public.grading_big_data FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert grading_big_data" ON public.grading_big_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update grading_big_data" ON public.grading_big_data FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete grading_big_data" ON public.grading_big_data FOR DELETE USING (true);

-- RLS policies for grading_kep_salinan
CREATE POLICY "Authenticated users can view grading_kep_salinan" ON public.grading_kep_salinan FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert grading_kep_salinan" ON public.grading_kep_salinan FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update grading_kep_salinan" ON public.grading_kep_salinan FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete grading_kep_salinan" ON public.grading_kep_salinan FOR DELETE USING (true);

-- RLS policies for grading_petikan
CREATE POLICY "Authenticated users can view grading_petikan" ON public.grading_petikan FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert grading_petikan" ON public.grading_petikan FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update grading_petikan" ON public.grading_petikan FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete grading_petikan" ON public.grading_petikan FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_grading_big_data_updated_at BEFORE UPDATE ON public.grading_big_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grading_kep_salinan_updated_at BEFORE UPDATE ON public.grading_kep_salinan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grading_petikan_updated_at BEFORE UPDATE ON public.grading_petikan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();