
-- =====================================================
-- COMPREHENSIVE RLS SECURITY FIX (FIXED TYPE CASTING)
-- Mengubah dari USING (true) menjadi role-based policies
-- =====================================================

-- =====================================================
-- 1. TABEL SENSITIF (PII): employees, profiles, absensi
-- =====================================================

-- === EMPLOYEES TABLE ===
DROP POLICY IF EXISTS "Admins can do everything on employees" ON public.employees;
DROP POLICY IF EXISTS "Users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON public.employees;

CREATE POLICY "Authenticated users can view employees"
ON public.employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert employees"
ON public.employees FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employees"
ON public.employees FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employees"
ON public.employees FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === PROFILES TABLE ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users have full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- === ABSENSI TABLE ===
DROP POLICY IF EXISTS "Admins can do everything on absensi" ON public.absensi;
DROP POLICY IF EXISTS "Authenticated users can view absensi" ON public.absensi;
DROP POLICY IF EXISTS "Authenticated users can insert absensi" ON public.absensi;
DROP POLICY IF EXISTS "Authenticated users can update absensi" ON public.absensi;
DROP POLICY IF EXISTS "Authenticated users can delete absensi" ON public.absensi;
DROP POLICY IF EXISTS "Admins can insert absensi" ON public.absensi;
DROP POLICY IF EXISTS "Admins can update absensi" ON public.absensi;
DROP POLICY IF EXISTS "Admins can delete absensi" ON public.absensi;

CREATE POLICY "Authenticated users can view absensi"
ON public.absensi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert absensi"
ON public.absensi FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update absensi"
ON public.absensi FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete absensi"
ON public.absensi FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. TABEL DATA DENGAN PUBLIC ACCESS (ubah ke authenticated)
-- =====================================================

-- === ABSEN_MANUAL ===
DROP POLICY IF EXISTS "Authenticated users can delete absen_manual" ON public.absen_manual;
DROP POLICY IF EXISTS "Authenticated users can insert absen_manual" ON public.absen_manual;
DROP POLICY IF EXISTS "Authenticated users can update absen_manual" ON public.absen_manual;
DROP POLICY IF EXISTS "Authenticated users can view absen_manual" ON public.absen_manual;
DROP POLICY IF EXISTS "Admins can manage absen_manual" ON public.absen_manual;

CREATE POLICY "Authenticated users can view absen_manual"
ON public.absen_manual FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage absen_manual"
ON public.absen_manual FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === AGENDA ===
DROP POLICY IF EXISTS "Authenticated users can create agenda" ON public.agenda;
DROP POLICY IF EXISTS "Authenticated users can delete agenda" ON public.agenda;
DROP POLICY IF EXISTS "Authenticated users can update agenda" ON public.agenda;
DROP POLICY IF EXISTS "Authenticated users can view agenda" ON public.agenda;
DROP POLICY IF EXISTS "Authenticated users can insert agenda" ON public.agenda;
DROP POLICY IF EXISTS "Admins can update agenda" ON public.agenda;
DROP POLICY IF EXISTS "Admins can delete agenda" ON public.agenda;

CREATE POLICY "Authenticated users can view agenda"
ON public.agenda FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert agenda"
ON public.agenda FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update agenda"
ON public.agenda FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete agenda"
ON public.agenda FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === AKTIVASI_CORTAX ===
DROP POLICY IF EXISTS "Authenticated users can delete aktivasi_cortax" ON public.aktivasi_cortax;
DROP POLICY IF EXISTS "Authenticated users can insert aktivasi_cortax" ON public.aktivasi_cortax;
DROP POLICY IF EXISTS "Authenticated users can update aktivasi_cortax" ON public.aktivasi_cortax;
DROP POLICY IF EXISTS "Authenticated users can view aktivasi_cortax" ON public.aktivasi_cortax;
DROP POLICY IF EXISTS "Admins can manage aktivasi_cortax" ON public.aktivasi_cortax;

CREATE POLICY "Authenticated users can view aktivasi_cortax"
ON public.aktivasi_cortax FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage aktivasi_cortax"
ON public.aktivasi_cortax FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === ASSIGNMENTS ===
DROP POLICY IF EXISTS "Admins can update all assignment fields" ON public.assignments;
DROP POLICY IF EXISTS "All authenticated users can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Only admins can delete assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update download status" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can delete assignments" ON public.assignments;

CREATE POLICY "Authenticated users can view assignments"
ON public.assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert assignments"
ON public.assignments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update assignments"
ON public.assignments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assignments"
ON public.assignments FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === BANK_ISSUE ===
DROP POLICY IF EXISTS "Authenticated users can delete bank_issue" ON public.bank_issue;
DROP POLICY IF EXISTS "Authenticated users can insert bank_issue" ON public.bank_issue;
DROP POLICY IF EXISTS "Authenticated users can update bank_issue" ON public.bank_issue;
DROP POLICY IF EXISTS "Authenticated users can view bank_issue" ON public.bank_issue;
DROP POLICY IF EXISTS "Admins can update bank_issue" ON public.bank_issue;
DROP POLICY IF EXISTS "Admins can delete bank_issue" ON public.bank_issue;

CREATE POLICY "Authenticated users can view bank_issue"
ON public.bank_issue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert bank_issue"
ON public.bank_issue FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update bank_issue"
ON public.bank_issue FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete bank_issue"
ON public.bank_issue FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === BERITA_ACARA_SIDANG ===
DROP POLICY IF EXISTS "Authenticated users can delete berita_acara_sidang" ON public.berita_acara_sidang;
DROP POLICY IF EXISTS "Authenticated users can insert berita_acara_sidang" ON public.berita_acara_sidang;
DROP POLICY IF EXISTS "Authenticated users can update berita_acara_sidang" ON public.berita_acara_sidang;
DROP POLICY IF EXISTS "Authenticated users can view berita_acara_sidang" ON public.berita_acara_sidang;
DROP POLICY IF EXISTS "Admins can update berita_acara_sidang" ON public.berita_acara_sidang;
DROP POLICY IF EXISTS "Admins can delete berita_acara_sidang" ON public.berita_acara_sidang;

