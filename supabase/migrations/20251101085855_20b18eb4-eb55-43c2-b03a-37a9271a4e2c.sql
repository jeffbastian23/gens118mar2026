-- Remove hari_tanggal_kegiatan column from assignments table
ALTER TABLE public.assignments DROP COLUMN IF EXISTS hari_tanggal_kegiatan;