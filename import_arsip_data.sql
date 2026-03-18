-- Import Daftar Berkas data
-- Delete existing data first
DELETE FROM daftar_berkas;

-- Insert all 27 records from Daftar_Berkas.xlsx
INSERT INTO daftar_berkas (no_berkas, kode_klasifikasi, uraian_informasi_berkas, kurun_waktu, tingkat_perkembangan, jumlah, lokasi, pic, keterangan) VALUES
(1, 'DL01', 'Pendidikan di luar kedinasan', '2020-2021', 'Asli', 78, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(2, 'DL03', 'Konsultasi dan asistensi', '2020-2021', 'Asli', 20, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(3, 'DL04', 'Sosialisasi dan bimbingan teknis', '2020-2021', 'Asli', 38, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(4, 'DL13', 'Pelaksanaan pelatihan', '2020-2021', 'Asli', 81, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(5, 'KA40', 'Pemindahan arsip inaktif', '2020-2021', 'Asli', 3, 'Nadine Bagian Umum', 'Subbagian TU dan Keuangan', 'Digital'),
(6, 'KP03', 'Penetapan CPNS menjadi PNS', '2020-2021', 'Asli', 2, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(7, 'KP10', 'Pengembangan kompetensi', '2020-2021', 'Asli', 8, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(8, 'KP101', 'Assessment center', '2020-2021', 'Asli', 1, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(9, 'KP201', 'Mutasi dan promosi', '2020-2021', 'Asli', 43, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(10, 'KP30', 'Disiplin pegawai', '2020-2021', 'Asli', 94, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(11, 'KP31', 'Sanksi dan hukuman', '2020-2021', 'Asli', 14, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(12, 'KP40', 'Mutasi keluarga', '2020-2021', 'Asli', 27, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(13, 'KP42', 'Layanan kesehatan/kesejahteraan pegawai', '2020-2021', 'Asli', 123, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(14, 'KP43', 'Penghargaan dan tanda jasa', '2020-2021', 'Asli', 7, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(15, 'KP50', 'Perjalanan dinas dalam jabatan', '2020-2021', 'Asli', 580, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(16, 'KP60', 'Pemberhentian pegawai hak pensiun', '2020-2021', 'Asli', 25, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(17, 'KP7', 'Personal file pegawai', '2020-2021', 'Asli', 100, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(18, 'KU01', 'Penganggaran', '2020-2021', 'Asli', 47, 'AlmariBagian Umum', 'Subbagian Kepegawaian', 'Tekstual'),
(19, 'KU11', 'LPP TKTT', '2020-2021', 'Asli', 36, 'AlmariBagian Umum', 'Subbagin TU dan Keuangan', 'Tekstual'),
(20, 'KU14', 'Belanja/pengeluaran anggaran', '2020-2021', 'Asli', 149, 'AlmariBagian Umum', 'Subbagin TU dan Keuangan', 'Tekstual'),
(21, 'OT4', 'Manajemen risiko', '2020-2021', 'Asli', 88, 'Nadine Bagian Umum', 'Subbagin TU dan Keuangan', 'Digital'),
(22, 'PB14', 'Pertanggungjawaban bendahara', '2020-2021', 'Asli', 1042, 'AlmariBagian Umum', 'Subbagin TU dan Keuangan', 'Tekstual'),
(23, 'PN50', 'Penugasan audit', '2020-2021', 'Asli', 86, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital'),
(24, 'RT0', 'Penggunaan gedung dan fasilitas kantor', '2020-2021', 'Asli', 59, 'Nadine Bagian Umum', 'Subbagian Rumah Tangga', 'Digital'),
(25, 'RT11', 'Peralatan operasional', '2020-2021', 'Asli', 5, 'Nadine Bagian Umum', 'Subbagian Rumah Tangga', 'Digital'),
(26, 'AG1', 'Perencanaan anggaran', '2020-2021', 'Asli', 4, 'Nadine Bagian Umum', 'Subbagian TU dan Keuangan', 'Digital'),
(27, 'DL10', 'Perencanaan dan pengembangan program pelatihan', '2020-2021', 'Asli', 11, 'Nadine Bagian Umum', 'Subbagian Kepegawaian', 'Digital');
