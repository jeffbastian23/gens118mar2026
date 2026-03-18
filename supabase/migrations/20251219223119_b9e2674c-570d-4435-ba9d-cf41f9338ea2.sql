-- Create rumah_negara table for State Housing management
CREATE TABLE public.rumah_negara (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tanah_nup TEXT,
  kode_barang_rn TEXT,
  kode TEXT,
  nama_rumah TEXT,
  tipe_rn TEXT,
  kondisi TEXT,
  kep_psg TEXT,
  alamat TEXT,
  kelurahan TEXT,
  status_bersertifikat TEXT,
  penghuni TEXT,
  nama_penghuni_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  jabatan TEXT,
  unit_organisasi TEXT,
  golongan_tipe_kelas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rumah_negara ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to view rumah_negara"
ON public.rumah_negara
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert rumah_negara"
ON public.rumah_negara
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update rumah_negara"
ON public.rumah_negara
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete rumah_negara"
ON public.rumah_negara
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rumah_negara_updated_at
BEFORE UPDATE ON public.rumah_negara
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();