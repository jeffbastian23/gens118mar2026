-- Create table for monitoring penilaian perilaku
CREATE TABLE public.monitoring_penilaian_perilaku (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  status_pengajuan TEXT DEFAULT 'Belum Mengajukan',
  status_penetapan TEXT DEFAULT 'Belum Ditetapkan',
  status_penilaian TEXT DEFAULT 'Menilai 0 dari 0',
  created_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.monitoring_penilaian_perilaku ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view monitoring_penilaian_perilaku" 
ON public.monitoring_penilaian_perilaku 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert monitoring_penilaian_perilaku" 
ON public.monitoring_penilaian_perilaku 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update monitoring_penilaian_perilaku" 
ON public.monitoring_penilaian_perilaku 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete monitoring_penilaian_perilaku" 
ON public.monitoring_penilaian_perilaku 
FOR DELETE 
USING (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_monitoring_penilaian_perilaku_updated_at
BEFORE UPDATE ON public.monitoring_penilaian_perilaku
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();