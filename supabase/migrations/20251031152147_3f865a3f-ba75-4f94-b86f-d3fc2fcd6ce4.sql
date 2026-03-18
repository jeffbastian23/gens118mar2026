-- Add sumber column to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS sumber text;