-- Add 'overview' role to app_role enum
-- This value will be available after the migration commits
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'overview';