CREATE POLICY "Authenticated users can view berita_acara_sidang"
ON public.berita_acara_sidang FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert berita_acara_sidang"
ON public.berita_acara_sidang FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update berita_acara_sidang"
ON public.berita_acara_sidang FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete berita_acara_sidang"
ON public.berita_acara_sidang FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === BOOK_NOMOR_MANUAL ===
DROP POLICY IF EXISTS "Authenticated users can delete book_nomor_manual" ON public.book_nomor_manual;
DROP POLICY IF EXISTS "Authenticated users can insert book_nomor_manual" ON public.book_nomor_manual;
DROP POLICY IF EXISTS "Authenticated users can update book_nomor_manual" ON public.book_nomor_manual;
DROP POLICY IF EXISTS "Authenticated users can view book_nomor_manual" ON public.book_nomor_manual;
DROP POLICY IF EXISTS "Admins can update book_nomor_manual" ON public.book_nomor_manual;
DROP POLICY IF EXISTS "Admins can delete book_nomor_manual" ON public.book_nomor_manual;

CREATE POLICY "Authenticated users can view book_nomor_manual"
ON public.book_nomor_manual FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert book_nomor_manual"
ON public.book_nomor_manual FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update book_nomor_manual"
ON public.book_nomor_manual FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete book_nomor_manual"
ON public.book_nomor_manual FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === BUKU_BAMBU ===
DROP POLICY IF EXISTS "Authenticated users can delete buku_bambu" ON public.buku_bambu;
DROP POLICY IF EXISTS "Authenticated users can insert buku_bambu" ON public.buku_bambu;
DROP POLICY IF EXISTS "Authenticated users can update buku_bambu" ON public.buku_bambu;
DROP POLICY IF EXISTS "Authenticated users can view buku_bambu" ON public.buku_bambu;
DROP POLICY IF EXISTS "Admins can update buku_bambu" ON public.buku_bambu;
DROP POLICY IF EXISTS "Admins can delete buku_bambu" ON public.buku_bambu;

CREATE POLICY "Authenticated users can view buku_bambu"
ON public.buku_bambu FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert buku_bambu"
ON public.buku_bambu FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update buku_bambu"
ON public.buku_bambu FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete buku_bambu"
ON public.buku_bambu FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === CUTI ===
DROP POLICY IF EXISTS "Authenticated users can view cuti" ON public.cuti;
DROP POLICY IF EXISTS "Authenticated users can insert cuti" ON public.cuti;
DROP POLICY IF EXISTS "Authenticated users can update cuti" ON public.cuti;
DROP POLICY IF EXISTS "Authenticated users can delete cuti" ON public.cuti;
DROP POLICY IF EXISTS "Admins can manage cuti" ON public.cuti;
DROP POLICY IF EXISTS "Admins can update cuti" ON public.cuti;
DROP POLICY IF EXISTS "Admins can delete cuti" ON public.cuti;

CREATE POLICY "Authenticated users can view cuti"
ON public.cuti FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert cuti"
ON public.cuti FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update cuti"
ON public.cuti FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cuti"
ON public.cuti FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === DAFTAR_BERKAS ===
DROP POLICY IF EXISTS "Authenticated users can delete daftar_berkas" ON public.daftar_berkas;
DROP POLICY IF EXISTS "Authenticated users can insert daftar_berkas" ON public.daftar_berkas;
DROP POLICY IF EXISTS "Authenticated users can update daftar_berkas" ON public.daftar_berkas;
DROP POLICY IF EXISTS "Authenticated users can view daftar_berkas" ON public.daftar_berkas;
DROP POLICY IF EXISTS "Admins can update daftar_berkas" ON public.daftar_berkas;
DROP POLICY IF EXISTS "Admins can delete daftar_berkas" ON public.daftar_berkas;

CREATE POLICY "Authenticated users can view daftar_berkas"
ON public.daftar_berkas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert daftar_berkas"
ON public.daftar_berkas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update daftar_berkas"
ON public.daftar_berkas FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete daftar_berkas"
ON public.daftar_berkas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === DAFTAR_GRADE ===
DROP POLICY IF EXISTS "Authenticated users can delete daftar_grade" ON public.daftar_grade;
DROP POLICY IF EXISTS "Authenticated users can insert daftar_grade" ON public.daftar_grade;
DROP POLICY IF EXISTS "Authenticated users can update daftar_grade" ON public.daftar_grade;
DROP POLICY IF EXISTS "Authenticated users can view daftar_grade" ON public.daftar_grade;
DROP POLICY IF EXISTS "Admins can manage daftar_grade" ON public.daftar_grade;

CREATE POLICY "Authenticated users can view daftar_grade"
ON public.daftar_grade FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage daftar_grade"
ON public.daftar_grade FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === DIGITAL_FOOTPRINT ===
DROP POLICY IF EXISTS "Authenticated users can delete digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Authenticated users can insert digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Authenticated users can update digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Authenticated users can view digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Users can view own digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Users can insert own digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Users can update own digital_footprint" ON public.digital_footprint;
DROP POLICY IF EXISTS "Admins can delete digital_footprint" ON public.digital_footprint;

CREATE POLICY "Users can view own digital_footprint"
ON public.digital_footprint FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own digital_footprint"
ON public.digital_footprint FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own digital_footprint"
ON public.digital_footprint FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete digital_footprint"
ON public.digital_footprint FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === DIGITAL_FOOTPRINT_TASKS ===
DROP POLICY IF EXISTS "Authenticated users can delete digital_footprint_tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert digital_footprint_tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Authenticated users can update digital_footprint_tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Authenticated users can view digital_footprint_tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.digital_footprint_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.digital_footprint_tasks;

