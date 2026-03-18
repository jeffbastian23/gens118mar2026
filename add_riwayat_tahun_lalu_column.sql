-- Add riwayat_tahun_lalu column to grading_big_data table
-- This column stores the previous year's grading result: Naik/Turun/Tetap

ALTER TABLE grading_big_data 
ADD COLUMN IF NOT EXISTS riwayat_tahun_lalu TEXT;

-- Comment for documentation
COMMENT ON COLUMN grading_big_data.riwayat_tahun_lalu IS 'Riwayat tahun lalu: Naik, Turun, atau Tetap';
