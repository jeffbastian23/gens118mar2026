-- Add eselon_iii and eselon_iv columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS eselon_iii text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS eselon_iv text DEFAULT NULL;