CREATE POLICY "Users can view own tasks"
ON public.digital_footprint_tasks FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own tasks"
ON public.digital_footprint_tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
ON public.digital_footprint_tasks FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own tasks"
ON public.digital_footprint_tasks FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- === DISTRIBUSI_SURAT ===
DROP POLICY IF EXISTS "Authenticated users can delete distribusi_surat" ON public.distribusi_surat;
DROP POLICY IF EXISTS "Authenticated users can insert distribusi_surat" ON public.distribusi_surat;
DROP POLICY IF EXISTS "Authenticated users can update distribusi_surat" ON public.distribusi_surat;
DROP POLICY IF EXISTS "Authenticated users can view distribusi_surat" ON public.distribusi_surat;
DROP POLICY IF EXISTS "Admins can update distribusi_surat" ON public.distribusi_surat;
DROP POLICY IF EXISTS "Admins can delete distribusi_surat" ON public.distribusi_surat;

CREATE POLICY "Authenticated users can view distribusi_surat"
ON public.distribusi_surat FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert distribusi_surat"
ON public.distribusi_surat FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update distribusi_surat"
ON public.distribusi_surat FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete distribusi_surat"
ON public.distribusi_surat FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === DOSIR_IN ===
DROP POLICY IF EXISTS "Authenticated users can delete dosir_in" ON public.dosir_in;
DROP POLICY IF EXISTS "Authenticated users can insert dosir_in" ON public.dosir_in;
DROP POLICY IF EXISTS "Authenticated users can update dosir_in" ON public.dosir_in;
DROP POLICY IF EXISTS "Authenticated users can view dosir_in" ON public.dosir_in;
DROP POLICY IF EXISTS "Admins can update dosir_in" ON public.dosir_in;
DROP POLICY IF EXISTS "Admins can delete dosir_in" ON public.dosir_in;

CREATE POLICY "Authenticated users can view dosir_in"
ON public.dosir_in FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert dosir_in"
ON public.dosir_in FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update dosir_in"
ON public.dosir_in FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dosir_in"
ON public.dosir_in FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === DOSIR_OUT ===
DROP POLICY IF EXISTS "Authenticated users can delete dosir_out" ON public.dosir_out;
DROP POLICY IF EXISTS "Authenticated users can insert dosir_out" ON public.dosir_out;
DROP POLICY IF EXISTS "Authenticated users can update dosir_out" ON public.dosir_out;
DROP POLICY IF EXISTS "Authenticated users can view dosir_out" ON public.dosir_out;
DROP POLICY IF EXISTS "Admins can update dosir_out" ON public.dosir_out;
DROP POLICY IF EXISTS "Admins can delete dosir_out" ON public.dosir_out;

CREATE POLICY "Authenticated users can view dosir_out"
ON public.dosir_out FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert dosir_out"
ON public.dosir_out FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update dosir_out"
ON public.dosir_out FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dosir_out"
ON public.dosir_out FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === EVENTS ===
DROP POLICY IF EXISTS "Authenticated users can delete events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Anyone can view events"
ON public.events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === FAQ_SDM ===
DROP POLICY IF EXISTS "Authenticated users can delete faq_sdm" ON public.faq_sdm;
DROP POLICY IF EXISTS "Authenticated users can insert faq_sdm" ON public.faq_sdm;
DROP POLICY IF EXISTS "Authenticated users can update faq_sdm" ON public.faq_sdm;
DROP POLICY IF EXISTS "Authenticated users can view faq_sdm" ON public.faq_sdm;
DROP POLICY IF EXISTS "Admins can manage faq_sdm" ON public.faq_sdm;

CREATE POLICY "Authenticated users can view faq_sdm"
ON public.faq_sdm FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage faq_sdm"
ON public.faq_sdm FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === GRADING TABLES ===
DROP POLICY IF EXISTS "Authenticated users can delete grading_berita_acara" ON public.grading_berita_acara;
DROP POLICY IF EXISTS "Authenticated users can insert grading_berita_acara" ON public.grading_berita_acara;
DROP POLICY IF EXISTS "Authenticated users can update grading_berita_acara" ON public.grading_berita_acara;
DROP POLICY IF EXISTS "Authenticated users can view grading_berita_acara" ON public.grading_berita_acara;
DROP POLICY IF EXISTS "Admins can manage grading_berita_acara" ON public.grading_berita_acara;

CREATE POLICY "Authenticated users can view grading_berita_acara"
ON public.grading_berita_acara FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_berita_acara"
ON public.grading_berita_acara FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_big_data" ON public.grading_big_data;
DROP POLICY IF EXISTS "Authenticated users can insert grading_big_data" ON public.grading_big_data;
DROP POLICY IF EXISTS "Authenticated users can update grading_big_data" ON public.grading_big_data;
DROP POLICY IF EXISTS "Authenticated users can view grading_big_data" ON public.grading_big_data;
DROP POLICY IF EXISTS "Admins can manage grading_big_data" ON public.grading_big_data;

CREATE POLICY "Authenticated users can view grading_big_data"
ON public.grading_big_data FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_big_data"
ON public.grading_big_data FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_format_hasil_evaluasi" ON public.grading_format_hasil_evaluasi;
DROP POLICY IF EXISTS "Authenticated users can insert grading_format_hasil_evaluasi" ON public.grading_format_hasil_evaluasi;
DROP POLICY IF EXISTS "Authenticated users can update grading_format_hasil_evaluasi" ON public.grading_format_hasil_evaluasi;
DROP POLICY IF EXISTS "Authenticated users can view grading_format_hasil_evaluasi" ON public.grading_format_hasil_evaluasi;
DROP POLICY IF EXISTS "Admins can manage grading_format_hasil_evaluasi" ON public.grading_format_hasil_evaluasi;

