-- Script to set up budget tracking tables and fix assignment columns
-- Run this in your Lovable Cloud SQL Editor (Cloud tab > Database)

-- First, ensure the date range columns exist in assignments table
ALTER TABLE IF EXISTS public.assignments 
ADD COLUMN IF NOT EXISTS tanggal_mulai_kegiatan TEXT,
ADD COLUMN IF NOT EXISTS tanggal_selesai_kegiatan TEXT;

-- Update any NULL values to use the legacy date field
UPDATE public.assignments 
SET 
  tanggal_mulai_kegiatan = COALESCE(tanggal_mulai_kegiatan, hari_tanggal_kegiatan),
  tanggal_selesai_kegiatan = COALESCE(tanggal_selesai_kegiatan, hari_tanggal_kegiatan)
WHERE tanggal_mulai_kegiatan IS NULL OR tanggal_selesai_kegiatan IS NULL;

-- Create city budgets table
CREATE TABLE IF NOT EXISTS public.city_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL UNIQUE,
  nominal_per_trip NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create budget configuration table
CREATE TABLE IF NOT EXISTS public.budget_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  total_budget NUMERIC NOT NULL DEFAULT 100000000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fiscal_year)
);

-- Insert default city budget data (sesuai permintaan)
INSERT INTO public.city_budgets (city_name, nominal_per_trip) VALUES
  ('Sidoarjo', 100000),
  ('Surabaya', 200000),
  ('Madiun', 300000),
  ('Malang', 300000),
  ('Pasuruan', 300000),
  ('Bojonegoro', 300000),
  ('Gresik', 300000),
  ('Lamongan', 300000),
  ('Madura', 300000)
ON CONFLICT (city_name) DO NOTHING;

-- Insert default budget configuration (Rp 100 juta dengan sisa Rp 5 juta akan dihitung otomatis)
INSERT INTO public.budget_config (fiscal_year, total_budget) VALUES
  (EXTRACT(YEAR FROM CURRENT_DATE), 100000000)
ON CONFLICT (fiscal_year) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.city_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_config ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read budget data
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read city budgets"
  ON public.city_budgets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to read budget config"
  ON public.budget_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for authenticated users to manage budget data
CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage city budgets"
  ON public.city_budgets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated users to manage budget config"
  ON public.budget_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Success message
SELECT 'Budget tracking tables created successfully! 🎉' as status;
