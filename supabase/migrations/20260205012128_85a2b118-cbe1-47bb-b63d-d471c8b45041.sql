-- Create new table for Pegawai & Atasan
CREATE TABLE public.pegawai_atasan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut SERIAL,
  nama VARCHAR(255) NOT NULL,
  nip VARCHAR(50),
  jabatan VARCHAR(255),
  eselon_iii VARCHAR(255),
  eselon_iv VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email VARCHAR(255)
);

-- Enable RLS
ALTER TABLE public.pegawai_atasan ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all pegawai_atasan"
ON public.pegawai_atasan
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert pegawai_atasan"
ON public.pegawai_atasan
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update pegawai_atasan"
ON public.pegawai_atasan
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Users can delete pegawai_atasan"
ON public.pegawai_atasan
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_pegawai_atasan_updated_at
BEFORE UPDATE ON public.pegawai_atasan
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();