CREATE POLICY "Authenticated users can view grading_format_hasil_evaluasi"
ON public.grading_format_hasil_evaluasi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_format_hasil_evaluasi"
ON public.grading_format_hasil_evaluasi FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_hasil_evaluasi" ON public.grading_hasil_evaluasi;
DROP POLICY IF EXISTS "Authenticated users can insert grading_hasil_evaluasi" ON public.grading_hasil_evaluasi;
DROP POLICY IF EXISTS "Authenticated users can update grading_hasil_evaluasi" ON public.grading_hasil_evaluasi;
DROP POLICY IF EXISTS "Authenticated users can view grading_hasil_evaluasi" ON public.grading_hasil_evaluasi;
DROP POLICY IF EXISTS "Admins can manage grading_hasil_evaluasi" ON public.grading_hasil_evaluasi;

CREATE POLICY "Authenticated users can view grading_hasil_evaluasi"
ON public.grading_hasil_evaluasi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_hasil_evaluasi"
ON public.grading_hasil_evaluasi FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_kelengkapan_simulasi" ON public.grading_kelengkapan_simulasi;
DROP POLICY IF EXISTS "Authenticated users can insert grading_kelengkapan_simulasi" ON public.grading_kelengkapan_simulasi;
DROP POLICY IF EXISTS "Authenticated users can update grading_kelengkapan_simulasi" ON public.grading_kelengkapan_simulasi;
DROP POLICY IF EXISTS "Authenticated users can view grading_kelengkapan_simulasi" ON public.grading_kelengkapan_simulasi;
DROP POLICY IF EXISTS "Admins can manage grading_kelengkapan_simulasi" ON public.grading_kelengkapan_simulasi;

CREATE POLICY "Authenticated users can view grading_kelengkapan_simulasi"
ON public.grading_kelengkapan_simulasi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_kelengkapan_simulasi"
ON public.grading_kelengkapan_simulasi FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_kep_salinan" ON public.grading_kep_salinan;
DROP POLICY IF EXISTS "Authenticated users can insert grading_kep_salinan" ON public.grading_kep_salinan;
DROP POLICY IF EXISTS "Authenticated users can update grading_kep_salinan" ON public.grading_kep_salinan;
DROP POLICY IF EXISTS "Authenticated users can view grading_kep_salinan" ON public.grading_kep_salinan;
DROP POLICY IF EXISTS "Admins can manage grading_kep_salinan" ON public.grading_kep_salinan;

CREATE POLICY "Authenticated users can view grading_kep_salinan"
ON public.grading_kep_salinan FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_kep_salinan"
ON public.grading_kep_salinan FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_kuesioner" ON public.grading_kuesioner;
DROP POLICY IF EXISTS "Authenticated users can insert grading_kuesioner" ON public.grading_kuesioner;
DROP POLICY IF EXISTS "Authenticated users can update grading_kuesioner" ON public.grading_kuesioner;
DROP POLICY IF EXISTS "Authenticated users can view grading_kuesioner" ON public.grading_kuesioner;
DROP POLICY IF EXISTS "Admins can manage grading_kuesioner" ON public.grading_kuesioner;

CREATE POLICY "Authenticated users can view grading_kuesioner"
ON public.grading_kuesioner FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_kuesioner"
ON public.grading_kuesioner FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can delete grading_petikan" ON public.grading_petikan;
DROP POLICY IF EXISTS "Authenticated users can insert grading_petikan" ON public.grading_petikan;
DROP POLICY IF EXISTS "Authenticated users can update grading_petikan" ON public.grading_petikan;
DROP POLICY IF EXISTS "Authenticated users can view grading_petikan" ON public.grading_petikan;
DROP POLICY IF EXISTS "Admins can manage grading_petikan" ON public.grading_petikan;

CREATE POLICY "Authenticated users can view grading_petikan"
ON public.grading_petikan FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage grading_petikan"
ON public.grading_petikan FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === GUDANG_ARSIP_TEGALSARI ===
DROP POLICY IF EXISTS "Authenticated users can delete gudang_arsip_tegalsari" ON public.gudang_arsip_tegalsari;
DROP POLICY IF EXISTS "Authenticated users can insert gudang_arsip_tegalsari" ON public.gudang_arsip_tegalsari;
DROP POLICY IF EXISTS "Authenticated users can update gudang_arsip_tegalsari" ON public.gudang_arsip_tegalsari;
DROP POLICY IF EXISTS "Authenticated users can view gudang_arsip_tegalsari" ON public.gudang_arsip_tegalsari;
DROP POLICY IF EXISTS "Admins can manage gudang_arsip_tegalsari" ON public.gudang_arsip_tegalsari;

CREATE POLICY "Authenticated users can view gudang_arsip_tegalsari"
ON public.gudang_arsip_tegalsari FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage gudang_arsip_tegalsari"
ON public.gudang_arsip_tegalsari FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === ISI_BERKAS ===
DROP POLICY IF EXISTS "Authenticated users can delete isi_berkas" ON public.isi_berkas;
DROP POLICY IF EXISTS "Authenticated users can insert isi_berkas" ON public.isi_berkas;
DROP POLICY IF EXISTS "Authenticated users can update isi_berkas" ON public.isi_berkas;
DROP POLICY IF EXISTS "Authenticated users can view isi_berkas" ON public.isi_berkas;
DROP POLICY IF EXISTS "Admins can update isi_berkas" ON public.isi_berkas;
DROP POLICY IF EXISTS "Admins can delete isi_berkas" ON public.isi_berkas;

CREATE POLICY "Authenticated users can view isi_berkas"
ON public.isi_berkas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert isi_berkas"
ON public.isi_berkas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update isi_berkas"
ON public.isi_berkas FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete isi_berkas"
ON public.isi_berkas FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === JAPRI_TEMAN ===
DROP POLICY IF EXISTS "Authenticated users can delete japri_teman" ON public.japri_teman;
DROP POLICY IF EXISTS "Authenticated users can insert japri_teman" ON public.japri_teman;
DROP POLICY IF EXISTS "Authenticated users can update japri_teman" ON public.japri_teman;
DROP POLICY IF EXISTS "Authenticated users can view japri_teman" ON public.japri_teman;
DROP POLICY IF EXISTS "Admins can manage japri_teman" ON public.japri_teman;

