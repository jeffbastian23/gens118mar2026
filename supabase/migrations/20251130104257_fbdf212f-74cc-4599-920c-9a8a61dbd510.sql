-- Add missing columns to isi_berkas table
ALTER TABLE isi_berkas 
ADD COLUMN IF NOT EXISTS nomor_surat_naskah TEXT,
ADD COLUMN IF NOT EXISTS nama_pic TEXT,
ADD COLUMN IF NOT EXISTS klasifikasi_keamanan TEXT,
ADD COLUMN IF NOT EXISTS hak_akses TEXT,
ADD COLUMN IF NOT EXISTS usia_retensi TEXT DEFAULT '5 tahun',
ADD COLUMN IF NOT EXISTS dimusnahkan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status_dokumen TEXT DEFAULT 'Aktif';

-- Add jenis_arsip column to daftar_berkas table
ALTER TABLE daftar_berkas 
ADD COLUMN IF NOT EXISTS jenis_arsip TEXT DEFAULT 'Arsip Umum';

-- Add isi_berkas_id to peminjaman_arsip for synchronization
ALTER TABLE peminjaman_arsip
ADD COLUMN IF NOT EXISTS isi_berkas_id UUID REFERENCES isi_berkas(id);

COMMENT ON COLUMN isi_berkas.nomor_surat_naskah IS 'Nomor surat atau naskah dinas';
COMMENT ON COLUMN isi_berkas.nama_pic IS 'Nama Person In Charge (PIC)';
COMMENT ON COLUMN isi_berkas.klasifikasi_keamanan IS 'Klasifikasi keamanan dokumen (Terbuka/Rahasia/Sangat Rahasia)';
COMMENT ON COLUMN isi_berkas.hak_akses IS 'Hak akses dokumen (Public/Internal/Restricted)';
COMMENT ON COLUMN isi_berkas.usia_retensi IS 'Usia retensi dokumen dalam tahun';
COMMENT ON COLUMN isi_berkas.dimusnahkan IS 'Status apakah dokumen sudah dimusnahkan';
COMMENT ON COLUMN daftar_berkas.jenis_arsip IS 'Jenis arsip: Arsip Umum atau Arsip Vital';