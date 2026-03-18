-- Add created_by and updated_by email columns to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS created_by_email TEXT,
ADD COLUMN IF NOT EXISTS updated_by_email TEXT;