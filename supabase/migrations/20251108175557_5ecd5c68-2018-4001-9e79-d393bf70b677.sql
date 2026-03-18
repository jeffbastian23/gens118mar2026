-- Create absensi table for attendance records
CREATE TABLE public.absensi (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama text NOT NULL,
  nip text NOT NULL,
  tanggal date NOT NULL,
  jam_masuk time,
  jam_pulang time,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.absensi ENABLE ROW LEVEL SECURITY;

-- Create policies for absensi table
CREATE POLICY "Allow public read access to absensi"
  ON public.absensi
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert absensi"
  ON public.absensi
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update absensi"
  ON public.absensi
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete absensi"
  ON public.absensi
  FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_absensi_nip ON public.absensi(nip);
CREATE INDEX idx_absensi_tanggal ON public.absensi(tanggal);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_absensi_updated_at
  BEFORE UPDATE ON public.absensi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();