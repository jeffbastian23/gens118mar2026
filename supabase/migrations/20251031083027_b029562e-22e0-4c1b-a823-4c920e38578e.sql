-- 1. Add new column for detailed location above city
ALTER TABLE assignments 
ADD COLUMN lokasi_penugasan_detail TEXT;

-- 2. Rename pejabat_penandatangan_id to pejabat_unit_pemohon_id
ALTER TABLE assignments 
RENAME COLUMN pejabat_penandatangan_id TO pejabat_unit_pemohon_id;

-- 3. Add new column for pejabat unit penerbit
ALTER TABLE assignments 
ADD COLUMN pejabat_unit_penerbit_id UUID NOT NULL DEFAULT gen_random_uuid();

-- 4. Update comment for better understanding
COMMENT ON COLUMN assignments.pejabat_unit_pemohon_id IS 'Pejabat yang menandatangani dari unit pemohon';
COMMENT ON COLUMN assignments.pejabat_unit_penerbit_id IS 'Pejabat yang menandatangani dari unit penerbit';
COMMENT ON COLUMN assignments.lokasi_penugasan_detail IS 'Detail lokasi penugasan (alamat lengkap, gedung, dll)';
COMMENT ON COLUMN assignments.tempat_penugasan IS 'Kota/Kabupaten tempat penugasan';