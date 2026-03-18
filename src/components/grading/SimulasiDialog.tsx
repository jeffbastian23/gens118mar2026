import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IsianTabelRow {
  data_per_januari_tahun: string;
  hasil_evaluasi: string;
  predikat_kinerja: string;
  gol_ruang: string;
  status_hukuman_disiplin: string;
  pendidikan: string;
  hasil_simulasi: string;
  current_grade?: number; // Track current grade for display
}

interface SimulasiFormData {
  nama_lengkap: string;
  nip: string;
  unit_organisasi: string;
  isian_tabel: IsianTabelRow[];
  grade_awal: number | null;
  batas_peringkat_tertinggi: number | null;
  rekomendasi_grade: number | null;
  nomenklatur_jabatan: string;
  lokasi: string;
  tanggal: string;
  jabatan_atasan_langsung: string;
  nama_atasan_langsung: string;
  nip_atasan_langsung: string;
  jabatan_unit_kepegawaian: string;
  nama_pejabat_kepegawaian: string;
  nip_pejabat_kepegawaian: string;
}

interface PermohonanOption {
  id: string;
  nama_lengkap: string;
  nip: string;
}

interface BigDataInfo {
  nip: string;
  eselon_iii: string;
  atasan_langsung_nama?: string;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_jabatan: string;
}

interface DaftarGrade {
  id: string;
  grade: number;
  jabatan: string;
  klaster: string;
  syarat_golongan?: string;
  syarat_pendidikan?: string;
}

interface PuSyaratGeneral {
  jenis: string;
  syarat: string;
  max_grade: number;
}

interface SimulasiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingData?: any;
  onSuccess: () => void;
}

const PREDIKAT_KINERJA_OPTIONS = ["Sangat Baik", "Baik", "Butuh Perbaikan", "Kurang", "Sangat Kurang"];
const STATUS_HUKUMAN_OPTIONS = ["Ya", "Tidak"];
const PENDIDIKAN_OPTIONS = ["SMA", "SMK", "D1", "D3", "S1", "S2", "S3"];
const HASIL_SIMULASI_OPTIONS = ["CPNS", "PNS", "Naik", "Tetap", "Turun"];
const GOL_RUANG_OPTIONS = ["II/a", "II/b", "II/c", "II/d", "III/a", "III/b", "III/c", "III/d", "IV/a", "IV/b", "IV/c", "IV/d", "IV/e"];

const emptyRow: IsianTabelRow = {
  data_per_januari_tahun: "",
  hasil_evaluasi: "",
  predikat_kinerja: "",
  gol_ruang: "",
  status_hukuman_disiplin: "Tidak",
  pendidikan: "",
  hasil_simulasi: "",
  current_grade: undefined,
};

// FIXED: Correct max grade values for each golongan/ruang
// II/a = 6, II/b = 7, II/c = 8, II/d = 9, III/a = 10, III/b = 11, III/c-IV/e = 12
const GOLONGAN_MAX_GRADE_MAP: Record<string, number> = {
  "II/a": 6,
  "II/b": 7,
  "II/c": 8,
  "II/d": 9,
  "III/a": 10,
  "III/b": 11,
  "III/c": 12,
  "III/d": 12,
  "IV/a": 12,
  "IV/b": 12,
  "IV/c": 12,
  "IV/d": 12,
  "IV/e": 12,
};

// Helper to check if golongan meets max grade requirement
const getMaxGradeForGolongan = (golongan: string, _puSyaratGeneral?: PuSyaratGeneral[]): number => {
  // Use fixed mapping - ignore pu_syarat_general to ensure correct values
  return GOLONGAN_MAX_GRADE_MAP[golongan] || 12;
};

// Pendidikan max grade map - UPDATED: SMA/SMK max grade is 6 (not 5)
const PENDIDIKAN_MAX_GRADE_MAP: Record<string, number> = {
  "SMA": 6,
  "SMK": 6,
  "SLTA": 6,
  "D1": 8,
  "DI": 8,
  "D3": 10,
  "DIII": 10,
  "D4": 12,
  "DIV": 12,
  "S1": 12,
  "SI": 12,
  "S2": 12,
  "SII": 12,
  "S3": 12,
  "SIII": 12,
};

const getMaxGradeForPendidikan = (pendidikan: string, _puSyaratGeneral?: PuSyaratGeneral[]): number => {
  // Use fixed mapping based on rules:
  // SMA/SMK = 6, D1 = 8, D3 = 10, D4/S1/S2/S3 = 12
  const normalized = pendidikan?.toUpperCase().trim() || "";
  return PENDIDIKAN_MAX_GRADE_MAP[normalized] || 12;
};

