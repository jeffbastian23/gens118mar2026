-- Create monev_rekap_grading table for the new data section in Monev sub-menu
CREATE TABLE public.monev_rekap_grading (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut SERIAL,
  nama TEXT NOT NULL,
  nip TEXT,
  pendidikan TEXT,
  golongan TEXT,
  riwayat_jabatan_hris TEXT,
  jabatan_riwayat_grading TEXT,
  eselon_ii TEXT,
  eselon_iii TEXT,
  eselon_iv TEXT,
  peringkat_jabatan TEXT,
  peringkat_grading TEXT,
  keterangan TEXT,
  konfirmasi_unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.monev_rekap_grading ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read monev_rekap_grading"
ON public.monev_rekap_grading
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert monev_rekap_grading"
ON public.monev_rekap_grading
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update monev_rekap_grading"
ON public.monev_rekap_grading
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete monev_rekap_grading"
ON public.monev_rekap_grading
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_monev_rekap_grading_updated_at
BEFORE UPDATE ON public.monev_rekap_grading
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();