-- Tambah kolom eselon_iii dan eselon_iv ke tabel employees untuk auto-fill di Big Data Grading
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS eselon_iii TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS eselon_iv TEXT;

-- Tambah index untuk lookup yang lebih cepat
CREATE INDEX IF NOT EXISTS idx_employees_nip ON public.employees(nip);

-- Add comment untuk dokumentasi
COMMENT ON COLUMN public.employees.eselon_iii IS 'Unit Eselon III (Bidang/Bagian) tempat pegawai bertugas';
COMMENT ON COLUMN public.employees.eselon_iv IS 'Unit Eselon IV (Seksi/Subbagian) tempat pegawai bertugas';