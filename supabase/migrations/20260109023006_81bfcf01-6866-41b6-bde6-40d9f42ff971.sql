-- Add jabatan_kategori column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS jabatan_kategori TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.jabatan_kategori IS 'Kategori jabatan pegawai: Eselon II, Eselon III, Eselon IV, PBC Madya, PBC Muda, PBC Pertama, PBC Pelaksana Lanjutan, PBC Pelaksana, Pranata Keuangan APBN, Pelaksana Pemeriksa, Pelaksana Administrasi';