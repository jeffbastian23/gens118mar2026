-- Create kunjungan_tamu (visitor management) table
CREATE TABLE public.kunjungan_tamu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_tamu text NOT NULL,
  instansi text,
  no_identitas text,
  no_telepon text,
  keperluan text NOT NULL,
  tujuan_bagian text[] NOT NULL DEFAULT '{}',
  foto_tamu text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kunjungan_tamu ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view kunjungan_tamu" ON public.kunjungan_tamu
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert kunjungan_tamu" ON public.kunjungan_tamu
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update kunjungan_tamu" ON public.kunjungan_tamu
FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete kunjungan_tamu" ON public.kunjungan_tamu
FOR DELETE USING (true);

-- Create surat_masuk (incoming mail) table
CREATE TABLE public.surat_masuk (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_agenda serial NOT NULL,
  nomor_dokumen text NOT NULL,
  hal text NOT NULL,
  tujuan_bagian text[] NOT NULL DEFAULT '{}',
  nama_pengirim text NOT NULL,
  instansi_pengirim text,
  nama_penerima text NOT NULL,
  petugas_bc_penerima text NOT NULL,
  foto_penerima text,
  tanggal_terima timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surat_masuk ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for surat_masuk
CREATE POLICY "Authenticated users can view surat_masuk" ON public.surat_masuk
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert surat_masuk" ON public.surat_masuk
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update surat_masuk" ON public.surat_masuk
FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete surat_masuk" ON public.surat_masuk
FOR DELETE USING (true);

-- Create buku_bambu (document tracking) table
CREATE TABLE public.buku_bambu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_masuk_id uuid REFERENCES public.surat_masuk(id) ON DELETE CASCADE,
  dari_unit text NOT NULL,
  ke_unit text NOT NULL,
  nama_penerima text NOT NULL,
  tanggal_kirim timestamp with time zone NOT NULL DEFAULT now(),
  catatan text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buku_bambu ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for buku_bambu
CREATE POLICY "Authenticated users can view buku_bambu" ON public.buku_bambu
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert buku_bambu" ON public.buku_bambu
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update buku_bambu" ON public.buku_bambu
FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete buku_bambu" ON public.buku_bambu
FOR DELETE USING (true);

-- Add new fields to agenda table for the enhanced agenda feature
ALTER TABLE public.agenda ADD COLUMN IF NOT EXISTS nomor_surat text;
ALTER TABLE public.agenda ADD COLUMN IF NOT EXISTS hal text;
ALTER TABLE public.agenda ADD COLUMN IF NOT EXISTS lokasi text;
ALTER TABLE public.agenda ADD COLUMN IF NOT EXISTS konfirmasi text DEFAULT 'Belum Dispo';
ALTER TABLE public.agenda ADD COLUMN IF NOT EXISTS tujuan_dispo text[] DEFAULT '{}';

-- Create updated_at triggers
CREATE OR REPLACE TRIGGER update_kunjungan_tamu_updated_at
BEFORE UPDATE ON public.kunjungan_tamu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_surat_masuk_updated_at
BEFORE UPDATE ON public.surat_masuk
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_buku_bambu_updated_at
BEFORE UPDATE ON public.buku_bambu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();