CREATE POLICY "Authenticated users can view japri_teman"
ON public.japri_teman FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage japri_teman"
ON public.japri_teman FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === KONVERSI_PREDIKAT_KINERJA ===
DROP POLICY IF EXISTS "Authenticated users can delete konversi_predikat_kinerja" ON public.konversi_predikat_kinerja;
DROP POLICY IF EXISTS "Authenticated users can insert konversi_predikat_kinerja" ON public.konversi_predikat_kinerja;
DROP POLICY IF EXISTS "Authenticated users can update konversi_predikat_kinerja" ON public.konversi_predikat_kinerja;
DROP POLICY IF EXISTS "Authenticated users can view konversi_predikat_kinerja" ON public.konversi_predikat_kinerja;
DROP POLICY IF EXISTS "Admins can manage konversi_predikat_kinerja" ON public.konversi_predikat_kinerja;

CREATE POLICY "Authenticated users can view konversi_predikat_kinerja"
ON public.konversi_predikat_kinerja FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage konversi_predikat_kinerja"
ON public.konversi_predikat_kinerja FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === KUNJUNGAN_TAMU ===
DROP POLICY IF EXISTS "Authenticated users can delete kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Authenticated users can insert kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Authenticated users can update kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Authenticated users can view kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Public can insert kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Anyone can insert kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Admins can update kunjungan_tamu" ON public.kunjungan_tamu;
DROP POLICY IF EXISTS "Admins can delete kunjungan_tamu" ON public.kunjungan_tamu;

CREATE POLICY "Anyone can insert kunjungan_tamu"
ON public.kunjungan_tamu FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Authenticated users can view kunjungan_tamu"
ON public.kunjungan_tamu FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update kunjungan_tamu"
ON public.kunjungan_tamu FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete kunjungan_tamu"
ON public.kunjungan_tamu FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- === REMAINING TABLES (Part 2) ===
-- mekanisme_54
DROP POLICY IF EXISTS "Authenticated users can delete mekanisme_54" ON public.mekanisme_54;
DROP POLICY IF EXISTS "Authenticated users can insert mekanisme_54" ON public.mekanisme_54;
DROP POLICY IF EXISTS "Authenticated users can update mekanisme_54" ON public.mekanisme_54;
DROP POLICY IF EXISTS "Authenticated users can view mekanisme_54" ON public.mekanisme_54;
DROP POLICY IF EXISTS "Admins can manage mekanisme_54" ON public.mekanisme_54;

CREATE POLICY "Authenticated users can view mekanisme_54"
ON public.mekanisme_54 FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage mekanisme_54"
ON public.mekanisme_54 FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- monev_laporan
DROP POLICY IF EXISTS "Authenticated users can delete monev_laporan" ON public.monev_laporan;
DROP POLICY IF EXISTS "Authenticated users can insert monev_laporan" ON public.monev_laporan;
DROP POLICY IF EXISTS "Authenticated users can update monev_laporan" ON public.monev_laporan;
DROP POLICY IF EXISTS "Authenticated users can view monev_laporan" ON public.monev_laporan;
DROP POLICY IF EXISTS "Admins can manage monev_laporan" ON public.monev_laporan;

CREATE POLICY "Authenticated users can view monev_laporan"
ON public.monev_laporan FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage monev_laporan"
ON public.monev_laporan FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- monitor_pbdk
DROP POLICY IF EXISTS "Authenticated users can delete monitor_pbdk" ON public.monitor_pbdk;
DROP POLICY IF EXISTS "Authenticated users can insert monitor_pbdk" ON public.monitor_pbdk;
DROP POLICY IF EXISTS "Authenticated users can update monitor_pbdk" ON public.monitor_pbdk;
DROP POLICY IF EXISTS "Authenticated users can view monitor_pbdk" ON public.monitor_pbdk;
DROP POLICY IF EXISTS "Admins can update monitor_pbdk" ON public.monitor_pbdk;
DROP POLICY IF EXISTS "Admins can delete monitor_pbdk" ON public.monitor_pbdk;

CREATE POLICY "Authenticated users can view monitor_pbdk"
ON public.monitor_pbdk FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert monitor_pbdk"
ON public.monitor_pbdk FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update monitor_pbdk"
ON public.monitor_pbdk FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete monitor_pbdk"
ON public.monitor_pbdk FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- monitoring_penilaian_perilaku
DROP POLICY IF EXISTS "Authenticated users can delete monitoring_penilaian_perilaku" ON public.monitoring_penilaian_perilaku;
DROP POLICY IF EXISTS "Authenticated users can insert monitoring_penilaian_perilaku" ON public.monitoring_penilaian_perilaku;
DROP POLICY IF EXISTS "Authenticated users can update monitoring_penilaian_perilaku" ON public.monitoring_penilaian_perilaku;
DROP POLICY IF EXISTS "Authenticated users can view monitoring_penilaian_perilaku" ON public.monitoring_penilaian_perilaku;
DROP POLICY IF EXISTS "Admins can manage monitoring_penilaian_perilaku" ON public.monitoring_penilaian_perilaku;

CREATE POLICY "Authenticated users can view monitoring_penilaian_perilaku"
ON public.monitoring_penilaian_perilaku FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage monitoring_penilaian_perilaku"
ON public.monitoring_penilaian_perilaku FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- mutasi
DROP POLICY IF EXISTS "Authenticated users can delete mutasi" ON public.mutasi;
DROP POLICY IF EXISTS "Authenticated users can insert mutasi" ON public.mutasi;
DROP POLICY IF EXISTS "Authenticated users can update mutasi" ON public.mutasi;
DROP POLICY IF EXISTS "Authenticated users can view mutasi" ON public.mutasi;
DROP POLICY IF EXISTS "Admins can manage mutasi" ON public.mutasi;

