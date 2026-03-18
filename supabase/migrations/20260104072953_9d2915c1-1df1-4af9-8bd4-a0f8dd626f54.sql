-- Create mekanisme_54 table for storing Penetapan data
CREATE TABLE public.mekanisme_54 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_urut INTEGER,
  jenis_penetapan TEXT NOT NULL CHECK (jenis_penetapan IN ('Penetapan Pertama', 'Penetapan Kembali', 'Penetapan Simulasi', 'Penetapan Sidang')),
  sub_jenis TEXT NOT NULL CHECK (sub_jenis IN ('PU', 'PK', 'PTB')),
  kode_kategori TEXT,
  deskripsi TEXT NOT NULL,
  parent_kode TEXT,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_email TEXT
);

-- Enable Row Level Security
ALTER TABLE public.mekanisme_54 ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view mekanisme_54"
ON public.mekanisme_54
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert mekanisme_54"
ON public.mekanisme_54
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update mekanisme_54"
ON public.mekanisme_54
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete mekanisme_54"
ON public.mekanisme_54
FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_mekanisme_54_jenis ON public.mekanisme_54(jenis_penetapan);
CREATE INDEX idx_mekanisme_54_sub_jenis ON public.mekanisme_54(sub_jenis);

-- Insert initial data for Penetapan Kembali
-- PELAKSANA UMUM
INSERT INTO public.mekanisme_54 (jenis_penetapan, sub_jenis, kode_kategori, deskripsi, level) VALUES
('Penetapan Kembali', 'PU', '1.a', 'CPNS Pelaksana Umum yang diangkat menjadi PNS Pelaksana Umum', 1),
('Penetapan Kembali', 'PU', '1.b', 'Pelaksana Umum yang dimutasi menjadi Pelaksana Umum', 1),
('Penetapan Kembali', 'PU', '1.c', 'Pelaksana Umum yang aktif kembali bekerja di Kementerian Keuangan setelah selesai menjalani cuti di luar tanggungan negara, ditugaskan di luar Kementerian Keuangan, atau diberhentikan sementara dari jabatan PNS dan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Kembali', 'PU', '1.d', 'Pelaksana Umum yang ditugaskan pada jabatan selain Pelaksana Umum atau kembali dari penugasan tertentu dan sebelum ditetapkan kembali sebagai Pelaksana Umum, tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan', 1),
('Penetapan Kembali', 'PU', '1.d.1', 'Pelaksana Umum yang dimutasi menjadi Pelaksana Khusus dan sebelum ditetapkan kembali sebagai Pelaksana Umum, tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan', 2),
('Penetapan Kembali', 'PU', '1.d.2', 'Pelaksana Umum yang dimutasi menjadi Pelaksana Tertentu dan sebelum ditetapkan kembali sebagai Pelaksana Umum, tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan', 2),
('Penetapan Kembali', 'PU', '1.e', 'Pelaksana Tugas Belajar kembali aktif menjadi Pelaksana Umum', 1),

