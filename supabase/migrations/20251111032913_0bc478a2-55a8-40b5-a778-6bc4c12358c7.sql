-- Add new columns to assignments table for Sumber Satuan Kerja and Jenis Penugasan
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS sumber_satuan_kerja TEXT,
ADD COLUMN IF NOT EXISTS sumber_satuan_kerja_custom TEXT,
ADD COLUMN IF NOT EXISTS jenis_penugasan TEXT;

-- Add comments to columns for documentation
COMMENT ON COLUMN assignments.sumber_satuan_kerja IS 'Sumber satuan kerja penugasan (predefined options)';
COMMENT ON COLUMN assignments.sumber_satuan_kerja_custom IS 'Custom sumber satuan kerja jika tidak ada di options';
COMMENT ON COLUMN assignments.jenis_penugasan IS 'Jenis penugasan (e.g., Dinas Dalam, Dinas Luar, dll)';