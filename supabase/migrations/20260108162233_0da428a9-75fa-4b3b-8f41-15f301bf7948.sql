-- Add new columns to kunjungan_tamu table
ALTER TABLE public.kunjungan_tamu 
ADD COLUMN IF NOT EXISTS pilihan_kantor TEXT DEFAULT 'Kanwil DJBC Jawa Timur I',
ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT,
ADD COLUMN IF NOT EXISTS status_janji TEXT DEFAULT 'Belum',
ADD COLUMN IF NOT EXISTS jumlah_tamu INTEGER DEFAULT 1;

-- Rename instansi to nama_perusahaan is not needed as we keep the same column and just change the label