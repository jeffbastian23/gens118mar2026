-- Create table for satker cortax data
CREATE TABLE public.satker_cortax (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  satuan_kerja TEXT NOT NULL,
  total_pegawai INTEGER NOT NULL DEFAULT 0,
  sudah_aktivasi INTEGER NOT NULL DEFAULT 0,
  belum_aktivasi INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.satker_cortax ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view satker_cortax" 
ON public.satker_cortax 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert satker_cortax" 
ON public.satker_cortax 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update satker_cortax" 
ON public.satker_cortax 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete satker_cortax" 
ON public.satker_cortax 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_satker_cortax_updated_at
BEFORE UPDATE ON public.satker_cortax
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();