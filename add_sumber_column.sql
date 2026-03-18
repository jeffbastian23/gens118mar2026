-- Add sumber column to assignments table
-- Run this SQL in your Supabase SQL Editor to add the new "sumber" field

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS sumber TEXT;

-- Add comment to column
COMMENT ON COLUMN assignments.sumber IS 'Sumber dana penugasan: DIPA, DBHCHT, DOKPPN, atau Kontak Pengadaan';
