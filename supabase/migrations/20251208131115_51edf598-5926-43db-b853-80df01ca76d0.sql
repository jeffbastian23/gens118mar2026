-- Add approved_by_name column to book_nomor_manual table
ALTER TABLE public.book_nomor_manual 
ADD COLUMN IF NOT EXISTS approved_by_name TEXT;