-- PELAKSANA KHUSUS Kembali
('Penetapan Kembali', 'PK', '2.a', 'Pelaksana Khusus yang dimutasi kembali sebagai Pelaksana Khusus pada tugas jabatan lain/unit kerja terkecil lain atau diangkat menjadi PNS', 1),
('Penetapan Kembali', 'PK', '2.b', 'Pelaksana Khusus yang dimutasi ke dalam jabatan Pelaksana lain kemudian dimutasi kembali sebagai Pelaksana Khusus', 1),
('Penetapan Kembali', 'PK', '2.b.1', 'Pelaksana Khusus yang dimutasi sebagai Pelaksana Umum yang kemudian dimutasi kembali sebagai Pelaksana Khusus', 2),
('Penetapan Kembali', 'PK', '2.b.2', 'Pelaksana Khusus yang dimutasi sebagai Pelaksana Tertentu yang kemudian dimutasi kembali sebagai Pelaksana Khusus', 2),
('Penetapan Kembali', 'PK', '2.b.3', 'Pelaksana Khusus yang dimutasi menjadi Pelaksana pada Unit Non Eselon di lingkungan Kementerian Keuangan yang tidak memiliki jabatan dan peringkat yang ditetapkan dalam Keputusan Menteri Keuangan mengenai Jabatan dan Peringkat bagi Pelaksana di lingkungan Kementerian Keuangan yang kemudian dimutasi kembali sebagai Pelaksana Khusus', 2),
('Penetapan Kembali', 'PK', '2.c', 'Pelaksana yang tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan, cuti di luar tanggungan negara atau diberhentikan sementara dari jabatan PNS dan pada saat kembali aktif bertugas di Kementerian Keuangan ditetapkan kembali sebagai Pelaksana Khusus', 1),
('Penetapan Kembali', 'PK', '2.c.1', 'Pelaksana Khusus yang cuti di luar tanggungan negara, ditugaskan di luar Kementerian Keuangan atau diberhentikan sementara dari jabatan PNS dan pada saat kembali aktif bertugas di Kementerian Keuangan ditetapkan kembali sebagai Pelaksana Khusus', 2),
('Penetapan Kembali', 'PK', '2.c.2', 'Pelaksana Umum yang cuti di luar tanggungan negara, ditugaskan di luar Kementerian Keuangan atau diberhentikan sementara dari jabatan PNS (sebelumnya pernah menjadi Pelaksana Khusus) dan pada saat kembali aktif bertugas di Kementerian Keuangan ditetapkan kembali sebagai Pelaksana Khusus', 2),

-- PELAKSANA TUGAS BELAJAR Kembali
('Penetapan Kembali', 'PTB', '3.a', 'Pelaksana Tugas Belajar yang kembali melaksanakan tugas belajar setelah aktif menjadi Pelaksana Umum atau Pelaksana Tugas Belajar yang ditetapkan kembali sebagai Pelaksana Tugas Belajar setelah dimutasi ke unit kerja terkecil lain', 1),
('Penetapan Kembali', 'PTB', '3.b', 'Pelaksana Tugas Belajar yang kembali melaksanakan tugas belajar setelah aktif menjadi Pelaksana Khusus', 1),
('Penetapan Kembali', 'PTB', '3.c', 'Pelaksana Tugas Belajar yang kembali melaksanakan tugas belajar setelah aktif menjadi Pelaksana Tertentu', 1),

-- PENETAPAN PERTAMA - PELAKSANA UMUM
('Penetapan Pertama', 'PU', '1.a', 'CPNS yang berdasarkan hasil rekrutmen sebagai Pelaksana Umum', 1),
('Penetapan Pertama', 'PU', '1.b', 'PNS dari luar Kementerian Keuangan yang beralih status menjadi PNS Kementerian Keuangan dan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Pertama', 'PU', '1.c', 'PNS dari luar Kementerian Keuangan yang ditugaskan di Kementerian Keuangan dan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Pertama', 'PU', '1.d', 'Pelaksana yang ditugaskan pada jabatan selain Pelaksana Umum atau kembali dari penugasan tertentu dan sebelum ditetapkan sebagai Pelaksana Umum untuk pertama kali, tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan', 1),
('Penetapan Pertama', 'PU', '1.d.1', 'Pelaksana Khusus yang sebelum ditetapkan sebagai Pelaksana Umum untuk pertama kali, tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan', 2),
('Penetapan Pertama', 'PU', '1.d.2', 'Pelaksana Tertentu yang sebelum ditetapkan sebagai Pelaksana Umum untuk pertama kali, tidak aktif bertugas di Kementerian Keuangan karena ditugaskan di luar Kementerian Keuangan', 2),
('Penetapan Pertama', 'PU', '1.e', 'Pejabat Fungsional yang diberhentikan dari jabatan fungsional yang bersangkutan dan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Pertama', 'PU', '1.f', 'Pejabat Struktural/Pimpinan pada Unit Organisasi Non Eselon yang dibebastugaskan/diberhentikan dari jabatan struktural/pimpinan pada unit organisasi non eselon yang bersangkutan dan ditetapkan sebagai Pelaksana Umum', 1),

