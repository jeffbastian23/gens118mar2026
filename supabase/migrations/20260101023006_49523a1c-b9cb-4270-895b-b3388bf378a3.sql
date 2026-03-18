-- Create konversi_predikat_kinerja table for storing annual performance predicate conversion
CREATE TABLE IF NOT EXISTS public.konversi_predikat_kinerja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  predikat TEXT NOT NULL,
  nilai_terendah NUMERIC NOT NULL,
  nilai_tertinggi NUMERIC NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create monev_laporan table for Monev reports
CREATE TABLE IF NOT EXISTS public.monev_laporan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  jenis_mekanisme_penetapan TEXT NOT NULL,
  jumlah_keputusan INTEGER NOT NULL DEFAULT 0,
  hasil_monev TEXT,
  tindak_lanjut TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create satuan_kerja table for storing organization units
CREATE TABLE IF NOT EXISTS public.satuan_kerja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  nama_satuan_kerja TEXT NOT NULL,
  kode_satuan_kerja TEXT,
  alamat TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.konversi_predikat_kinerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monev_laporan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satuan_kerja ENABLE ROW LEVEL SECURITY;

-- Create policies for konversi_predikat_kinerja
CREATE POLICY "Authenticated users can view konversi_predikat_kinerja" 
ON public.konversi_predikat_kinerja FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert konversi_predikat_kinerja" 
ON public.konversi_predikat_kinerja FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update konversi_predikat_kinerja" 
ON public.konversi_predikat_kinerja FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete konversi_predikat_kinerja" 
ON public.konversi_predikat_kinerja FOR DELETE USING (true);

-- Create policies for monev_laporan
CREATE POLICY "Authenticated users can view monev_laporan" 
ON public.monev_laporan FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert monev_laporan" 
ON public.monev_laporan FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update monev_laporan" 
ON public.monev_laporan FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete monev_laporan" 
ON public.monev_laporan FOR DELETE USING (true);

-- Create policies for satuan_kerja
CREATE POLICY "Authenticated users can view satuan_kerja" 
ON public.satuan_kerja FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert satuan_kerja" 
ON public.satuan_kerja FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update satuan_kerja" 
ON public.satuan_kerja FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete satuan_kerja" 
ON public.satuan_kerja FOR DELETE USING (true);

-- Insert default satuan kerja data
INSERT INTO public.satuan_kerja (no_urut, nama_satuan_kerja, kode_satuan_kerja) VALUES
(1, 'Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I', 'KANWIL'),
(2, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak', 'KPPBC-TP'),
(3, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda', 'KPPBC-JU'),
(4, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean A Pasuruan', 'KPPBC-PA'),
(5, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik', 'KPPBC-GR'),
(6, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Sidoarjo', 'KPPBC-SI'),
(7, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Madura', 'KPPBC-MA'),
(8, 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro', 'KPPBC-BJ'),
(9, 'Balai Laboratorium Bea dan Cukai Kelas I Surabaya', 'BLBC-SBY');