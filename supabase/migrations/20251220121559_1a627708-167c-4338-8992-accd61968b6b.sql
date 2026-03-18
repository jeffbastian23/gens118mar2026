-- Create monitor_pbdk table for PBDK (Perubahan Berkas Data Kepegawaian) monitoring
CREATE TABLE public.monitor_pbdk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut SERIAL,
  employee_id UUID REFERENCES public.employees(id),
  nama_pegawai TEXT NOT NULL,
  nip TEXT,
  uraian_jabatan TEXT,
  jabatan TEXT,
  jenis_perubahan_data TEXT NOT NULL CHECK (jenis_perubahan_data IN ('Keluarga Tertanggung', 'KGB', 'Pangkat', 'Pendidikan')),
  detail_data TEXT,
  status_hris TEXT NOT NULL DEFAULT 'Belum' CHECK (status_hris IN ('Sudah', 'Belum')),
  tanggal_input_hris DATE,
  status_pbdk TEXT NOT NULL DEFAULT 'Belum' CHECK (status_pbdk IN ('Sudah', 'Belum')),
  tanggal_pbdk DATE,
  nama_petugas TEXT,
  petugas_id UUID REFERENCES public.tim_upk(id),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.monitor_pbdk ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view monitor_pbdk"
ON public.monitor_pbdk
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert monitor_pbdk"
ON public.monitor_pbdk
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update monitor_pbdk"
ON public.monitor_pbdk
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete monitor_pbdk"
ON public.monitor_pbdk
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_monitor_pbdk_updated_at
BEFORE UPDATE ON public.monitor_pbdk
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_monitor_pbdk_employee_id ON public.monitor_pbdk(employee_id);
CREATE INDEX idx_monitor_pbdk_status_hris ON public.monitor_pbdk(status_hris);
CREATE INDEX idx_monitor_pbdk_status_pbdk ON public.monitor_pbdk(status_pbdk);
CREATE INDEX idx_monitor_pbdk_jenis_perubahan ON public.monitor_pbdk(jenis_perubahan_data);