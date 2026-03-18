-- Ensure tanggal_mulai_kegiatan and tanggal_selesai_kegiatan columns exist in assignments table
-- This migration is safe to run even if columns already exist

DO $$ 
BEGIN
  -- Add tanggal_mulai_kegiatan if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assignments' 
    AND column_name = 'tanggal_mulai_kegiatan'
  ) THEN
    ALTER TABLE public.assignments 
    ADD COLUMN tanggal_mulai_kegiatan TEXT;
  END IF;

  -- Add tanggal_selesai_kegiatan if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assignments' 
    AND column_name = 'tanggal_selesai_kegiatan'
  ) THEN
    ALTER TABLE public.assignments 
    ADD COLUMN tanggal_selesai_kegiatan TEXT;
  END IF;
END $$;