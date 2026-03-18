-- Create table for manual attendance records
CREATE TABLE public.absen_manual (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kegiatan TEXT NOT NULL,
  tanggal DATE NOT NULL,
  tempat TEXT NOT NULL,
  jumlah_page INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.absen_manual ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view absen_manual" 
ON public.absen_manual 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert absen_manual" 
ON public.absen_manual 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update absen_manual" 
ON public.absen_manual 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete absen_manual" 
ON public.absen_manual 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_absen_manual_updated_at
BEFORE UPDATE ON public.absen_manual
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();