// Helper function to get nomenklatur jabatan based on pendidikan
// SMA/SMK/D1/DI → Pengadministrasi Perkantoran
// D3/DIII → Pengolah Data dan Informasi  
// D4/DIV/S1/SI/S2/S3 → Penata Layanan Operasional
const getNomenklaturKlasterFromPendidikan = (pendidikan: string): "kiri" | "tengah" | "kanan" => {
  const normalized = pendidikan?.toUpperCase().trim() || "";
  
  // SMA/SMK/D1/DI → klaster kanan (Pengadministrasi Perkantoran)
  if (["SMA", "SMK", "SLTA", "D1", "DI"].includes(normalized)) {
    return "kanan";
  }
  
  // D3/DIII → klaster tengah (Pengolah Data dan Informasi)
  if (["D3", "DIII"].includes(normalized)) {
    return "tengah";
  }
  
  // D4/DIV/S1/SI/S2/SII/S3/SIII → klaster kiri (Penata Layanan Operasional)
  return "kiri";
};

// Helper to determine which klaster to use based on golongan and pendidikan
// Rules from Tabel 408:
// - II/a to II/c with SMA/D1 → klaster kanan (jabatan3)
// - II/c to III/a with D3 → klaster tengah (jabatan2)
// - III/a to III/b with D4/S1 → klaster kiri (jabatan1)
const getKlasterType = (golongan: string, pendidikan: string): "kiri" | "tengah" | "kanan" | null => {
  const golLevel = GOL_RUANG_OPTIONS.indexOf(golongan);
  
  // Normalize pendidikan
  const pendNorm = pendidikan.toUpperCase();
  
  // II/a (0) to II/c (2) with SMA/D1 → klaster kanan
  if (golLevel >= 0 && golLevel <= 2 && (pendNorm === "SMA" || pendNorm === "SMK" || pendNorm === "D1" || pendNorm === "SLTA")) {
    return "kanan";
  }
  
  // II/c (2) to III/a (4) with D3 → klaster tengah
  if (golLevel >= 2 && golLevel <= 4 && pendNorm === "D3") {
    return "tengah";
  }
  
  // III/a (4) to III/b (5) with D4/S1 → klaster kiri
  if (golLevel >= 4 && golLevel <= 5 && (pendNorm === "D4" || pendNorm === "S1" || pendNorm === "D4/S1" || pendNorm === "S2" || pendNorm === "S3")) {
    return "kiri";
  }
  
  // Higher golongan with D4/S1 also use kiri
  if (golLevel > 5 && (pendNorm === "D4" || pendNorm === "S1" || pendNorm === "D4/S1" || pendNorm === "S2" || pendNorm === "S3")) {
    return "kiri";
  }
  
  return null;
};

// Data structure for Tabel 408 lookup - Subbagian Tata Usaha dan Keuangan
// Klaster kiri = D4/S1, Klaster tengah = D3, Klaster kanan = SMA/D1
const TABEL_408_DATA: Record<number, { kiri?: string; tengah?: string; kanan?: string }> = {
  12: { kiri: "Penata Layanan Operasional Tk.I" },
  11: { kiri: "Penata Layanan Operasional Tk.II" },
  10: { kiri: "Penata Layanan Operasional Tk.III", tengah: "Pengolah Data dan Informasi Tk.I" },
  9: { kiri: "Penata Layanan Operasional Tk.IV", tengah: "Pengolah Data dan Informasi Tk.II" },
  8: { kiri: "Penata Layanan Operasional Tk.V", tengah: "Pengolah Data dan Informasi Tk.III", kanan: "Pengadministrasi Perkantoran Tk.I" },
  7: { tengah: "Pengolah Data dan Informasi Tk.IV", kanan: "Pengadministrasi Perkantoran Tk.II" },
  6: { tengah: "Pengolah Data dan Informasi Tk.V", kanan: "Pengadministrasi Perkantoran Tk.III" },
  5: { kanan: "Pengadministrasi Perkantoran Tk.IV" },
  4: { kanan: "Pengadministrasi Perkantoran Tk.V" },
};

