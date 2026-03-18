-- Add jenis_kelamin column to pensiun table
ALTER TABLE public.pensiun 
ADD COLUMN IF NOT EXISTS jenis_kelamin TEXT;