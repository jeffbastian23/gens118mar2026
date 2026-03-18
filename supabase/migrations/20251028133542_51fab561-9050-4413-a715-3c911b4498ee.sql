-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nm_pegawai TEXT NOT NULL,
  uraian_pangkat TEXT NOT NULL,
  uraian_jabatan TEXT NOT NULL,
  nm_unit_organisasi TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agenda_number INTEGER NOT NULL,
  unit_pemohon TEXT NOT NULL,
  unit_penerbit TEXT NOT NULL,
  dasar_penugasan TEXT NOT NULL,
  nomor_naskah_dinas TEXT NOT NULL,
  tanggal_naskah TEXT NOT NULL,
  perihal TEXT NOT NULL,
  employee_ids TEXT[] NOT NULL DEFAULT '{}',
  tujuan TEXT NOT NULL,
  hari_tanggal_kegiatan TEXT NOT NULL,
  waktu_penugasan TEXT NOT NULL,
  tempat_penugasan TEXT NOT NULL,
  pejabat_penandatangan_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees (public access for now)
CREATE POLICY "Employees are viewable by everyone" 
ON public.employees 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update employees" 
ON public.employees 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete employees" 
ON public.employees 
FOR DELETE 
USING (true);

-- Create RLS policies for assignments (public access for now)
CREATE POLICY "Assignments are viewable by everyone" 
ON public.assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create assignments" 
ON public.assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update assignments" 
ON public.assignments 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete assignments" 
ON public.assignments 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on assignments
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for assignments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;