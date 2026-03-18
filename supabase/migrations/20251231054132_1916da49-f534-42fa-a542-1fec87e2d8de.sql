-- Add new columns to grading_kelengkapan_simulasi for comprehensive simulation data
ALTER TABLE public.grading_kelengkapan_simulasi 
ADD COLUMN IF NOT EXISTS unit_organisasi TEXT,
ADD COLUMN IF NOT EXISTS isian_tabel JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS grade_awal INTEGER,
ADD COLUMN IF NOT EXISTS batas_peringkat_tertinggi INTEGER,
ADD COLUMN IF NOT EXISTS rekomendasi_grade INTEGER,
ADD COLUMN IF NOT EXISTS nomenklatur_jabatan TEXT,
ADD COLUMN IF NOT EXISTS lokasi TEXT,
ADD COLUMN IF NOT EXISTS tanggal DATE,
ADD COLUMN IF NOT EXISTS jabatan_atasan_langsung TEXT,
ADD COLUMN IF NOT EXISTS nama_atasan_langsung TEXT,
ADD COLUMN IF NOT EXISTS nip_atasan_langsung TEXT,
ADD COLUMN IF NOT EXISTS jabatan_unit_kepegawaian TEXT,
ADD COLUMN IF NOT EXISTS nama_pejabat_kepegawaian TEXT,
ADD COLUMN IF NOT EXISTS nip_pejabat_kepegawaian TEXT,
ADD COLUMN IF NOT EXISTS no_urut INTEGER;