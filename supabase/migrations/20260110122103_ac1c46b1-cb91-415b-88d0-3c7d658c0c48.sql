-- Create corebase_db_pokok table
CREATE TABLE IF NOT EXISTS public.corebase_db_pokok (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_reg SERIAL NOT NULL,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL UNIQUE,
  tempat_lahir TEXT,
  tgl_lahir DATE,
  tmt_cpns DATE,
  cek_tmt_cpns TEXT,
  automasi_cek_tmt_cpns TEXT,
  tmt_pns DATE,
  agama TEXT,
  gender TEXT CHECK (gender IN ('Pria', 'Wanita')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create corebase_db_status table
CREATE TABLE IF NOT EXISTS public.corebase_db_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('PNS', 'P3K')),
  flag_cltn BOOLEAN DEFAULT false,
  cltn_surat_izin_nomor TEXT,
  cltn_tgl_mulai DATE,
  cltn_tgl_akhir DATE,
  cltn_status_argo TEXT,
  flag_pemberhentian BOOLEAN DEFAULT false,
  pemberhentian_jenis TEXT,
  pemberhentian_no_skep TEXT,
  pemberhentian_tgl_skep DATE,
  pemberhentian_tgl_diterima DATE,
  pemberhentian_tgl_berlaku DATE,
  pemberhentian_tindak_lanjut TEXT,
  flag_meninggal BOOLEAN DEFAULT false,
  meninggal_tgl DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create corebase_db_pensiun table
CREATE TABLE IF NOT EXISTS public.corebase_db_pensiun (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL UNIQUE,
  tgl_lahir DATE,
  kode_jabatan TEXT,
  eselon_jenjang TEXT,
  bup INTEGER DEFAULT 58,
  tmt_pensiun DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create corebase_db_rekam_jejak table
CREATE TABLE IF NOT EXISTS public.corebase_db_rekam_jejak (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL,
  nama_satker TEXT,
  unit_es_iii TEXT,
  unit_es_iv TEXT,
  jenis TEXT CHECK (jenis IN ('JMA', 'JMP', 'JMPT', 'JNMFA', 'JNMFT', 'JNMP')),
  es_jenjang_jp TEXT CHECK (es_jenjang_jp IN ('Eselon', 'Fungsional', 'Pelaksana PU', 'PTB', 'PK')),
  nama_jab_sub_unsur TEXT,
  tmt_satker DATE,
  durasi_satker TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS for all corebase tables
ALTER TABLE public.corebase_db_pokok ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corebase_db_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corebase_db_pensiun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corebase_db_rekam_jejak ENABLE ROW LEVEL SECURITY;

-- Create policies for corebase_db_pokok
CREATE POLICY "corebase_db_pokok viewable by authenticated" ON public.corebase_db_pokok FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_pokok insertable by authenticated" ON public.corebase_db_pokok FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_pokok updatable by authenticated" ON public.corebase_db_pokok FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_pokok deletable by authenticated" ON public.corebase_db_pokok FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for corebase_db_status
CREATE POLICY "corebase_db_status viewable by authenticated" ON public.corebase_db_status FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_status insertable by authenticated" ON public.corebase_db_status FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_status updatable by authenticated" ON public.corebase_db_status FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_status deletable by authenticated" ON public.corebase_db_status FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for corebase_db_pensiun
CREATE POLICY "corebase_db_pensiun viewable by authenticated" ON public.corebase_db_pensiun FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_pensiun insertable by authenticated" ON public.corebase_db_pensiun FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_pensiun updatable by authenticated" ON public.corebase_db_pensiun FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_pensiun deletable by authenticated" ON public.corebase_db_pensiun FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for corebase_db_rekam_jejak
CREATE POLICY "corebase_db_rekam_jejak viewable by authenticated" ON public.corebase_db_rekam_jejak FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_rekam_jejak insertable by authenticated" ON public.corebase_db_rekam_jejak FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_rekam_jejak updatable by authenticated" ON public.corebase_db_rekam_jejak FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "corebase_db_rekam_jejak deletable by authenticated" ON public.corebase_db_rekam_jejak FOR DELETE USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE TRIGGER update_corebase_db_pokok_updated_at BEFORE UPDATE ON public.corebase_db_pokok FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corebase_db_status_updated_at BEFORE UPDATE ON public.corebase_db_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corebase_db_pensiun_updated_at BEFORE UPDATE ON public.corebase_db_pensiun FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corebase_db_rekam_jejak_updated_at BEFORE UPDATE ON public.corebase_db_rekam_jejak FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();