-- Add satker column to rekap_realisasi_perjadin table
ALTER TABLE public.rekap_realisasi_perjadin 
ADD COLUMN satker text[] DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN public.rekap_realisasi_perjadin.satker IS 'Array of satker units: Bagian Umum, Bidang Kepabeanan dan Cukai, Bidang Penindakan dan Penyidikan, Bidang Kepatuhan Internal, Bidang Fasilitas Kepabeanan dan Cukai, Sub Unsur Keberatan dan Banding, Sub Unsur Audit Kepabeanan dan Cukai';