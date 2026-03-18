-- Add download status columns to assignments table
ALTER TABLE assignments 
ADD COLUMN nota_dinas_downloaded BOOLEAN DEFAULT FALSE,
ADD COLUMN surat_tugas_downloaded BOOLEAN DEFAULT FALSE,
ADD COLUMN nota_dinas_downloaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN surat_tugas_downloaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN nota_dinas_downloaded_by TEXT,
ADD COLUMN surat_tugas_downloaded_by TEXT;

-- Add comments for clarity
COMMENT ON COLUMN assignments.nota_dinas_downloaded IS 'Status apakah Nota Dinas sudah diunduh';
COMMENT ON COLUMN assignments.surat_tugas_downloaded IS 'Status apakah Surat Tugas sudah diunduh';
COMMENT ON COLUMN assignments.nota_dinas_downloaded_at IS 'Waktu Nota Dinas diunduh';
COMMENT ON COLUMN assignments.surat_tugas_downloaded_at IS 'Waktu Surat Tugas diunduh';
COMMENT ON COLUMN assignments.nota_dinas_downloaded_by IS 'Email user yang mengunduh Nota Dinas';
COMMENT ON COLUMN assignments.surat_tugas_downloaded_by IS 'Email user yang mengunduh Surat Tugas';