// Get nomenklatur jabatan based on grade and pendidikan only (for PU)
// This is the primary function for determining jabatan baru
// SMA/SMK/D1/DI → klaster kanan (Pengadministrasi Perkantoran)
// D3/DIII → klaster tengah (Pengolah Data dan Informasi)
// D4/DIV/S1/SI/S2/S3 → klaster kiri (Penata Layanan Operasional)
const getNomenklaturJabatanFromPendidikan = (grade: number, pendidikan: string): string => {
  const gradeData = TABEL_408_DATA[grade];
  if (!gradeData) return "";
  
  const klaster = getNomenklaturKlasterFromPendidikan(pendidikan);
  
  // Try to get jabatan from appropriate klaster
  if (klaster === "kiri" && gradeData.kiri) return gradeData.kiri;
  if (klaster === "tengah" && gradeData.tengah) return gradeData.tengah;
  if (klaster === "kanan" && gradeData.kanan) return gradeData.kanan;
  
  // Fallback based on klaster hierarchy: for D3 try tengah then kiri, for SMA try kanan only
  if (klaster === "tengah") {
    return gradeData.tengah || gradeData.kiri || "";
  }
  if (klaster === "kanan") {
    return gradeData.kanan || "";
  }
  
  // For kiri (D4/S1+), fallback to tengah if kiri not available
  return gradeData.kiri || gradeData.tengah || "";
};

// Legacy function - kept for backward compatibility but now uses pendidikan-based logic
const getNomenklaturJabatan = (grade: number, golongan: string, pendidikan: string): string => {
  // Use pendidikan-only logic (ignore golongan for PU)
  return getNomenklaturJabatanFromPendidikan(grade, pendidikan);
};

