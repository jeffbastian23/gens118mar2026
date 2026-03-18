-- Create table for Gudang Arsip Tegalsari
CREATE TABLE IF NOT EXISTS public.gudang_arsip_tegalsari (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_rak TEXT NOT NULL,
  jenis_rak TEXT NOT NULL,
  kapasitas_maksimal INTEGER NOT NULL,
  kapasitas_terpakai INTEGER NOT NULL DEFAULT 0,
  lokasi TEXT,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gudang_arsip_tegalsari ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view gudang_arsip_tegalsari" 
ON public.gudang_arsip_tegalsari 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert gudang_arsip_tegalsari" 
ON public.gudang_arsip_tegalsari 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gudang_arsip_tegalsari" 
ON public.gudang_arsip_tegalsari 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete gudang_arsip_tegalsari" 
ON public.gudang_arsip_tegalsari 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_gudang_arsip_tegalsari_updated_at
BEFORE UPDATE ON public.gudang_arsip_tegalsari
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add nama_peminjam and foto_peminjam columns to peminjaman_arsip table
ALTER TABLE public.peminjaman_arsip 
ADD COLUMN IF NOT EXISTS nama_peminjam TEXT,
ADD COLUMN IF NOT EXISTS foto_peminjam TEXT;

-- Add dokumen_scan column to isi_berkas table for uploaded scanned documents
ALTER TABLE public.isi_berkas 
ADD COLUMN IF NOT EXISTS dokumen_scan TEXT;