CREATE POLICY "Authenticated users can view mutasi"
ON public.mutasi FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage mutasi"
ON public.mutasi FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- news
DROP POLICY IF EXISTS "Authenticated users can delete news" ON public.news;
DROP POLICY IF EXISTS "Authenticated users can insert news" ON public.news;
DROP POLICY IF EXISTS "Authenticated users can update news" ON public.news;
DROP POLICY IF EXISTS "Authenticated users can view news" ON public.news;
DROP POLICY IF EXISTS "Anyone can view news" ON public.news;
DROP POLICY IF EXISTS "Admins can manage news" ON public.news;

CREATE POLICY "Anyone can view news"
ON public.news FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage news"
ON public.news FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can do everything on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- on_air_content
DROP POLICY IF EXISTS "Authenticated users can delete on_air_content" ON public.on_air_content;
DROP POLICY IF EXISTS "Authenticated users can insert on_air_content" ON public.on_air_content;
DROP POLICY IF EXISTS "Authenticated users can update on_air_content" ON public.on_air_content;
DROP POLICY IF EXISTS "Authenticated users can view on_air_content" ON public.on_air_content;
DROP POLICY IF EXISTS "Admins can manage on_air_content" ON public.on_air_content;

CREATE POLICY "Authenticated users can view on_air_content"
ON public.on_air_content FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage on_air_content"
ON public.on_air_content FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- peminjaman_arsip
DROP POLICY IF EXISTS "Authenticated users can delete peminjaman_arsip" ON public.peminjaman_arsip;
DROP POLICY IF EXISTS "Authenticated users can insert peminjaman_arsip" ON public.peminjaman_arsip;
DROP POLICY IF EXISTS "Authenticated users can update peminjaman_arsip" ON public.peminjaman_arsip;
DROP POLICY IF EXISTS "Authenticated users can view peminjaman_arsip" ON public.peminjaman_arsip;
DROP POLICY IF EXISTS "Admins can update peminjaman_arsip" ON public.peminjaman_arsip;
DROP POLICY IF EXISTS "Admins can delete peminjaman_arsip" ON public.peminjaman_arsip;

CREATE POLICY "Authenticated users can view peminjaman_arsip"
ON public.peminjaman_arsip FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert peminjaman_arsip"
ON public.peminjaman_arsip FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update peminjaman_arsip"
ON public.peminjaman_arsip FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete peminjaman_arsip"
ON public.peminjaman_arsip FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- pendataan_masuk
DROP POLICY IF EXISTS "Authenticated users can delete pendataan_masuk" ON public.pendataan_masuk;
DROP POLICY IF EXISTS "Authenticated users can insert pendataan_masuk" ON public.pendataan_masuk;
DROP POLICY IF EXISTS "Authenticated users can update pendataan_masuk" ON public.pendataan_masuk;
DROP POLICY IF EXISTS "Authenticated users can view pendataan_masuk" ON public.pendataan_masuk;
DROP POLICY IF EXISTS "Admins can update pendataan_masuk" ON public.pendataan_masuk;
DROP POLICY IF EXISTS "Admins can delete pendataan_masuk" ON public.pendataan_masuk;

CREATE POLICY "Authenticated users can view pendataan_masuk"
ON public.pendataan_masuk FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pendataan_masuk"
ON public.pendataan_masuk FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update pendataan_masuk"
ON public.pendataan_masuk FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pendataan_masuk"
ON public.pendataan_masuk FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- pendidikan
DROP POLICY IF EXISTS "Authenticated users can delete pendidikan" ON public.pendidikan;
DROP POLICY IF EXISTS "Authenticated users can insert pendidikan" ON public.pendidikan;
DROP POLICY IF EXISTS "Authenticated users can update pendidikan" ON public.pendidikan;
DROP POLICY IF EXISTS "Authenticated users can view pendidikan" ON public.pendidikan;
DROP POLICY IF EXISTS "Admins can manage pendidikan" ON public.pendidikan;

CREATE POLICY "Authenticated users can view pendidikan"
ON public.pendidikan FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage pendidikan"
ON public.pendidikan FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- pensiun
DROP POLICY IF EXISTS "Authenticated users can delete pensiun" ON public.pensiun;
DROP POLICY IF EXISTS "Authenticated users can insert pensiun" ON public.pensiun;
DROP POLICY IF EXISTS "Authenticated users can update pensiun" ON public.pensiun;
DROP POLICY IF EXISTS "Authenticated users can view pensiun" ON public.pensiun;
DROP POLICY IF EXISTS "Admins can manage pensiun" ON public.pensiun;

CREATE POLICY "Authenticated users can view pensiun"
ON public.pensiun FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage pensiun"
ON public.pensiun FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- permohonan_grading
DROP POLICY IF EXISTS "Authenticated users can delete permohonan_grading" ON public.permohonan_grading;
DROP POLICY IF EXISTS "Authenticated users can insert permohonan_grading" ON public.permohonan_grading;
DROP POLICY IF EXISTS "Authenticated users can update permohonan_grading" ON public.permohonan_grading;
DROP POLICY IF EXISTS "Authenticated users can view permohonan_grading" ON public.permohonan_grading;
DROP POLICY IF EXISTS "Admins can update permohonan_grading" ON public.permohonan_grading;
DROP POLICY IF EXISTS "Admins can delete permohonan_grading" ON public.permohonan_grading;

CREATE POLICY "Authenticated users can view permohonan_grading"
ON public.permohonan_grading FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert permohonan_grading"
ON public.permohonan_grading FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update permohonan_grading"
ON public.permohonan_grading FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete permohonan_grading"
ON public.permohonan_grading FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- plh_kepala
DROP POLICY IF EXISTS "Admins can do everything on plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Users can view plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Authenticated users can delete plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Authenticated users can insert plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Authenticated users can update plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Authenticated users can view plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Admins can update plh_kepala" ON public.plh_kepala;
DROP POLICY IF EXISTS "Admins can delete plh_kepala" ON public.plh_kepala;

