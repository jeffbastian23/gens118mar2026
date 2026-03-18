-- Create daftar_berkas table
CREATE TABLE IF NOT EXISTS public.daftar_berkas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_berkas integer NOT NULL,
  kode_klasifikasi text NOT NULL,
  uraian_informasi_berkas text NOT NULL,
  kurun_waktu text NOT NULL,
  tingkat_perkembangan text NOT NULL,
  jumlah integer NOT NULL,
  lokasi text NOT NULL,
  pic text NOT NULL,
  keterangan text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create isi_berkas table
CREATE TABLE IF NOT EXISTS public.isi_berkas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut integer NOT NULL,
  no_berkas integer NOT NULL,
  kode_klasifikasi text NOT NULL,
  uraian_informasi_arsip text NOT NULL,
  kurun_waktu text NOT NULL,
  tingkat_perkembangan text NOT NULL,
  jumlah integer NOT NULL,
  keterangan text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daftar_berkas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isi_berkas ENABLE ROW LEVEL SECURITY;

-- Create policies for daftar_berkas
CREATE POLICY "Authenticated users can view daftar_berkas"
  ON public.daftar_berkas
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert daftar_berkas"
  ON public.daftar_berkas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daftar_berkas"
  ON public.daftar_berkas
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete daftar_berkas"
  ON public.daftar_berkas
  FOR DELETE
  USING (true);

-- Create policies for isi_berkas
CREATE POLICY "Authenticated users can view isi_berkas"
  ON public.isi_berkas
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert isi_berkas"
  ON public.isi_berkas
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update isi_berkas"
  ON public.isi_berkas
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete isi_berkas"
  ON public.isi_berkas
  FOR DELETE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_daftar_berkas_updated_at
  BEFORE UPDATE ON public.daftar_berkas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_isi_berkas_updated_at
  BEFORE UPDATE ON public.isi_berkas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();