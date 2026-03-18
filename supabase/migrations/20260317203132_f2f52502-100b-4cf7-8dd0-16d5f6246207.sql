CREATE TABLE public.kenaikan_pangkat_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_pegawai TEXT NOT NULL,
  uraian_pangkat TEXT,
  nip TEXT,
  unit TEXT,
  jenis TEXT,
  tmt_pangkat TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kenaikan_pangkat_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read kenaikan_pangkat_data"
ON public.kenaikan_pangkat_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert kenaikan_pangkat_data"
ON public.kenaikan_pangkat_data FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete kenaikan_pangkat_data"
ON public.kenaikan_pangkat_data FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update kenaikan_pangkat_data"
ON public.kenaikan_pangkat_data FOR UPDATE TO authenticated USING (true) WITH CHECK (true);