-- PENETAPAN PERTAMA - PELAKSANA KHUSUS
('Penetapan Pertama', 'PK', '2.a', 'CPNS yang berdasarkan hasil rekrutmen sebagai Pelaksana Khusus', 1),
('Penetapan Pertama', 'PK', '2.b', 'PNS dari luar Kementerian Keuangan yang beralih status menjadi PNS Kementerian Keuangan dan ditetapkan sebagai Pelaksana Khusus', 1),
('Penetapan Pertama', 'PK', '2.c', 'PNS dari luar Kementerian Keuangan yang ditugaskan di Kementerian Keuangan dan ditetapkan sebagai Pelaksana Khusus', 1),
('Penetapan Pertama', 'PK', '2.d', 'Pelaksana Umum, Pelaksana Tertentu, atau Pelaksana pada Unit Non Eselon/Badan Layanan Umum di lingkungan Kementerian Keuangan yang tidak memiliki jabatan dan peringkat yang ditetapkan dalam Keputusan Menteri Keuangan yang dimutasi sebagai Pelaksana Khusus untuk pertama kali', 1),
('Penetapan Pertama', 'PK', '2.d.1', 'Pelaksana Umum yang dimutasi sebagai Pelaksana Khusus untuk pertama kali', 2),
('Penetapan Pertama', 'PK', '2.d.2', 'Pelaksana Tertentu yang dimutasi sebagai Pelaksana Khusus untuk pertama kali', 2),
('Penetapan Pertama', 'PK', '2.d.3', 'Pelaksana pada Unit Non Eselon di lingkungan Kementerian Keuangan yang tidak memiliki jabatan dan peringkat yang ditetapkan dalam Keputusan Menteri Keuangan yang dimutasi sebagai Pelaksana Khusus untuk pertama kali', 2),
('Penetapan Pertama', 'PK', '2.e', 'Pelaksana Umum atau Pelaksana Tertentu yang tidak aktif bertugas di Kementerian Keuangan karena cuti di luar tanggungan negara, ditugaskan di luar Kementerian Keuangan atau diberhentikan sementara dari jabatan PNS dan pada saat kembali aktif bertugas di Kementerian Keuangan ditetapkan sebagai Pelaksana Khusus untuk pertama kali', 1),
('Penetapan Pertama', 'PK', '2.e.1', 'Pelaksana Umum yang cuti di luar tanggungan negara, ditugaskan di luar Kementerian Keuangan atau diberhentikan sementara dari jabatan PNS dan pada saat kembali aktif bertugas di Kementerian Keuangan ditetapkan sebagai Pelaksana Khusus untuk pertama kali', 2),
('Penetapan Pertama', 'PK', '2.e.2', 'Pelaksana Tertentu yang cuti di luar tanggungan negara, ditugaskan di luar Kementerian Keuangan atau diberhentikan sementara dari jabatan PNS dan pada saat kembali aktif bertugas di Kementerian Keuangan ditetapkan sebagai Pelaksana Khusus untuk pertama kali', 2),
('Penetapan Pertama', 'PK', '2.f', 'Pejabat Fungsional yang diberhentikan dari jabatan fungsional yang bersangkutan dan ditetapkan sebagai Pelaksana Khusus', 1),
('Penetapan Pertama', 'PK', '2.g', 'Pejabat Struktural/Pimpinan pada Unit Organisasi Non Eselon yang dibebastugaskan/diberhentikan dari jabatan struktural/pimpinan pada unit organisasi non eselon yang bersangkutan dan ditetapkan sebagai Pelaksana Khusus', 1),
('Penetapan Pertama', 'PK', '2.h', 'Pelaksana Tugas Belajar yang kembali aktif dan ditetapkan dalam jabatan Pelaksana Khusus untuk pertama kali', 1),

-- PENETAPAN PERTAMA - PELAKSANA TUGAS BELAJAR
('Penetapan Pertama', 'PTB', '3.a', 'Pelaksana Umum yang melaksanakan tugas belajar untuk pertama kali', 1),
('Penetapan Pertama', 'PTB', '3.b', 'Pelaksana Khusus yang melaksanakan tugas belajar untuk pertama kali', 1),
('Penetapan Pertama', 'PTB', '3.c', 'Pelaksana Tertentu yang melaksanakan tugas belajar untuk pertama kali', 1),
('Penetapan Pertama', 'PTB', '3.d', 'Pejabat Fungsional yang melaksanakan tugas belajar', 1),
('Penetapan Pertama', 'PTB', '3.e', 'Pejabat Struktural/Pimpinan pada Unit Organisasi Non Eselon yang melaksanakan tugas belajar', 1),

