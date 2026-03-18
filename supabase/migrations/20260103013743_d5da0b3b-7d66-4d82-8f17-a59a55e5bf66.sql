-- Fix rating constraint to allow values 1-5 instead of 1-4
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_rating_penilaian_check;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_rating_penilaian_check CHECK (rating_penilaian >= 1 AND rating_penilaian <= 5);