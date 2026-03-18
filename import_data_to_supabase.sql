-- Script untuk mengimpor data Pensiun dan Pendidikan ke Supabase
-- 
-- INSTRUKSI:
-- 1. Buka Supabase SQL Editor: https://supabase.com/dashboard/project/uaqqbkwidpkntvomjgzt/sql/new
-- 2. Copy dan paste script ini
-- 3. Jalankan script
-- 
-- CATATAN: Data ini diambil dari file Excel pensiun.xlsx dan pendidikan.xlsx
-- yang sudah ada di folder public/data/
-- 
-- Karena datanya sangat banyak (lebih dari 2000 baris per tabel), 
-- disarankan untuk menggunakan metode import CSV dari Supabase Table Editor
-- atau menggunakan client-side import melalui aplikasi web.

-- Hapus data lama jika ada (opsional - hati-hati!)
-- TRUNCATE TABLE pensiun;
-- TRUNCATE TABLE pendidikan;

-- Untuk import data dalam jumlah besar, lebih baik menggunakan salah satu metode berikut:
-- 
-- METODE 1: Import via Supabase Table Editor
-- 1. Buka https://supabase.com/dashboard/project/uaqqbkwidpkntvomjgzt/editor
-- 2. Pilih tabel "pensiun" atau "pendidikan"
-- 3. Klik tombol "Insert" > "Import data from CSV"
-- 4. Upload file Excel yang sudah dikonversi ke CSV
-- 
-- METODE 2: Import via aplikasi (yang akan saya buat)
-- - Akan ada tombol import di halaman Pensiun dan Pendidikan
-- - Tombol ini akan membaca Excel dan insert ke Supabase secara otomatis

-- Contoh data (5 baris pertama untuk pensiun):
INSERT INTO pensiun (nip, nama_lengkap, usia_tahun, masa_kerja_tahun, jenjang_jabatan, jabatan, unit_organisasi) VALUES
('198002272003121001', 'Iwan Darmawan', 45, 21, 'Non Eselon', 'Pemeriksa Bea Cukai Pertama/Ahli Pertama Pemeriksaan Bea dan Cukai', 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik'),
('198704282007011002', 'Nizar Fauzi', 38, 18, 'Non Eselon', 'Penata Layanan Operasional Tk.III', 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak'),
('199009252010011002', 'A. A Ngurah Agung Kamasan', 35, 15, 'Non Eselon', 'Pemeriksa Bea Cukai Pelaksana/Terampil Pemeriksaan Bea dan Cukai', 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda'),
('197903142000121002', 'A. Makmuridin', 46, 24, 'Non Eselon', 'Pemeriksa Bea Cukai Muda/Ahli Muda Pemeriksaan Bea dan Cukai', 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak'),
('199411212015021002', 'A. Misbahul Huda', 30, 10, 'Non Eselon', 'Pemeriksa Bea Cukai Pelaksana/Terampil Pemeriksaan Bea dan Cukai', 'Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak')
ON CONFLICT (nip) DO NOTHING;

-- Contoh data (5 baris pertama untuk pendidikan):
INSERT INTO pendidikan (nip, nama_lengkap, pendidikan, tahun_lulus, lokasi_pendidikan, jurusan, nama_lembaga_pendidikan) VALUES
('198002272003121001', 'Iwan Darmawan', 'Sarjana', 2022, 'Dalam Negeri', 'Teknik Perkapalan', 'Institut Teknologi Adhi Tama Surabaya'),
('198704282007011002', 'Nizar Fauzi', 'Sarjana', 2024, 'Dalam Negeri', 'Manajemen', 'Universitas Terbuka'),
('199009252010011002', 'A. A Ngurah Agung Kamasan', 'Sarjana', 2022, 'Dalam Negeri', 'Manajemen-S1', 'Universitas Terbuka'),
('197903142000121002', 'A. Makmuridin', 'Sarjana', 2006, 'Dalam Negeri', 'Sarjana Ekonomi', '-'),
('199411212015021002', 'A. Misbahul Huda', 'Diploma III', 2022, 'Dalam Negeri', 'Perpajakan', 'Universitas Terbuka')
ON CONFLICT (id) DO NOTHING;