CREATE POLICY "Authenticated users can view plh_kepala"
ON public.plh_kepala FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert plh_kepala"
ON public.plh_kepala FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update plh_kepala"
ON public.plh_kepala FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete plh_kepala"
ON public.plh_kepala FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- pu_syarat_general
DROP POLICY IF EXISTS "Authenticated users can delete pu_syarat_general" ON public.pu_syarat_general;
DROP POLICY IF EXISTS "Authenticated users can insert pu_syarat_general" ON public.pu_syarat_general;
DROP POLICY IF EXISTS "Authenticated users can update pu_syarat_general" ON public.pu_syarat_general;
DROP POLICY IF EXISTS "Authenticated users can view pu_syarat_general" ON public.pu_syarat_general;
DROP POLICY IF EXISTS "Admins can manage pu_syarat_general" ON public.pu_syarat_general;

CREATE POLICY "Authenticated users can view pu_syarat_general"
ON public.pu_syarat_general FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage pu_syarat_general"
ON public.pu_syarat_general FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- qr_presensi_events
DROP POLICY IF EXISTS "Authenticated users can insert qr_presensi_events" ON public.qr_presensi_events;
DROP POLICY IF EXISTS "Authenticated users can view qr_presensi_events" ON public.qr_presensi_events;
DROP POLICY IF EXISTS "Authenticated users can delete qr_presensi_events" ON public.qr_presensi_events;
DROP POLICY IF EXISTS "Authenticated users can update qr_presensi_events" ON public.qr_presensi_events;
DROP POLICY IF EXISTS "Admins can update qr_presensi_events" ON public.qr_presensi_events;
DROP POLICY IF EXISTS "Admins can delete qr_presensi_events" ON public.qr_presensi_events;

CREATE POLICY "Authenticated users can view qr_presensi_events"
ON public.qr_presensi_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert qr_presensi_events"
ON public.qr_presensi_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update qr_presensi_events"
ON public.qr_presensi_events FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete qr_presensi_events"
ON public.qr_presensi_events FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- qr_presensi_responses
DROP POLICY IF EXISTS "Authenticated users can insert qr_presensi_responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Authenticated users can view qr_presensi_responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Authenticated users can delete qr_presensi_responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Authenticated users can update qr_presensi_responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Anyone can insert qr_presensi_responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Admins can update qr_presensi_responses" ON public.qr_presensi_responses;
DROP POLICY IF EXISTS "Admins can delete qr_presensi_responses" ON public.qr_presensi_responses;

CREATE POLICY "Anyone can insert qr_presensi_responses"
ON public.qr_presensi_responses FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Authenticated users can view qr_presensi_responses"
ON public.qr_presensi_responses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update qr_presensi_responses"
ON public.qr_presensi_responses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete qr_presensi_responses"
ON public.qr_presensi_responses FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- realisasi_anggaran
DROP POLICY IF EXISTS "Authenticated users can delete realisasi_anggaran" ON public.realisasi_anggaran;
DROP POLICY IF EXISTS "Authenticated users can insert realisasi_anggaran" ON public.realisasi_anggaran;
DROP POLICY IF EXISTS "Authenticated users can update realisasi_anggaran" ON public.realisasi_anggaran;
DROP POLICY IF EXISTS "Authenticated users can view realisasi_anggaran" ON public.realisasi_anggaran;
DROP POLICY IF EXISTS "Admins can manage realisasi_anggaran" ON public.realisasi_anggaran;

CREATE POLICY "Authenticated users can view realisasi_anggaran"
ON public.realisasi_anggaran FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage realisasi_anggaran"
ON public.realisasi_anggaran FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- rekap_realisasi_perjadin
DROP POLICY IF EXISTS "Authenticated users can delete rekap_realisasi_perjadin" ON public.rekap_realisasi_perjadin;
DROP POLICY IF EXISTS "Authenticated users can insert rekap_realisasi_perjadin" ON public.rekap_realisasi_perjadin;
DROP POLICY IF EXISTS "Authenticated users can update rekap_realisasi_perjadin" ON public.rekap_realisasi_perjadin;
DROP POLICY IF EXISTS "Authenticated users can view rekap_realisasi_perjadin" ON public.rekap_realisasi_perjadin;
DROP POLICY IF EXISTS "Admins can manage rekap_realisasi_perjadin" ON public.rekap_realisasi_perjadin;

CREATE POLICY "Authenticated users can view rekap_realisasi_perjadin"
ON public.rekap_realisasi_perjadin FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rekap_realisasi_perjadin"
ON public.rekap_realisasi_perjadin FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- rumah_negara
DROP POLICY IF EXISTS "Authenticated users can delete rumah_negara" ON public.rumah_negara;
DROP POLICY IF EXISTS "Authenticated users can insert rumah_negara" ON public.rumah_negara;
DROP POLICY IF EXISTS "Authenticated users can update rumah_negara" ON public.rumah_negara;
DROP POLICY IF EXISTS "Authenticated users can view rumah_negara" ON public.rumah_negara;
DROP POLICY IF EXISTS "Admins can manage rumah_negara" ON public.rumah_negara;

CREATE POLICY "Authenticated users can view rumah_negara"
ON public.rumah_negara FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rumah_negara"
ON public.rumah_negara FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- rundown
DROP POLICY IF EXISTS "Authenticated users can delete rundown" ON public.rundown;
DROP POLICY IF EXISTS "Authenticated users can insert rundown" ON public.rundown;
DROP POLICY IF EXISTS "Authenticated users can update rundown" ON public.rundown;
DROP POLICY IF EXISTS "Authenticated users can view rundown" ON public.rundown;
DROP POLICY IF EXISTS "Admins can update rundown" ON public.rundown;
DROP POLICY IF EXISTS "Admins can delete rundown" ON public.rundown;

