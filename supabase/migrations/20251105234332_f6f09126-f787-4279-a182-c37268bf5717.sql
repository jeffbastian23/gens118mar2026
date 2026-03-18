-- Create cuti table for leave data
CREATE TABLE IF NOT EXISTS public.cuti (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nip text NOT NULL,
  nama_pegawai text NOT NULL,
  pangkat_pegawai text,
  jabatan_pegawai text,
  jenis_cuti text NOT NULL,
  tgl_awal date NOT NULL,
  tgl_akhir date NOT NULL,
  tahun_cuti integer NOT NULL,
  lama_cuti numeric NOT NULL,
  cuti_setengah text,
  alasan text,
  flag_cuti_tambahan boolean DEFAULT false,
  tgl_awal_tambahan date,
  tgl_akhir_tambahan date,
  proses text,
  status text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cuti ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read cuti data
CREATE POLICY "Allow public read access to cuti"
  ON public.cuti
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert cuti data
CREATE POLICY "Allow authenticated users to insert cuti"
  ON public.cuti
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update cuti data
CREATE POLICY "Allow authenticated users to update cuti"
  ON public.cuti
  FOR UPDATE
  USING (true);

-- Allow authenticated users to delete cuti data
CREATE POLICY "Allow authenticated users to delete cuti"
  ON public.cuti
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cuti_updated_at
  BEFORE UPDATE ON public.cuti
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_cuti_nip ON public.cuti(nip);
CREATE INDEX idx_cuti_nama_pegawai ON public.cuti(nama_pegawai);
CREATE INDEX idx_cuti_jenis_cuti ON public.cuti(jenis_cuti);
CREATE INDEX idx_cuti_tahun_cuti ON public.cuti(tahun_cuti);
CREATE INDEX idx_cuti_status ON public.cuti(status);