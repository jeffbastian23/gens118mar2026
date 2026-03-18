-- Add keputusan column to grading_big_data table
ALTER TABLE public.grading_big_data 
ADD COLUMN IF NOT EXISTS keputusan text;