export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      absen_manual: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          jumlah_page: number
          nama_kegiatan: string
          tanggal: string
          tempat: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jumlah_page?: number
          nama_kegiatan: string
          tanggal: string
          tempat: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jumlah_page?: number
          nama_kegiatan?: string
          tanggal?: string
          tempat?: string
          updated_at?: string
        }
        Relationships: []
      }
      absensi: {
        Row: {
          created_at: string
          id: string
          jam_masuk: string | null
          jam_pulang: string | null
          nama: string
          nip: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jam_masuk?: string | null
          jam_pulang?: string | null
          nama: string
          nip: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jam_masuk?: string | null
          jam_pulang?: string | null
          nama?: string
          nip?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: []
      }
      agenda: {
        Row: {
          consumption_needed: number
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          hal: string | null
          id: string
          konfirmasi: string | null
          lokasi: string | null
          nomor_surat: string | null
          notes: string | null
          room_name: string
          seating_arrangement: string | null
          start_time: string | null
          title: string
          total_attendees: number
          tujuan_dispo: string[] | null
          updated_at: string
        }
        Insert: {
          consumption_needed?: number
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          hal?: string | null
          id?: string
          konfirmasi?: string | null
          lokasi?: string | null
          nomor_surat?: string | null
          notes?: string | null
          room_name: string
          seating_arrangement?: string | null
          start_time?: string | null
          title: string
          total_attendees?: number
          tujuan_dispo?: string[] | null
          updated_at?: string
        }
        Update: {
          consumption_needed?: number
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          hal?: string | null
          id?: string
          konfirmasi?: string | null
          lokasi?: string | null
          nomor_surat?: string | null
          notes?: string | null
          room_name?: string
          seating_arrangement?: string | null
          start_time?: string | null
          title?: string
          total_attendees?: number
          tujuan_dispo?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      aktivasi_cortax: {
        Row: {
          bagian_bidang: string | null
          bukti_registrasi: string | null
          created_at: string
          id: string
          login_portal: string | null
          nama_lengkap: string
          nip: string
          nomor: number | null
          pangkat: string | null
          status_kode_otorisasi: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          bagian_bidang?: string | null
          bukti_registrasi?: string | null
          created_at?: string
          id?: string
          login_portal?: string | null
          nama_lengkap: string
          nip: string
          nomor?: number | null
          pangkat?: string | null
          status_kode_otorisasi?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          bagian_bidang?: string | null
          bukti_registrasi?: string | null
          created_at?: string
          id?: string
          login_portal?: string | null
          nama_lengkap?: string
          nip?: string
          nomor?: number | null
          pangkat?: string | null
          status_kode_otorisasi?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          agenda_number: number
          assigned_upk_at: string | null
          assigned_upk_id: string | null
          assigned_upk_manually: boolean | null
          created_at: string
          created_by_email: string | null
          dasar_penugasan: string
          document_path: string | null
          employee_ids: string[]
          id: string
          jenis_penugasan: string | null
          konsep_masuk_at: string | null
          konsep_masuk_by: string | null
          konsep_path: string | null
          lokasi_penugasan_detail: string | null
          manual_employees: Json | null
          no_satu_kemenkeu: string | null
          nomor_naskah_dinas: string
          nota_dinas_downloaded: boolean | null
          nota_dinas_downloaded_at: string | null
          nota_dinas_downloaded_by: string | null
          pejabat_unit_pemohon_id: string
          pejabat_unit_penerbit_id: string
          perihal: string
          proses_nd_at: string | null
          proses_nd_by: string | null
          proses_st_at: string | null
          proses_st_by: string | null
          rating_at: string | null
          rating_by: string | null
          rating_penilaian: number | null
          saran_feedback: string | null
          selesai_at: string | null
          selesai_by: string | null
          sumber: string | null
          sumber_satuan_kerja: string | null
          sumber_satuan_kerja_custom: string | null
          surat_tugas_downloaded: boolean | null
          surat_tugas_downloaded_at: string | null
          surat_tugas_downloaded_by: string | null
          tanggal_mulai_kegiatan: string | null
          tanggal_naskah: string
          tanggal_satu_kemenkeu: string | null
          tanggal_selesai_kegiatan: string | null
          tempat_penugasan: string
          tujuan: string
          unit_pemohon: string
          unit_penerbit: string
          updated_at: string
          updated_by_email: string | null
          verifikasi_keuangan_at: string | null
          verifikasi_keuangan_by: string | null
          verifikasi_keuangan_catatan: string | null
          verifikasi_keuangan_status: string | null
          waktu_penugasan: string
        }
        Insert: {
          agenda_number: number
          assigned_upk_at?: string | null
          assigned_upk_id?: string | null
          assigned_upk_manually?: boolean | null
          created_at?: string
          created_by_email?: string | null
          dasar_penugasan: string
          document_path?: string | null
          employee_ids: string[]
          id?: string
          jenis_penugasan?: string | null
          konsep_masuk_at?: string | null
          konsep_masuk_by?: string | null
          konsep_path?: string | null
          lokasi_penugasan_detail?: string | null
          manual_employees?: Json | null
          no_satu_kemenkeu?: string | null
          nomor_naskah_dinas: string
          nota_dinas_downloaded?: boolean | null
          nota_dinas_downloaded_at?: string | null
          nota_dinas_downloaded_by?: string | null
          pejabat_unit_pemohon_id: string
          pejabat_unit_penerbit_id?: string
          perihal: string
          proses_nd_at?: string | null
          proses_nd_by?: string | null
          proses_st_at?: string | null
          proses_st_by?: string | null
          rating_at?: string | null
          rating_by?: string | null
          rating_penilaian?: number | null
          saran_feedback?: string | null
          selesai_at?: string | null
          selesai_by?: string | null
          sumber?: string | null
          sumber_satuan_kerja?: string | null
          sumber_satuan_kerja_custom?: string | null
          surat_tugas_downloaded?: boolean | null
          surat_tugas_downloaded_at?: string | null
          surat_tugas_downloaded_by?: string | null
          tanggal_mulai_kegiatan?: string | null
          tanggal_naskah: string
          tanggal_satu_kemenkeu?: string | null
          tanggal_selesai_kegiatan?: string | null
          tempat_penugasan: string
          tujuan: string
          unit_pemohon: string
          unit_penerbit: string
          updated_at?: string
          updated_by_email?: string | null
          verifikasi_keuangan_at?: string | null
          verifikasi_keuangan_by?: string | null
          verifikasi_keuangan_catatan?: string | null
          verifikasi_keuangan_status?: string | null
          waktu_penugasan: string
        }
        Update: {
          agenda_number?: number
          assigned_upk_at?: string | null
          assigned_upk_id?: string | null
          assigned_upk_manually?: boolean | null
          created_at?: string
          created_by_email?: string | null
          dasar_penugasan?: string
          document_path?: string | null
          employee_ids?: string[]
          id?: string
          jenis_penugasan?: string | null
          konsep_masuk_at?: string | null
          konsep_masuk_by?: string | null
          konsep_path?: string | null
          lokasi_penugasan_detail?: string | null
          manual_employees?: Json | null
          no_satu_kemenkeu?: string | null
          nomor_naskah_dinas?: string
          nota_dinas_downloaded?: boolean | null
          nota_dinas_downloaded_at?: string | null
          nota_dinas_downloaded_by?: string | null
          pejabat_unit_pemohon_id?: string
          pejabat_unit_penerbit_id?: string
          perihal?: string
          proses_nd_at?: string | null
          proses_nd_by?: string | null
          proses_st_at?: string | null
          proses_st_by?: string | null
          rating_at?: string | null
          rating_by?: string | null
          rating_penilaian?: number | null
          saran_feedback?: string | null
          selesai_at?: string | null
          selesai_by?: string | null
          sumber?: string | null
          sumber_satuan_kerja?: string | null
          sumber_satuan_kerja_custom?: string | null
          surat_tugas_downloaded?: boolean | null
          surat_tugas_downloaded_at?: string | null
          surat_tugas_downloaded_by?: string | null
          tanggal_mulai_kegiatan?: string | null
          tanggal_naskah?: string
          tanggal_satu_kemenkeu?: string | null
          tanggal_selesai_kegiatan?: string | null
          tempat_penugasan?: string
          tujuan?: string
          unit_pemohon?: string
          unit_penerbit?: string
          updated_at?: string
          updated_by_email?: string | null
          verifikasi_keuangan_at?: string | null
          verifikasi_keuangan_by?: string | null
          verifikasi_keuangan_catatan?: string | null
          verifikasi_keuangan_status?: string | null
          waktu_penugasan?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_upk_id_fkey"
            columns: ["assigned_upk_id"]
            isOneToOne: false
            referencedRelation: "tim_upk"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_penugasan: {
        Row: {
          alamat: string | null
          bentuk_kantor: string | null
          created_at: string
          created_by_email: string | null
          dipa: string | null
          fasilitas: string | null
          id: string
          jabatan_a1: string | null
          jabatan_a2: string | null
          jabatan_a3: string | null
          jabatan_katim: string | null
          jabatan_pma: string | null
          jabatan_pta: string | null
          nama_a1: string | null
          nama_a2: string | null
          nama_a3: string | null
          nama_katim: string | null
          nama_perusahaan: string | null
          nama_pma: string | null
          nama_pta: string | null
          no: number
          no_st_induk: string | null
          npa: string | null
          npwp: string | null
          pangkat_gol_a1: string | null
          pangkat_gol_a2: string | null
          pangkat_gol_a3: string | null
          pangkat_gol_katim: string | null
          pangkat_gol_pma: string | null
          pangkat_gol_pta: string | null
          periode_ke: string | null
          tahap_pelaksanaan_st_ke: string | null
          tanggal_akhir_peklap: string | null
          tanggal_akhir_periode: string | null
          tanggal_awal_peklap: string | null
          tanggal_awal_periode: string | null
          tanggal_st_induk: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          bentuk_kantor?: string | null
          created_at?: string
          created_by_email?: string | null
          dipa?: string | null
          fasilitas?: string | null
          id?: string
          jabatan_a1?: string | null
          jabatan_a2?: string | null
          jabatan_a3?: string | null
          jabatan_katim?: string | null
          jabatan_pma?: string | null
          jabatan_pta?: string | null
          nama_a1?: string | null
          nama_a2?: string | null
          nama_a3?: string | null
          nama_katim?: string | null
          nama_perusahaan?: string | null
          nama_pma?: string | null
          nama_pta?: string | null
          no?: number
          no_st_induk?: string | null
          npa?: string | null
          npwp?: string | null
          pangkat_gol_a1?: string | null
          pangkat_gol_a2?: string | null
          pangkat_gol_a3?: string | null
          pangkat_gol_katim?: string | null
          pangkat_gol_pma?: string | null
          pangkat_gol_pta?: string | null
          periode_ke?: string | null
          tahap_pelaksanaan_st_ke?: string | null
          tanggal_akhir_peklap?: string | null
          tanggal_akhir_periode?: string | null
          tanggal_awal_peklap?: string | null
          tanggal_awal_periode?: string | null
          tanggal_st_induk?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          bentuk_kantor?: string | null
          created_at?: string
          created_by_email?: string | null
          dipa?: string | null
          fasilitas?: string | null
          id?: string
          jabatan_a1?: string | null
          jabatan_a2?: string | null
          jabatan_a3?: string | null
          jabatan_katim?: string | null
          jabatan_pma?: string | null
          jabatan_pta?: string | null
          nama_a1?: string | null
          nama_a2?: string | null
          nama_a3?: string | null
          nama_katim?: string | null
          nama_perusahaan?: string | null
          nama_pma?: string | null
          nama_pta?: string | null
          no?: number
          no_st_induk?: string | null
          npa?: string | null
          npwp?: string | null
          pangkat_gol_a1?: string | null
          pangkat_gol_a2?: string | null
          pangkat_gol_a3?: string | null
          pangkat_gol_katim?: string | null
          pangkat_gol_pma?: string | null
          pangkat_gol_pta?: string | null
          periode_ke?: string | null
          tahap_pelaksanaan_st_ke?: string | null
          tanggal_akhir_peklap?: string | null
          tanggal_akhir_periode?: string | null
          tanggal_awal_peklap?: string | null
          tanggal_awal_periode?: string | null
          tanggal_st_induk?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_issue: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          issue: string
          no: number | null
          solusi: string | null
          uic: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          issue: string
          no?: number | null
          solusi?: string | null
          uic?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          issue?: string
          no?: number | null
          solusi?: string | null
          uic?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      berita_acara_sidang: {
        Row: {
          created_at: string
          created_by_email: string | null
          detail_kategori: Json | null
          id: string
          kategori: string | null
          lokasi: string | null
          nama_pimpinan: string | null
          nip_pimpinan: string | null
          no_urut: number | null
          nomor_ba: string | null
          pegawai_klaster_ii: Json | null
          peserta: Json | null
          satuan_kerja: string | null
          tanggal: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          detail_kategori?: Json | null
          id?: string
          kategori?: string | null
          lokasi?: string | null
          nama_pimpinan?: string | null
          nip_pimpinan?: string | null
          no_urut?: number | null
          nomor_ba?: string | null
          pegawai_klaster_ii?: Json | null
          peserta?: Json | null
          satuan_kerja?: string | null
          tanggal?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          detail_kategori?: Json | null
          id?: string
          kategori?: string | null
          lokasi?: string | null
          nama_pimpinan?: string | null
          nip_pimpinan?: string | null
          no_urut?: number | null
          nomor_ba?: string | null
          pegawai_klaster_ii?: Json | null
          peserta?: Json | null
          satuan_kerja?: string | null
          tanggal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      book_nomor_manual: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string | null
          created_at: string
          id: string
          jenis_perihal: string | null
          jenis_surat: string
          kepada: string
          nama_bidang: string
          nama_lengkap: string
          nominal: number | null
          nomor_lengkap: string
          nomor_urut: number
          perihal: string
          status_approval: string | null
          tanggal: string
          updated_at: string
          user_email: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          id?: string
          jenis_perihal?: string | null
          jenis_surat: string
          kepada: string
          nama_bidang: string
          nama_lengkap: string
          nominal?: number | null
          nomor_lengkap: string
          nomor_urut: number
          perihal: string
          status_approval?: string | null
          tanggal?: string
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          created_at?: string
          id?: string
          jenis_perihal?: string | null
          jenis_surat?: string
          kepada?: string
          nama_bidang?: string
          nama_lengkap?: string
          nominal?: number | null
          nomor_lengkap?: string
          nomor_urut?: number
          perihal?: string
          status_approval?: string | null
          tanggal?: string
          updated_at?: string
          user_email?: string | null
        }
        Relationships: []
      }
      buku_bambu: {
        Row: {
          catatan: string | null
          created_at: string
          created_by_email: string | null
          created_by_name: string | null
          dari_unit: string
          foto_absen: string | null
          hal: string | null
          id: string
          ke_unit: string
          nama_penerima: string
          no_urut: number | null
          nomor_surat: string | null
          pdf_dokumen: string | null
          surat_masuk_id: string | null
          tanggal_kirim: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by_email?: string | null
          created_by_name?: string | null
          dari_unit: string
          foto_absen?: string | null
          hal?: string | null
          id?: string
          ke_unit: string
          nama_penerima: string
          no_urut?: number | null
          nomor_surat?: string | null
          pdf_dokumen?: string | null
          surat_masuk_id?: string | null
          tanggal_kirim?: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by_email?: string | null
          created_by_name?: string | null
          dari_unit?: string
          foto_absen?: string | null
          hal?: string | null
          id?: string
          ke_unit?: string
          nama_penerima?: string
          no_urut?: number | null
          nomor_surat?: string | null
          pdf_dokumen?: string | null
          surat_masuk_id?: string | null
          tanggal_kirim?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buku_bambu_surat_masuk_id_fkey"
            columns: ["surat_masuk_id"]
            isOneToOne: false
            referencedRelation: "surat_masuk"
            referencedColumns: ["id"]
          },
        ]
      }
      corebase_db_goljab: {
        Row: {
          created_at: string
          created_by_email: string | null
          golongan: string | null
          id: string
          jabatan: string | null
          nama: string
          nip: string
          pangkat: string | null
          satuan_kerja: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          golongan?: string | null
          id?: string
          jabatan?: string | null
          nama: string
          nip: string
          pangkat?: string | null
          satuan_kerja?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          golongan?: string | null
          id?: string
          jabatan?: string | null
          nama?: string
          nip?: string
          pangkat?: string | null
          satuan_kerja?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corebase_db_pensiun: {
        Row: {
          bup: number | null
          created_at: string
          created_by_email: string | null
          eselon_jenjang: string | null
          id: string
          kode_jabatan: string | null
          nama: string
          nip: string
          tgl_lahir: string | null
          tmt_pensiun: string | null
          updated_at: string
        }
        Insert: {
          bup?: number | null
          created_at?: string
          created_by_email?: string | null
          eselon_jenjang?: string | null
          id?: string
          kode_jabatan?: string | null
          nama: string
          nip: string
          tgl_lahir?: string | null
          tmt_pensiun?: string | null
          updated_at?: string
        }
        Update: {
          bup?: number | null
          created_at?: string
          created_by_email?: string | null
          eselon_jenjang?: string | null
          id?: string
          kode_jabatan?: string | null
          nama?: string
          nip?: string
          tgl_lahir?: string | null
          tmt_pensiun?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corebase_db_pokok: {
        Row: {
          agama: string | null
          automasi_cek_tmt_cpns: string | null
          cek_tmt_cpns: string | null
          created_at: string
          created_by_email: string | null
          gender: string | null
          id: string
          nama: string
          nip: string
          no_reg: number
          tempat_lahir: string | null
          tgl_lahir: string | null
          tmt_cpns: string | null
          tmt_pns: string | null
          updated_at: string
        }
        Insert: {
          agama?: string | null
          automasi_cek_tmt_cpns?: string | null
          cek_tmt_cpns?: string | null
          created_at?: string
          created_by_email?: string | null
          gender?: string | null
          id?: string
          nama: string
          nip: string
          no_reg?: number
          tempat_lahir?: string | null
          tgl_lahir?: string | null
          tmt_cpns?: string | null
          tmt_pns?: string | null
          updated_at?: string
        }
        Update: {
          agama?: string | null
          automasi_cek_tmt_cpns?: string | null
          cek_tmt_cpns?: string | null
          created_at?: string
          created_by_email?: string | null
          gender?: string | null
          id?: string
          nama?: string
          nip?: string
          no_reg?: number
          tempat_lahir?: string | null
          tgl_lahir?: string | null
          tmt_cpns?: string | null
          tmt_pns?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corebase_db_rekam_jejak: {
        Row: {
          created_at: string
          created_by_email: string | null
          durasi_satker: string | null
          es_jenjang_jp: string | null
          id: string
          jenis: string | null
          nama: string
          nama_jab_sub_unsur: string | null
          nama_satker: string | null
          nip: string
          tmt_satker: string | null
          unit_es_iii: string | null
          unit_es_iv: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          durasi_satker?: string | null
          es_jenjang_jp?: string | null
          id?: string
          jenis?: string | null
          nama: string
          nama_jab_sub_unsur?: string | null
          nama_satker?: string | null
          nip: string
          tmt_satker?: string | null
          unit_es_iii?: string | null
          unit_es_iv?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          durasi_satker?: string | null
          es_jenjang_jp?: string | null
          id?: string
          jenis?: string | null
          nama?: string
          nama_jab_sub_unsur?: string | null
          nama_satker?: string | null
          nip?: string
          tmt_satker?: string | null
          unit_es_iii?: string | null
          unit_es_iv?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corebase_db_status: {
        Row: {
          cltn_status_argo: string | null
          cltn_surat_izin_nomor: string | null
          cltn_tgl_akhir: string | null
          cltn_tgl_mulai: string | null
          created_at: string
          created_by_email: string | null
          flag_cltn: boolean | null
          flag_meninggal: boolean | null
          flag_pemberhentian: boolean | null
          id: string
          meninggal_tgl: string | null
          nama: string
          nip: string
          pemberhentian_jenis: string | null
          pemberhentian_no_skep: string | null
          pemberhentian_tgl_berlaku: string | null
          pemberhentian_tgl_diterima: string | null
          pemberhentian_tgl_skep: string | null
          pemberhentian_tindak_lanjut: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          cltn_status_argo?: string | null
          cltn_surat_izin_nomor?: string | null
          cltn_tgl_akhir?: string | null
          cltn_tgl_mulai?: string | null
          created_at?: string
          created_by_email?: string | null
          flag_cltn?: boolean | null
          flag_meninggal?: boolean | null
          flag_pemberhentian?: boolean | null
          id?: string
          meninggal_tgl?: string | null
          nama: string
          nip: string
          pemberhentian_jenis?: string | null
          pemberhentian_no_skep?: string | null
          pemberhentian_tgl_berlaku?: string | null
          pemberhentian_tgl_diterima?: string | null
          pemberhentian_tgl_skep?: string | null
          pemberhentian_tindak_lanjut?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          cltn_status_argo?: string | null
          cltn_surat_izin_nomor?: string | null
          cltn_tgl_akhir?: string | null
          cltn_tgl_mulai?: string | null
          created_at?: string
          created_by_email?: string | null
          flag_cltn?: boolean | null
          flag_meninggal?: boolean | null
          flag_pemberhentian?: boolean | null
          id?: string
          meninggal_tgl?: string | null
          nama?: string
          nip?: string
          pemberhentian_jenis?: string | null
          pemberhentian_no_skep?: string | null
          pemberhentian_tgl_berlaku?: string | null
          pemberhentian_tgl_diterima?: string | null
          pemberhentian_tgl_skep?: string | null
          pemberhentian_tindak_lanjut?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cuti: {
        Row: {
          alasan: string | null
          created_at: string
          cuti_setengah: string | null
          flag_cuti_tambahan: boolean | null
          id: string
          jabatan_pegawai: string | null
          nama_pegawai: string
          nip: string
          pangkat_pegawai: string | null
          proses: string | null
          status: string | null
          tahun_cuti: number
          tanggal_cuti_alasan_penting: string | null
          tanggal_cuti_besar_non_keagamaan: string | null
          tanggal_cuti_melahirkan: string | null
          tanggal_cuti_sakit: string | null
          tanggal_cuti_tahunan: string | null
          tanggal_pengganti_cuti_bersama: string | null
          tgl_akhir_tambahan: string | null
          tgl_awal_tambahan: string | null
          total_cuti_alasan_penting: number | null
          total_cuti_besar_non_keagamaan: number | null
          total_cuti_melahirkan: number | null
          total_cuti_sakit: number | null
          total_cuti_tahunan: number | null
          total_pengganti_cuti_bersama: number | null
          updated_at: string
        }
        Insert: {
          alasan?: string | null
          created_at?: string
          cuti_setengah?: string | null
          flag_cuti_tambahan?: boolean | null
          id?: string
          jabatan_pegawai?: string | null
          nama_pegawai: string
          nip: string
          pangkat_pegawai?: string | null
          proses?: string | null
          status?: string | null
          tahun_cuti: number
          tanggal_cuti_alasan_penting?: string | null
          tanggal_cuti_besar_non_keagamaan?: string | null
          tanggal_cuti_melahirkan?: string | null
          tanggal_cuti_sakit?: string | null
          tanggal_cuti_tahunan?: string | null
          tanggal_pengganti_cuti_bersama?: string | null
          tgl_akhir_tambahan?: string | null
          tgl_awal_tambahan?: string | null
          total_cuti_alasan_penting?: number | null
          total_cuti_besar_non_keagamaan?: number | null
          total_cuti_melahirkan?: number | null
          total_cuti_sakit?: number | null
          total_cuti_tahunan?: number | null
          total_pengganti_cuti_bersama?: number | null
          updated_at?: string
        }
        Update: {
          alasan?: string | null
          created_at?: string
          cuti_setengah?: string | null
          flag_cuti_tambahan?: boolean | null
          id?: string
          jabatan_pegawai?: string | null
          nama_pegawai?: string
          nip?: string
          pangkat_pegawai?: string | null
          proses?: string | null
          status?: string | null
          tahun_cuti?: number
          tanggal_cuti_alasan_penting?: string | null
          tanggal_cuti_besar_non_keagamaan?: string | null
          tanggal_cuti_melahirkan?: string | null
          tanggal_cuti_sakit?: string | null
          tanggal_cuti_tahunan?: string | null
          tanggal_pengganti_cuti_bersama?: string | null
          tgl_akhir_tambahan?: string | null
          tgl_awal_tambahan?: string | null
          total_cuti_alasan_penting?: number | null
          total_cuti_besar_non_keagamaan?: number | null
          total_cuti_melahirkan?: number | null
          total_cuti_sakit?: number | null
          total_cuti_tahunan?: number | null
          total_pengganti_cuti_bersama?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      daftar_berkas: {
        Row: {
          created_at: string
          id: string
          jenis_arsip: string | null
          jumlah: number
          keterangan: string
          kode_klasifikasi: string
          kurun_waktu: string
          lokasi: string
          no_berkas: number
          pic: string
          tingkat_perkembangan: string
          updated_at: string
          uraian_informasi_berkas: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_arsip?: string | null
          jumlah: number
          keterangan: string
          kode_klasifikasi: string
          kurun_waktu: string
          lokasi: string
          no_berkas: number
          pic: string
          tingkat_perkembangan: string
          updated_at?: string
          uraian_informasi_berkas: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis_arsip?: string | null
          jumlah?: number
          keterangan?: string
          kode_klasifikasi?: string
          kurun_waktu?: string
          lokasi?: string
          no_berkas?: number
          pic?: string
          tingkat_perkembangan?: string
          updated_at?: string
          uraian_informasi_berkas?: string
        }
        Relationships: []
      }
      daftar_grade: {
        Row: {
          created_at: string
          created_by_email: string | null
          grade: number
          id: string
          jabatan: string
          klaster: string
          no_urut: number | null
          syarat_golongan: string | null
          syarat_pendidikan: string | null
          tugas_jabatan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          grade: number
          id?: string
          jabatan: string
          klaster: string
          no_urut?: number | null
          syarat_golongan?: string | null
          syarat_pendidikan?: string | null
          tugas_jabatan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          grade?: number
          id?: string
          jabatan?: string
          klaster?: string
          no_urut?: number | null
          syarat_golongan?: string | null
          syarat_pendidikan?: string | null
          tugas_jabatan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      digital_footprint: {
        Row: {
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          status: string
          tasks: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status: string
          tasks?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          tasks?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      digital_footprint_tasks: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          task_text: string
          updated_at: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          task_text: string
          updated_at?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          task_text?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      distribusi_surat: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          jenis_dokumen: string
          keterangan: string | null
          nama_lengkap: string
          nama_penerima: string | null
          nip: string | null
          no_urut: number
          nomor_dokumen: string | null
          satuan_kerja: string
          status_distribusi: string | null
          tanggal_pengambilan: string | null
          tanggal_terima: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jenis_dokumen: string
          keterangan?: string | null
          nama_lengkap: string
          nama_penerima?: string | null
          nip?: string | null
          no_urut?: number
          nomor_dokumen?: string | null
          satuan_kerja: string
          status_distribusi?: string | null
          tanggal_pengambilan?: string | null
          tanggal_terima?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jenis_dokumen?: string
          keterangan?: string | null
          nama_lengkap?: string
          nama_penerima?: string | null
          nip?: string | null
          no_urut?: number
          nomor_dokumen?: string | null
          satuan_kerja?: string
          status_distribusi?: string | null
          tanggal_pengambilan?: string | null
          tanggal_terima?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dosir_in: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          is_dosir_complete: boolean | null
          is_spd_complete: boolean | null
          nama_lengkap: string
          nip: string | null
          tanggal_input: string
          tim_upk_id: string | null
          tim_upk_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          is_dosir_complete?: boolean | null
          is_spd_complete?: boolean | null
          nama_lengkap: string
          nip?: string | null
          tanggal_input?: string
          tim_upk_id?: string | null
          tim_upk_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          is_dosir_complete?: boolean | null
          is_spd_complete?: boolean | null
          nama_lengkap?: string
          nip?: string | null
          tanggal_input?: string
          tim_upk_id?: string | null
          tim_upk_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dosir_in_tim_upk_id_fkey"
            columns: ["tim_upk_id"]
            isOneToOne: false
            referencedRelation: "tim_upk"
            referencedColumns: ["id"]
          },
        ]
      }
      dosir_out: {
        Row: {
          created_at: string
          created_by_email: string | null
          foto_dokumen: string | null
          id: string
          is_bmn_returned: boolean | null
          is_rumah_negara_returned: boolean | null
          is_tanggungan_koperasi_returned: boolean | null
          nama_lengkap: string
          nip: string | null
          tanggal_tanda_terima: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          foto_dokumen?: string | null
          id?: string
          is_bmn_returned?: boolean | null
          is_rumah_negara_returned?: boolean | null
          is_tanggungan_koperasi_returned?: boolean | null
          nama_lengkap: string
          nip?: string | null
          tanggal_tanda_terima?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          foto_dokumen?: string | null
          id?: string
          is_bmn_returned?: boolean | null
          is_rumah_negara_returned?: boolean | null
          is_tanggungan_koperasi_returned?: boolean | null
          nama_lengkap?: string
          nip?: string | null
          tanggal_tanda_terima?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          email: string | null
          eselon_iii: string | null
          eselon_iv: string | null
          id: string
          jabatan_kategori: string | null
          kontak: string | null
          nip: string | null
          nm_pegawai: string
          nm_unit_organisasi: string
          updated_at: string
          uraian_jabatan: string
          uraian_pangkat: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          id?: string
          jabatan_kategori?: string | null
          kontak?: string | null
          nip?: string | null
          nm_pegawai: string
          nm_unit_organisasi: string
          updated_at?: string
          uraian_jabatan: string
          uraian_pangkat: string
        }
        Update: {
          created_at?: string
          email?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          id?: string
          jabatan_kategori?: string | null
          kontak?: string | null
          nip?: string | null
          nm_pegawai?: string
          nm_unit_organisasi?: string
          updated_at?: string
          uraian_jabatan?: string
          uraian_pangkat?: string
        }
        Relationships: []
      }
      eselonisasi: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          is_active: boolean | null
          kode_unit: string | null
          nama_unit: string
          no_urut: number | null
          parent_id: string | null
          tingkat_eselon: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          is_active?: boolean | null
          kode_unit?: string | null
          nama_unit: string
          no_urut?: number | null
          parent_id?: string | null
          tingkat_eselon: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          is_active?: boolean | null
          kode_unit?: string | null
          nama_unit?: string
          no_urut?: number | null
          parent_id?: string | null
          tingkat_eselon?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eselonisasi_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "eselonisasi"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      faq_sdm: {
        Row: {
          created_at: string
          id: string
          jawaban: string
          kategori: string
          pertanyaan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jawaban: string
          kategori: string
          pertanyaan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jawaban?: string
          kategori?: string
          pertanyaan?: string
          updated_at?: string
        }
        Relationships: []
      }
      grading_berita_acara: {
        Row: {
          created_at: string
          created_by_email: string | null
          hasil_penilaian: string | null
          id: string
          kesimpulan: string | null
          nama_lengkap: string
          nip: string | null
          nomor_ba: string | null
          permohonan_id: string | null
          tanggal_ba: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          hasil_penilaian?: string | null
          id?: string
          kesimpulan?: string | null
          nama_lengkap: string
          nip?: string | null
          nomor_ba?: string | null
          permohonan_id?: string | null
          tanggal_ba?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          hasil_penilaian?: string | null
          id?: string
          kesimpulan?: string | null
          nama_lengkap?: string
          nip?: string | null
          nomor_ba?: string | null
          permohonan_id?: string | null
          tanggal_ba?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_berita_acara_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan_grading"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_big_data: {
        Row: {
          akumulasi_masa_kerja: string | null
          akumulasi_terakhir: string | null
          atasan_dari_atasan_id: string | null
          atasan_dari_atasan_nama: string | null
          atasan_langsung_id: string | null
          atasan_langsung_nama: string | null
          created_at: string
          created_by_email: string | null
          eselon_iii: string | null
          eselon_iv: string | null
          grade: string | null
          grade_baru: string | null
          hukuman_disiplin: boolean | null
          id: string
          jabatan: string | null
          jabatan_baru: string | null
          jenis: string | null
          kemampuan_kerja: string | null
          keputusan: string | null
          lampiran_kep: string | null
          lokasi: string | null
          lokasi_pendidikan_terakhir: string | null
          nama_lengkap: string
          nip: string
          pangkat: string | null
          pangkat_golongan: string | null
          pendidikan: string | null
          pendidikan_awal: string | null
          pkt_2024: string | null
          pkt_2025: string | null
          rekomendasi: string | null
          riwayat_tahun_lalu: string | null
          tmt_pangkat: string | null
          tmt_peringkat_baru: string | null
          tmt_terakhir: string | null
          tugas_belajar: boolean | null
          updated_at: string
          upkp: boolean | null
        }
        Insert: {
          akumulasi_masa_kerja?: string | null
          akumulasi_terakhir?: string | null
          atasan_dari_atasan_id?: string | null
          atasan_dari_atasan_nama?: string | null
          atasan_langsung_id?: string | null
          atasan_langsung_nama?: string | null
          created_at?: string
          created_by_email?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          grade?: string | null
          grade_baru?: string | null
          hukuman_disiplin?: boolean | null
          id?: string
          jabatan?: string | null
          jabatan_baru?: string | null
          jenis?: string | null
          kemampuan_kerja?: string | null
          keputusan?: string | null
          lampiran_kep?: string | null
          lokasi?: string | null
          lokasi_pendidikan_terakhir?: string | null
          nama_lengkap: string
          nip: string
          pangkat?: string | null
          pangkat_golongan?: string | null
          pendidikan?: string | null
          pendidikan_awal?: string | null
          pkt_2024?: string | null
          pkt_2025?: string | null
          rekomendasi?: string | null
          riwayat_tahun_lalu?: string | null
          tmt_pangkat?: string | null
          tmt_peringkat_baru?: string | null
          tmt_terakhir?: string | null
          tugas_belajar?: boolean | null
          updated_at?: string
          upkp?: boolean | null
        }
        Update: {
          akumulasi_masa_kerja?: string | null
          akumulasi_terakhir?: string | null
          atasan_dari_atasan_id?: string | null
          atasan_dari_atasan_nama?: string | null
          atasan_langsung_id?: string | null
          atasan_langsung_nama?: string | null
          created_at?: string
          created_by_email?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          grade?: string | null
          grade_baru?: string | null
          hukuman_disiplin?: boolean | null
          id?: string
          jabatan?: string | null
          jabatan_baru?: string | null
          jenis?: string | null
          kemampuan_kerja?: string | null
          keputusan?: string | null
          lampiran_kep?: string | null
          lokasi?: string | null
          lokasi_pendidikan_terakhir?: string | null
          nama_lengkap?: string
          nip?: string
          pangkat?: string | null
          pangkat_golongan?: string | null
          pendidikan?: string | null
          pendidikan_awal?: string | null
          pkt_2024?: string | null
          pkt_2025?: string | null
          rekomendasi?: string | null
          riwayat_tahun_lalu?: string | null
          tmt_pangkat?: string | null
          tmt_peringkat_baru?: string | null
          tmt_terakhir?: string | null
          tugas_belajar?: boolean | null
          updated_at?: string
          upkp?: boolean | null
        }
        Relationships: []
      }
      grading_format_hasil_evaluasi: {
        Row: {
          akumulasi_masa_kerja_sd_tahun_y: string | null
          akumulasi_masa_kerja_terakhir_peringkat_lama: string | null
          created_at: string
          created_by_email: string | null
          id: string
          jabatan_kedudukan: string | null
          jabatan_tugas_kedudukan: string | null
          jenis_evaluasi: string
          kemampuan_kerja: string | null
          lokasi: string | null
          nama_atasan_dari_atasan_langsung: string | null
          nama_atasan_langsung: string | null
          nama_nip: string
          nip_atasan_dari_atasan_langsung: string | null
          nip_atasan_langsung: string | null
          no_urut: number | null
          pangkat_gol_ruang_tmt: string | null
          pendidikan: string | null
          peringkat_lama: string | null
          permohonan_id: string | null
          pkt_y: string | null
          pkt_y_minus_1: string | null
          predikat_kinerja_tahunan_y: string | null
          predikat_kinerja_terakhir_peringkat_lama: string | null
          satuan_kerja: string | null
          tanggal: string | null
          updated_at: string
        }
        Insert: {
          akumulasi_masa_kerja_sd_tahun_y?: string | null
          akumulasi_masa_kerja_terakhir_peringkat_lama?: string | null
          created_at?: string
          created_by_email?: string | null
          id?: string
          jabatan_kedudukan?: string | null
          jabatan_tugas_kedudukan?: string | null
          jenis_evaluasi: string
          kemampuan_kerja?: string | null
          lokasi?: string | null
          nama_atasan_dari_atasan_langsung?: string | null
          nama_atasan_langsung?: string | null
          nama_nip: string
          nip_atasan_dari_atasan_langsung?: string | null
          nip_atasan_langsung?: string | null
          no_urut?: number | null
          pangkat_gol_ruang_tmt?: string | null
          pendidikan?: string | null
          peringkat_lama?: string | null
          permohonan_id?: string | null
          pkt_y?: string | null
          pkt_y_minus_1?: string | null
          predikat_kinerja_tahunan_y?: string | null
          predikat_kinerja_terakhir_peringkat_lama?: string | null
          satuan_kerja?: string | null
          tanggal?: string | null
          updated_at?: string
        }
        Update: {
          akumulasi_masa_kerja_sd_tahun_y?: string | null
          akumulasi_masa_kerja_terakhir_peringkat_lama?: string | null
          created_at?: string
          created_by_email?: string | null
          id?: string
          jabatan_kedudukan?: string | null
          jabatan_tugas_kedudukan?: string | null
          jenis_evaluasi?: string
          kemampuan_kerja?: string | null
          lokasi?: string | null
          nama_atasan_dari_atasan_langsung?: string | null
          nama_atasan_langsung?: string | null
          nama_nip?: string
          nip_atasan_dari_atasan_langsung?: string | null
          nip_atasan_langsung?: string | null
          no_urut?: number | null
          pangkat_gol_ruang_tmt?: string | null
          pendidikan?: string | null
          peringkat_lama?: string | null
          permohonan_id?: string | null
          pkt_y?: string | null
          pkt_y_minus_1?: string | null
          predikat_kinerja_tahunan_y?: string | null
          predikat_kinerja_terakhir_peringkat_lama?: string | null
          satuan_kerja?: string | null
          tanggal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_format_hasil_evaluasi_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan_grading"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_hasil_evaluasi: {
        Row: {
          catatan: string | null
          created_at: string
          created_by_email: string | null
          hasil: string | null
          id: string
          jenis_evaluasi: string | null
          nama_lengkap: string
          nilai: number | null
          nip: string | null
          permohonan_id: string | null
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by_email?: string | null
          hasil?: string | null
          id?: string
          jenis_evaluasi?: string | null
          nama_lengkap: string
          nilai?: number | null
          nip?: string | null
          permohonan_id?: string | null
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by_email?: string | null
          hasil?: string | null
          id?: string
          jenis_evaluasi?: string | null
          nama_lengkap?: string
          nilai?: number | null
          nip?: string | null
          permohonan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_hasil_evaluasi_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan_grading"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_kelengkapan_simulasi: {
        Row: {
          batas_peringkat_tertinggi: number | null
          catatan: string | null
          created_at: string
          created_by_email: string | null
          grade_awal: number | null
          id: string
          isian_tabel: Json | null
          jabatan_atasan_langsung: string | null
          jabatan_unit_kepegawaian: string | null
          jenis_kelengkapan: string | null
          lokasi: string | null
          nama_atasan_langsung: string | null
          nama_lengkap: string
          nama_pejabat_kepegawaian: string | null
          nip: string | null
          nip_atasan_langsung: string | null
          nip_pejabat_kepegawaian: string | null
          no_urut: number | null
          nomenklatur_jabatan: string | null
          permohonan_id: string | null
          rekomendasi_grade: number | null
          status: string | null
          tanggal: string | null
          unit_organisasi: string | null
          updated_at: string
        }
        Insert: {
          batas_peringkat_tertinggi?: number | null
          catatan?: string | null
          created_at?: string
          created_by_email?: string | null
          grade_awal?: number | null
          id?: string
          isian_tabel?: Json | null
          jabatan_atasan_langsung?: string | null
          jabatan_unit_kepegawaian?: string | null
          jenis_kelengkapan?: string | null
          lokasi?: string | null
          nama_atasan_langsung?: string | null
          nama_lengkap: string
          nama_pejabat_kepegawaian?: string | null
          nip?: string | null
          nip_atasan_langsung?: string | null
          nip_pejabat_kepegawaian?: string | null
          no_urut?: number | null
          nomenklatur_jabatan?: string | null
          permohonan_id?: string | null
          rekomendasi_grade?: number | null
          status?: string | null
          tanggal?: string | null
          unit_organisasi?: string | null
          updated_at?: string
        }
        Update: {
          batas_peringkat_tertinggi?: number | null
          catatan?: string | null
          created_at?: string
          created_by_email?: string | null
          grade_awal?: number | null
          id?: string
          isian_tabel?: Json | null
          jabatan_atasan_langsung?: string | null
          jabatan_unit_kepegawaian?: string | null
          jenis_kelengkapan?: string | null
          lokasi?: string | null
          nama_atasan_langsung?: string | null
          nama_lengkap?: string
          nama_pejabat_kepegawaian?: string | null
          nip?: string | null
          nip_atasan_langsung?: string | null
          nip_pejabat_kepegawaian?: string | null
          no_urut?: number | null
          nomenklatur_jabatan?: string | null
          permohonan_id?: string | null
          rekomendasi_grade?: number | null
          status?: string | null
          tanggal?: string | null
          unit_organisasi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_kelengkapan_simulasi_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan_grading"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_kep_salinan: {
        Row: {
          created_at: string
          created_by_email: string | null
          grade_baru: string | null
          grade_lama: string | null
          grading_id: string | null
          hal: string | null
          id: string
          jabatan_baru: string | null
          jabatan_lama: string | null
          jenis_dokumen: string | null
          keterangan: string | null
          nama_lengkap: string
          nip: string | null
          nomor_kep: string
          pangkat_gol_tmt: string | null
          pendidikan: string | null
          tanggal_kep: string | null
          tmt_peringkat_terakhir: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          grade_baru?: string | null
          grade_lama?: string | null
          grading_id?: string | null
          hal?: string | null
          id?: string
          jabatan_baru?: string | null
          jabatan_lama?: string | null
          jenis_dokumen?: string | null
          keterangan?: string | null
          nama_lengkap: string
          nip?: string | null
          nomor_kep: string
          pangkat_gol_tmt?: string | null
          pendidikan?: string | null
          tanggal_kep?: string | null
          tmt_peringkat_terakhir?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          grade_baru?: string | null
          grade_lama?: string | null
          grading_id?: string | null
          hal?: string | null
          id?: string
          jabatan_baru?: string | null
          jabatan_lama?: string | null
          jenis_dokumen?: string | null
          keterangan?: string | null
          nama_lengkap?: string
          nip?: string | null
          nomor_kep?: string
          pangkat_gol_tmt?: string | null
          pendidikan?: string | null
          tanggal_kep?: string | null
          tmt_peringkat_terakhir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_kep_salinan_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "grading_big_data"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_kuesioner: {
        Row: {
          created_at: string
          created_by_email: string | null
          grading_id: string | null
          id: string
          jawaban: Json | null
          jenis_kuesioner: string | null
          nama_lengkap: string
          nip: string | null
          permohonan_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          grading_id?: string | null
          id?: string
          jawaban?: Json | null
          jenis_kuesioner?: string | null
          nama_lengkap: string
          nip?: string | null
          permohonan_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          grading_id?: string | null
          id?: string
          jawaban?: Json | null
          jenis_kuesioner?: string | null
          nama_lengkap?: string
          nip?: string | null
          permohonan_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_kuesioner_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "grading_big_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_kuesioner_permohonan_id_fkey"
            columns: ["permohonan_id"]
            isOneToOne: false
            referencedRelation: "permohonan_grading"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_petikan: {
        Row: {
          created_at: string
          created_by_email: string | null
          grading_id: string | null
          id: string
          kep_salinan_id: string | null
          keterangan: string | null
          nama_lengkap: string
          nip: string | null
          nomor_petikan: string
          tanggal_petikan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          grading_id?: string | null
          id?: string
          kep_salinan_id?: string | null
          keterangan?: string | null
          nama_lengkap: string
          nip?: string | null
          nomor_petikan: string
          tanggal_petikan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          grading_id?: string | null
          id?: string
          kep_salinan_id?: string | null
          keterangan?: string | null
          nama_lengkap?: string
          nip?: string | null
          nomor_petikan?: string
          tanggal_petikan?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_petikan_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "grading_big_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_petikan_kep_salinan_id_fkey"
            columns: ["kep_salinan_id"]
            isOneToOne: false
            referencedRelation: "grading_kep_salinan"
            referencedColumns: ["id"]
          },
        ]
      }
      gudang_arsip_tegalsari: {
        Row: {
          created_at: string
          id: string
          jenis_rak: string
          jumlah_rak: number
          jumlah_terisi_box: number
          kapasitas: number
          kapasitas_box_per_rak: number
          no_urut: number | null
          nomor_rak: string
          sisa_kapasitas_box: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_rak?: string
          jumlah_rak?: number
          jumlah_terisi_box?: number
          kapasitas?: number
          kapasitas_box_per_rak?: number
          no_urut?: number | null
          nomor_rak?: string
          sisa_kapasitas_box?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis_rak?: string
          jumlah_rak?: number
          jumlah_terisi_box?: number
          kapasitas?: number
          kapasitas_box_per_rak?: number
          no_urut?: number | null
          nomor_rak?: string
          sisa_kapasitas_box?: number
          updated_at?: string
        }
        Relationships: []
      }
      isi_berkas: {
        Row: {
          created_at: string
          dimusnahkan: boolean | null
          dokumen_scan: string | null
          hak_akses: string | null
          id: string
          jumlah: number
          keterangan: string | null
          klasifikasi_keamanan: string | null
          kode_klasifikasi: string
          kurun_waktu: string
          nama_pic: string | null
          no_berkas: number
          no_urut: number
          nomor_surat_naskah: string | null
          status_dokumen: string | null
          tingkat_perkembangan: string
          updated_at: string
          uraian_informasi_arsip: string
          usia_retensi: string | null
        }
        Insert: {
          created_at?: string
          dimusnahkan?: boolean | null
          dokumen_scan?: string | null
          hak_akses?: string | null
          id?: string
          jumlah: number
          keterangan?: string | null
          klasifikasi_keamanan?: string | null
          kode_klasifikasi: string
          kurun_waktu: string
          nama_pic?: string | null
          no_berkas: number
          no_urut: number
          nomor_surat_naskah?: string | null
          status_dokumen?: string | null
          tingkat_perkembangan: string
          updated_at?: string
          uraian_informasi_arsip: string
          usia_retensi?: string | null
        }
        Update: {
          created_at?: string
          dimusnahkan?: boolean | null
          dokumen_scan?: string | null
          hak_akses?: string | null
          id?: string
          jumlah?: number
          keterangan?: string | null
          klasifikasi_keamanan?: string | null
          kode_klasifikasi?: string
          kurun_waktu?: string
          nama_pic?: string | null
          no_berkas?: number
          no_urut?: number
          nomor_surat_naskah?: string | null
          status_dokumen?: string | null
          tingkat_perkembangan?: string
          updated_at?: string
          uraian_informasi_arsip?: string
          usia_retensi?: string | null
        }
        Relationships: []
      }
      jadwal_sidang_grading: {
        Row: {
          created_at: string
          created_by_email: string | null
          hari_tanggal: string
          id: string
          media: string | null
          no_urut: number | null
          pukul: string | null
          satuan_kerja: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          hari_tanggal: string
          id?: string
          media?: string | null
          no_urut?: number | null
          pukul?: string | null
          satuan_kerja?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          hari_tanggal?: string
          id?: string
          media?: string | null
          no_urut?: number | null
          pukul?: string | null
          satuan_kerja?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      japri_teman: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kontak: string | null
          nama: string
          nip: string | null
          no_urut: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kontak?: string | null
          nama: string
          nip?: string | null
          no_urut: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kontak?: string | null
          nama?: string
          nip?: string | null
          no_urut?: number
          updated_at?: string
        }
        Relationships: []
      }
      japri_teman_existing: {
        Row: {
          agama: string | null
          check_teams_kanwil: string | null
          check_wa_bintal: string | null
          check_wa_info: string | null
          check_wag_kanwil: string | null
          created_at: string
          domain_kemenkeu: string | null
          eselon_iii: string | null
          id: string
          jabatan: string | null
          kontak: string | null
          nama_lengkap: string
          nip: string | null
          no_urut: number | null
          updated_at: string
        }
        Insert: {
          agama?: string | null
          check_teams_kanwil?: string | null
          check_wa_bintal?: string | null
          check_wa_info?: string | null
          check_wag_kanwil?: string | null
          created_at?: string
          domain_kemenkeu?: string | null
          eselon_iii?: string | null
          id?: string
          jabatan?: string | null
          kontak?: string | null
          nama_lengkap: string
          nip?: string | null
          no_urut?: number | null
          updated_at?: string
        }
        Update: {
          agama?: string | null
          check_teams_kanwil?: string | null
          check_wa_bintal?: string | null
          check_wa_info?: string | null
          check_wag_kanwil?: string | null
          created_at?: string
          domain_kemenkeu?: string | null
          eselon_iii?: string | null
          id?: string
          jabatan?: string | null
          kontak?: string | null
          nama_lengkap?: string
          nip?: string | null
          no_urut?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      karis_karsu: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          nama: string
          nama_pasangan: string | null
          nip: string
          no: number
          nomor_nd_pengajuan: string | null
          pic: string | null
          satuan_kerja: string
          tanggal_input_si_asn: string | null
          tanggal_karis_karsu_terbit: string | null
          tanggal_pengajuan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          nama: string
          nama_pasangan?: string | null
          nip: string
          no?: number
          nomor_nd_pengajuan?: string | null
          pic?: string | null
          satuan_kerja: string
          tanggal_input_si_asn?: string | null
          tanggal_karis_karsu_terbit?: string | null
          tanggal_pengajuan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          nama?: string
          nama_pasangan?: string | null
          nip?: string
          no?: number
          nomor_nd_pengajuan?: string | null
          pic?: string | null
          satuan_kerja?: string
          tanggal_input_si_asn?: string | null
          tanggal_karis_karsu_terbit?: string | null
          tanggal_pengajuan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kenaikan_pangkat_data: {
        Row: {
          created_at: string
          id: string
          jenis: string | null
          nama_pegawai: string
          nip: string | null
          tmt_pangkat: string | null
          unit: string | null
          updated_at: string
          uraian_pangkat: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jenis?: string | null
          nama_pegawai: string
          nip?: string | null
          tmt_pangkat?: string | null
          unit?: string | null
          updated_at?: string
          uraian_pangkat?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: string | null
          nama_pegawai?: string
          nip?: string | null
          tmt_pangkat?: string | null
          unit?: string | null
          updated_at?: string
          uraian_pangkat?: string | null
        }
        Relationships: []
      }
      konversi_predikat_kinerja: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          keterangan: string | null
          nilai_terendah: number
          nilai_tertinggi: number
          no_urut: number | null
          predikat: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          keterangan?: string | null
          nilai_terendah: number
          nilai_tertinggi: number
          no_urut?: number | null
          predikat: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          keterangan?: string | null
          nilai_terendah?: number
          nilai_tertinggi?: number
          no_urut?: number | null
          predikat?: string
          updated_at?: string
        }
        Relationships: []
      }
      kunjungan_tamu: {
        Row: {
          created_at: string
          feedback_comment: string | null
          feedback_rating: number | null
          feedback_submitted_at: string | null
          feedback_submitted_by: string | null
          foto_tamu: string | null
          id: string
          instansi: string | null
          jenis_kelamin: string | null
          jumlah_tamu: number | null
          keperluan: string
          layanan: string | null
          nama_tamu: string
          no_identitas: string | null
          no_telepon: string | null
          pendidikan: string | null
          pilihan_kantor: string | null
          recorded_by_email: string | null
          recorded_by_name: string | null
          status_janji: string | null
          survey_responses: Json | null
          tujuan_bagian: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          feedback_submitted_at?: string | null
          feedback_submitted_by?: string | null
          foto_tamu?: string | null
          id?: string
          instansi?: string | null
          jenis_kelamin?: string | null
          jumlah_tamu?: number | null
          keperluan: string
          layanan?: string | null
          nama_tamu: string
          no_identitas?: string | null
          no_telepon?: string | null
          pendidikan?: string | null
          pilihan_kantor?: string | null
          recorded_by_email?: string | null
          recorded_by_name?: string | null
          status_janji?: string | null
          survey_responses?: Json | null
          tujuan_bagian?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          feedback_submitted_at?: string | null
          feedback_submitted_by?: string | null
          foto_tamu?: string | null
          id?: string
          instansi?: string | null
          jenis_kelamin?: string | null
          jumlah_tamu?: number | null
          keperluan?: string
          layanan?: string | null
          nama_tamu?: string
          no_identitas?: string | null
          no_telepon?: string | null
          pendidikan?: string | null
          pilihan_kantor?: string | null
          recorded_by_email?: string | null
          recorded_by_name?: string | null
          status_janji?: string | null
          survey_responses?: Json | null
          tujuan_bagian?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      login_backgrounds: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mekanisme_54: {
        Row: {
          created_at: string
          created_by_email: string | null
          deskripsi: string
          id: string
          jenis_penetapan: string
          kode_kategori: string | null
          level: number | null
          no_urut: number | null
          parent_kode: string | null
          sub_jenis: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          deskripsi: string
          id?: string
          jenis_penetapan: string
          kode_kategori?: string | null
          level?: number | null
          no_urut?: number | null
          parent_kode?: string | null
          sub_jenis: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          deskripsi?: string
          id?: string
          jenis_penetapan?: string
          kode_kategori?: string | null
          level?: number | null
          no_urut?: number | null
          parent_kode?: string | null
          sub_jenis?: string
          updated_at?: string
        }
        Relationships: []
      }
      monev_laporan: {
        Row: {
          created_at: string
          created_by_email: string | null
          hasil_monev: string | null
          id: string
          jenis_mekanisme_penetapan: string
          jumlah_keputusan: number
          keterangan: string | null
          no_urut: number | null
          tindak_lanjut: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          hasil_monev?: string | null
          id?: string
          jenis_mekanisme_penetapan: string
          jumlah_keputusan?: number
          keterangan?: string | null
          no_urut?: number | null
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          hasil_monev?: string | null
          id?: string
          jenis_mekanisme_penetapan?: string
          jumlah_keputusan?: number
          keterangan?: string | null
          no_urut?: number | null
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monev_rekap_grading: {
        Row: {
          created_at: string
          created_by_email: string | null
          eselon_ii: string | null
          eselon_iii: string | null
          eselon_iv: string | null
          golongan: string | null
          id: string
          jabatan_riwayat_grading: string | null
          keterangan: string | null
          konfirmasi_unit: string | null
          nama: string
          nip: string | null
          no_urut: number
          pendidikan: string | null
          peringkat_grading: string | null
          peringkat_jabatan: string | null
          riwayat_jabatan_hris: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          eselon_ii?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          golongan?: string | null
          id?: string
          jabatan_riwayat_grading?: string | null
          keterangan?: string | null
          konfirmasi_unit?: string | null
          nama: string
          nip?: string | null
          no_urut?: number
          pendidikan?: string | null
          peringkat_grading?: string | null
          peringkat_jabatan?: string | null
          riwayat_jabatan_hris?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          eselon_ii?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          golongan?: string | null
          id?: string
          jabatan_riwayat_grading?: string | null
          keterangan?: string | null
          konfirmasi_unit?: string | null
          nama?: string
          nip?: string | null
          no_urut?: number
          pendidikan?: string | null
          peringkat_grading?: string | null
          peringkat_jabatan?: string | null
          riwayat_jabatan_hris?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monitor_pbdk: {
        Row: {
          created_at: string
          created_by_email: string | null
          detail_data: string | null
          employee_id: string | null
          id: string
          jabatan: string | null
          jenis_perubahan_data: string
          keterangan: string | null
          nama_pegawai: string
          nama_petugas: string | null
          nip: string | null
          no_urut: number
          petugas_id: string | null
          status_hris: string
          status_pbdk: string
          tanggal_input_hris: string | null
          tanggal_pbdk: string | null
          updated_at: string
          uraian_jabatan: string | null
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          detail_data?: string | null
          employee_id?: string | null
          id?: string
          jabatan?: string | null
          jenis_perubahan_data: string
          keterangan?: string | null
          nama_pegawai: string
          nama_petugas?: string | null
          nip?: string | null
          no_urut?: number
          petugas_id?: string | null
          status_hris?: string
          status_pbdk?: string
          tanggal_input_hris?: string | null
          tanggal_pbdk?: string | null
          updated_at?: string
          uraian_jabatan?: string | null
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          detail_data?: string | null
          employee_id?: string | null
          id?: string
          jabatan?: string | null
          jenis_perubahan_data?: string
          keterangan?: string | null
          nama_pegawai?: string
          nama_petugas?: string | null
          nip?: string | null
          no_urut?: number
          petugas_id?: string | null
          status_hris?: string
          status_pbdk?: string
          tanggal_input_hris?: string | null
          tanggal_pbdk?: string | null
          updated_at?: string
          uraian_jabatan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitor_pbdk_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monitor_pbdk_petugas_id_fkey"
            columns: ["petugas_id"]
            isOneToOne: false
            referencedRelation: "tim_upk"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_penilaian_perilaku: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          nama_lengkap: string
          nip: string | null
          no_urut: number | null
          status_penetapan: string | null
          status_pengajuan: string | null
          status_penilaian: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          nama_lengkap: string
          nip?: string | null
          no_urut?: number | null
          status_penetapan?: string | null
          status_pengajuan?: string | null
          status_penilaian?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          nama_lengkap?: string
          nip?: string | null
          no_urut?: number | null
          status_penetapan?: string | null
          status_pengajuan?: string | null
          status_penilaian?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mutasi: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          jabatan: string | null
          nama_lengkap: string
          nip: string | null
          nomor_kep: string
          pangkat_golongan: string | null
          tanggal_kep: string
          unit_baru: string
          unit_lama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jabatan?: string | null
          nama_lengkap: string
          nip?: string | null
          nomor_kep: string
          pangkat_golongan?: string | null
          tanggal_kep: string
          unit_baru: string
          unit_lama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jabatan?: string | null
          nama_lengkap?: string
          nip?: string | null
          nomor_kep?: string
          pangkat_golongan?: string | null
          tanggal_kep?: string
          unit_baru?: string
          unit_lama?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          published_at: string | null
          source: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          published_at?: string | null
          source?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          published_at?: string | null
          source?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      on_air_content: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_live: boolean
          media_type: string
          media_url: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_live?: boolean
          media_type?: string
          media_url: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_live?: boolean
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pegawai_atasan: {
        Row: {
          atasan_dari_atasan: string | null
          atasan_langsung: string | null
          created_at: string
          created_by_email: string | null
          eselon_iii: string | null
          eselon_iv: string | null
          id: string
          jabatan: string | null
          nama: string
          nip: string | null
          no_urut: number
          updated_at: string
        }
        Insert: {
          atasan_dari_atasan?: string | null
          atasan_langsung?: string | null
          created_at?: string
          created_by_email?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          id?: string
          jabatan?: string | null
          nama: string
          nip?: string | null
          no_urut?: number
          updated_at?: string
        }
        Update: {
          atasan_dari_atasan?: string | null
          atasan_langsung?: string | null
          created_at?: string
          created_by_email?: string | null
          eselon_iii?: string | null
          eselon_iv?: string | null
          id?: string
          jabatan?: string | null
          nama?: string
          nip?: string | null
          no_urut?: number
          updated_at?: string
        }
        Relationships: []
      }
      peminjaman_arsip: {
        Row: {
          baris: string
          created_at: string
          foto_peminjam: string | null
          id: string
          isi_berkas_id: string | null
          keperluan: string
          kode_klasifikasi: string
          nama_dokumen: string
          nama_peminjam: string | null
          no_rak: string
          no_urut: number
          nomor_boks: string
          pemilik_dokumen: string
          status_dokumen: string
          status_pengembalian: boolean
          sub_rak: string
          susun: string
          tahun_dokumen: string
          tanggal_peminjaman: string
          tanggal_pengembalian: string | null
          updated_at: string
        }
        Insert: {
          baris: string
          created_at?: string
          foto_peminjam?: string | null
          id?: string
          isi_berkas_id?: string | null
          keperluan: string
          kode_klasifikasi: string
          nama_dokumen: string
          nama_peminjam?: string | null
          no_rak: string
          no_urut: number
          nomor_boks: string
          pemilik_dokumen: string
          status_dokumen?: string
          status_pengembalian?: boolean
          sub_rak: string
          susun: string
          tahun_dokumen: string
          tanggal_peminjaman?: string
          tanggal_pengembalian?: string | null
          updated_at?: string
        }
        Update: {
          baris?: string
          created_at?: string
          foto_peminjam?: string | null
          id?: string
          isi_berkas_id?: string | null
          keperluan?: string
          kode_klasifikasi?: string
          nama_dokumen?: string
          nama_peminjam?: string | null
          no_rak?: string
          no_urut?: number
          nomor_boks?: string
          pemilik_dokumen?: string
          status_dokumen?: string
          status_pengembalian?: boolean
          sub_rak?: string
          susun?: string
          tahun_dokumen?: string
          tanggal_peminjaman?: string
          tanggal_pengembalian?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "peminjaman_arsip_isi_berkas_id_fkey"
            columns: ["isi_berkas_id"]
            isOneToOne: false
            referencedRelation: "isi_berkas"
            referencedColumns: ["id"]
          },
        ]
      }
      pendataan_masuk: {
        Row: {
          baris: string
          created_at: string
          daftar_berkas_id: string | null
          geotag: string | null
          id: string
          jenis_berkas: string
          kode_klasifikasi: string
          no_berkas: number
          nomor_rak: string
          sub_rak: string
          susun: string
          updated_at: string
          uraian_informasi_berkas: string
        }
        Insert: {
          baris: string
          created_at?: string
          daftar_berkas_id?: string | null
          geotag?: string | null
          id?: string
          jenis_berkas: string
          kode_klasifikasi: string
          no_berkas: number
          nomor_rak: string
          sub_rak: string
          susun: string
          updated_at?: string
          uraian_informasi_berkas: string
        }
        Update: {
          baris?: string
          created_at?: string
          daftar_berkas_id?: string | null
          geotag?: string | null
          id?: string
          jenis_berkas?: string
          kode_klasifikasi?: string
          no_berkas?: number
          nomor_rak?: string
          sub_rak?: string
          susun?: string
          updated_at?: string
          uraian_informasi_berkas?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendataan_masuk_daftar_berkas_id_fkey"
            columns: ["daftar_berkas_id"]
            isOneToOne: false
            referencedRelation: "daftar_berkas"
            referencedColumns: ["id"]
          },
        ]
      }
      pendidikan: {
        Row: {
          created_at: string
          id: string
          jurusan: string | null
          lokasi_pendidikan: string | null
          nama_lembaga_pendidikan: string | null
          nama_lengkap: string
          nip: string | null
          pendidikan: string | null
          tahun_lulus: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jurusan?: string | null
          lokasi_pendidikan?: string | null
          nama_lembaga_pendidikan?: string | null
          nama_lengkap: string
          nip?: string | null
          pendidikan?: string | null
          tahun_lulus?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jurusan?: string | null
          lokasi_pendidikan?: string | null
          nama_lembaga_pendidikan?: string | null
          nama_lengkap?: string
          nip?: string | null
          pendidikan?: string | null
          tahun_lulus?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pensiun: {
        Row: {
          created_at: string
          id: string
          jabatan: string | null
          jenis_kelamin: string | null
          jenjang_jabatan: string | null
          masa_kerja_tahun: number | null
          nama_lengkap: string
          nip: string | null
          unit_organisasi: string | null
          updated_at: string
          usia_tahun: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          jenjang_jabatan?: string | null
          masa_kerja_tahun?: number | null
          nama_lengkap: string
          nip?: string | null
          unit_organisasi?: string | null
          updated_at?: string
          usia_tahun?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          jabatan?: string | null
          jenis_kelamin?: string | null
          jenjang_jabatan?: string | null
          masa_kerja_tahun?: number | null
          nama_lengkap?: string
          nip?: string | null
          unit_organisasi?: string | null
          updated_at?: string
          usia_tahun?: number | null
        }
        Relationships: []
      }
      permohonan_grading: {
        Row: {
          created_at: string
          created_by_email: string | null
          dari: string | null
          grade_baru: string | null
          grade_lama: string | null
          grading_id: string | null
          hal: string | null
          id: string
          jabatan_baru: string | null
          jabatan_lama: string | null
          ke: string | null
          keterangan: string | null
          nama_lengkap: string
          nip: string | null
          no_urut: number | null
          nomor_kep: string
          pangkat_gol_tmt: string | null
          pendidikan: string | null
          tanggal_kep: string | null
          tmt_peringkat_terakhir: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          dari?: string | null
          grade_baru?: string | null
          grade_lama?: string | null
          grading_id?: string | null
          hal?: string | null
          id?: string
          jabatan_baru?: string | null
          jabatan_lama?: string | null
          ke?: string | null
          keterangan?: string | null
          nama_lengkap: string
          nip?: string | null
          no_urut?: number | null
          nomor_kep: string
          pangkat_gol_tmt?: string | null
          pendidikan?: string | null
          tanggal_kep?: string | null
          tmt_peringkat_terakhir?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          dari?: string | null
          grade_baru?: string | null
          grade_lama?: string | null
          grading_id?: string | null
          hal?: string | null
          id?: string
          jabatan_baru?: string | null
          jabatan_lama?: string | null
          ke?: string | null
          keterangan?: string | null
          nama_lengkap?: string
          nip?: string | null
          no_urut?: number | null
          nomor_kep?: string
          pangkat_gol_tmt?: string | null
          pendidikan?: string | null
          tanggal_kep?: string | null
          tmt_peringkat_terakhir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permohonan_grading_grading_id_fkey"
            columns: ["grading_id"]
            isOneToOne: false
            referencedRelation: "grading_big_data"
            referencedColumns: ["id"]
          },
        ]
      }
      plh_kepala: {
        Row: {
          agenda_number: number
          assigned_upk_at: string | null
          assigned_upk_id: string | null
          assigned_upk_manually: boolean | null
          created_at: string
          dasar_penugasan: string | null
          document_path: string | null
          employee_id: string | null
          employee_ids: string[] | null
          id: string
          jenis_plh_plt: string | null
          konsep_masuk_at: string | null
          konsep_masuk_by: string | null
          no_satu_kemenkeu: string | null
          nomor_naskah_dinas: string
          pejabat_unit_pemohon_id: string | null
          pejabat_unit_penerbit_id: string | null
          perihal: string
          proses_nd_at: string | null
          proses_nd_by: string | null
          proses_st_at: string | null
          proses_st_by: string | null
          selesai_at: string | null
          selesai_by: string | null
          tanggal: string
          tanggal_plh_mulai: string | null
          tanggal_plh_selesai: string | null
          tanggal_satu_kemenkeu: string | null
          unit_pemohon: string
          unit_penerbit: string
          updated_at: string
          verifikasi_keuangan_at: string | null
          verifikasi_keuangan_by: string | null
          verifikasi_keuangan_status: string | null
        }
        Insert: {
          agenda_number?: number
          assigned_upk_at?: string | null
          assigned_upk_id?: string | null
          assigned_upk_manually?: boolean | null
          created_at?: string
          dasar_penugasan?: string | null
          document_path?: string | null
          employee_id?: string | null
          employee_ids?: string[] | null
          id?: string
          jenis_plh_plt?: string | null
          konsep_masuk_at?: string | null
          konsep_masuk_by?: string | null
          no_satu_kemenkeu?: string | null
          nomor_naskah_dinas: string
          pejabat_unit_pemohon_id?: string | null
          pejabat_unit_penerbit_id?: string | null
          perihal: string
          proses_nd_at?: string | null
          proses_nd_by?: string | null
          proses_st_at?: string | null
          proses_st_by?: string | null
          selesai_at?: string | null
          selesai_by?: string | null
          tanggal: string
          tanggal_plh_mulai?: string | null
          tanggal_plh_selesai?: string | null
          tanggal_satu_kemenkeu?: string | null
          unit_pemohon: string
          unit_penerbit: string
          updated_at?: string
          verifikasi_keuangan_at?: string | null
          verifikasi_keuangan_by?: string | null
          verifikasi_keuangan_status?: string | null
        }
        Update: {
          agenda_number?: number
          assigned_upk_at?: string | null
          assigned_upk_id?: string | null
          assigned_upk_manually?: boolean | null
          created_at?: string
          dasar_penugasan?: string | null
          document_path?: string | null
          employee_id?: string | null
          employee_ids?: string[] | null
          id?: string
          jenis_plh_plt?: string | null
          konsep_masuk_at?: string | null
          konsep_masuk_by?: string | null
          no_satu_kemenkeu?: string | null
          nomor_naskah_dinas?: string
          pejabat_unit_pemohon_id?: string | null
          pejabat_unit_penerbit_id?: string | null
          perihal?: string
          proses_nd_at?: string | null
          proses_nd_by?: string | null
          proses_st_at?: string | null
          proses_st_by?: string | null
          selesai_at?: string | null
          selesai_by?: string | null
          tanggal?: string
          tanggal_plh_mulai?: string | null
          tanggal_plh_selesai?: string | null
          tanggal_satu_kemenkeu?: string | null
          unit_pemohon?: string
          unit_penerbit?: string
          updated_at?: string
          verifikasi_keuangan_at?: string | null
          verifikasi_keuangan_by?: string | null
          verifikasi_keuangan_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plh_kepala_assigned_upk_id_fkey"
            columns: ["assigned_upk_id"]
            isOneToOne: false
            referencedRelation: "tim_upk"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          eselon_iii: string | null
          eselon_iv: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
          user_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          eselon_iii?: string | null
          eselon_iv?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          user_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          eselon_iii?: string | null
          eselon_iv?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          user_status?: string | null
        }
        Relationships: []
      }
      pu_syarat_general: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          jenis: string
          max_grade: number
          no_urut: number | null
          syarat: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jenis: string
          max_grade: number
          no_urut?: number | null
          syarat: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          jenis?: string
          max_grade?: number
          no_urut?: number | null
          syarat?: string
          updated_at?: string
        }
        Relationships: []
      }
      qr_presensi_events: {
        Row: {
          alamat: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          latitude: number
          link_tujuan: string
          longitude: number
          nama_kegiatan: string
          qr_code: string | null
          radius_meter: number
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string | null
        }
        Insert: {
          alamat?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          latitude: number
          link_tujuan: string
          longitude: number
          nama_kegiatan: string
          qr_code?: string | null
          radius_meter?: number
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at?: string | null
        }
        Update: {
          alamat?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          link_tujuan?: string
          longitude?: number
          nama_kegiatan?: string
          qr_code?: string | null
          radius_meter?: number
          tanggal_mulai?: string
          tanggal_selesai?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      qr_presensi_responses: {
        Row: {
          created_at: string | null
          device_info: string | null
          distance_meter: number
          event_id: string
          foto_absen: string | null
          id: string
          latitude: number
          longitude: number
          nama: string
          nip: string | null
          waktu_absen: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          distance_meter: number
          event_id: string
          foto_absen?: string | null
          id?: string
          latitude: number
          longitude: number
          nama: string
          nip?: string | null
          waktu_absen?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          distance_meter?: number
          event_id?: string
          foto_absen?: string | null
          id?: string
          latitude?: number
          longitude?: number
          nama?: string
          nip?: string | null
          waktu_absen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_presensi_responses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "qr_presensi_events"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_settings: {
        Row: {
          auto_mode: boolean | null
          id: string
          rotation_interval_seconds: number | null
          updated_at: string
          updated_by_email: string | null
        }
        Insert: {
          auto_mode?: boolean | null
          id?: string
          rotation_interval_seconds?: number | null
          updated_at?: string
          updated_by_email?: string | null
        }
        Update: {
          auto_mode?: boolean | null
          id?: string
          rotation_interval_seconds?: number | null
          updated_at?: string
          updated_by_email?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          created_by_email: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          quote_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          quote_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          quote_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      realisasi_anggaran: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          kode_akun: string | null
          kode_kegiatan: string | null
          kode_komponen: string | null
          kode_output: string | null
          kode_program: string | null
          kode_sub_komponen: string | null
          kode_sub_output: string | null
          level_hierarki: number | null
          lock_pagu: number | null
          no_urut: number | null
          pagu_revisi: number | null
          periode: string | null
          persentase: number | null
          realisasi_periode_ini: number | null
          realisasi_periode_lalu: number | null
          realisasi_sd_periode: number | null
          sisa_anggaran: number | null
          tahun_anggaran: number | null
          updated_at: string
          uraian: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          kode_akun?: string | null
          kode_kegiatan?: string | null
          kode_komponen?: string | null
          kode_output?: string | null
          kode_program?: string | null
          kode_sub_komponen?: string | null
          kode_sub_output?: string | null
          level_hierarki?: number | null
          lock_pagu?: number | null
          no_urut?: number | null
          pagu_revisi?: number | null
          periode?: string | null
          persentase?: number | null
          realisasi_periode_ini?: number | null
          realisasi_periode_lalu?: number | null
          realisasi_sd_periode?: number | null
          sisa_anggaran?: number | null
          tahun_anggaran?: number | null
          updated_at?: string
          uraian: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          kode_akun?: string | null
          kode_kegiatan?: string | null
          kode_komponen?: string | null
          kode_output?: string | null
          kode_program?: string | null
          kode_sub_komponen?: string | null
          kode_sub_output?: string | null
          level_hierarki?: number | null
          lock_pagu?: number | null
          no_urut?: number | null
          pagu_revisi?: number | null
          periode?: string | null
          persentase?: number | null
          realisasi_periode_ini?: number | null
          realisasi_periode_lalu?: number | null
          realisasi_sd_periode?: number | null
          sisa_anggaran?: number | null
          tahun_anggaran?: number | null
          updated_at?: string
          uraian?: string
        }
        Relationships: []
      }
      rekap_realisasi_perjadin: {
        Row: {
          created_at: string
          created_by_email: string | null
          efisiensi: number
          id: string
          jenis_spd: string
          pagu: number
          pagu_tersedia: number | null
          persentase: number | null
          realisasi: number
          saldo: number | null
          satker: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          efisiensi?: number
          id?: string
          jenis_spd: string
          pagu?: number
          pagu_tersedia?: number | null
          persentase?: number | null
          realisasi?: number
          saldo?: number | null
          satker?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          efisiensi?: number
          id?: string
          jenis_spd?: string
          pagu?: number
          pagu_tersedia?: number | null
          persentase?: number | null
          realisasi?: number
          saldo?: number | null
          satker?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      rumah_negara: {
        Row: {
          alamat: string | null
          created_at: string
          golongan_tipe_kelas: string | null
          id: string
          jabatan: string | null
          kelurahan: string | null
          kep_psg: string | null
          kode: string | null
          kode_barang_rn: string | null
          kondisi: string | null
          nama_penghuni_id: string | null
          nama_rumah: string | null
          penghuni: string | null
          status_bersertifikat: string | null
          tanah_nup: string | null
          tipe_rn: string | null
          unit_organisasi: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          golongan_tipe_kelas?: string | null
          id?: string
          jabatan?: string | null
          kelurahan?: string | null
          kep_psg?: string | null
          kode?: string | null
          kode_barang_rn?: string | null
          kondisi?: string | null
          nama_penghuni_id?: string | null
          nama_rumah?: string | null
          penghuni?: string | null
          status_bersertifikat?: string | null
          tanah_nup?: string | null
          tipe_rn?: string | null
          unit_organisasi?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          golongan_tipe_kelas?: string | null
          id?: string
          jabatan?: string | null
          kelurahan?: string | null
          kep_psg?: string | null
          kode?: string | null
          kode_barang_rn?: string | null
          kondisi?: string | null
          nama_penghuni_id?: string | null
          nama_rumah?: string | null
          penghuni?: string | null
          status_bersertifikat?: string | null
          tanah_nup?: string | null
          tipe_rn?: string | null
          unit_organisasi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rumah_negara_nama_penghuni_id_fkey"
            columns: ["nama_penghuni_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      rundown: {
        Row: {
          created_at: string
          created_by_email: string | null
          id: string
          judul: string
          tanggal_kegiatan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          judul: string
          tanggal_kegiatan?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          id?: string
          judul?: string
          tanggal_kegiatan?: string
          updated_at?: string
        }
        Relationships: []
      }
      rundown_items: {
        Row: {
          akhir: string | null
          created_at: string
          durasi: string | null
          id: string
          kegiatan: string
          mulai: string | null
          no_urut: number
          pic_ids: string[] | null
          pic_manual: string[] | null
          pic_names: string[] | null
          rundown_id: string
          updated_at: string
          uraian: string | null
        }
        Insert: {
          akhir?: string | null
          created_at?: string
          durasi?: string | null
          id?: string
          kegiatan: string
          mulai?: string | null
          no_urut?: number
          pic_ids?: string[] | null
          pic_manual?: string[] | null
          pic_names?: string[] | null
          rundown_id: string
          updated_at?: string
          uraian?: string | null
        }
        Update: {
          akhir?: string | null
          created_at?: string
          durasi?: string | null
          id?: string
          kegiatan?: string
          mulai?: string | null
          no_urut?: number
          pic_ids?: string[] | null
          pic_manual?: string[] | null
          pic_names?: string[] | null
          rundown_id?: string
          updated_at?: string
          uraian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rundown_items_rundown_id_fkey"
            columns: ["rundown_id"]
            isOneToOne: false
            referencedRelation: "rundown"
            referencedColumns: ["id"]
          },
        ]
      }
      satker_cortax: {
        Row: {
          belum_aktivasi: number
          created_at: string
          id: string
          satuan_kerja: string
          sudah_aktivasi: number
          total_pegawai: number
          updated_at: string
        }
        Insert: {
          belum_aktivasi?: number
          created_at?: string
          id?: string
          satuan_kerja: string
          sudah_aktivasi?: number
          total_pegawai?: number
          updated_at?: string
        }
        Update: {
          belum_aktivasi?: number
          created_at?: string
          id?: string
          satuan_kerja?: string
          sudah_aktivasi?: number
          total_pegawai?: number
          updated_at?: string
        }
        Relationships: []
      }
      satuan_kerja: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          keterangan: string | null
          kode_satuan_kerja: string | null
          nama_satuan_kerja: string
          no_urut: number | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          keterangan?: string | null
          kode_satuan_kerja?: string | null
          nama_satuan_kerja: string
          no_urut?: number | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          keterangan?: string | null
          kode_satuan_kerja?: string | null
          nama_satuan_kerja?: string
          no_urut?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      st_luar_kantor: {
        Row: {
          created_at: string
          created_by_email: string | null
          dasar_penugasan: string
          employee_ids: string[]
          hal: string | null
          id: string
          lokasi_penugasan: string
          pdf_dokumen: string | null
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at: string
          updated_by_email: string | null
          waktu_penugasan: string | null
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          dasar_penugasan: string
          employee_ids: string[]
          hal?: string | null
          id?: string
          lokasi_penugasan: string
          pdf_dokumen?: string | null
          tanggal_mulai: string
          tanggal_selesai: string
          updated_at?: string
          updated_by_email?: string | null
          waktu_penugasan?: string | null
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          dasar_penugasan?: string
          employee_ids?: string[]
          hal?: string | null
          id?: string
          lokasi_penugasan?: string
          pdf_dokumen?: string | null
          tanggal_mulai?: string
          tanggal_selesai?: string
          updated_at?: string
          updated_by_email?: string | null
          waktu_penugasan?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          image_url: string
          user_email: string | null
          user_id: string
          user_name: string | null
          user_role: string | null
          viewed_by: string[] | null
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
          user_role?: string | null
          viewed_by?: string[] | null
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          user_role?: string | null
          viewed_by?: string[] | null
          views_count?: number | null
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          story_id: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          story_id: string
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          story_id?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      surat_masuk: {
        Row: {
          created_at: string
          feedback_comment: string | null
          feedback_rating: number | null
          foto_penerima: string | null
          hal: string
          id: string
          instansi_pengirim: string | null
          nama_penerima: string
          nama_pengirim: string
          nomor_agenda: number
          nomor_dokumen: string
          pdf_dokumen: string | null
          petugas_bc_penerima: string
          tanggal_terima: string
          tujuan_bagian: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          foto_penerima?: string | null
          hal: string
          id?: string
          instansi_pengirim?: string | null
          nama_penerima: string
          nama_pengirim: string
          nomor_agenda?: number
          nomor_dokumen: string
          pdf_dokumen?: string | null
          petugas_bc_penerima: string
          tanggal_terima?: string
          tujuan_bagian?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          feedback_comment?: string | null
          feedback_rating?: number | null
          foto_penerima?: string | null
          hal?: string
          id?: string
          instansi_pengirim?: string | null
          nama_penerima?: string
          nama_pengirim?: string
          nomor_agenda?: number
          nomor_dokumen?: string
          pdf_dokumen?: string | null
          petugas_bc_penerima?: string
          tanggal_terima?: string
          tujuan_bagian?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      syarat_kenaikan_pangkat: {
        Row: {
          created_at: string
          created_by_email: string | null
          deskripsi: string | null
          id: string
          is_active: boolean | null
          jenis_kenaikan: string
          kode_kriteria: string
          kriteria: string
          no_urut: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_email?: string | null
          deskripsi?: string | null
          id?: string
          is_active?: boolean | null
          jenis_kenaikan: string
          kode_kriteria: string
          kriteria: string
          no_urut?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_email?: string | null
          deskripsi?: string | null
          id?: string
          is_active?: boolean | null
          jenis_kenaikan?: string
          kode_kriteria?: string
          kriteria?: string
          no_urut?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tim_keuangan: {
        Row: {
          assignment_count: number | null
          created_at: string
          email: string
          id: string
          last_assigned_at: string | null
          name: string
          telepon: string | null
          tugas: string | null
          updated_at: string
        }
        Insert: {
          assignment_count?: number | null
          created_at?: string
          email: string
          id?: string
          last_assigned_at?: string | null
          name: string
          telepon?: string | null
          tugas?: string | null
          updated_at?: string
        }
        Update: {
          assignment_count?: number | null
          created_at?: string
          email?: string
          id?: string
          last_assigned_at?: string | null
          name?: string
          telepon?: string | null
          tugas?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tim_upk: {
        Row: {
          assignment_count: number
          created_at: string
          email: string
          id: string
          last_assigned_at: string | null
          name: string
          telepon: string | null
          tugas: string | null
          updated_at: string
        }
        Insert: {
          assignment_count?: number
          created_at?: string
          email: string
          id?: string
          last_assigned_at?: string | null
          name: string
          telepon?: string | null
          tugas?: string | null
          updated_at?: string
        }
        Update: {
          assignment_count?: number
          created_at?: string
          email?: string
          id?: string
          last_assigned_at?: string | null
          name?: string
          telepon?: string | null
          tugas?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_menu_access: {
        Row: {
          allowed_menus: string[]
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_menus?: string[]
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_menus?: string[]
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_book_nomor_lengkap: {
        Args: { p_jenis_surat: string; p_nomor_urut: number }
        Returns: string
      }
      get_corebase_age_stats: { Args: never; Returns: Json }
      get_corebase_gender_stats: { Args: never; Returns: Json }
      get_corebase_goljab_stats: { Args: never; Returns: Json }
      get_corebase_pensiun_stats: { Args: never; Returns: Json }
      get_corebase_religion_stats: { Args: never; Returns: Json }
      get_corebase_status_stats: { Args: never; Returns: Json }
      get_next_book_nomor: { Args: { p_jenis_surat: string }; Returns: number }
      get_next_tim_upk: { Args: never; Returns: string }
      get_next_tim_upk_for_plh: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "overview" | "sapu_jagat" | "super"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "overview", "sapu_jagat", "super"],
    },
  },
} as const
