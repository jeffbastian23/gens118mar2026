
-- Create table for Karis/Karsu data
CREATE TABLE public.karis_karsu (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no SERIAL,
  nama TEXT NOT NULL,
  nip TEXT NOT NULL,
  satuan_kerja TEXT NOT NULL,
  nama_pasangan TEXT,
  nomor_nd_pengajuan TEXT,
  tanggal_pengajuan DATE,
  tanggal_input_si_asn DATE,
  tanggal_karis_karsu_terbit DATE,
  pic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.karis_karsu ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything on karis_karsu"
ON public.karis_karsu
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view
CREATE POLICY "Users can view karis_karsu"
ON public.karis_karsu
FOR SELECT
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_karis_karsu_updated_at
BEFORE UPDATE ON public.karis_karsu
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
