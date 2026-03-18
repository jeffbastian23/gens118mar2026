
CREATE TABLE public.audit_penugasan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no SERIAL,
  npwp TEXT,
  nama_perusahaan TEXT,
  bentuk_kantor TEXT,
  alamat TEXT,
  fasilitas TEXT,
  npa TEXT,
  tanggal_awal_periode TEXT,
  tanggal_akhir_periode TEXT,
  tanggal_awal_peklap TEXT,
  tanggal_akhir_peklap TEXT,
  nama_pma TEXT,
  pangkat_gol_pma TEXT,
  jabatan_pma TEXT,
  nama_pta TEXT,
  pangkat_gol_pta TEXT,
  jabatan_pta TEXT,
  nama_katim TEXT,
  pangkat_gol_katim TEXT,
  jabatan_katim TEXT,
  nama_a1 TEXT,
  pangkat_gol_a1 TEXT,
  jabatan_a1 TEXT,
  nama_a2 TEXT,
  pangkat_gol_a2 TEXT,
  jabatan_a2 TEXT,
  nama_a3 TEXT,
  pangkat_gol_a3 TEXT,
  jabatan_a3 TEXT,
  no_st_induk TEXT,
  tanggal_st_induk TEXT,
  tahap_pelaksanaan_st_ke TEXT,
  dipa TEXT,
  periode_ke TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

ALTER TABLE public.audit_penugasan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view audit_penugasan"
ON public.audit_penugasan FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert audit_penugasan"
ON public.audit_penugasan FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update audit_penugasan"
ON public.audit_penugasan FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete audit_penugasan"
ON public.audit_penugasan FOR DELETE
USING (auth.role() = 'authenticated');
