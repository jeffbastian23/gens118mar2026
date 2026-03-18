// Centralized Menu Configuration
// This file contains all menu definitions used across the application
// When adding new menus/submenus, add them here and they will automatically
// be available in AccessManagement and other parts of the application

export interface SubMenuItem {
  id: string;
  label: string;
}

export interface MenuItem {
  id: string;
  label: string;
  subMenus?: SubMenuItem[];
}

// Main navigation menus
export const MAIN_MENUS: MenuItem[] = [
  { id: "dashboard", label: "Dashboard" },
];

// Administrasi SDM menus with sub-menus
export const ADMINISTRASI_SDM_MENUS: MenuItem[] = [
  { 
    id: "daftar-pegawai", 
    label: "Daftar Pegawai",
    subMenus: [
      { id: "daftar-pegawai:daftar-pegawai", label: "Daftar Pegawai" },
      { id: "daftar-pegawai:data-pokok", label: "Data Pokok" },
      { id: "daftar-pegawai:golongan", label: "Golongan" },
      { id: "daftar-pegawai:satuan-kerja", label: "Satuan Kerja" },
      { id: "daftar-pegawai:demografi", label: "Demografi" },
    ]
  },
  { 
    id: "surat-tugas", 
    label: "Surat Tugas",
    subMenus: [
      { id: "surat-tugas:dashboard", label: "Dashboard" },
      { id: "surat-tugas:form-permohonan", label: "Form Permohonan" },
      { id: "surat-tugas:cek-status", label: "Cek Status" },
      { id: "surat-tugas:st-luar-kantor", label: "ST Luar Kantor" },
      { id: "surat-tugas:realisasi-anggaran", label: "Realisasi Anggaran" },
      { id: "surat-tugas:rekap-realisasi-perjadin", label: "Rekap Realisasi Perjadin" },
      { id: "surat-tugas:tim-upk", label: "Tim UPK" },
      { id: "surat-tugas:tim-keuangan", label: "Tim Keuangan" },
      { id: "surat-tugas:audit", label: "Audit" },
    ]
  },
  { 
    id: "plh-plt", 
    label: "Plh/Plt",
    subMenus: [
      { id: "plh-plt:dashboard", label: "Dashboard" },
      { id: "plh-plt:form-permohonan", label: "Form Permohonan" },
      { id: "plh-plt:status", label: "Status" },
    ]
  },
  { 
    id: "grading", 
    label: "Grading",
    subMenus: [
      { id: "grading:dashboard", label: "Dashboard" },
      { id: "grading:big-data", label: "Big Data" },
      { id: "grading:single-core", label: "Single Core" },
      { id: "grading:daftar-grade", label: "Daftar Grade" },
      { id: "grading:tabel-408", label: "Tabel 408" },
      { id: "grading:mekanisme-54", label: "Mekanisme 54" },
      { id: "grading:permohonan", label: "Permohonan" },
      { id: "grading:kelengkapan-simulasi", label: "Simulasi" },
      { id: "grading:kuesioner", label: "Kuesioner" },
      { id: "grading:hasil-evaluasi", label: "Hasil Evaluasi" },
      { id: "grading:berita-acara", label: "Berita Acara" },
      { id: "grading:sk-penetapan", label: "SK Penetapan" },
      { id: "grading:monev", label: "Monev" },
    ]
  },
  { id: "pensiun", label: "Pensiun" },
  { 
    id: "absensi", 
    label: "Absensi",
    subMenus: [
      { id: "absensi:dashboard", label: "Dashboard" },
      { id: "absensi:pengolahan-data", label: "Pengolahan Data" },
    ]
  },
  { 
    id: "kenaikan-pangkat", 
    label: "Kenaikan Pangkat",
    subMenus: [
      { id: "kenaikan-pangkat:dashboard", label: "Dashboard" },
      { id: "kenaikan-pangkat:syarat-kenaikan-pangkat", label: "Syarat Kenaikan Pangkat" },
      { id: "kenaikan-pangkat:olah-data", label: "Olah Data" },
    ]
  },
  { id: "kenaikan-gaji", label: "Kenaikan Gaji Berkala" },
  { 
    id: "perkawinan", 
    label: "Perkawinan",
    subMenus: [
      { id: "perkawinan:dashboard", label: "Dashboard" },
      { id: "perkawinan:karis-karsu", label: "Karis/Karsu" },
    ]
  },
  { id: "cuti", label: "Cuti" },
  { 
    id: "berita", 
    label: "Berita",
    subMenus: [
      { id: "berita:lihat-berita", label: "Lihat Berita" },
      { id: "berita:lihat-event", label: "Lihat Event" },
      { id: "berita:kelola-berita", label: "Kelola Berita" },
      { id: "berita:kelola-event", label: "Kelola Event" },
      { id: "berita:quote", label: "Quote" },
    ]
  },
  { 
    id: "arsip", 
    label: "Arsip",
    subMenus: [
      { id: "arsip:dashboard", label: "Dashboard" },
      { id: "arsip:gudang-tegalsari", label: "Gudang Arsip Tegalsari" },
      { id: "arsip:isi-berkas", label: "Isi Berkas" },
      { id: "arsip:daftar-berkas", label: "Daftar Berkas" },
      { id: "arsip:pendataan-masuk", label: "Pendataan Masuk" },
      { id: "arsip:peminjaman", label: "Peminjaman Arsip" },
    ]
  },
  { 
    id: "digital-footprint", 
    label: "Digital Footprint",
    subMenus: [
      { id: "digital-footprint:dashboard", label: "Dashboard" },
      { id: "digital-footprint:database", label: "Database" },
      { id: "digital-footprint:ai-voice", label: "AI Voice" },
    ]
  },
  { 
    id: "agenda", 
    label: "Agenda",
    subMenus: [
      { id: "agenda:dashboard", label: "Dashboard" },
      { id: "agenda:agenda", label: "Agenda" },
      { id: "agenda:book-room", label: "Book Room" },
      { id: "agenda:absen", label: "Absen" },
      { id: "agenda:issue", label: "Issue" },
    ]
  },
  { 
    id: "kunjungan-tamu", 
    label: "Pengguna Jasa/Layanan",
    subMenus: [
      { id: "kunjungan-tamu:dashboard", label: "Dashboard" },
      { id: "kunjungan-tamu:daftar-kunjungan", label: "Daftar Kunjungan" },
      { id: "kunjungan-tamu:penilaian-skm", label: "Penilaian SKM" },
    ]
  },
  { 
    id: "surat-masuk", 
    label: "Administrasi Surat",
    subMenus: [
      { id: "surat-masuk:dashboard", label: "Dashboard" },
      { id: "surat-masuk:daftar-surat-masuk", label: "Daftar Surat Masuk" },
      { id: "surat-masuk:buku-bambu", label: "Buku Bambu" },
      { id: "surat-masuk:book-nomor-manual", label: "Book Nomor Manual" },
      { id: "surat-masuk:distribusi-surat", label: "Distribusi Surat" },
    ]
  },
  { id: "ebook", label: "eBook" },
  { 
    id: "qr-presensi", 
    label: "QR Presensi",
    subMenus: [
      { id: "qr-presensi:dashboard", label: "Dashboard" },
      { id: "qr-presensi:database-kegiatan", label: "Database Kegiatan" },
      { id: "qr-presensi:data-absensi", label: "Data Absensi" },
    ]
  },
  { 
    id: "live-chat-sdm", 
    label: "Live Chat SDM",
    subMenus: [
      { id: "live-chat-sdm:live-chat", label: "Live Chat" },
      { id: "live-chat-sdm:voice-call", label: "Voice Call" },
      { id: "live-chat-sdm:faq", label: "FAQ" },
      { id: "live-chat-sdm:pembagian-tugas", label: "Pembagian Tugas" },
    ]
  },
  { id: "japri-teman", label: "Japri Teman" },
  { 
    id: "aktivasi-cortax", 
    label: "Aktivasi Cortax",
    subMenus: [
      { id: "aktivasi-cortax:dashboard", label: "Dashboard" },
      { id: "aktivasi-cortax:dashboard-satker", label: "Dashboard Satker" },
      { id: "aktivasi-cortax:database", label: "Database" },
    ]
  },
  { 
    id: "rumah-negara", 
    label: "Rumah Negara",
    subMenus: [
      { id: "rumah-negara:dashboard", label: "Dashboard" },
      { id: "rumah-negara:data-rumah-negara", label: "Data Rumah Negara" },
    ]
  },
  { 
    id: "monitor-pbdk", 
    label: "Monitor PBDK",
    subMenus: [
      { id: "monitor-pbdk:dashboard", label: "Dashboard" },
      { id: "monitor-pbdk:database", label: "Database" },
    ]
  },
  { 
    id: "penilaian-perilaku", 
    label: "Penilaian Perilaku",
    subMenus: [
      { id: "penilaian-perilaku:dashboard", label: "Dashboard" },
      { id: "penilaian-perilaku:database", label: "Database" },
    ]
  },
  { 
    id: "corebase", 
    label: "Corebase",
    subMenus: [
      { id: "corebase:db-pokok", label: "DB Pokok" },
      { id: "corebase:db-status", label: "DB Status" },
      { id: "corebase:db-pensiun", label: "DB Pensiun" },
      { id: "corebase:db-rekam-jejak", label: "DB Rekam Jejak" },
      { id: "corebase:db-goljab", label: "DB Goljab" },
      { id: "corebase:eselonisasi", label: "Eselonisasi" },
      { id: "corebase:pegawai-atasan", label: "Pegawai & Atasan" },
    ]
  },
];

