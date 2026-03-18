-- Create quotes table for login page quotes
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  display_order INT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for quotes
CREATE POLICY "Anyone can view active quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update quotes" ON public.quotes FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete quotes" ON public.quotes FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create quote_settings table for auto mode toggle
CREATE TABLE public.quote_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_mode BOOLEAN DEFAULT true,
  rotation_interval_seconds INT DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.quote_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for quote_settings
CREATE POLICY "Anyone can view quote settings" ON public.quote_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update quote settings" ON public.quote_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert quote settings" ON public.quote_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default settings
INSERT INTO public.quote_settings (auto_mode, rotation_interval_seconds) VALUES (true, 10);

-- Insert the existing quote
INSERT INTO public.quotes (quote_text, is_active, display_order) VALUES ('One for all, a trusted voice in every decision', true, 1);

-- Create eselonisasi table for organizational hierarchy
CREATE TABLE public.eselonisasi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_unit TEXT NOT NULL,
  tingkat_eselon TEXT NOT NULL, -- 'eselon_2', 'eselon_3', 'eselon_4'
  parent_id UUID REFERENCES public.eselonisasi(id) ON DELETE SET NULL,
  kode_unit TEXT,
  no_urut INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable RLS
ALTER TABLE public.eselonisasi ENABLE ROW LEVEL SECURITY;

-- Create policies for eselonisasi
CREATE POLICY "Anyone can view eselonisasi" ON public.eselonisasi FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert eselonisasi" ON public.eselonisasi FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update eselonisasi" ON public.eselonisasi FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete eselonisasi" ON public.eselonisasi FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert default organizational structure
INSERT INTO public.eselonisasi (id, nama_unit, tingkat_eselon, parent_id, no_urut) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Kantor Wilayah Direktorat Jenderal Bea dan Cukai Jawa Timur I', 'eselon_2', NULL, 1);

INSERT INTO public.eselonisasi (id, nama_unit, tingkat_eselon, parent_id, no_urut) 
VALUES ('22222222-2222-2222-2222-222222222222', 'Bagian Umum', 'eselon_3', '11111111-1111-1111-1111-111111111111', 1);

INSERT INTO public.eselonisasi (id, nama_unit, tingkat_eselon, parent_id, no_urut) 
VALUES ('33333333-3333-3333-3333-333333333333', 'Subbagian Kepegawaian', 'eselon_4', '22222222-2222-2222-2222-222222222222', 1);