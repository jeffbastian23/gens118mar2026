-- Add kontak (phone) column to employees table for Japri Teman feature
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS kontak text;

-- Add email column to employees table for Japri Teman feature
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS email text;