// Pengembangan SDM menus
export const PENGEMBANGAN_SDM_MENUS: MenuItem[] = [
  { id: "pendidikan", label: "Pendidikan" },
  { id: "kompetensi", label: "Kompetensi" },
  { 
    id: "mutasi", 
    label: "Mutasi",
    subMenus: [
      { id: "mutasi:dashboard", label: "Dashboard" },
      { id: "mutasi:pengolahan-data", label: "Pengolahan Data" },
    ]
  },
  { id: "kekuatan-pegawai", label: "Kekuatan Pegawai" },
];

// All menus combined
export const ALL_MENUS = [...MAIN_MENUS, ...ADMINISTRASI_SDM_MENUS, ...PENGEMBANGAN_SDM_MENUS];

// Get all menu IDs including sub-menu IDs
export const getAllMenuIds = (): string[] => {
  const ids: string[] = [];
  ALL_MENUS.forEach(menu => {
    ids.push(menu.id);
    if (menu.subMenus) {
      menu.subMenus.forEach(sub => ids.push(sub.id));
    }
  });
  return ids;
};

// Get total menu count
export const getTotalMenuCount = (): number => {
  return ALL_MENUS.length;
};

// Get total sub-menu count
export const getTotalSubMenuCount = (): number => {
  let count = 0;
  ALL_MENUS.forEach(menu => {
    if (menu.subMenus) {
      count += menu.subMenus.length;
    }
  });
  return count;
};
