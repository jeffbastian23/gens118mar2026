-- Add konsep_path column to assignments table for storing uploaded konsep documents (Excel/Word)
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS konsep_path TEXT;