export default function SimulasiDialog({ open, onOpenChange, editingData, onSuccess }: SimulasiDialogProps) {
  const [loading, setLoading] = useState(false);
  const [permohonanOptions, setPermohonanOptions] = useState<PermohonanOption[]>([]);
  const [bigDataMap, setBigDataMap] = useState<Record<string, BigDataInfo>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [daftarGradeList, setDaftarGradeList] = useState<DaftarGrade[]>([]);
  const [puSyaratGeneral, setPuSyaratGeneral] = useState<PuSyaratGeneral[]>([]);
  const [namaLengkapOpen, setNamaLengkapOpen] = useState(false);
  const [namaLengkapSearch, setNamaLengkapSearch] = useState("");
  const [pejabatKepegawaianOpen, setPejabatKepegawaianOpen] = useState(false);
  const [pejabatKepegawaianSearch, setPejabatKepegawaianSearch] = useState("");
  
  const [formData, setFormData] = useState<SimulasiFormData>({
    nama_lengkap: "",
    nip: "",
    unit_organisasi: "",
    isian_tabel: [{ ...emptyRow }],
    grade_awal: null,
    batas_peringkat_tertinggi: null,
    rekomendasi_grade: null,
    nomenklatur_jabatan: "",
    lokasi: "",
    tanggal: new Date().toISOString().split('T')[0],
    jabatan_atasan_langsung: "",
    nama_atasan_langsung: "",
    nip_atasan_langsung: "",
    jabatan_unit_kepegawaian: "",
    nama_pejabat_kepegawaian: "",
    nip_pejabat_kepegawaian: "",
  });

  useEffect(() => {
    if (open) {
      fetchPermohonanOptions();
      fetchBigData();
      fetchEmployees();
      fetchDaftarGrade();
      fetchPuSyaratGeneral();
    }
  }, [open]);

  useEffect(() => {
    if (editingData) {
      const isianTabel = editingData.isian_tabel || [{ ...emptyRow }];
      setFormData({
        nama_lengkap: editingData.nama_lengkap || "",
        nip: editingData.nip || "",
        unit_organisasi: editingData.unit_organisasi || "",
        isian_tabel: Array.isArray(isianTabel) ? isianTabel : [{ ...emptyRow }],
        grade_awal: editingData.grade_awal || null,
        batas_peringkat_tertinggi: editingData.batas_peringkat_tertinggi || null,
        rekomendasi_grade: editingData.rekomendasi_grade || null,
        nomenklatur_jabatan: editingData.nomenklatur_jabatan || "",
        lokasi: editingData.lokasi || "",
        tanggal: editingData.tanggal || new Date().toISOString().split('T')[0],
        jabatan_atasan_langsung: editingData.jabatan_atasan_langsung || "",
        nama_atasan_langsung: editingData.nama_atasan_langsung || "",
        nip_atasan_langsung: editingData.nip_atasan_langsung || "",
        jabatan_unit_kepegawaian: editingData.jabatan_unit_kepegawaian || "",
        nama_pejabat_kepegawaian: editingData.nama_pejabat_kepegawaian || "",
        nip_pejabat_kepegawaian: editingData.nip_pejabat_kepegawaian || "",
      });
    } else {
      setFormData({
        nama_lengkap: "",
        nip: "",
        unit_organisasi: "",
        isian_tabel: [{ ...emptyRow }],
        grade_awal: null,
        batas_peringkat_tertinggi: null,
        rekomendasi_grade: null,
        nomenklatur_jabatan: "",
        lokasi: "",
        tanggal: new Date().toISOString().split('T')[0],
        jabatan_atasan_langsung: "",
        nama_atasan_langsung: "",
        nip_atasan_langsung: "",
        jabatan_unit_kepegawaian: "",
        nama_pejabat_kepegawaian: "",
        nip_pejabat_kepegawaian: "",
      });
    }
  }, [editingData, open]);

  const fetchPermohonanOptions = async () => {
    // Fetch from Big Data instead of permohonan_grading
    const { data } = await supabase
      .from("grading_big_data")
      .select("id, nama_lengkap, nip, atasan_langsung_nama");
    if (data) setPermohonanOptions(data as any);
  };

  const fetchBigData = async () => {
    const { data } = await supabase
      .from("grading_big_data")
      .select("nip, eselon_iii, atasan_langsung_nama");
    if (data) {
      const map: Record<string, BigDataInfo> = {};
      data.forEach(d => {
        if (d.nip) map[d.nip] = { nip: d.nip, eselon_iii: d.eselon_iii || "", atasan_langsung_nama: d.atasan_langsung_nama || "" };
      });
      setBigDataMap(map);
    }
  };

  const fetchEmployees = async () => {
    // Fetch ALL employees using pagination for Pejabat Kepegawaian dropdown (>1000 employees)
    let allEmployees: Employee[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data } = await supabase
        .from("employees")
        .select("id, nm_pegawai, nip, uraian_jabatan")
        .order("nm_pegawai", { ascending: true })
        .range(from, from + batchSize - 1);
      
      if (data && data.length > 0) {
        allEmployees = [...allEmployees, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    if (allEmployees.length > 0) setEmployees(allEmployees);
  };
  
  // All employees are now available for Pejabat Unit Kepegawaian dropdown
  // (Tidak lagi dibatasi ke nama-nama tertentu, semua pegawai dapat dipilih)
  const pejabatKepegawaianOptions = employees;

  const fetchDaftarGrade = async () => {
    const { data } = await supabase
      .from("daftar_grade")
      .select("id, grade, jabatan, klaster, syarat_golongan, syarat_pendidikan")
      .eq("klaster", "PU") // Only fetch PU grades for simulation
      .order("grade", { ascending: true });
    if (data) setDaftarGradeList(data);
  };

  const fetchPuSyaratGeneral = async () => {
    const { data } = await supabase
      .from("pu_syarat_general")
      .select("jenis, syarat, max_grade");
    if (data) setPuSyaratGeneral(data);
  };

  // Helper function to extract TMT data from NIP (digits 9-14)
  const extractTMTFromNIP = (nip: string): { cpnsYear: number; cpnsMonth: number; pnsYear: number; startYear: number } | null => {
    if (!nip || nip.length < 14) return null;
    const raw = nip.substring(8, 14); // digits 9-14 (0-indexed: 8-13)
    const year = parseInt(raw.substring(0, 4));
    const month = parseInt(raw.substring(4, 6));
    if (isNaN(year) || isNaN(month)) return null;
    const pnsYear = year + 1;
    // Start year logic: if month is January (01) or February (02), Start = PNS year. Otherwise Start = PNS year + 1
    const startYear = (month === 1 || month === 2) ? pnsYear : pnsYear + 1;
    return { cpnsYear: year, cpnsMonth: month, pnsYear, startYear };
  };

  const handleNamaChange = (nama: string) => {
    const selected = permohonanOptions.find(p => p.nama_lengkap === nama);
    const nip = selected?.nip || "";
    const bigData = bigDataMap[nip];
    
    // Auto-fill atasan langsung from big data
    const atasanLangsungNama = bigData?.atasan_langsung_nama || "";
    const foundAtasan = employees.find(e => e.nm_pegawai === atasanLangsungNama);
    
    // Extract TMT data from NIP for auto-filling 3 initial rows
    const tmtData = extractTMTFromNIP(nip);
    let initialRows: IsianTabelRow[] = [{ ...emptyRow }];
    
    if (tmtData) {
      // Create 3 initial rows: CPNS year, PNS year, Start year
      initialRows = [
        { 
          ...emptyRow, 
          data_per_januari_tahun: tmtData.cpnsYear.toString(),
          hasil_simulasi: "CPNS"
        },
        { 
          ...emptyRow, 
          data_per_januari_tahun: tmtData.pnsYear.toString(),
          hasil_simulasi: "PNS"
        },
        { 
          ...emptyRow, 
          data_per_januari_tahun: tmtData.startYear.toString(),
          hasil_simulasi: "Tetap" // Start year = Hitungan Tetap
        },
      ];
    }
    
    setFormData(prev => ({
      ...prev,
      nama_lengkap: nama,
      nip: nip,
      unit_organisasi: bigData?.eselon_iii || "",
      isian_tabel: initialRows,
      // Auto-fill atasan langsung
      nama_atasan_langsung: atasanLangsungNama,
      nip_atasan_langsung: foundAtasan?.nip || "",
      jabatan_atasan_langsung: foundAtasan?.uraian_jabatan || "",
    }));
  };

  const handleAtasanChange = (nama: string) => {
    const emp = employees.find(e => e.nm_pegawai === nama);
    setFormData(prev => ({
      ...prev,
      nama_atasan_langsung: nama,
      nip_atasan_langsung: emp?.nip || "",
      jabatan_atasan_langsung: emp?.uraian_jabatan || "",
    }));
  };

  const handlePejabatKepegawaianChange = (nama: string) => {
    const emp = employees.find(e => e.nm_pegawai === nama);
    setFormData(prev => ({
      ...prev,
      nama_pejabat_kepegawaian: nama,
      nip_pejabat_kepegawaian: emp?.nip || "",
      jabatan_unit_kepegawaian: emp?.uraian_jabatan || "",
    }));
    setPejabatKepegawaianOpen(false);
    setPejabatKepegawaianSearch("");
  };

  const handleGradeChange = (gradeStr: string) => {
    const grade = parseInt(gradeStr);
    
    // Get the last row's golongan and pendidikan for auto nomenklatur
    const lastRow = formData.isian_tabel[formData.isian_tabel.length - 1];
    const golongan = lastRow?.gol_ruang || "";
    const pendidikan = lastRow?.pendidikan || "";
    
    // Auto-determine nomenklatur jabatan based on grade, golongan, and pendidikan
    const autoNomenklatur = getNomenklaturJabatan(grade, golongan, pendidikan);
    
    // Fallback to daftar_grade if auto-determination fails
    const gradeData = daftarGradeList.find(g => g.grade === grade);
    const finalNomenklatur = autoNomenklatur || gradeData?.jabatan || "";
    
    setFormData(prev => ({
      ...prev,
      rekomendasi_grade: grade,
      nomenklatur_jabatan: finalNomenklatur,
    }));
  };

  // Check if row grade exceeds limits (for red highlighting)
  const isRowExceedingLimits = (rowIndex: number, golongan: string, pendidikan: string): boolean => {
    if (!formData.grade_awal) return false;
    
    let currentGrade = formData.grade_awal;
    for (let i = 0; i <= rowIndex; i++) {
      const row = formData.isian_tabel[i];
      if (row.hasil_evaluasi === "Naik") currentGrade++;
      else if (row.hasil_evaluasi === "Turun") currentGrade = Math.max(1, currentGrade - 1);
    }
    
    // Check if current grade exceeds max for golongan or pendidikan
    const maxGradeGol = getMaxGradeForGolongan(golongan);
    const maxGradePend = getMaxGradeForPendidikan(pendidikan);
    
    return currentGrade > maxGradeGol || currentGrade > maxGradePend;
  };

  const addTableRow = () => {
    setFormData(prev => {
      const lastRow = prev.isian_tabel[prev.isian_tabel.length - 1];
      let newYear = "";
      
      // Auto-increment year from last row
      if (lastRow?.data_per_januari_tahun) {
        const lastYear = parseInt(lastRow.data_per_januari_tahun);
        if (!isNaN(lastYear)) {
          newYear = (lastYear + 1).toString();
        }
      }
      
      return {
        ...prev,
        isian_tabel: [...prev.isian_tabel, { ...emptyRow, data_per_januari_tahun: newYear }],
      };
    });
  };

  const removeTableRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      isian_tabel: prev.isian_tabel.filter((_, i) => i !== index),
    }));
  };

  // Calculate current grade based on previous rows
  const calculateCurrentGrade = (rowIndex: number): number => {
    let currentGrade = formData.grade_awal || 0;
    
    for (let i = 0; i < rowIndex; i++) {
      const row = formData.isian_tabel[i];
      if (row.hasil_evaluasi === "Naik") {
        currentGrade++;
      } else if (row.hasil_evaluasi === "Turun") {
        currentGrade = Math.max(1, currentGrade - 1);
      }
      // "Tetap" keeps the same grade
    }
    
    return currentGrade;
  };

  // Check if "Naik" option should be available for hasil evaluasi
  const canSelectNaik = (rowIndex: number, golongan: string, pendidikan: string): boolean => {
    const currentGrade = calculateCurrentGrade(rowIndex);
    const targetGrade = currentGrade + 1;
    
    // Check golongan limit
    const maxGradeGol = getMaxGradeForGolongan(golongan, puSyaratGeneral);
    if (targetGrade > maxGradeGol) return false;
    
    // Check pendidikan limit
    const maxGradePend = getMaxGradeForPendidikan(pendidikan, puSyaratGeneral);
    if (targetGrade > maxGradePend) return false;
    
    return true;
  };

  // Get available hasil evaluasi options based on requirements
  const getHasilEvaluasiOptions = (rowIndex: number, golongan: string, pendidikan: string): string[] => {
    const options = ["Tetap", "Turun"];
    
    if (canSelectNaik(rowIndex, golongan, pendidikan)) {
      options.unshift("Naik");
    }
    
    return options;
  };

  // Get available hasil simulasi options (same logic as hasil evaluasi)
  const getHasilSimulasiOptions = (rowIndex: number, golongan: string, pendidikan: string): string[] => {
    const baseOptions = ["CPNS", "PNS", "Tetap", "Turun"];
    
    if (canSelectNaik(rowIndex, golongan, pendidikan)) {
      // Insert "Naik" after "PNS"
      baseOptions.splice(2, 0, "Naik");
    }
    
    return baseOptions;
  };

  const updateTableRow = (index: number, field: keyof IsianTabelRow, value: string) => {
    setFormData(prev => {
      const newRows = [...prev.isian_tabel];
      newRows[index] = { ...newRows[index], [field]: value };
      
      // If first row year is changed, auto-update subsequent rows
      if (field === "data_per_januari_tahun" && index === 0) {
        const firstYear = parseInt(value);
        if (!isNaN(firstYear)) {
          for (let i = 1; i < newRows.length; i++) {
            newRows[i] = { ...newRows[i], data_per_januari_tahun: (firstYear + i).toString() };
          }
        }
      }
      
      // Auto-calculate rekomendasi_grade from the final grade in the last row
      // and auto-fill nomenklatur_jabatan based on pendidikan from last row
      let autoRekomendasi = prev.rekomendasi_grade;
      let autoNomenklatur = prev.nomenklatur_jabatan;
      
      if (prev.grade_awal) {
        // Calculate final grade after all evaluations
        let finalGrade = prev.grade_awal;
        for (let i = 0; i < newRows.length; i++) {
          const row = newRows[i];
          // Use hasil_simulasi for CPNS/PNS rows, hasil_evaluasi for others
          const evaluasi = row.hasil_simulasi || row.hasil_evaluasi;
          if (evaluasi === "Naik") {
            finalGrade++;
          } else if (evaluasi === "Turun") {
            finalGrade = Math.max(1, finalGrade - 1);
          }
          // Tetap, CPNS, PNS = no change
        }
        
        autoRekomendasi = finalGrade;
        
        // Get pendidikan from the last row for nomenklatur
        const lastRow = newRows[newRows.length - 1];
        const lastPendidikan = lastRow?.pendidikan || "";
        
        if (lastPendidikan && finalGrade) {
          autoNomenklatur = getNomenklaturJabatanFromPendidikan(finalGrade, lastPendidikan);
        }
      }
      
      return { 
        ...prev, 
        isian_tabel: newRows,
        rekomendasi_grade: autoRekomendasi,
        nomenklatur_jabatan: autoNomenklatur
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.nama_lengkap) {
      toast.error("Nama Lengkap wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "";

      const payload = {
        nama_lengkap: formData.nama_lengkap,
        nip: formData.nip,
        unit_organisasi: formData.unit_organisasi,
        isian_tabel: JSON.parse(JSON.stringify(formData.isian_tabel)) as any,
        grade_awal: formData.grade_awal,
        batas_peringkat_tertinggi: formData.batas_peringkat_tertinggi,
        rekomendasi_grade: formData.rekomendasi_grade,
        nomenklatur_jabatan: formData.nomenklatur_jabatan,
        lokasi: formData.lokasi,
        tanggal: formData.tanggal || null,
        jabatan_atasan_langsung: formData.jabatan_atasan_langsung,
        nama_atasan_langsung: formData.nama_atasan_langsung,
        nip_atasan_langsung: formData.nip_atasan_langsung,
        jabatan_unit_kepegawaian: formData.jabatan_unit_kepegawaian,
        nama_pejabat_kepegawaian: formData.nama_pejabat_kepegawaian,
        nip_pejabat_kepegawaian: formData.nip_pejabat_kepegawaian,
        jenis_kelengkapan: "Kelengkapan Data dan Rekomendasi Hasil Simulasi",
        status: "Pending",
        created_by_email: userEmail,
      };

      if (editingData?.id) {
        const { error } = await supabase
          .from("grading_kelengkapan_simulasi")
          .update(payload as any)
          .eq("id", editingData.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("grading_kelengkapan_simulasi")
          .insert([payload as any]);
        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get unique grades for dropdown (only PU)
  const uniqueGrades = [...new Set(daftarGradeList.map(g => g.grade))].sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{editingData ? "Edit" : "Tambah"} Data Simulasi</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Popover open={namaLengkapOpen} onOpenChange={setNamaLengkapOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={namaLengkapOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.nama_lengkap || "Pilih Nama"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Cari nama atau NIP..."
                        value={namaLengkapSearch}
                        onValueChange={setNamaLengkapSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {permohonanOptions
                            .filter(p =>
                              p.nama_lengkap.toLowerCase().includes(namaLengkapSearch.toLowerCase()) ||
                              p.nip.includes(namaLengkapSearch)
                            )
                            .slice(0, 50)
                            .map(p => (
                              <CommandItem
                                key={p.id}
                                value={`${p.nama_lengkap} ${p.nip}`}
                                onSelect={() => {
                                  handleNamaChange(p.nama_lengkap);
                                  setNamaLengkapOpen(false);
                                  setNamaLengkapSearch("");
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.nama_lengkap}</span>
                                  <span className="text-xs text-muted-foreground">NIP: {p.nip}</span>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>NIP Pelaksana</Label>
                <Input value={formData.nip} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Unit Organisasi (Eselon III)</Label>
                <Input value={formData.unit_organisasi} readOnly className="bg-muted" />
              </div>
            </div>

            {/* Dynamic Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Isian Tabel Simulasi</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTableRow}>
                  <Plus className="h-4 w-4 mr-1" /> Tambah Baris
                </Button>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-2 py-2 text-left whitespace-nowrap">Data Per Januari Tahun</th>
                      <th className="px-2 py-2 text-left">Hasil Evaluasi</th>
                      <th className="px-2 py-2 text-left">Predikat Kinerja</th>
                      <th className="px-2 py-2 text-left">Gol. Ruang</th>
                      <th className="px-2 py-2 text-left">Status Hukuman</th>
                      <th className="px-2 py-2 text-left">Pendidikan</th>
                      <th className="px-2 py-2 text-left">Hasil Simulasi</th>
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.isian_tabel.map((row, idx) => {
                      const currentGrade = calculateCurrentGrade(idx);
                      const golongan = row.gol_ruang || "";
                      const pendidikan = row.pendidikan || "";
                      const hasilEvaluasiOptions = getHasilEvaluasiOptions(idx, golongan, pendidikan);
                      const hasilSimulasiOptions = getHasilSimulasiOptions(idx, golongan, pendidikan);
                      
                      // Calculate grade after this row's hasil_evaluasi
                      let gradeAfterEval = currentGrade;
                      if (row.hasil_evaluasi === "Naik") gradeAfterEval++;
                      else if (row.hasil_evaluasi === "Turun") gradeAfterEval = Math.max(1, gradeAfterEval - 1);
                      
                      // Check if this row exceeds grade limits (for red highlighting)
                      const exceedsLimits = isRowExceedingLimits(idx, golongan, pendidikan);
                      
                      return (
                        <tr key={idx} className={`border-t ${exceedsLimits ? "bg-red-100 dark:bg-red-950/50" : ""}`}>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                placeholder="2024"
                                value={row.data_per_januari_tahun}
                                onChange={e => updateTableRow(idx, "data_per_januari_tahun", e.target.value)}
                                className="h-8 w-20"
                              />
                              {formData.grade_awal && row.hasil_evaluasi && (
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  ({gradeAfterEval})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <Select value={row.hasil_evaluasi} onValueChange={v => updateTableRow(idx, "hasil_evaluasi", v)}>
                              <SelectTrigger className="h-8 w-24"><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>
                                {hasilEvaluasiOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1">
                            <Select value={row.predikat_kinerja} onValueChange={v => updateTableRow(idx, "predikat_kinerja", v)}>
                              <SelectTrigger className="h-8 w-24"><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>
                                {PREDIKAT_KINERJA_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Select value={row.gol_ruang} onValueChange={v => updateTableRow(idx, "gol_ruang", v)}>
                                <SelectTrigger className="h-8 w-20"><SelectValue placeholder="-" /></SelectTrigger>
                                <SelectContent>
                                  {GOL_RUANG_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              {golongan && (
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                  ({getMaxGradeForGolongan(golongan, puSyaratGeneral)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <Select value={row.status_hukuman_disiplin} onValueChange={v => updateTableRow(idx, "status_hukuman_disiplin", v)}>
                              <SelectTrigger className="h-8 w-20"><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>
                                {STATUS_HUKUMAN_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <Select value={row.pendidikan} onValueChange={v => updateTableRow(idx, "pendidikan", v)}>
                                <SelectTrigger className="h-8 w-20"><SelectValue placeholder="-" /></SelectTrigger>
                                <SelectContent>
                                  {PENDIDIKAN_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              {pendidikan && (
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                  ({getMaxGradeForPendidikan(pendidikan, puSyaratGeneral)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <Select value={row.hasil_simulasi} onValueChange={v => updateTableRow(idx, "hasil_simulasi", v)}>
                              <SelectTrigger className="h-8 w-20"><SelectValue placeholder="-" /></SelectTrigger>
                              <SelectContent>
                                {hasilSimulasiOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-2 py-1">
                            {formData.isian_tabel.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeTableRow(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Grade Awal</Label>
                <Input
                  type="number"
                  value={formData.grade_awal || ""}
                  onChange={e => setFormData(prev => ({ ...prev, grade_awal: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Batas Peringkat Tertinggi (Opsional)</Label>
                <Input
                  type="number"
                  value={formData.batas_peringkat_tertinggi || ""}
                  onChange={e => setFormData(prev => ({ ...prev, batas_peringkat_tertinggi: e.target.value ? parseInt(e.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Rekomendasi Grade</Label>
                <Select value={formData.rekomendasi_grade?.toString() || ""} onValueChange={handleGradeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueGrades.map(grade => (
                      <SelectItem key={grade} value={grade.toString()}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nomenklatur Jabatan</Label>
                {formData.rekomendasi_grade && TABEL_408_DATA[formData.rekomendasi_grade] ? (
                  <Select 
                    value={formData.nomenklatur_jabatan} 
                    onValueChange={v => setFormData(prev => ({ ...prev, nomenklatur_jabatan: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Nomenklatur" />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const gradeData = TABEL_408_DATA[formData.rekomendasi_grade!];
                        const options: string[] = [];
                        if (gradeData?.kiri) options.push(gradeData.kiri);
                        if (gradeData?.tengah) options.push(gradeData.tengah);
                        if (gradeData?.kanan) options.push(gradeData.kanan);
                        return options.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={formData.nomenklatur_jabatan} readOnly className="bg-muted" />
                )}
              </div>
            </div>

            {/* Location & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Input
                  value={formData.lokasi}
                  onChange={e => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
                  placeholder="Masukkan lokasi"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={formData.tanggal}
                  onChange={e => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                />
              </div>
            </div>

            {/* Atasan Langsung */}
            <div className="space-y-2">
              <Label className="font-semibold">Atasan Langsung</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Jabatan Atasan Langsung</Label>
                  <Input value={formData.jabatan_atasan_langsung} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Atasan Langsung</Label>
                  <Select value={formData.nama_atasan_langsung} onValueChange={handleAtasanChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Nama" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.nm_pegawai}>{e.nm_pegawai}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>NIP Atasan Langsung</Label>
                  <Input value={formData.nip_atasan_langsung} readOnly className="bg-muted" />
                </div>
              </div>
            </div>

            {/* Pejabat Unit Kepegawaian with Search */}
            <div className="space-y-2">
              <Label className="font-semibold">Pejabat Unit Kepegawaian</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Jabatan Unit Kepegawaian</Label>
                  <Input value={formData.jabatan_unit_kepegawaian} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pejabat Unit Kepegawaian</Label>
                  <Popover open={pejabatKepegawaianOpen} onOpenChange={setPejabatKepegawaianOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={pejabatKepegawaianOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.nama_pejabat_kepegawaian || "Pilih Nama"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[350px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Cari nama atau NIP..."
                          value={pejabatKepegawaianSearch}
                          onValueChange={setPejabatKepegawaianSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Tidak ditemukan</CommandEmpty>
                          <CommandGroup>
                            {pejabatKepegawaianOptions
                              .filter(e =>
                                e.nm_pegawai.toLowerCase().includes(pejabatKepegawaianSearch.toLowerCase()) ||
                                (e.nip && e.nip.includes(pejabatKepegawaianSearch))
                              )
                              .slice(0, 50)
                              .map(e => (
                                <CommandItem
                                  key={e.id}
                                  value={`${e.nm_pegawai} ${e.nip}`}
                                  onSelect={() => handlePejabatKepegawaianChange(e.nm_pegawai)}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{e.nm_pegawai}</span>
                                    <span className="text-xs text-muted-foreground">{e.uraian_jabatan}</span>
                                    <span className="text-xs text-muted-foreground">NIP: {e.nip}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>NIP Pejabat Unit Kepegawaian</Label>
                  <Input value={formData.nip_pejabat_kepegawaian} readOnly className="bg-muted" />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Menyimpan..." : editingData ? "Perbarui" : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
