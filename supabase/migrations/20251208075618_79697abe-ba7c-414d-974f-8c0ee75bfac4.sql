-- Add new columns to profiles for user avatar and status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS user_status text DEFAULT 'available';

-- Add new columns to book_nomor_manual for approval system and perihal structure
ALTER TABLE public.book_nomor_manual 
ADD COLUMN IF NOT EXISTS jenis_perihal text,
ADD COLUMN IF NOT EXISTS nominal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS status_approval text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approved_by text;

-- Add verifikasi_keuangan columns to assignments
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_by text,
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_status text DEFAULT 'pending';

-- Add verifikasi_keuangan columns to plh_kepala for consistency
ALTER TABLE public.plh_kepala 
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_by text,
ADD COLUMN IF NOT EXISTS verifikasi_keuangan_status text DEFAULT 'pending';