-- PENETAPAN SIMULASI
('Penetapan Simulasi', 'PU', 'a', 'Pelaksana Khusus yang dimutasi menjadi Pelaksana Umum', 1),
('Penetapan Simulasi', 'PU', 'b', 'Pelaksana Khusus yang tidak aktif bekerja di Kementerian Keuangan karena cuti diluar tanggungan negara/diberhentikan sementara dari jabatan PNS dan pada saat aktif kembali bekerja di Kementerian Keuangan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Simulasi', 'PU', 'c', 'Pelaksana Tertentu yang dimutasi menjadi Pelaksana Umum', 1),
('Penetapan Simulasi', 'PU', 'd', 'Pelaksana Tertentu yang tidak aktif bekerja di Kementerian Keuangan karena cuti diluar tanggungan negara atau diberhentikan sementara dari jabatan PNS dan pada saat aktif kembali bekerja di Kementerian Keuangan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Simulasi', 'PU', 'e', 'Pelaksana pada Unit Organisasi Non Eselon dan Badan Layanan Umum di lingkungan Kementerian Keuangan yang tidak memiliki jabatan dan peringkat yang diatur dalam ketentuan mengenai Jabatan dan Peringkat bagi Pelaksana di lingkungan Kementerian Keuangan yang ditetapkan Menteri Keuangan yang dimutasi menjadi Pelaksana Umum', 1),
('Penetapan Simulasi', 'PU', 'f', 'Pelaksana pada Unit Organisasi Non Eselon dan Badan Layanan Umum di lingkungan Kementerian Keuangan yang tidak memiliki jabatan dan peringkat yang diatur dalam ketentuan mengenai Jabatan dan Peringkat bagi Pelaksana di lingkungan Kementerian Keuangan yang ditetapkan Menteri Keuangan yang tidak aktif bekerja di Kementerian Keuangan karena cuti diluar tanggungan negara atau diberhentikan sementara dari jabatan PNS dan pada saat aktif kembali bekerja di Kementerian Keuangan ditetapkan sebagai Pelaksana Umum', 1),
('Penetapan Simulasi', 'PU', 'g', 'Pelaksana pada Unit Organisasi Non Eselon dan Badan Layanan Umum di lingkungan Kementerian Keuangan yang tidak memiliki jabatan dan peringkat yang diatur dalam ketentuan mengenai Jabatan dan Peringkat bagi Pelaksana di lingkungan Kementerian Keuangan yang ditetapkan Menteri Keuangan kemudian ditetapkan peringkat jabatan Kementerian Keuangan', 1),

-- PENETAPAN SIDANG
('Penetapan Sidang', 'PU', '1.a', 'Pelaksana Umum yang direkomendasikan naik/turun/tetap', 1),
('Penetapan Sidang', 'PU', '1.b', 'Pelaksana Umum yang direkomendasikan naik karena memperoleh kenaikan pangkat/golongan ruang karena lulus UPKP/tugas belajar', 1),
('Penetapan Sidang', 'PU', '1.c', 'Pelaksana Umum yang belum direkomendasikan naik/turun/tetap (baru mengumpulkan 1 predikat kinerja/belum mempunyai predikat kinerja)', 1),
('Penetapan Sidang', 'PK', '2.a', 'Pelaksana Khusus yang direkomendasikan naik/tetap', 1),
('Penetapan Sidang', 'PK', '2.b', 'Pelaksana Khusus yang belum direkomendasikan naik/tetap', 1),
('Penetapan Sidang', 'PTB', '3.a', 'Pelaksana Tugas Belajar yang direkomendasikan naik/turun/tetap', 1),
('Penetapan Sidang', 'PTB', '3.b', 'Pelaksana Tugas Belajar yang belum direkomendasikan naik/turun/tetap', 1);