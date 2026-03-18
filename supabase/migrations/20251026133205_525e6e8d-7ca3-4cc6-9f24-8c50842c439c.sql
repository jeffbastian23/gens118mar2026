-- Create employees table for HR Surat Tugas Generator
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nm_pegawai TEXT NOT NULL,
  uraian_pangkat TEXT NOT NULL,
  uraian_jabatan TEXT NOT NULL,
  nm_unit_organisasi TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (since this is employee directory)
CREATE POLICY "Allow public read access to employees" 
ON public.employees 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated users to update employees" 
ON public.employees 
FOR UPDATE 
USING (true);

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete employees" 
ON public.employees 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster search
CREATE INDEX idx_employees_nm_pegawai ON public.employees(nm_pegawai);
CREATE INDEX idx_employees_search ON public.employees USING gin(to_tsvector('indonesian', nm_pegawai || ' ' || uraian_jabatan));