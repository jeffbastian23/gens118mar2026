-- Create rundown table for agenda rundown
CREATE TABLE public.rundown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  judul TEXT NOT NULL,
  tanggal_kegiatan DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Create rundown_items table for individual rundown entries
CREATE TABLE public.rundown_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rundown_id UUID NOT NULL REFERENCES public.rundown(id) ON DELETE CASCADE,
  no_urut INTEGER NOT NULL DEFAULT 1,
  mulai TEXT,
  akhir TEXT,
  durasi TEXT,
  kegiatan TEXT NOT NULL,
  uraian TEXT,
  pic_ids TEXT[] DEFAULT '{}',
  pic_names TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rundown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rundown_items ENABLE ROW LEVEL SECURITY;

-- Create policies for rundown
CREATE POLICY "Anyone can view rundown" ON public.rundown FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert rundown" ON public.rundown FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update rundown" ON public.rundown FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete rundown" ON public.rundown FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create policies for rundown_items
CREATE POLICY "Anyone can view rundown_items" ON public.rundown_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert rundown_items" ON public.rundown_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update rundown_items" ON public.rundown_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete rundown_items" ON public.rundown_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create indexes
CREATE INDEX idx_rundown_items_rundown_id ON public.rundown_items(rundown_id);
CREATE INDEX idx_rundown_tanggal ON public.rundown(tanggal_kegiatan);