CREATE POLICY "Authenticated users can view rundown"
ON public.rundown FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert rundown"
ON public.rundown FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update rundown"
ON public.rundown FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rundown"
ON public.rundown FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- rundown_items
DROP POLICY IF EXISTS "Authenticated users can delete rundown_items" ON public.rundown_items;
DROP POLICY IF EXISTS "Authenticated users can insert rundown_items" ON public.rundown_items;
DROP POLICY IF EXISTS "Authenticated users can update rundown_items" ON public.rundown_items;
DROP POLICY IF EXISTS "Authenticated users can view rundown_items" ON public.rundown_items;
DROP POLICY IF EXISTS "Admins can update rundown_items" ON public.rundown_items;
DROP POLICY IF EXISTS "Admins can delete rundown_items" ON public.rundown_items;

CREATE POLICY "Authenticated users can view rundown_items"
ON public.rundown_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert rundown_items"
ON public.rundown_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update rundown_items"
ON public.rundown_items FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete rundown_items"
ON public.rundown_items FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- satker_cortax
DROP POLICY IF EXISTS "Authenticated users can delete satker_cortax" ON public.satker_cortax;
DROP POLICY IF EXISTS "Authenticated users can insert satker_cortax" ON public.satker_cortax;
DROP POLICY IF EXISTS "Authenticated users can update satker_cortax" ON public.satker_cortax;
DROP POLICY IF EXISTS "Authenticated users can view satker_cortax" ON public.satker_cortax;
DROP POLICY IF EXISTS "Admins can manage satker_cortax" ON public.satker_cortax;

CREATE POLICY "Authenticated users can view satker_cortax"
ON public.satker_cortax FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage satker_cortax"
ON public.satker_cortax FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- satuan_kerja
DROP POLICY IF EXISTS "Authenticated users can delete satuan_kerja" ON public.satuan_kerja;
DROP POLICY IF EXISTS "Authenticated users can insert satuan_kerja" ON public.satuan_kerja;
DROP POLICY IF EXISTS "Authenticated users can update satuan_kerja" ON public.satuan_kerja;
DROP POLICY IF EXISTS "Authenticated users can view satuan_kerja" ON public.satuan_kerja;
DROP POLICY IF EXISTS "Admins can manage satuan_kerja" ON public.satuan_kerja;

CREATE POLICY "Authenticated users can view satuan_kerja"
ON public.satuan_kerja FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage satuan_kerja"
ON public.satuan_kerja FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- st_luar_kantor
DROP POLICY IF EXISTS "Authenticated users can delete st_luar_kantor" ON public.st_luar_kantor;
DROP POLICY IF EXISTS "Authenticated users can insert st_luar_kantor" ON public.st_luar_kantor;
DROP POLICY IF EXISTS "Authenticated users can update st_luar_kantor" ON public.st_luar_kantor;
DROP POLICY IF EXISTS "Authenticated users can view st_luar_kantor" ON public.st_luar_kantor;
DROP POLICY IF EXISTS "Admins can update st_luar_kantor" ON public.st_luar_kantor;
DROP POLICY IF EXISTS "Admins can delete st_luar_kantor" ON public.st_luar_kantor;

CREATE POLICY "Authenticated users can view st_luar_kantor"
ON public.st_luar_kantor FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert st_luar_kantor"
ON public.st_luar_kantor FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update st_luar_kantor"
ON public.st_luar_kantor FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete st_luar_kantor"
ON public.st_luar_kantor FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- stories
DROP POLICY IF EXISTS "Authenticated users can delete stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated users can update stories" ON public.stories;
DROP POLICY IF EXISTS "Authenticated users can view stories" ON public.stories;
DROP POLICY IF EXISTS "Admins can manage stories" ON public.stories;

CREATE POLICY "Authenticated users can view stories"
ON public.stories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage stories"
ON public.stories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- surat_masuk
DROP POLICY IF EXISTS "Authenticated users can delete surat_masuk" ON public.surat_masuk;
DROP POLICY IF EXISTS "Authenticated users can insert surat_masuk" ON public.surat_masuk;
DROP POLICY IF EXISTS "Authenticated users can update surat_masuk" ON public.surat_masuk;
DROP POLICY IF EXISTS "Authenticated users can view surat_masuk" ON public.surat_masuk;
DROP POLICY IF EXISTS "Admins can update surat_masuk" ON public.surat_masuk;
DROP POLICY IF EXISTS "Admins can delete surat_masuk" ON public.surat_masuk;

CREATE POLICY "Authenticated users can view surat_masuk"
ON public.surat_masuk FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert surat_masuk"
ON public.surat_masuk FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update surat_masuk"
ON public.surat_masuk FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete surat_masuk"
ON public.surat_masuk FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- tim_keuangan
DROP POLICY IF EXISTS "Authenticated users can view tim_keuangan" ON public.tim_keuangan;
DROP POLICY IF EXISTS "Admins can manage tim_keuangan" ON public.tim_keuangan;

CREATE POLICY "Authenticated users can view tim_keuangan"
ON public.tim_keuangan FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tim_keuangan"
ON public.tim_keuangan FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- tim_upk
DROP POLICY IF EXISTS "Authenticated users can view tim_upk" ON public.tim_upk;
DROP POLICY IF EXISTS "Admins can manage tim_upk" ON public.tim_upk;

CREATE POLICY "Authenticated users can view tim_upk"
ON public.tim_upk FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage tim_upk"
ON public.tim_upk FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_menu_access
DROP POLICY IF EXISTS "Authenticated users can view user_menu_access" ON public.user_menu_access;
DROP POLICY IF EXISTS "Admins can manage user_menu_access" ON public.user_menu_access;
DROP POLICY IF EXISTS "Users can view own menu access" ON public.user_menu_access;

CREATE POLICY "Users can view own menu access"
ON public.user_menu_access FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user_menu_access"
ON public.user_menu_access FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
