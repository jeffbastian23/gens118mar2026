-- Add pdf_dokumen column to surat_masuk table
ALTER TABLE surat_masuk ADD COLUMN IF NOT EXISTS pdf_dokumen TEXT;

-- Add pdf_dokumen column to buku_bambu table
ALTER TABLE buku_bambu ADD COLUMN IF NOT EXISTS pdf_dokumen TEXT;

-- Add comment for documentation
COMMENT ON COLUMN surat_masuk.pdf_dokumen IS 'Base64 encoded PDF document or PDF data URL';
COMMENT ON COLUMN buku_bambu.pdf_dokumen IS 'Base64 encoded PDF document or PDF data URL';
