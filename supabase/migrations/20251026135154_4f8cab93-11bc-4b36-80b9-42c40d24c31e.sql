-- Create assignments table for tracking employee assignments
CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  agenda_number integer NOT NULL,
  unit_pemohon text NOT NULL,
  unit_penerbit text NOT NULL,
  dasar_penugasan text NOT NULL,
  nomor_naskah_dinas text NOT NULL,
  tanggal_naskah date NOT NULL,
  perihal text NOT NULL,
  employee_ids uuid[] NOT NULL,
  tujuan text NOT NULL,
  hari_tanggal_kegiatan date NOT NULL,
  waktu_penugasan text NOT NULL,
  tempat_penugasan text NOT NULL,
  pejabat_penandatangan_id uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to assignments" 
ON public.assignments 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert assignments" 
ON public.assignments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update assignments" 
ON public.assignments 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete assignments" 
ON public.assignments 
FOR DELETE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_assignments_agenda_number ON public.assignments(agenda_number);
CREATE INDEX idx_assignments_created_at ON public.assignments(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create sequence for agenda numbers
CREATE SEQUENCE IF NOT EXISTS assignments_agenda_number_seq START 1;