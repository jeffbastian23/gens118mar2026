-- Add pendidikan_awal column to grading_big_data table
ALTER TABLE public.grading_big_data 
ADD COLUMN IF NOT EXISTS pendidikan_awal TEXT;