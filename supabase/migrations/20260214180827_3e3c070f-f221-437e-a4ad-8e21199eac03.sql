
CREATE TABLE public.japri_teman_existing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  nip TEXT,
  nama_lengkap TEXT NOT NULL,
  agama TEXT,
  jabatan TEXT,
  eselon_iii TEXT,
  domain_kemenkeu TEXT,
  kontak TEXT,
  check_wag_kanwil TEXT,
  check_wa_info TEXT,
  check_wa_bintal TEXT,
  check_teams_kanwil TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.japri_teman_existing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read japri_teman_existing"
  ON public.japri_teman_existing FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to insert japri_teman_existing"
  ON public.japri_teman_existing FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update japri_teman_existing"
  ON public.japri_teman_existing FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to delete japri_teman_existing"
  ON public.japri_teman_existing FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_japri_teman_existing_updated_at
  BEFORE UPDATE ON public.japri_teman_existing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
