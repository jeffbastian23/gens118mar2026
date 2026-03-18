-- Create peminjaman_arsip table
CREATE TABLE IF NOT EXISTS public.peminjaman_arsip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_urut INTEGER NOT NULL,
  nama_dokumen TEXT NOT NULL,
  kode_klasifikasi TEXT NOT NULL,
  nomor_boks TEXT NOT NULL,
  tahun_dokumen TEXT NOT NULL,
  pemilik_dokumen TEXT NOT NULL CHECK (pemilik_dokumen IN ('Umum', 'Pabean', 'KI', 'P2', 'Fasilitas', 'KC', 'Audit', 'Keban')),
  no_rak TEXT NOT NULL,
  sub_rak TEXT NOT NULL,
  susun TEXT NOT NULL,
  baris TEXT NOT NULL,
  status_dokumen TEXT NOT NULL DEFAULT 'Aktif' CHECK (status_dokumen IN ('Aktif', 'Inaktif')),
  keperluan TEXT NOT NULL,
  tanggal_peminjaman TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status_pengembalian BOOLEAN NOT NULL DEFAULT FALSE,
  tanggal_pengembalian TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.peminjaman_arsip ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view peminjaman_arsip"
ON public.peminjaman_arsip FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert peminjaman_arsip"
ON public.peminjaman_arsip FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update peminjaman_arsip"
ON public.peminjaman_arsip FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete peminjaman_arsip"
ON public.peminjaman_arsip FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_peminjaman_arsip_updated_at
BEFORE UPDATE ON public.peminjaman_arsip
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();