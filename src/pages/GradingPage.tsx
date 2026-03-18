import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Mic, Plus, Search, Edit, Trash2, Download, Upload, Eye, FileDown, FileText, ChevronDown, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import AISearchBar from "@/components/AISearchBar";
import Voicebot from "@/components/Voicebot";
import TambahKuesionerDialog from "@/components/TambahKuesionerDialog";
import KuesionerFormDialog from "@/components/KuesionerFormDialog";
import SimulasiDialog from "@/components/grading/SimulasiDialog";
import KonversiPredikatKinerjaTable from "@/components/KonversiPredikatKinerjaTable";
import MonevLaporanTab from "@/components/MonevLaporanTab";
import Tabel408Tab from "@/components/grading/Tabel408Tab";
import Mekanisme54Tab from "@/components/grading/Mekanisme54Tab";
import HasilEvaluasiTab from "@/components/grading/HasilEvaluasiTab";
import BeritaAcaraTab from "@/components/grading/BeritaAcaraTab";
import SKPenetapanTab from "@/components/grading/SKPenetapanTab";
import { generateKuesionerPdf } from "@/utils/kuesionerPdfGenerator";
import GradingDashboard from "@/components/grading/GradingDashboard";
import { generateKelengkapanDataPelaksana, generateSimulasiSidangPenilaian } from "@/utils/simulasiDocumentGenerator";
import { generateNDPermohonan, generateLampiranPermohonan, generateLampiranPermohonanWord, generateLampiranPermohonanWordFromBigData } from "@/utils/permohonanDocumentGenerator";
import { 
  analyzeJabatanBaruWithGolongan, 
  getAvailableJabatanOptionsForPU,
  getAllPUJabatanOptionsForGrade,
  getPTBJabatan,
  getPKJabatan,
  getJabatanWithTingkat,
  determineJabatanFamily,
  meetsGolonganSyarat,
  meetsPendidikanSyarat
} from "@/utils/gradingJabatanUtils";
import * as XLSX from "xlsx";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// Constants for dropdown options
const GOLONGAN_OPTIONS = ["II/a", "II/b", "II/c", "II/d", "III/a", "III/b", "III/c", "III/d", "IV/a", "IV/b"];
const PENDIDIKAN_OPTIONS = ["SLTA", "D1", "D3", "D4", "S1", "S2", "S3"];
const KLASTER_OPTIONS = ["PU", "PK", "PTB"];
const KEMAMPUAN_KERJA_OPTIONS = ["Memenuhi", "Tidak Memenuhi"];

// Interfaces
interface GradingData {
  id: string;
  nama_lengkap: string;
  nip: string;
  lampiran_kep: string;
  pangkat: string;
  pangkat_golongan: string;
  tmt_pangkat: string;
  pendidikan: string;
  lokasi: string;
  lokasi_pendidikan_terakhir: string;
  akumulasi_masa_kerja: string;
  tmt_terakhir: string;
  riwayat_tahun_lalu: string; // New field: Naik/Turun/Tetap
  eselon_iii: string;
  eselon_iv: string;
  jabatan: string; // This is now jabatan_lama in Big Data context
  jabatan_baru: string;
  grade: string; // This is now grade_lama in Big Data context
  grade_baru: string;
  akumulasi_terakhir: string;
  tmt_peringkat_baru: string;
  kemampuan_kerja: string;
  atasan_langsung_id: string;
  atasan_langsung_nama: string;
  atasan_dari_atasan_id: string;
  atasan_dari_atasan_nama: string;
  pkt_2024: string;
  pkt_2025: string;
  hukuman_disiplin: boolean;
  tugas_belajar: boolean;
  upkp: boolean;
  jenis: string;
  rekomendasi: string;
  keputusan: string;
  created_at?: string;
  updated_at?: string;
}

const RIWAYAT_TAHUN_LALU_OPTIONS = ["Naik", "Turun", "Tetap"];

interface EmployeeDataFull {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
  eselon_iii: string | null;
  eselon_iv: string | null;
}

// Helper function to extract golongan from pangkat string (e.g., "Penata Tk.I (III/d)" -> "III/d")
const extractGolonganFromPangkat = (pangkat: string): string => {
  const match = pangkat.match(/\(([IVab/]+)\)/i);
  return match ? match[1] : "";
};

// Helper function to extract pangkat name (before "-") from combined string like "Pengatur Tk.I-II/d"
const extractPangkatName = (combined: string): string => {
  if (!combined) return "";
  // Check if format is "Pengatur Tk.I-II/d" (hyphen separated)
  if (combined.includes("-")) {
    return combined.split("-")[0].trim();
  }
  // Check if format is "Pengatur Tk.I (II/d)" (parenthesis format)
  const match = combined.match(/^(.+?)\s*\(/);
  if (match) {
    return match[1].trim();
  }
  return combined;
};

// Helper function to extract golongan (after "-") from combined string like "Pengatur Tk.I-II/d"
const extractGolonganFromCombined = (combined: string): string => {
  if (!combined) return "";
  // Check if format is "Pengatur Tk.I-II/d" (hyphen separated)
  if (combined.includes("-")) {
    return combined.split("-")[1]?.trim() || "";
  }
  // Check if format is "Pengatur Tk.I (II/d)" (parenthesis format)
  const match = combined.match(/\(([IVab/]+)\)/i);
  return match ? match[1] : "";
};

// Mapping golongan to pangkat name
const GOLONGAN_TO_PANGKAT: Record<string, string> = {
  "I/a": "Juru Muda",
  "I/b": "Juru Muda Tk. I",
  "I/c": "Juru",
  "I/d": "Juru Tk. I",
  "II/a": "Pengatur Muda",
  "II/b": "Pengatur Muda Tk. I",
  "II/c": "Pengatur",
  "II/d": "Pengatur Tk. I",
  "III/a": "Penata Muda",
  "III/b": "Penata Muda Tk. I",
  "III/c": "Penata",
  "III/d": "Penata Tk. I",
  "IV/a": "Pembina",
  "IV/b": "Pembina Tk. I",
  "IV/c": "Pembina Utama Muda",
  "IV/d": "Pembina Utama Madya",
  "IV/e": "Pembina Utama",
};

// Helper to get pangkat name from golongan
const getPangkatNameFromGolongan = (golongan: string): string => {
  if (!golongan) return "";
  const normalizedGol = golongan.toUpperCase().replace(/([IViv]+)\/([A-Ea-e])/, (_, roman, letter) => `${roman.toUpperCase()}/${letter.toLowerCase()}`);
  return GOLONGAN_TO_PANGKAT[normalizedGol] || GOLONGAN_TO_PANGKAT[golongan] || "";
};

// Format date to Indonesian format (e.g., "1 April 2023")
const formatDateIndonesian = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Helper function to format pangkat/gol/tmt as "Pangkat / Gol / TMT" (e.g., "Pengatur Tk. I / II/d / 1 April 2023")
const formatPangkatGolTmt = (pangkat: string, golongan: string, tmtPangkat: string): string => {
  const pangkatName = pangkat || getPangkatNameFromGolongan(golongan);
  const gol = extractGolonganFromCombined(golongan) || golongan || "";
  const tmtFormatted = formatDateIndonesian(tmtPangkat);
  return [pangkatName, gol, tmtFormatted].filter(Boolean).join(" / ");
};

// Helper function to find Atasan Langsung based on Eselon IV and Eselon III
// Search patterns: "Kepala Seksi " + Eselon IV, "Kepala Subbagian " + Eselon IV, etc.
const findAtasanLangsung = (eselonIV: string, eselonIII: string, employees: EmployeeDataFull[]): EmployeeDataFull | null => {
  if (!eselonIV || !employees.length) return null;
  
  const eselonIVLower = eselonIV.toLowerCase().trim();
  const eselonIIILower = eselonIII?.toLowerCase().trim() || "";
  
  // Generate multiple search patterns for Eselon IV (Kepala Seksi, Kepala Subbagian, etc.)
  const searchPatterns = [
    `kepala seksi ${eselonIVLower}`,
    `kepala subbagian ${eselonIVLower}`,
    `kepala ${eselonIVLower}`,
  ];
  
  // Try to find with each pattern, preferring matches that also include Eselon III
  for (const pattern of searchPatterns) {
    // First try with Eselon III for more specific match
    if (eselonIIILower) {
      const found = employees.find(emp => {
        if (!emp.uraian_jabatan) return false;
        const jabatanLower = emp.uraian_jabatan.toLowerCase();
        return jabatanLower.includes(pattern) && jabatanLower.includes(eselonIIILower);
      });
      if (found) return found;
    }
    
    // Then try without Eselon III
    const found = employees.find(emp => {
      if (!emp.uraian_jabatan) return false;
      return emp.uraian_jabatan.toLowerCase().includes(pattern);
    });
    if (found) return found;
  }
  
  return null;
};

// Helper function to find Atasan dari Atasan based on Eselon III (Kepala Kantor/Bidang/Balai)
// Search patterns: "Kepala Kantor " + Eselon III, "Kepala Bidang " + Eselon III, "Kepala Kantor Balai " + Eselon III
const findAtasanDariAtasan = (eselonIII: string, employees: EmployeeDataFull[]): EmployeeDataFull | null => {
  if (!eselonIII || !employees.length) return null;
  
  const eselonIIILower = eselonIII.toLowerCase().trim();
  
  // Generate multiple search patterns for Eselon III
  const searchPatterns = [
    `kepala kantor balai ${eselonIIILower}`,
    `kepala kantor ${eselonIIILower}`,
    `kepala balai ${eselonIIILower}`,
    `kepala bidang ${eselonIIILower}`,
    `kepala bagian ${eselonIIILower}`,
    `kepala ${eselonIIILower}`,
  ];
  
  // Try to find with each pattern
  for (const pattern of searchPatterns) {
    const found = employees.find(emp => {
      if (!emp.uraian_jabatan) return false;
      return emp.uraian_jabatan.toLowerCase().includes(pattern);
    });
    if (found) return found;
  }
  
  // Fallback: if eselon III looks like a unit name, search for "Kepala Kantor" containing that unit
  const found = employees.find(emp => {
    if (!emp.uraian_jabatan) return false;
    const jabatanLower = emp.uraian_jabatan.toLowerCase();
    // Match if jabatan starts with "Kepala Kantor" or "Kepala Bidang" or "Kepala Bagian"
    // and contains the eselon III name somewhere
    return (jabatanLower.startsWith("kepala kantor") || 
            jabatanLower.startsWith("kepala bidang") || 
            jabatanLower.startsWith("kepala bagian") ||
            jabatanLower.startsWith("kepala balai")) && 
           jabatanLower.includes(eselonIIILower);
  });
  
  return found || null;
};

interface DaftarGradeData {
  id: string;
  no_urut: number;
  klaster: string;
  grade: number;
  jabatan: string;
  tugas_jabatan?: string;
  syarat_pendidikan?: string;
  syarat_golongan?: string;
  created_at?: string;
}

interface PuSyaratGeneralData {
  id: string;
  jenis: string;
  syarat: string;
  max_grade: number;
  no_urut: number;
  created_at?: string;
}

interface KepSalinanData {
  id: string;
  grading_id: string;
  nama_lengkap: string;
  nip: string;
  nomor_kep: string;
  tanggal_kep: string;
  jenis_dokumen: string;
  keterangan: string;
  created_at?: string;
}

interface PetikanData {
  id: string;
  grading_id: string;
  nama_lengkap: string;
  nip: string;
  nomor_petikan: string;
  tanggal_petikan: string;
  keterangan: string;
  created_at?: string;
}

// Constants for Dari/Ke options in Permohonan
const DARI_KE_OPTIONS = ["PU", "PK", "PTB", "Pelaksana Tertentu"];

interface PermohonanData {
  id: string;
  grading_id: string;
  no_urut: number;
  nomor_kep: string;
  tanggal_kep: string;
  hal: string;
  nama_lengkap: string;
  nip: string;
  pangkat_gol_tmt: string;
  pendidikan: string;
  jabatan_lama: string;
  grade_lama: string;
  jabatan_baru: string;
  grade_baru: string;
  tmt_peringkat_terakhir: string;
  dari: string;
  ke: string;
  created_at?: string;
}

const PKT_OPTIONS = ["Sangat Baik", "Baik", "Butuh Perbaikan", "Kurang", "Sangat Kurang"];
const HAL_OPTIONS = ["Pertama", "Kembali", "Simulasi", "Sidang"];

// Map HAL to jenis_penetapan in mekanisme_54
const HAL_TO_JENIS_PENETAPAN: Record<string, string> = {
  "Pertama": "Penetapan Pertama",
  "Kembali": "Penetapan Kembali",
  "Simulasi": "Penetapan Simulasi",
  "Sidang": "Penetapan Sidang",
};

interface Mekanisme54CategoryOption {
  id: string;
  jenis_penetapan: string;
  sub_jenis: string;
  kode_kategori: string;
  deskripsi: string;
}
const JENIS_OPTIONS = ["PU", "PK", "PTB", "Pelaksana Tertentu"];
const REKOMENDASI_OPTIONS = ["Naik", "Tetap", "Turun"];

// Helper function to calculate grade_baru based on rekomendasi
const calculateGradeBaru = (gradeLama: string, rekomendasi: string): string => {
  const gradeNum = parseInt(gradeLama);
  if (isNaN(gradeNum)) return gradeLama;
  
  if (rekomendasi === "Naik") {
    return String(gradeNum + 1);
  } else if (rekomendasi === "Turun") {
    return String(Math.max(1, gradeNum - 1));
  } else {
    return gradeLama; // Tetap
  }
};

// Helper function to extract TMT CPNS from NIP (digits 9-14) and format as YYYYMM
// Also calculates PNS date as CPNS + 1 year and Start year for grade calculation
const extractTMTFromNIP = (nip: string): { raw: string; cpnsFormatted: string; pnsFormatted: string; year: number; month: number; pnsYear: number; startYear: number } | null => {
  if (!nip || nip.length < 14) return null;
  const raw = nip.substring(8, 14); // digits 9-14 (0-indexed: 8-13)
  const year = parseInt(raw.substring(0, 4));
  const month = parseInt(raw.substring(4, 6));
  if (isNaN(year) || isNaN(month)) return null;
  const pnsYear = year + 1;
  // Start year logic: if month is January (01) or February (02), Start = PNS year. Otherwise Start = PNS year + 1
  const startYear = (month === 1 || month === 2) ? pnsYear : pnsYear + 1;
  return { 
    raw, 
    cpnsFormatted: `${year}-${month.toString().padStart(2, '0')}`,
    pnsFormatted: `${pnsYear}-${month.toString().padStart(2, '0')}`,
    year, 
    month,
    pnsYear,
    startYear
  };
};

// Helper function to analyze grade potential based on NIP
// Format: Periode Naik: 2022(NEP 2020 & NEP 2021), 2024(NEP 2022 & NEP 2023), 2026(NEP 2024 & NEP 2025)
const analyzeGradePotential = (nip: string, currentYear: number = new Date().getFullYear()): { status: string; color: string; keterangan: string } => {
  const tmtData = extractTMTFromNIP(nip);
  if (!tmtData) return { status: "Data Tidak Valid", color: "bg-gray-400 text-white", keterangan: "" };
  
  // Use startYear for grade calculation
  // Start year logic: if month is January (01), Start = PNS year. Otherwise Start = PNS year + 1
  const startYear = tmtData.startYear;
  
  // Generate grade period info in format: 2022(NEP 2020 & NEP 2021), 2024(NEP 2022 & NEP 2023), etc.
  // Grade naik every 2 years starting from startYear + 2
  const periodeList: string[] = [];
  let eligibleToNaik = false;
  
  // Calculate how many periods are needed to reach current year
  // First eligible naik is 2 years after Start year (based on 2 NEP evaluations)
  // For employees who started long ago, we need to find the periods around the current year
  
  // Find the first period year that is close to current year
  let firstPeriodYear = startYear + 2;
  
  // Skip periods that are more than 4 years in the past
  while (firstPeriodYear < currentYear - 4) {
    firstPeriodYear += 2;
  }
  
  // Generate 4 periods starting from the calculated first period
  for (let i = 0; i < 4; i++) {
    const periodeYear = firstPeriodYear + (i * 2);
    
    // Calculate the NEP years based on the period
    // Each period requires 2 NEP evaluations from (periodeYear - 2) and (periodeYear - 1)
    const nepYear1 = periodeYear - 2;
    const nepYear2 = periodeYear - 1;
    
    // Only show relevant periods (current year - 2 to current year + 8)
    if (periodeYear >= currentYear - 2 && periodeYear <= currentYear + 8) {
      periodeList.push(`${periodeYear}(NEP ${nepYear1} & NEP ${nepYear2})`);
    }
    
    // Check if current year matches a naik period
    if (periodeYear === currentYear) {
      eligibleToNaik = true;
    }
  }
  
  // If periodeList is still empty (very old employees), generate from current year
  if (periodeList.length === 0) {
    // Find the nearest eligible period
    const yearsFromStart = currentYear - startYear - 2;
    const periodsElapsed = Math.floor(yearsFromStart / 2);
    const nextPeriodYear = startYear + 2 + (periodsElapsed * 2) + (yearsFromStart % 2 === 0 ? 0 : 2);
    
    for (let i = -1; i < 3; i++) {
      const periodeYear = nextPeriodYear + (i * 2);
      if (periodeYear >= currentYear - 2 && periodeYear <= currentYear + 8) {
        const nepYear1 = periodeYear - 2;
        const nepYear2 = periodeYear - 1;
        periodeList.push(`${periodeYear}(NEP ${nepYear1} & NEP ${nepYear2})`);
        
        if (periodeYear === currentYear) {
          eligibleToNaik = true;
        }
      }
    }
  }
  
  const keteranganText = periodeList.length > 0 ? `Periode Naik: ${periodeList.join(", ")}` : "";
  
  if (eligibleToNaik) {
    return { 
      status: "Potensi Naik", 
      color: "bg-green-500 text-white", 
      keterangan: keteranganText
    };
  } else if (currentYear < startYear + 2) {
    return { 
      status: "Belum Eligible", 
      color: "bg-yellow-500 text-white", 
      keterangan: `Start ${startYear}. ${keteranganText}`
    };
  } else {
    return { 
      status: "Potensi Tetap", 
      color: "bg-blue-500 text-white", 
      keterangan: keteranganText
    };
  }
};

// Helper function to build Analisa NIP status with flags
const buildAnalisaNIPWithFlags = (nipAnalysis: { status: string; color: string; keterangan: string }, data: GradingData): { status: string; color: string; keterangan: string } => {
  const flags: string[] = [];
  if (data.hukuman_disiplin) flags.push("Flag Hukdis");
  if (data.upkp) flags.push("Flag UPKP");
  if (data.tugas_belajar) flags.push("Flag Tugas Belajar");
  
  if (flags.length === 0) {
    return nipAnalysis;
  }
  
  return {
    status: nipAnalysis.status + " + " + flags.join(" + "),
    color: data.hukuman_disiplin ? "bg-red-500 text-white" : nipAnalysis.color,
    keterangan: nipAnalysis.keterangan
  };
};

// Helper function to determine klaster from jenis or jabatan_baru
const determineKlaster = (jenis: string | null, jabatanBaru: string | null): string | null => {
  if (jenis) {
    if (jenis === "PU") return "PU";
    if (jenis === "PK") return "PK";
    if (jenis === "PTB") return "PTB";
    if (jenis === "Pelaksana Tertentu") return "Pelaksana Tertentu";
  }
  // Try to determine from jabatan_baru (PTB typically contains "Tugas Belajar", PK contains "Keprotokolan")
  if (jabatanBaru) {
    if (jabatanBaru.toLowerCase().includes("tugas belajar")) return "PTB";
    if (jabatanBaru.toLowerCase().includes("keprotokolan")) return "PK";
  }
  return jenis || null;
};

// Helper function to auto-calculate lampiran_kep based on triggers
// 1.a = PU direkomendasikan naik/turun/tetap
// 1.b = PU direkomendasikan naik karena kenaikan pangkat/golongan karena lulus UPKP/tugas belajar
// 1.c = PU belum direkomendasikan (baru 1 PKT atau belum ada PKT)
// 2.a = PK direkomendasikan naik/tetap
// 2.b = PK belum direkomendasikan naik/tetap
// 3.a = PTB direkomendasikan naik/turun/tetap
// 3.b = PTB belum direkomendasikan naik/turun/tetap
const calculateLampiranKep = (
  jenis: string | null,
  rekomendasi: string | null,
  pkt2024: string | null,
  pkt2025: string | null,
  tugasBelajar: boolean | null,
  upkp: boolean | null
): string => {
  const hasRekomendasi = rekomendasi && (rekomendasi === "Naik" || rekomendasi === "Turun" || rekomendasi === "Tetap");
  const hasBothPKT = pkt2024 && pkt2025;
  const hasOnlyOnePKT = (pkt2024 && !pkt2025) || (!pkt2024 && pkt2025);
  const hasNoPKT = !pkt2024 && !pkt2025;
  
  if (jenis === "PU") {
    // Check for 1.b first - PU with UPKP or Tugas Belajar flag
    if (hasRekomendasi && rekomendasi === "Naik" && (upkp || tugasBelajar)) {
      return "1.b";
    }
    // 1.c - PU belum direkomendasikan (only 1 PKT or no PKT)
    if (hasOnlyOnePKT || hasNoPKT) {
      return "1.c";
    }
    // 1.a - PU direkomendasikan naik/turun/tetap (has both PKT)
    if (hasRekomendasi && hasBothPKT) {
      return "1.a";
    }
    return "1.c"; // Default for PU
  }
  
  if (jenis === "PK") {
    // 2.b - PK belum direkomendasikan
    if (hasOnlyOnePKT || hasNoPKT || !hasRekomendasi) {
      return "2.b";
    }
    // 2.a - PK direkomendasikan naik/tetap
    if (hasRekomendasi && (rekomendasi === "Naik" || rekomendasi === "Tetap")) {
      return "2.a";
    }
    return "2.b"; // Default for PK
  }
  
  if (jenis === "PTB") {
    // 3.b - PTB belum direkomendasikan
    if (hasOnlyOnePKT || hasNoPKT || !hasRekomendasi) {
      return "3.b";
    }
    // 3.a - PTB direkomendasikan naik/turun/tetap
    if (hasRekomendasi) {
      return "3.a";
    }
    return "3.b"; // Default for PTB
  }
  
  return ""; // Unknown jenis
};

// Helper function to get max grade from golongan based on hardcoded mapping
// Golongan mapping: III/c - IV/e (12), III/b (11), III/a (10), II/d (9), II/c (8), II/b (7), II/a (6)
// Helper function to normalize golongan format: ensure lowercase after "/"
// Example: II/C -> II/c, III/A -> III/a
const normalizeGolongan = (golongan: string | null): string => {
  if (!golongan) return "";
  // Split by "/" and ensure the second part is lowercase
  const parts = golongan.split("/");
  if (parts.length === 2) {
    return `${parts[0].toUpperCase()}/${parts[1].toLowerCase()}`;
  }
  return golongan;
};

const getMaxGradeFromGolongan = (golongan: string | null, puSyaratGeneralData: PuSyaratGeneralData[]): number => {
  if (!golongan) return 12;
  
  // Clean and normalize golongan string
  const golonganClean = golongan.toUpperCase().replace(/\s/g, "").trim();
  
  // Extract golongan pattern like "II/A", "III/D", etc.
  const golonganMatch = golonganClean.match(/(I{1,3}V?|IV)\/(A|B|C|D|E)/i);
  const golonganKey = golonganMatch ? golonganMatch[0].toUpperCase() : golonganClean;
  
  // FIXED: Hardcoded golongan mapping with correct values
  // III/c, III/d, IV/a, IV/b, IV/c, IV/d, IV/e = 12
  // III/b = 11
  // III/a = 10
  // II/d = 9
  // II/c = 8
  // II/b = 7
  // II/a = 6
  const golRanking: Record<string, number> = { 
    "II/A": 6, 
    "II/B": 7, 
    "II/C": 8, 
    "II/D": 9, 
    "III/A": 10, 
    "III/B": 11, 
    "III/C": 12, 
    "III/D": 12, 
    "IV/A": 12, 
    "IV/B": 12, 
    "IV/C": 12, 
    "IV/D": 12, 
    "IV/E": 12 
  };
  
  // Return hardcoded mapping directly
  return golRanking[golonganKey] || 12;
};

// Helper function to get max grade from pendidikan based on hardcoded mapping
// Pendidikan mapping: S1/D4/S2/S3/SI/DIV/SII/SIII (12), D3/D2/DIII/DII (10), D1/DI (8), SLTA/SMA/SMK (6)
const getMaxGradeFromPendidikan = (pendidikan: string | null, puSyaratGeneralData: PuSyaratGeneralData[]): number => {
  if (!pendidikan) return 12;
  
  const pendidikanUpper = pendidikan.toUpperCase().replace(/\s/g, "").trim();
  
  // FIXED: Hardcoded pendidikan mapping with correct values
  // SLTA/SMA/SMK = 6
  if (pendidikanUpper.includes("SLTA") || pendidikanUpper.includes("SMA") || pendidikanUpper.includes("SMK")) {
    return 6;
  }
  
  // D1/DI = 8
  if (pendidikanUpper === "D1" || pendidikanUpper === "DI" || 
      pendidikanUpper.includes("D1") && !pendidikanUpper.includes("D1V")) {
    // Check if it's specifically D1 not D10 or similar
    if (/^D1$/i.test(pendidikanUpper) || /^DI$/i.test(pendidikanUpper) || 
        /\bD1\b/i.test(pendidikan) || /\bDI\b/i.test(pendidikan)) {
      return 8;
    }
  }
  
  // D2/D3/DII/DIII = 10
  if (pendidikanUpper === "D2" || pendidikanUpper === "DII" || 
      pendidikanUpper === "D3" || pendidikanUpper === "DIII" ||
      pendidikanUpper.includes("D2") || pendidikanUpper.includes("D3") || 
      pendidikanUpper.includes("DII") || pendidikanUpper.includes("DIII")) {
    return 10;
  }
  
  // S1/D4/S2/S3/SI/DIV/SII/SIII = 12
  if (pendidikanUpper.includes("S1") || pendidikanUpper.includes("SI") ||
      pendidikanUpper.includes("D4") || pendidikanUpper.includes("DIV") ||
      pendidikanUpper.includes("S2") || pendidikanUpper.includes("SII") ||
      pendidikanUpper.includes("S3") || pendidikanUpper.includes("SIII")) {
    return 12;
  }
  
  // Default to 12 for unknown education levels
  return 12;
};

// Helper function to analyze grade potential based on golongan and pendidikan max grades
// "Bisa Naik" = grade lama + 1 <= BOTH max golongan AND max pendidikan
// "Hanya Tetap" = grade lama + 1 > max golongan OR max pendidikan (exceeds at least one limit)
const analyzeGolPendidikanPotential = (
  gradeLama: number,
  maxGradeGolongan: number,
  maxGradePendidikan: number
): { status: string; color: string } => {
  const gradeBaru = gradeLama + 1;
  
  // Check if potential grade (grade lama + 1) exceeds any max grade limits
  const exceedsGolongan = gradeBaru > maxGradeGolongan;
  const exceedsPendidikan = gradeBaru > maxGradePendidikan;
  
  // "Hanya Tetap" if grade baru exceeds either golongan OR pendidikan limit
  if (exceedsGolongan || exceedsPendidikan) {
    return { status: "Hanya Tetap", color: "bg-red-500 text-white" };
  }
  
  // "Bisa Naik" if grade baru is within BOTH limits
  return { status: "Bisa Naik", color: "bg-green-500 text-white" };
};

// Helper function for Analisa Y-1 (new column between Analisis Gol/Pend and Jabatan Baru)
// "Mungkin Naik" = riwayat_tahun_lalu is "Tetap" or "Turun" OR has flag UPKP/Tugas Belajar
// "Mungkin Tetap" = riwayat_tahun_lalu is "Naik" OR no flag UPKP/Tugas Belajar
const analyzeY1Potential = (
  riwayatTahunLalu: string | null,
  hasUPKP: boolean,
  hasTugasBelajar: boolean
): { status: string; color: string } => {
  // Check if has special flags (UPKP or Tugas Belajar) - these override riwayat
  if (hasUPKP || hasTugasBelajar) {
    return { status: "Mungkin Naik", color: "bg-green-500 text-white" };
  }
  
  // Check riwayat tahun lalu
  const riwayat = riwayatTahunLalu?.trim().toLowerCase() || "";
  
  if (riwayat === "tetap" || riwayat === "turun") {
    return { status: "Mungkin Naik", color: "bg-green-500 text-white" };
  }
  
  if (riwayat === "naik") {
    return { status: "Mungkin Tetap", color: "bg-yellow-500 text-white" };
  }
  
  // Default when riwayat is empty - Mungkin Tetap (no special criteria)
  return { status: "Mungkin Tetap", color: "bg-gray-400 text-white" };
};

// Helper function to determine Analisa Jabatan Baru based on pendidikan AND golongan (for PU)
// Uses the new enhanced analysis that checks both requirements
const analyzeJabatanBaru = (pendidikan: string | null, golongan?: string | null): { jabatan: string; color: string; eligible?: boolean; reason?: string } => {
  // If golongan is provided, use the enhanced analysis
  if (golongan) {
    const result = analyzeJabatanBaruWithGolongan(pendidikan, golongan);
    return {
      jabatan: result.jabatan,
      color: result.color,
      eligible: result.eligible,
      reason: result.reason
    };
  }
  
  // Fallback to pendidikan-only analysis for backward compatibility
  if (!pendidikan) return { jabatan: "-", color: "" };
  
  const pendNormalized = pendidikan.toUpperCase().replace(/\s/g, "").trim();
  
  // SMA/SMK/SLTA/D1/DI → Pengadministrasi Perkantoran
  if (pendNormalized.includes("SMA") || pendNormalized.includes("SMK") || 
      pendNormalized.includes("SLTA") || pendNormalized === "D1" || pendNormalized === "DI" ||
      /\bD1\b/i.test(pendidikan) || /\bDI\b/i.test(pendidikan)) {
    return { jabatan: "Pengadministrasi Perkantoran", color: "bg-blue-100 text-blue-800" };
  }
  
  // D3/DIII → Pengolah Data dan Informasi
  if (pendNormalized === "D3" || pendNormalized === "DIII" ||
      pendNormalized.includes("D3") || pendNormalized.includes("DIII")) {
    return { jabatan: "Pengolah Data dan Informasi", color: "bg-purple-100 text-purple-800" };
  }
  
  // D4/DIV/S1/SI/S2/S3 → Penata Layanan Operasional
  if (pendNormalized.includes("D4") || pendNormalized.includes("DIV") ||
      pendNormalized.includes("S1") || pendNormalized.includes("SI") ||
      pendNormalized.includes("S2") || pendNormalized.includes("SII") ||
      pendNormalized.includes("S3") || pendNormalized.includes("SIII")) {
    return { jabatan: "Penata Layanan Operasional", color: "bg-green-100 text-green-800" };
  }
  
  return { jabatan: "-", color: "" };
};

// Helper function to get jabatan options for PU based on grade and employee qualifications
const getJabatanBaruOptionsForPU = (
  gradeBaru: number,
  pegawaiGolongan: string,
  pegawaiPendidikan: string,
  daftarGradeData: DaftarGradeData[]
): { jabatan: string; syarat_golongan: string; syarat_pendidikan: string; eligible: boolean }[] => {
  // Get all PU jabatan for this grade from daftar_grade
  const allOptions = daftarGradeData
    .filter(dg => dg.klaster === "PU" && dg.grade === gradeBaru)
    .map(dg => {
      const meetsGol = meetsGolonganSyarat(pegawaiGolongan, dg.syarat_golongan || "");
      const meetsPend = meetsPendidikanSyarat(pegawaiPendidikan, dg.syarat_pendidikan || "");
      return {
        jabatan: dg.jabatan,
        syarat_golongan: dg.syarat_golongan || "",
        syarat_pendidikan: dg.syarat_pendidikan || "",
        eligible: meetsGol && meetsPend
      };
    });
  
  return allOptions;
};

// Helper function to get Tingkat (Tk.I to Tk.V) based on grade
// Maps grade to corresponding Tingkat for jabatan naming
const getTingkatFromGrade = (grade: number): string => {
  // Grade 12, 11, 10, 9, 8 = Tk.I to Tk.V for D4/S1 (kiri) - Penata Layanan Operasional
  // Grade 10, 9, 8, 7, 6 = Tk.I to Tk.V for D3 (tengah) - Pengolah Data dan Informasi  
  // Grade 8, 7, 6, 5, 4 = Tk.I to Tk.V for SMA/D1 (kanan) - Pengadministrasi Perkantoran
  // Return appropriate Tingkat based on grade position within klaster
  if (grade >= 12) return "Tk.I";
  if (grade >= 11) return "Tk.II";
  if (grade >= 10) return "Tk.III";
  if (grade >= 9) return "Tk.IV";
  if (grade >= 8) return "Tk.V";
  if (grade >= 7) return "Tk.IV";
  if (grade >= 6) return "Tk.V";
  if (grade >= 5) return "Tk.IV";
  if (grade >= 4) return "Tk.V";
  return "";
};

// Helper function for QC validation - validates grade against pendidikan and golongan requirements
const validateGradeQC = (
  data: GradingData,
  daftarGradeData: DaftarGradeData[],
  puSyaratGeneralData: PuSyaratGeneralData[]
): { isValid: boolean; reason: string } => {
  const gradeBaru = parseInt(data.grade_baru) || parseInt(data.grade) || 0;
  const jabatanBaru = data.jabatan_baru || data.jabatan;
  const pendidikan = data.pendidikan;
  const golongan = data.pangkat_golongan;
  const jenis = data.jenis;
  
  if (!gradeBaru || gradeBaru === 0) {
    return { isValid: true, reason: "Grade belum diisi" };
  }
  
  const klaster = determineKlaster(jenis, jabatanBaru);
  
  // Find matching daftar_grade entry
  const matchingGrade = daftarGradeData.find(dg => 
    dg.grade === gradeBaru && 
    (!klaster || dg.klaster === klaster)
  );
  
  // Check PTB - PTB has no syarat requirements, always valid
  if (klaster === "PTB") {
    return { isValid: true, reason: "PTB - Tidak ada syarat khusus" };
  }
  
  // Check PK - PK follows its own syarat
  if (klaster === "PK") {
    if (matchingGrade) {
      // Check golongan requirement if available
      if (matchingGrade.syarat_golongan && golongan) {
        const syaratGolonganList = matchingGrade.syarat_golongan.split("/").map(s => s.trim().toUpperCase());
        const golonganUpper = golongan.toUpperCase();
        // For PK, check minimum golongan
        if (!syaratGolonganList.some(sg => golonganUpper.includes(sg) || sg.includes(golonganUpper.split("/")[0]))) {
          // Check if golongan meets minimum
          const golRanking: Record<string, number> = { "II/A": 1, "II/B": 2, "II/C": 3, "II/D": 4, "III/A": 5, "III/B": 6, "III/C": 7, "III/D": 8, "IV/A": 9, "IV/B": 10, "IV/C": 11, "IV/D": 12, "IV/E": 13 };
          const currentGolRank = golRanking[golonganUpper] || 0;
          const minGolRank = Math.min(...syaratGolonganList.map(sg => golRanking[sg.toUpperCase()] || 999));
          if (currentGolRank < minGolRank) {
            return { isValid: false, reason: `Golongan ${golongan} < syarat ${matchingGrade.syarat_golongan}` };
          }
        }
      }
    }
    return { isValid: true, reason: "PK - Memenuhi syarat" };
  }
  
  // Check PU - PU uses syarat general (max grade based on golongan and pendidikan)
  if (klaster === "PU" || !klaster) {
    // Get max grade from golongan
    let maxGradeFromGolongan = 12;
    if (golongan) {
      const golonganSyarat = puSyaratGeneralData.find(p => 
        p.jenis === "golongan" && 
        p.syarat.toUpperCase().split(",").some(s => 
          golongan.toUpperCase().includes(s.trim()) || s.trim().includes(golongan.toUpperCase())
        )
      );
      if (golonganSyarat) {
        maxGradeFromGolongan = golonganSyarat.max_grade;
      } else {
        // Default golongan mapping
        const golRanking: Record<string, number> = { "II/A": 6, "II/B": 7, "II/C": 8, "II/D": 9, "III/A": 10, "III/B": 11, "III/C": 12, "III/D": 12, "IV/A": 12, "IV/B": 12, "IV/C": 12, "IV/D": 12, "IV/E": 12 };
        maxGradeFromGolongan = golRanking[golongan.toUpperCase()] || 12;
      }
    }
    
    // Get max grade from pendidikan
    let maxGradeFromPendidikan = 12;
    if (pendidikan) {
      const pendidikanUpper = pendidikan.toUpperCase();
      const pendidikanSyarat = puSyaratGeneralData.find(p => 
        p.jenis === "pendidikan" && 
        p.syarat.toUpperCase().split(",").some(s => 
          pendidikanUpper.includes(s.trim()) || s.trim().includes(pendidikanUpper)
        )
      );
      if (pendidikanSyarat) {
        maxGradeFromPendidikan = pendidikanSyarat.max_grade;
      } else {
        // Default pendidikan mapping
        if (pendidikanUpper.includes("SLTA") || pendidikanUpper.includes("SMA") || pendidikanUpper.includes("SMK")) {
          maxGradeFromPendidikan = 6;
        } else if (pendidikanUpper === "D1" || pendidikanUpper === "DI") {
          maxGradeFromPendidikan = 8;
        } else if (pendidikanUpper.includes("D2") || pendidikanUpper.includes("D3") || pendidikanUpper.includes("DIII")) {
          maxGradeFromPendidikan = 10;
        } else if (pendidikanUpper.includes("S1") || pendidikanUpper.includes("D4") || pendidikanUpper.includes("S2") || pendidikanUpper.includes("S3")) {
          maxGradeFromPendidikan = 12;
        }
      }
    }
    
    // Maximum allowed grade is the minimum of both
    const maxAllowedGrade = Math.min(maxGradeFromGolongan, maxGradeFromPendidikan);
    
    if (gradeBaru > maxAllowedGrade) {
      let reason = `Grade ${gradeBaru} > max (`;
      if (maxGradeFromGolongan <= maxGradeFromPendidikan) {
        reason += `Gol: ${maxGradeFromGolongan}`;
      }
      if (maxGradeFromPendidikan < maxGradeFromGolongan) {
        reason += `Pend: ${maxGradeFromPendidikan}`;
      }
      if (maxGradeFromGolongan === maxGradeFromPendidikan) {
        reason = `Grade ${gradeBaru} > max ${maxAllowedGrade}`;
      }
      reason += ")";
      return { isValid: false, reason };
    }
    
    // Check if klaster matches jabatan from daftar_grade
    if (jabatanBaru && matchingGrade && matchingGrade.klaster !== klaster && klaster) {
      return { isValid: false, reason: `Salah kolam: ${klaster} vs ${matchingGrade.klaster}` };
    }
    
    return { isValid: true, reason: "Memenuhi syarat" };
  }
  
  return { isValid: true, reason: "Valid" };
};

export default function GradingPage() {
  const { user, role, fullName, loading: authLoading, signOut } = useAuth();
  const { hasSubMenuAccess, loading: subMenuLoading } = useSubMenuAccess("grading");
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  
  // States
  const [gradingData, setGradingData] = useState<GradingData[]>([]);
  const [kepSalinanData, setKepSalinanData] = useState<KepSalinanData[]>([]);
  const [petikanData, setPetikanData] = useState<PetikanData[]>([]);
  const [permohonanData, setPermohonanData] = useState<PermohonanData[]>([]);
  const [daftarGradeData, setDaftarGradeData] = useState<DaftarGradeData[]>([]);
  const [employeesData, setEmployeesData] = useState<{ id: string; nm_pegawai: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLokasi, setFilterLokasi] = useState("");
  const [filterEselonIII, setFilterEselonIII] = useState("");
  const [filterQC, setFilterQC] = useState<"all" | "valid" | "invalid">("all");
  const [voicebotOpen, setVoicebotOpen] = useState(false);
  const [permohonanSearchTerm, setPermohonanSearchTerm] = useState("");
  const [bigDataSelectSearchTerm, setBigDataSelectSearchTerm] = useState("");
  
  // Big Data filter states
  const [filterBigDataGolongan, setFilterBigDataGolongan] = useState("");
  const [filterBigDataPangkat, setFilterBigDataPangkat] = useState("");
  const [filterBigDataPendidikan, setFilterBigDataPendidikan] = useState("");
  const [filterBigDataGradeLama, setFilterBigDataGradeLama] = useState("");
  const [filterBigDataKlaster, setFilterBigDataKlaster] = useState("");
  const [filterBigDataMaksGol, setFilterBigDataMaksGol] = useState<"all" | "valid" | "invalid">("all");
  const [filterBigDataMaksPend, setFilterBigDataMaksPend] = useState<"all" | "valid" | "invalid">("all");
  const [filterBigDataMaksGolValue, setFilterBigDataMaksGolValue] = useState("");
  const [filterBigDataMaksPendValue, setFilterBigDataMaksPendValue] = useState("");
  
  // Single Core filter states
  const [filterKlaster, setFilterKlaster] = useState("");
  const [filterKeputusan, setFilterKeputusan] = useState("");
  const [filterGradeBaru, setFilterGradeBaru] = useState("");
  const [filterJabatanBaru, setFilterJabatanBaru] = useState("");
  const [filterAnalisaNIP, setFilterAnalisaNIP] = useState("");
  const [filterIsiKuesioner, setFilterIsiKuesioner] = useState("");
  const [filterAnalisisGolPend, setFilterAnalisisGolPend] = useState("");
  const [filterAnalisaY1, setFilterAnalisaY1] = useState("");
  const [filterAnalisaJabatanBaru, setFilterAnalisaJabatanBaru] = useState("");
  const [deleteAllSingleCoreOpen, setDeleteAllSingleCoreOpen] = useState(false);
  
  // Permohonan filter states
  const [filterPermohonanNoKep, setFilterPermohonanNoKep] = useState("");
  const [filterPermohonanGradeBaru, setFilterPermohonanGradeBaru] = useState("");
  const [filterPermohonanJabatanBaru, setFilterPermohonanJabatanBaru] = useState("");
  const [filterPermohonanDari, setFilterPermohonanDari] = useState("");
  const [filterPermohonanKe, setFilterPermohonanKe] = useState("");
  const [expandedKepGroups, setExpandedKepGroups] = useState<Set<string>>(new Set());
  
  // Permohonan multi-select states
  const [permohonanSelectedEmployees, setPermohonanSelectedEmployees] = useState<Array<{
    grading_id: string;
    nama_lengkap: string;
    nip: string;
    pangkat_gol_tmt: string;
    pendidikan: string;
    jabatan_lama: string;
    grade_lama: string;
    jabatan_baru: string;
    grade_baru: string;
    tmt_peringkat_terakhir: string;
  }>>([]);
  
  // Dialog states
  const [bigDataDialogOpen, setBigDataDialogOpen] = useState(false);
  const [kepSalinanDialogOpen, setKepSalinanDialogOpen] = useState(false);
  const [petikanDialogOpen, setPetikanDialogOpen] = useState(false);
  const [permohonanDialogOpen, setPermohonanDialogOpen] = useState(false);
  const [daftarGradeDialogOpen, setDaftarGradeDialogOpen] = useState(false);
  const [kuesionerDialogOpen, setKuesionerDialogOpen] = useState(false);
  const [kuesionerFormDialogOpen, setKuesionerFormDialogOpen] = useState(false);
  const [kuesionerData, setKuesionerData] = useState<any[]>([]);
  const [selectedKuesioner, setSelectedKuesioner] = useState<any>(null);
  const [simulasiData, setSimulasiData] = useState<any[]>([]);
  const [simulasiDialogOpen, setSimulasiDialogOpen] = useState(false);
  const [editingSimulasi, setEditingSimulasi] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"grading" | "kep" | "petikan" | "permohonan" | "daftar-grade" | "kuesioner" | "simulasi" | "pu-syarat" | null>(null);
  const [deleteAllDaftarGradeOpen, setDeleteAllDaftarGradeOpen] = useState(false);
  const [daftarGradeKlasterFilter, setDaftarGradeKlasterFilter] = useState<string>("all");
  const [daftarGradeGradeFilter, setDaftarGradeGradeFilter] = useState<string>("all");
  const [daftarGradeJabatanFilter, setDaftarGradeJabatanFilter] = useState<string>("all");
  const [deleteAllBigDataOpen, setDeleteAllBigDataOpen] = useState(false);
  const [deleteAllPermohonanOpen, setDeleteAllPermohonanOpen] = useState(false);
  const [deleteAllKuesionerOpen, setDeleteAllKuesionerOpen] = useState(false);
  const [deleteAllSimulasiOpen, setDeleteAllSimulasiOpen] = useState(false);
  const [editingData, setEditingData] = useState<GradingData | null>(null);
  const [editingPermohonan, setEditingPermohonan] = useState<PermohonanData | null>(null);
  const [editingDaftarGrade, setEditingDaftarGrade] = useState<DaftarGradeData | null>(null);
  const [puSyaratDialogOpen, setPuSyaratDialogOpen] = useState(false);
  const [editingPuSyarat, setEditingPuSyarat] = useState<PuSyaratGeneralData | null>(null);
  const [puSyaratFormData, setPuSyaratFormData] = useState<{ jenis: string; syarat: string; max_grade: number }>({ jenis: "", syarat: "", max_grade: 0 });
  
  // Combobox open states for employee selection
  const [atasanLangsungOpen, setAtasanLangsungOpen] = useState(false);
  const [atasanDariAtasanOpen, setAtasanDariAtasanOpen] = useState(false);
  const [namaLengkapOpen, setNamaLengkapOpen] = useState(false);
  
  // Full employees data for vlookup in Big Data form
  const [employeesDataFull, setEmployeesDataFull] = useState<EmployeeDataFull[]>([]);
  
  // Pegawai Atasan data from Core Base for lookup
  const [pegawaiAtasanData, setPegawaiAtasanData] = useState<{ 
    nip: string | null; 
    nama: string;
    eselon_iii: string | null; 
    eselon_iv: string | null;
    atasan_langsung: string | null;
    atasan_dari_atasan: string | null;
  }[]>([]);
  
  // Form states for Big Data
  const [formData, setFormData] = useState<Partial<GradingData>>({
    nama_lengkap: "",
    nip: "",
    lampiran_kep: "",
    pangkat: "",
    pangkat_golongan: "",
    tmt_pangkat: "",
    pendidikan: "",
    lokasi: "",
    lokasi_pendidikan_terakhir: "",
    akumulasi_masa_kerja: "",
    tmt_terakhir: "",
    eselon_iii: "",
    eselon_iv: "",
    jabatan: "",
    jabatan_baru: "",
    grade: "",
    grade_baru: "",
    akumulasi_terakhir: "",
    tmt_peringkat_baru: "",
    kemampuan_kerja: "",
    atasan_langsung_id: "",
    atasan_langsung_nama: "",
    atasan_dari_atasan_id: "",
    atasan_dari_atasan_nama: "",
    pkt_2024: "",
    pkt_2025: "",
    hukuman_disiplin: false,
    tugas_belajar: false,
    upkp: false,
    jenis: "",
    rekomendasi: "",
    keputusan: "",
  });

  // Form states for Daftar Grade
  const [daftarGradeFormData, setDaftarGradeFormData] = useState<Partial<DaftarGradeData>>({
    klaster: "",
    grade: 0,
    jabatan: "",
    tugas_jabatan: "",
    syarat_pendidikan: "",
    syarat_golongan: "",
  });

  // State for PU Syarat General
  const [puSyaratGeneralData, setPuSyaratGeneralData] = useState<PuSyaratGeneralData[]>([]);
  
  // Form states for KEP & Salinan
  const [kepFormData, setKepFormData] = useState({
    grading_id: "",
    nomor_kep: "",
    tanggal_kep: "",
    jenis_dokumen: "",
    keterangan: "",
  });
  
  // Form states for Petikan
  const [petikanFormData, setPetikanFormData] = useState({
    grading_id: "",
    nomor_petikan: "",
    tanggal_petikan: "",
    keterangan: "",
  });

  // Form states for Permohonan
  const [permohonanFormData, setPermohonanFormData] = useState<Partial<PermohonanData>>({
    grading_id: "",
    nomor_kep: "",
    tanggal_kep: "",
    hal: "",
    nama_lengkap: "",
    nip: "",
    pangkat_gol_tmt: "",
    pendidikan: "",
    jabatan_lama: "",
    grade_lama: "",
    jabatan_baru: "",
    grade_baru: "",
    tmt_peringkat_terakhir: "",
    dari: "",
    ke: "",
  });
  
  // Mekanisme 54 categories for Permohonan Hal dropdown
  const [mekanisme54Categories, setMekanisme54Categories] = useState<Mekanisme54CategoryOption[]>([]);
  
  // Selected lampiran title from category for Word generation
  const [selectedLampiranTitle, setSelectedLampiranTitle] = useState<string>("");
  
  // Lampiran Word selection dialog
  const [lampiranWordDialogOpen, setLampiranWordDialogOpen] = useState(false);
  const [lampiranWordSelectedIds, setLampiranWordSelectedIds] = useState<Set<string>>(new Set());
  
  // Determine initial active tab based on access
  const getInitialTab = () => {
    if (hasSubMenuAccess("grading:dashboard")) return "dashboard";
    if (hasSubMenuAccess("grading:big-data")) return "big-data";
    if (hasSubMenuAccess("grading:single-core")) return "single-core";
    if (hasSubMenuAccess("grading:daftar-grade")) return "daftar-grade";
    if (hasSubMenuAccess("grading:tabel-408")) return "tabel-408";
    if (hasSubMenuAccess("grading:mekanisme-54")) return "mekanisme-54";
    if (hasSubMenuAccess("grading:permohonan")) return "permohonan";
    if (hasSubMenuAccess("grading:sk-penetapan")) return "sk-penetapan";
    if (hasSubMenuAccess("grading:monev")) return "monev";
    if (hasSubMenuAccess("grading:kelengkapan-simulasi")) return "kelengkapan-simulasi";
    if (hasSubMenuAccess("grading:kuesioner")) return "kuesioner";
    if (hasSubMenuAccess("grading:hasil-evaluasi")) return "hasil-evaluasi";
    if (hasSubMenuAccess("grading:berita-acara")) return "berita-acara";
    return "dashboard";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch all data from Supabase
  useEffect(() => {
    fetchGradingData();
    fetchKepSalinanData();
    fetchPetikanData();
    fetchPermohonanData();
    fetchDaftarGradeData();
    fetchEmployeesData();
    fetchEmployeesDataFull();
    fetchPegawaiAtasanData();
    fetchKuesionerData();
    fetchSimulasiData();
    fetchPuSyaratGeneralData();
    fetchMekanisme54Categories();
  }, []);

  // Fetch Pegawai Atasan data from Core Base for lookup
  const fetchPegawaiAtasanData = async () => {
    try {
      // Fetch all data in batches to overcome Supabase 1000 row limit
      const allData: { nip: string | null; nama: string; eselon_iii: string | null; eselon_iv: string | null; atasan_langsung: string | null; atasan_dari_atasan: string | null }[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error } = await supabase
          .from("pegawai_atasan")
          .select("nip, nama, eselon_iii, eselon_iv, atasan_langsung, atasan_dari_atasan")
          .order("no_urut", { ascending: true })
          .range(offset, offset + batchSize - 1);

        if (error) throw error;

        if (batchData && batchData.length > 0) {
          allData.push(...batchData);
          offset += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Use atasan_langsung and atasan_dari_atasan directly from database (synced with Corebase Pegawai & Atasan)
      setPegawaiAtasanData(allData.map(item => ({
        nip: item.nip,
        nama: item.nama,
        eselon_iii: item.eselon_iii,
        eselon_iv: item.eselon_iv,
        atasan_langsung: item.atasan_langsung,
        atasan_dari_atasan: item.atasan_dari_atasan,
      })));
    } catch (error: any) {
      console.error("Error fetching pegawai atasan data:", error);
    }
  };

  const fetchSimulasiData = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_kelengkapan_simulasi")
        .select("id, nama_lengkap, nip, pangkat_golongan, jabatan, eselon_iv, eselon_iii, grade, kelengkapan_data, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSimulasiData(data || []);
    } catch (error: any) {
      console.error("Error fetching simulasi data:", error);
    }
  };

  const handleExportSimulasi = () => {
    const exportData = simulasiData.map((d, i) => ({
      No: i + 1,
      "Nama Lengkap": d.nama_lengkap,
      NIP: d.nip,
      "Unit Organisasi": d.unit_organisasi,
      "Grade Awal": d.grade_awal,
      "Rekomendasi Grade": d.rekomendasi_grade,
      "Nomenklatur Jabatan": d.nomenklatur_jabatan,
      Lokasi: d.lokasi,
      Tanggal: d.tanggal,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Simulasi");
    XLSX.writeFile(wb, `Data_Simulasi_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  const handleImportSimulasi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const insertData = jsonData.map((row: any) => ({
        nama_lengkap: row["Nama Lengkap"] || "",
        nip: row["NIP"] || "",
        unit_organisasi: row["Unit Organisasi"] || "",
        grade_awal: row["Grade Awal"] || null,
        rekomendasi_grade: row["Rekomendasi Grade"] || null,
        nomenklatur_jabatan: row["Nomenklatur Jabatan"] || "",
        lokasi: row["Lokasi"] || "",
        tanggal: row["Tanggal"] || null,
        created_by_email: currentUser?.email,
      })).filter((d: any) => d.nama_lengkap);
      const { error } = await supabase.from("grading_kelengkapan_simulasi").insert(insertData);
      if (error) throw error;
      toast.success(`Berhasil import ${insertData.length} data`);
      fetchSimulasiData();
    } catch (err: any) {
      toast.error(err.message || "Gagal import");
    }
    e.target.value = "";
  };

  const handleDeleteSimulasi = async (id: string) => {
    const { error } = await supabase.from("grading_kelengkapan_simulasi").delete().eq("id", id);
    if (error) { toast.error("Gagal menghapus"); return; }
    toast.success("Data dihapus");
    fetchSimulasiData();
  };

  // Fetch Mekanisme 54 categories for Permohonan Hal dropdown
  const fetchMekanisme54Categories = async () => {
    try {
      const { data, error } = await supabase
        .from("mekanisme_54")
        .select("id, jenis_penetapan, sub_jenis, kode_kategori, deskripsi")
        .order("jenis_penetapan")
        .order("sub_jenis")
        .order("kode_kategori");
      if (error) throw error;
      setMekanisme54Categories(data || []);
    } catch (error) {
      console.error("Error fetching mekanisme 54:", error);
    }
  };

  // Get mekanisme 54 categories for a specific Hal value
  const getMekanisme54ForHal = (hal: string): Record<string, Mekanisme54CategoryOption[]> => {
    const jenisPenetapan = HAL_TO_JENIS_PENETAPAN[hal];
    if (!jenisPenetapan) return {};
    const filtered = mekanisme54Categories.filter(c => c.jenis_penetapan === jenisPenetapan);
    const grouped: Record<string, Mekanisme54CategoryOption[]> = {};
    filtered.forEach(c => {
      if (!grouped[c.sub_jenis]) grouped[c.sub_jenis] = [];
      grouped[c.sub_jenis].push(c);
    });
    return grouped;
  };

  const fetchKuesionerData = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_kuesioner")
        .select("id, nama_lengkap, nip, jenis_kuesioner, jawaban, status, grading_id, created_by_email, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setKuesionerData(data || []);
    } catch (error: any) {
      console.error("Error fetching kuesioner data:", error);
    }
  };

  // Export Kuesioner to Excel
  const handleExportKuesioner = () => {
    if (kuesionerData.length === 0) {
      toast.error("Tidak ada data kuesioner untuk di-export");
      return;
    }

    const exportData = kuesionerData.map((item, index) => {
      const jawaban = item.jawaban || {};
      return {
        No: index + 1,
        "Nama Lengkap": item.nama_lengkap,
        NIP: item.nip || "",
        "Jenis Kuesioner": item.jenis_kuesioner || "",
        Status: item.status || "",
        Lokasi: jawaban.lokasi || "",
        Tanggal: jawaban.tanggal || "",
        "Atasan Langsung": jawaban.atasan_langsung_nama || "",
        "NIP Atasan Langsung": jawaban.atasan_langsung_nip || "",
        "Atasan dari Atasan Langsung": jawaban.atasan_dari_atasan_nama || "",
        "NIP Atasan dari Atasan Langsung": jawaban.atasan_dari_atasan_nip || "",
        "Peringkat Saat Ini": jawaban.peringkat_saat_ini || "",
        "Jabatan Saat Ini": jawaban.jabatan_saat_ini || "",
        "Pangkat/Golongan": jawaban.pangkat_golongan || "",
        "Pendidikan Saat Ini": jawaban.pendidikan_saat_ini || "",
        "Unit Organisasi": jawaban.unit_organisasi || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kuesioner");
    XLSX.writeFile(wb, `Data_Kuesioner_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data kuesioner berhasil di-export");
  };

  // Import Kuesioner from Excel
  const handleImportKuesioner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);

      if (data.length === 0) {
        toast.error("File Excel kosong");
        return;
      }

      const importedData = data.map((row: any) => ({
        nama_lengkap: row["Nama Lengkap"] || "",
        nip: row["NIP"] || null,
        jenis_kuesioner: row["Jenis Kuesioner"] || null,
        status: row["Status"] || "Belum Diisi",
        jawaban: {
          lokasi: row["Lokasi"] || "",
          tanggal: row["Tanggal"] || "",
          atasan_langsung_nama: row["Atasan Langsung"] || "",
          atasan_langsung_nip: row["NIP Atasan Langsung"] || "",
          atasan_dari_atasan_nama: row["Atasan dari Atasan Langsung"] || "",
          atasan_dari_atasan_nip: row["NIP Atasan dari Atasan Langsung"] || "",
          peringkat_saat_ini: row["Peringkat Saat Ini"] || "",
          jabatan_saat_ini: row["Jabatan Saat Ini"] || "",
          pangkat_golongan: row["Pangkat/Golongan"] || "",
          pendidikan_saat_ini: row["Pendidikan Saat Ini"] || "",
          unit_organisasi: row["Unit Organisasi"] || "",
        },
        created_by_email: user?.email,
      })).filter((item: any) => item.nama_lengkap);

      if (importedData.length === 0) {
        toast.error("Tidak ada data valid untuk di-import");
        return;
      }

      const { error } = await supabase.from("grading_kuesioner").insert(importedData);
      if (error) throw error;

      toast.success(`Berhasil import ${importedData.length} data kuesioner`);
      fetchKuesionerData();
    } catch (error: any) {
      console.error("Error importing kuesioner:", error);
      toast.error(error.message || "Gagal import data kuesioner");
    } finally {
      // Reset input file
      e.target.value = "";
    }
  };

  const fetchGradingData = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_big_data")
        .select("id, nama_lengkap, nip, lampiran_kep, pangkat, pangkat_golongan, tmt_pangkat, pendidikan, lokasi, lokasi_pendidikan_terakhir, akumulasi_masa_kerja, tmt_terakhir, riwayat_tahun_lalu, eselon_iii, eselon_iv, jabatan, jabatan_baru, grade, grade_baru, akumulasi_terakhir, tmt_peringkat_baru, kemampuan_kerja, atasan_langsung_id, atasan_langsung_nama, atasan_dari_atasan_id, atasan_dari_atasan_nama, pkt_2024, pkt_2025, hukuman_disiplin, tugas_belajar, upkp, jenis, rekomendasi, keputusan, created_at, updated_at")
        .order("nama_lengkap", { ascending: true });

      if (error) throw error;
      // Map data and ensure riwayat_tahun_lalu field exists + normalize golongan format
      const mappedData = (data || []).map((item: any) => ({
        ...item,
        riwayat_tahun_lalu: item.riwayat_tahun_lalu || "",
        // Normalize golongan to lowercase after "/" (e.g., II/C -> II/c)
        pangkat_golongan: normalizeGolongan(item.pangkat_golongan),
      })) as GradingData[];
      setGradingData(mappedData);
    } catch (error: any) {
      console.error("Error fetching grading data:", error);
      toast.error("Gagal memuat data grading");
    } finally {
      setLoading(false);
    }
  };

  const fetchKepSalinanData = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_kep_salinan")
        .select("id, grading_id, nama_lengkap, nip, nomor_kep, tanggal_kep, jenis_dokumen, keterangan, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setKepSalinanData(data || []);
    } catch (error: any) {
      console.error("Error fetching KEP & Salinan data:", error);
    }
  };

  const fetchPetikanData = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_petikan")
        .select("id, grading_id, nama_lengkap, nip, nomor_petikan, tanggal_petikan, keterangan, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPetikanData(data || []);
    } catch (error: any) {
      console.error("Error fetching Petikan data:", error);
    }
  };

  const fetchPermohonanData = async () => {
    try {
      const { data, error } = await supabase
        .from("permohonan_grading")
        .select("id, grading_id, no_urut, nomor_kep, tanggal_kep, hal, nama_lengkap, nip, pangkat_gol_tmt, pendidikan, jabatan_lama, grade_lama, jabatan_baru, grade_baru, tmt_peringkat_terakhir, dari, ke, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
  // Map data from database to interface (handle old keterangan field to new dari/ke fields)
      const mappedData = (data || []).map(item => ({
        ...item,
        dari: item.dari || "",
        ke: item.ke || "",
      }));
      setPermohonanData(mappedData);
    } catch (error: any) {
      console.error("Error fetching Permohonan data:", error);
    }
  };

  const fetchDaftarGradeData = async () => {
    try {
      const { data, error } = await supabase
        .from("daftar_grade")
        .select("id, no_urut, klaster, grade, jabatan, tugas_jabatan, syarat_pendidikan, syarat_golongan, created_at")
        .order("grade", { ascending: true });

      if (error) throw error;
      setDaftarGradeData(data || []);
    } catch (error: any) {
      console.error("Error fetching Daftar Grade data:", error);
    }
  };

  const fetchPuSyaratGeneralData = async () => {
    try {
      const { data, error } = await supabase
        .from("pu_syarat_general")
        .select("id, jenis, syarat, max_grade, no_urut, created_at")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setPuSyaratGeneralData(data || []);
    } catch (error: any) {
      console.error("Error fetching PU Syarat General data:", error);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      // Fetch all employees (more than 1000) using pagination
      let allEmployees: { id: string; nm_pegawai: string }[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai")
          .order("nm_pegawai", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allEmployees = [...allEmployees, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      setEmployeesData(allEmployees);
    } catch (error: any) {
      console.error("Error fetching employees data:", error);
    }
  };

  // Fetch full employees data with pangkat for vlookup
  const fetchEmployeesDataFull = async () => {
    try {
      let allEmployees: EmployeeDataFull[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, uraian_pangkat, uraian_jabatan, nm_unit_organisasi, eselon_iii, eselon_iv")
          .order("nm_pegawai", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allEmployees = [...allEmployees, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }
      
      setEmployeesDataFull(allEmployees);
    } catch (error: any) {
      console.error("Error fetching full employees data:", error);
    }
  };

  // Handle Big Data form submission
  const handleBigDataSubmit = async () => {
    try {
      if (!formData.nama_lengkap || !formData.nip) {
        toast.error("Nama Lengkap dan NIP wajib diisi");
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Auto-calculate grade_baru based on rekomendasi
      const calculatedGradeBaru = formData.rekomendasi && formData.grade 
        ? calculateGradeBaru(formData.grade, formData.rekomendasi)
        : formData.grade_baru || formData.grade;

      // Auto-calculate lampiran_kep based on jenis, rekomendasi, PKT, and flags
      const calculatedLampiranKep = calculateLampiranKep(
        formData.jenis || null,
        formData.rekomendasi || null,
        formData.pkt_2024 || null,
        formData.pkt_2025 || null,
        formData.tugas_belajar || false,
        formData.upkp || false
      ) || formData.lampiran_kep;

      if (editingData) {
        const { error } = await supabase
          .from("grading_big_data")
          .update({
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip,
            lampiran_kep: calculatedLampiranKep,
            pangkat: formData.pangkat,
            pangkat_golongan: normalizeGolongan(formData.pangkat_golongan || ""),
            tmt_pangkat: formData.tmt_pangkat || null,
            pendidikan: formData.pendidikan,
            lokasi: formData.lokasi,
            lokasi_pendidikan_terakhir: formData.lokasi_pendidikan_terakhir,
            akumulasi_masa_kerja: formData.akumulasi_masa_kerja,
            tmt_terakhir: formData.tmt_terakhir || null,
            riwayat_tahun_lalu: formData.riwayat_tahun_lalu || null,
            eselon_iii: formData.eselon_iii,
            eselon_iv: formData.eselon_iv,
            jabatan: formData.jabatan,
            jabatan_baru: formData.jabatan_baru,
            grade: formData.grade,
            grade_baru: calculatedGradeBaru,
            akumulasi_terakhir: formData.akumulasi_terakhir,
            tmt_peringkat_baru: formData.tmt_peringkat_baru || null,
            kemampuan_kerja: formData.kemampuan_kerja,
            atasan_langsung_id: formData.atasan_langsung_id || null,
            atasan_langsung_nama: formData.atasan_langsung_nama,
            atasan_dari_atasan_id: formData.atasan_dari_atasan_id || null,
            atasan_dari_atasan_nama: formData.atasan_dari_atasan_nama,
            pkt_2024: formData.pkt_2024,
            pkt_2025: formData.pkt_2025,
            hukuman_disiplin: formData.hukuman_disiplin,
            tugas_belajar: formData.tugas_belajar,
            upkp: formData.upkp,
            jenis: formData.jenis,
            rekomendasi: formData.rekomendasi,
          })
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("grading_big_data")
          .insert({
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip,
            lampiran_kep: calculatedLampiranKep,
            pangkat: formData.pangkat,
            pangkat_golongan: normalizeGolongan(formData.pangkat_golongan || ""),
            tmt_pangkat: formData.tmt_pangkat || null,
            pendidikan: formData.pendidikan,
            lokasi: formData.lokasi,
            lokasi_pendidikan_terakhir: formData.lokasi_pendidikan_terakhir,
            akumulasi_masa_kerja: formData.akumulasi_masa_kerja,
            tmt_terakhir: formData.tmt_terakhir || null,
            riwayat_tahun_lalu: formData.riwayat_tahun_lalu || null,
            eselon_iii: formData.eselon_iii,
            eselon_iv: formData.eselon_iv,
            jabatan: formData.jabatan,
            jabatan_baru: formData.jabatan_baru,
            grade: formData.grade,
            grade_baru: calculatedGradeBaru,
            akumulasi_terakhir: formData.akumulasi_terakhir,
            tmt_peringkat_baru: formData.tmt_peringkat_baru || null,
            kemampuan_kerja: formData.kemampuan_kerja,
            atasan_langsung_id: formData.atasan_langsung_id || null,
            atasan_langsung_nama: formData.atasan_langsung_nama,
            atasan_dari_atasan_id: formData.atasan_dari_atasan_id || null,
            atasan_dari_atasan_nama: formData.atasan_dari_atasan_nama,
            pkt_2024: formData.pkt_2024,
            pkt_2025: formData.pkt_2025,
            hukuman_disiplin: formData.hukuman_disiplin,
            tugas_belajar: formData.tugas_belajar,
            upkp: formData.upkp,
            jenis: formData.jenis,
            rekomendasi: formData.rekomendasi,
            created_by_email: userEmail,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      fetchGradingData();
      setBigDataDialogOpen(false);
      setEditingData(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  // Handle KEP & Salinan form submission
  const handleKepSalinanSubmit = async () => {
    try {
      if (!kepFormData.grading_id || !kepFormData.nomor_kep) {
        toast.error("Pegawai dan Nomor KEP wajib diisi");
        return;
      }

      const selectedGrading = gradingData.find(g => g.id === kepFormData.grading_id);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const { error } = await supabase
        .from("grading_kep_salinan")
        .insert({
          grading_id: kepFormData.grading_id,
          nama_lengkap: selectedGrading?.nama_lengkap || "",
          nip: selectedGrading?.nip || "",
          nomor_kep: kepFormData.nomor_kep,
          tanggal_kep: kepFormData.tanggal_kep || null,
          jenis_dokumen: kepFormData.jenis_dokumen,
          keterangan: kepFormData.keterangan,
          created_by_email: userEmail,
        });

      if (error) throw error;
      toast.success("Data KEP & Salinan berhasil ditambahkan");

      fetchKepSalinanData();
      setKepSalinanDialogOpen(false);
      setKepFormData({ grading_id: "", nomor_kep: "", tanggal_kep: "", jenis_dokumen: "", keterangan: "" });
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  // Handle Petikan form submission
  const handlePetikanSubmit = async () => {
    try {
      if (!petikanFormData.grading_id || !petikanFormData.nomor_petikan) {
        toast.error("Pegawai dan Nomor Petikan wajib diisi");
        return;
      }

      const selectedGrading = gradingData.find(g => g.id === petikanFormData.grading_id);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const { error } = await supabase
        .from("grading_petikan")
        .insert({
          grading_id: petikanFormData.grading_id,
          nama_lengkap: selectedGrading?.nama_lengkap || "",
          nip: selectedGrading?.nip || "",
          nomor_petikan: petikanFormData.nomor_petikan,
          tanggal_petikan: petikanFormData.tanggal_petikan || null,
          keterangan: petikanFormData.keterangan,
          created_by_email: userEmail,
        });

      if (error) throw error;
      toast.success("Data Petikan berhasil ditambahkan");

      fetchPetikanData();
      setPetikanDialogOpen(false);
      setPetikanFormData({ grading_id: "", nomor_petikan: "", tanggal_petikan: "", keterangan: "" });
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  // Handle Permohonan form submission - supports single or multiple employees
  const handlePermohonanSubmit = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Get next no_urut
      const { data: maxData } = await supabase
        .from("permohonan_grading")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);
      
      let nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut) 
        ? maxData[0].no_urut + 1 
        : 1;

      if (editingPermohonan) {
        // Edit mode - update single record
        if (!permohonanFormData.nomor_kep || !permohonanFormData.nama_lengkap) {
          toast.error("Nomor KEP dan Nama Lengkap wajib diisi");
          return;
        }
        const { error } = await supabase
          .from("permohonan_grading")
          .update({
            grading_id: permohonanFormData.grading_id || null,
            nomor_kep: permohonanFormData.nomor_kep,
            tanggal_kep: permohonanFormData.tanggal_kep || null,
            hal: permohonanFormData.hal,
            nama_lengkap: permohonanFormData.nama_lengkap,
            nip: permohonanFormData.nip,
            pangkat_gol_tmt: permohonanFormData.pangkat_gol_tmt,
            pendidikan: permohonanFormData.pendidikan,
            jabatan_lama: permohonanFormData.jabatan_lama,
            grade_lama: permohonanFormData.grade_lama,
            jabatan_baru: permohonanFormData.jabatan_baru,
            grade_baru: permohonanFormData.grade_baru,
            tmt_peringkat_terakhir: permohonanFormData.tmt_peringkat_terakhir || null,
            dari: permohonanFormData.dari,
            ke: permohonanFormData.ke,
          })
          .eq("id", editingPermohonan.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");

        // Also insert any newly added employees in edit mode
        if (permohonanSelectedEmployees.length > 0) {
          const insertData = permohonanSelectedEmployees.map((emp, idx) => ({
            grading_id: emp.grading_id || null,
            no_urut: nextNoUrut + idx,
            nomor_kep: permohonanFormData.nomor_kep,
            tanggal_kep: permohonanFormData.tanggal_kep || null,
            hal: permohonanFormData.hal,
            nama_lengkap: emp.nama_lengkap,
            nip: emp.nip,
            pangkat_gol_tmt: emp.pangkat_gol_tmt,
            pendidikan: emp.pendidikan,
            jabatan_lama: emp.jabatan_lama,
            grade_lama: emp.grade_lama,
            jabatan_baru: emp.jabatan_baru,
            grade_baru: emp.grade_baru,
            tmt_peringkat_terakhir: emp.tmt_peringkat_terakhir || null,
            dari: permohonanFormData.dari,
            ke: permohonanFormData.ke,
            created_by_email: userEmail,
          }));
          const { error: insertError } = await supabase.from("permohonan_grading").insert(insertData);
          if (insertError) throw insertError;
          toast.success(`${insertData.length} pegawai baru berhasil ditambahkan`);
        }
      } else {
        // Insert mode - check if multi-employee or single employee
        if (permohonanSelectedEmployees.length > 0) {
          // Multi-employee insert
          if (!permohonanFormData.nomor_kep) {
            toast.error("Nomor KEP wajib diisi");
            return;
          }
          const insertData = permohonanSelectedEmployees.map((emp, idx) => ({
            grading_id: emp.grading_id || null,
            no_urut: nextNoUrut + idx,
            nomor_kep: permohonanFormData.nomor_kep,
            tanggal_kep: permohonanFormData.tanggal_kep || null,
            hal: permohonanFormData.hal,
            nama_lengkap: emp.nama_lengkap,
            nip: emp.nip,
            pangkat_gol_tmt: emp.pangkat_gol_tmt,
            pendidikan: emp.pendidikan,
            jabatan_lama: emp.jabatan_lama,
            grade_lama: emp.grade_lama,
            jabatan_baru: emp.jabatan_baru,
            grade_baru: emp.grade_baru,
            tmt_peringkat_terakhir: emp.tmt_peringkat_terakhir || null,
            dari: permohonanFormData.dari,
            ke: permohonanFormData.ke,
            created_by_email: userEmail,
          }));
          const { error } = await supabase.from("permohonan_grading").insert(insertData);
          if (error) throw error;
          toast.success(`${insertData.length} data berhasil ditambahkan`);
        } else {
          // Single employee insert
          if (!permohonanFormData.nomor_kep || !permohonanFormData.nama_lengkap) {
            toast.error("Nomor KEP dan Nama Lengkap wajib diisi");
            return;
          }
          const { error } = await supabase
            .from("permohonan_grading")
            .insert({
              grading_id: permohonanFormData.grading_id || null,
              no_urut: nextNoUrut,
              nomor_kep: permohonanFormData.nomor_kep,
              tanggal_kep: permohonanFormData.tanggal_kep || null,
              hal: permohonanFormData.hal,
              nama_lengkap: permohonanFormData.nama_lengkap,
              nip: permohonanFormData.nip,
              pangkat_gol_tmt: permohonanFormData.pangkat_gol_tmt,
              pendidikan: permohonanFormData.pendidikan,
              jabatan_lama: permohonanFormData.jabatan_lama,
              grade_lama: permohonanFormData.grade_lama,
              jabatan_baru: permohonanFormData.jabatan_baru,
              grade_baru: permohonanFormData.grade_baru,
              tmt_peringkat_terakhir: permohonanFormData.tmt_peringkat_terakhir || null,
              dari: permohonanFormData.dari,
              ke: permohonanFormData.ke,
              created_by_email: userEmail,
            });
          if (error) throw error;
          toast.success("Data berhasil ditambahkan");
        }
      }

      fetchPermohonanData();
      setPermohonanDialogOpen(false);
      setEditingPermohonan(null);
      resetPermohonanForm();
      setPermohonanSelectedEmployees([]);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };
  
  // Add employee to multi-select list for Permohonan
  const handleAddEmployeeToPermohonan = (gradingId: string) => {
    const selectedGrading = gradingData.find(g => g.id === gradingId);
    if (!selectedGrading) return;
    
    // Check if already added
    if (permohonanSelectedEmployees.some(e => e.grading_id === gradingId)) {
      toast.warning("Pegawai sudah ada dalam daftar");
      return;
    }
    
    // Format pangkat_gol_tmt as "Pangkat / Gol / TMT" (e.g., "Pengatur Tk. I / II/d / 1 April 2023")
    const pangkatGolTmt = formatPangkatGolTmt(
      selectedGrading.pangkat || "",
      selectedGrading.pangkat_golongan || "",
      selectedGrading.tmt_pangkat || ""
    );
    
    setPermohonanSelectedEmployees(prev => [...prev, {
      grading_id: gradingId,
      nama_lengkap: selectedGrading.nama_lengkap,
      nip: selectedGrading.nip,
      pangkat_gol_tmt: pangkatGolTmt,
      pendidikan: selectedGrading.pendidikan,
      jabatan_lama: selectedGrading.jabatan,
      grade_lama: selectedGrading.grade,
      jabatan_baru: selectedGrading.jabatan_baru || "",
      grade_baru: selectedGrading.grade_baru || "",
      tmt_peringkat_terakhir: selectedGrading.tmt_terakhir || "",
    }]);
    
    toast.success(`${selectedGrading.nama_lengkap} ditambahkan ke daftar`);
  };
  
  // Remove employee from multi-select list
  const handleRemoveEmployeeFromPermohonan = (gradingId: string) => {
    setPermohonanSelectedEmployees(prev => prev.filter(e => e.grading_id !== gradingId));
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;

    try {
      if (deleteType === "grading") {
        // First, delete related records in permohonan_grading to avoid FK constraint violation
        await supabase.from("permohonan_grading").delete().eq("grading_id", deleteId);
        // Then delete the grading_big_data record
        const { error } = await supabase.from("grading_big_data").delete().eq("id", deleteId);
        if (error) throw error;
        fetchGradingData();
      } else if (deleteType === "kep") {
        const { error } = await supabase.from("grading_kep_salinan").delete().eq("id", deleteId);
        if (error) throw error;
        fetchKepSalinanData();
      } else if (deleteType === "petikan") {
        const { error } = await supabase.from("grading_petikan").delete().eq("id", deleteId);
        if (error) throw error;
        fetchPetikanData();
      } else if (deleteType === "permohonan") {
        const { error } = await supabase.from("permohonan_grading").delete().eq("id", deleteId);
        if (error) throw error;
        fetchPermohonanData();
      } else if (deleteType === "daftar-grade") {
        const { error } = await supabase.from("daftar_grade").delete().eq("id", deleteId);
        if (error) throw error;
        fetchDaftarGradeData();
      } else if (deleteType === "kuesioner") {
        const { error } = await supabase.from("grading_kuesioner").delete().eq("id", deleteId);
        if (error) throw error;
        fetchKuesionerData();
      } else if (deleteType === "simulasi") {
        const { error } = await supabase.from("grading_kelengkapan_simulasi").delete().eq("id", deleteId);
        if (error) throw error;
        fetchSimulasiData();
      } else if (deleteType === "pu-syarat") {
        const { error } = await supabase.from("pu_syarat_general").delete().eq("id", deleteId);
        if (error) throw error;
        fetchPuSyaratGeneralData();
      }

      toast.success("Data berhasil dihapus");
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  // Handle delete all Daftar Grade
  const handleDeleteAllDaftarGrade = async () => {
    try {
      const { error } = await supabase.from("daftar_grade").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data Daftar Grade berhasil dihapus");
      fetchDaftarGradeData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus semua data");
    } finally {
      setDeleteAllDaftarGradeOpen(false);
    }
  };

  // Handle delete all Big Data
  const handleDeleteAllBigData = async () => {
    try {
      // First delete all related permohonan_grading records
      await supabase.from("permohonan_grading").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // Then delete all grading_big_data records
      const { error } = await supabase.from("grading_big_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data Big Data berhasil dihapus");
      fetchGradingData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus semua data");
    } finally {
      setDeleteAllBigDataOpen(false);
    }
  };

  // Handle sync atasan from pegawai_atasan (Corebase) to grading_big_data
  const handleSyncAtasan = async () => {
    try {
      toast.info("Menyinkronkan data atasan dari Corebase Pegawai & Atasan...");
      
      // Fetch latest pegawai_atasan data
      const allPegawaiAtasan: { nip: string | null; atasan_langsung: string | null; atasan_dari_atasan: string | null }[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const { data: batchData, error } = await supabase
          .from("pegawai_atasan")
          .select("nip, atasan_langsung, atasan_dari_atasan")
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        if (batchData && batchData.length > 0) {
          allPegawaiAtasan.push(...batchData);
          offset += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      // Build NIP lookup map
      const nipMap = new Map<string, { atasan_langsung: string | null; atasan_dari_atasan: string | null }>();
      allPegawaiAtasan.forEach(pa => {
        if (pa.nip) nipMap.set(pa.nip, { atasan_langsung: pa.atasan_langsung, atasan_dari_atasan: pa.atasan_dari_atasan });
      });

      // Update each grading_big_data record that has a matching NIP
      let updatedCount = 0;
      for (const gd of gradingData) {
        if (!gd.nip) continue;
        const match = nipMap.get(gd.nip);
        if (!match) continue;
        
        const needsUpdate = 
          (match.atasan_langsung && match.atasan_langsung !== gd.atasan_langsung_nama) ||
          (match.atasan_dari_atasan && match.atasan_dari_atasan !== gd.atasan_dari_atasan_nama);
        
        if (needsUpdate) {
          const updatePayload: any = {};
          if (match.atasan_langsung) updatePayload.atasan_langsung_nama = match.atasan_langsung;
          if (match.atasan_dari_atasan) updatePayload.atasan_dari_atasan_nama = match.atasan_dari_atasan;
          
          const { error } = await supabase
            .from("grading_big_data")
            .update(updatePayload)
            .eq("id", gd.id);
          
          if (!error) updatedCount++;
        }
      }

      toast.success(`Sinkronisasi selesai! ${updatedCount} data atasan diperbarui.`);
      fetchGradingData();
      fetchPegawaiAtasanData();
    } catch (error: any) {
      console.error("Error syncing atasan:", error);
      toast.error(error.message || "Gagal menyinkronkan data atasan");
    }
  };

  // Handle delete all Permohonan
  const handleDeleteAllPermohonan = async () => {
    try {
      const { error } = await supabase.from("permohonan_grading").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data Permohonan berhasil dihapus");
      fetchPermohonanData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus semua data");
    } finally {
      setDeleteAllPermohonanOpen(false);
    }
  };

  // Handle delete all Kuesioner
  const handleDeleteAllKuesioner = async () => {
    try {
      const { error } = await supabase.from("grading_kuesioner").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data Kuesioner berhasil dihapus");
      fetchKuesionerData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus semua data");
    } finally {
      setDeleteAllKuesionerOpen(false);
    }
  };

  // Handle delete all Simulasi
  const handleDeleteAllSimulasi = async () => {
    try {
      const { error } = await supabase.from("grading_kelengkapan_simulasi").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data Simulasi berhasil dihapus");
      fetchSimulasiData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus semua data");
    } finally {
      setDeleteAllSimulasiOpen(false);
    }
  };
  const handleDaftarGradeSubmit = async () => {
    try {
      if (!daftarGradeFormData.klaster || !daftarGradeFormData.grade || !daftarGradeFormData.jabatan) {
        toast.error("Klaster, Grade, dan Jabatan wajib diisi");
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Get next no_urut
      const { data: maxData } = await supabase
        .from("daftar_grade")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);
      
      const nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut) 
        ? maxData[0].no_urut + 1 
        : 1;

      if (editingDaftarGrade) {
        const { error } = await supabase
          .from("daftar_grade")
          .update({
            klaster: daftarGradeFormData.klaster,
            grade: daftarGradeFormData.grade,
            jabatan: daftarGradeFormData.jabatan,
            tugas_jabatan: daftarGradeFormData.tugas_jabatan || null,
            syarat_pendidikan: daftarGradeFormData.syarat_pendidikan || null,
            syarat_golongan: daftarGradeFormData.syarat_golongan || null,
          })
          .eq("id", editingDaftarGrade.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("daftar_grade")
          .insert({
            no_urut: nextNoUrut,
            klaster: daftarGradeFormData.klaster,
            grade: daftarGradeFormData.grade,
            jabatan: daftarGradeFormData.jabatan,
            tugas_jabatan: daftarGradeFormData.tugas_jabatan || null,
            syarat_pendidikan: daftarGradeFormData.syarat_pendidikan || null,
            syarat_golongan: daftarGradeFormData.syarat_golongan || null,
            created_by_email: userEmail,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      fetchDaftarGradeData();
      setDaftarGradeDialogOpen(false);
      setEditingDaftarGrade(null);
      resetDaftarGradeForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setFormData({
      nama_lengkap: "",
      nip: "",
      lampiran_kep: "",
      pangkat: "",
      pangkat_golongan: "",
      tmt_pangkat: "",
      pendidikan: "",
      lokasi: "",
      lokasi_pendidikan_terakhir: "",
      akumulasi_masa_kerja: "",
      tmt_terakhir: "",
      riwayat_tahun_lalu: "",
      eselon_iii: "",
      eselon_iv: "",
      jabatan: "",
      jabatan_baru: "",
      grade: "",
      grade_baru: "",
      akumulasi_terakhir: "",
      tmt_peringkat_baru: "",
      kemampuan_kerja: "",
      atasan_langsung_id: "",
      atasan_langsung_nama: "",
      atasan_dari_atasan_id: "",
      atasan_dari_atasan_nama: "",
      pkt_2024: "",
      pkt_2025: "",
      hukuman_disiplin: false,
      tugas_belajar: false,
      upkp: false,
      jenis: "",
      rekomendasi: "",
    });
  };

  const resetDaftarGradeForm = () => {
    setDaftarGradeFormData({
      klaster: "",
      grade: 0,
      jabatan: "",
      tugas_jabatan: "",
      syarat_pendidikan: "",
      syarat_golongan: "",
    });
  };

  // PU Syarat General handlers
  const resetPuSyaratForm = () => {
    setPuSyaratFormData({ jenis: "", syarat: "", max_grade: 0 });
  };

  const handlePuSyaratSubmit = async () => {
    try {
      if (!puSyaratFormData.jenis || !puSyaratFormData.syarat || !puSyaratFormData.max_grade) {
        toast.error("Semua field wajib diisi");
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const { data: maxData } = await supabase
        .from("pu_syarat_general")
        .select("no_urut")
        .eq("jenis", puSyaratFormData.jenis)
        .order("no_urut", { ascending: false })
        .limit(1);
      
      const nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut) 
        ? maxData[0].no_urut + 1 
        : 1;

      if (editingPuSyarat) {
        const { error } = await supabase
          .from("pu_syarat_general")
          .update({
            jenis: puSyaratFormData.jenis,
            syarat: puSyaratFormData.syarat,
            max_grade: puSyaratFormData.max_grade,
          })
          .eq("id", editingPuSyarat.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("pu_syarat_general")
          .insert({
            no_urut: nextNoUrut,
            jenis: puSyaratFormData.jenis,
            syarat: puSyaratFormData.syarat,
            max_grade: puSyaratFormData.max_grade,
            created_by_email: userEmail,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      fetchPuSyaratGeneralData();
      setPuSyaratDialogOpen(false);
      setEditingPuSyarat(null);
      resetPuSyaratForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleEditPuSyarat = (data: PuSyaratGeneralData) => {
    setEditingPuSyarat(data);
    setPuSyaratFormData({ jenis: data.jenis, syarat: data.syarat, max_grade: data.max_grade });
    setPuSyaratDialogOpen(true);
  };

  const handleExportPuSyaratGeneral = () => {
    if (puSyaratGeneralData.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }
    const exportData = puSyaratGeneralData.map((item, index) => ({
      No: item.no_urut || index + 1,
      Jenis: item.jenis,
      Syarat: item.syarat,
      "Max Grade": item.max_grade,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PU Syarat General");
    XLSX.writeFile(wb, `PU_Syarat_General_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil di-export");
  };

  const handleImportPuSyaratGeneral = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);

      if (data.length === 0) {
        toast.error("File Excel kosong");
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const importedData = data.map((row: any, index) => ({
        no_urut: row["No"] || index + 1,
        jenis: row["Jenis"] || "",
        syarat: row["Syarat"] || "",
        max_grade: row["Max Grade"] || 0,
        created_by_email: userEmail,
      })).filter((item: any) => item.jenis && item.syarat);

      if (importedData.length === 0) {
        toast.error("Tidak ada data valid untuk di-import");
        return;
      }

      const { error } = await supabase.from("pu_syarat_general").insert(importedData);
      if (error) throw error;

      toast.success(`Berhasil import ${importedData.length} data`);
      fetchPuSyaratGeneralData();
    } catch (error: any) {
      toast.error(error.message || "Gagal import data");
    } finally {
      e.target.value = "";
    }
  };

  const handleEditDaftarGrade = (data: DaftarGradeData) => {
    setEditingDaftarGrade(data);
    setDaftarGradeFormData(data);
    setDaftarGradeDialogOpen(true);
  };

  const resetPermohonanForm = () => {
    setPermohonanFormData({
      grading_id: "",
      nomor_kep: "",
      tanggal_kep: "",
      hal: "",
      nama_lengkap: "",
      nip: "",
      pangkat_gol_tmt: "",
      pendidikan: "",
      jabatan_lama: "",
      grade_lama: "",
      jabatan_baru: "",
      grade_baru: "",
      tmt_peringkat_terakhir: "",
      dari: "",
      ke: "",
    });
    setPermohonanSelectedEmployees([]);
    setSelectedLampiranTitle("");
  };

  const handleEditBigData = (data: GradingData) => {
    setEditingData(data);
    setFormData(data);
    setBigDataDialogOpen(true);
  };

  const handleEditPermohonan = (data: PermohonanData) => {
    setEditingPermohonan(data);
    setPermohonanFormData(data);
    setPermohonanDialogOpen(true);
  };

  // Auto-fill permohonan from Big Data
  const handleSelectPegawaiForPermohonan = (gradingId: string) => {
    if (gradingId === "none") {
      setPermohonanFormData(prev => ({
        ...prev,
        grading_id: "",
        nama_lengkap: "",
        nip: "",
        pendidikan: "",
        jabatan_lama: "",
        grade_lama: "",
        jabatan_baru: "",
        grade_baru: "",
        pangkat_gol_tmt: "",
        tmt_peringkat_terakhir: "",
      }));
      return;
    }

    const selectedGrading = gradingData.find(g => g.id === gradingId);
    if (selectedGrading) {
      // Get klaster from Big Data for auto-fill logic
      const klaster = determineKlaster(selectedGrading.jenis, selectedGrading.jabatan_baru || selectedGrading.jabatan);
      
      // Get current hal value for auto-fill dari/ke
      const currentHal = permohonanFormData.hal;
      let autoFromDari = permohonanFormData.dari;
      let autoToKe = permohonanFormData.ke;
      
      // Auto-fill dari/ke based on Hal selection
      if (currentHal === "Pertama" || currentHal === "Kembali") {
        autoFromDari = klaster || "";
      } else if (currentHal === "Simulasi") {
        autoFromDari = "PK";
        autoToKe = "PU";
      } else if (currentHal === "Sidang") {
        autoFromDari = klaster || "";
        autoToKe = klaster || "";
      }
      
      // Format pangkat_gol_tmt as "Pangkat / Gol / TMT" (e.g., "Pengatur Tk. I / II/d / 1 April 2023")
      const pangkatGolTmt = formatPangkatGolTmt(
        selectedGrading.pangkat || "",
        selectedGrading.pangkat_golongan || "",
        selectedGrading.tmt_pangkat || ""
      );
      
      setPermohonanFormData(prev => ({
        ...prev,
        grading_id: gradingId,
        nama_lengkap: selectedGrading.nama_lengkap,
        nip: selectedGrading.nip,
        pendidikan: selectedGrading.pendidikan,
        jabatan_lama: `${selectedGrading.jabatan}`,
        grade_lama: selectedGrading.grade,
        jabatan_baru: selectedGrading.jabatan_baru || "",
        grade_baru: selectedGrading.grade_baru || "",
        pangkat_gol_tmt: pangkatGolTmt,
        tmt_peringkat_terakhir: selectedGrading.tmt_terakhir || "",
        dari: autoFromDari,
        ke: autoToKe,
      }));
    }
  };
  
  // Handle Hal selection change - auto-fill Dari/Ke
  const handleHalChange = (hal: string) => {
    const selectedGrading = permohonanFormData.grading_id 
      ? gradingData.find(g => g.id === permohonanFormData.grading_id) 
      : null;
    const klaster = selectedGrading 
      ? determineKlaster(selectedGrading.jenis, selectedGrading.jabatan_baru || selectedGrading.jabatan) 
      : "";
    
    let autoFromDari = "";
    let autoToKe = "";
    
    if (hal === "Pertama" || hal === "Kembali") {
      autoFromDari = klaster || "";
    } else if (hal === "Simulasi") {
      autoFromDari = "PK";
      autoToKe = "PU";
    } else if (hal === "Sidang") {
      autoFromDari = klaster || "";
      autoToKe = klaster || "";
    }
    
    setPermohonanFormData(prev => ({
      ...prev,
      hal: hal,
      dari: autoFromDari,
      ke: autoToKe,
    }));
  };

  // Export Big Data to Excel
  const handleExportBigData = () => {
    const exportData = filteredGradingData.map((data, index) => {
      const nipAnalysis = analyzeGradePotential(data.nip);
      const analysisWithFlags = buildAnalisaNIPWithFlags(nipAnalysis, data);
      return {
        // Fields marked with (AUTO) are auto-generated by the system
        // Fields marked with (WAJIB) are required for manual input
        "No": index + 1,
        "Lampiran KEP (WAJIB)": data.lampiran_kep || "",
        "Nama Lengkap (WAJIB)": data.nama_lengkap,
        "NIP (WAJIB)": data.nip,
        "Analisa NIP (AUTO)": analysisWithFlags.status,
        "Pangkat (AUTO dari NIP)": data.pangkat || "",
        "Golongan (AUTO dari NIP)": extractGolonganFromCombined(data.pangkat_golongan) || data.pangkat_golongan || "",
        "TMT Pangkat": data.tmt_pangkat || "",
        "Pendidikan (WAJIB)": data.pendidikan || "",
        "Lokasi Pendidikan Terakhir": data.lokasi_pendidikan_terakhir || data.lokasi || "",
        "Jabatan Lama (WAJIB)": data.jabatan || "",
        "Grade Lama (WAJIB)": data.grade || "",
        "Akumulasi Masa Kerja": data.akumulasi_masa_kerja || "",
        "TMT Terakhir": data.tmt_terakhir || "",
        "Riwayat Tahun Lalu": data.riwayat_tahun_lalu || "",
        "Analisa Y-1 (AUTO)": (() => {
          const analisaY1 = analyzeY1Potential(data.riwayat_tahun_lalu, data.upkp, data.tugas_belajar);
          return analisaY1.status;
        })(),
        "Analisa Jabatan Baru (AUTO)": (() => {
          if (data.jenis === "PU") {
            const analysis = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan);
            return analysis.eligible ? `${analysis.jabatan} (Memenuhi)` : `${analysis.jabatan} (${analysis.reason || 'Tidak Memenuhi'})`;
          }
          return "-";
        })(),
        "Jabatan Baru (AUTO dari Rekomendasi)": data.jabatan_baru || "",
        "Grade Baru (AUTO dari Rekomendasi)": data.grade_baru || "",
        "Akumulasi Terakhir": data.akumulasi_terakhir || "",
        "TMT Peringkat Baru": data.tmt_peringkat_baru || "",
        "Eselon III (WAJIB untuk auto Atasan)": data.eselon_iii || "",
        "Eselon IV (WAJIB untuk auto Atasan)": data.eselon_iv || "",
        "PKT 2024 (WAJIB)": data.pkt_2024 || "",
        "PKT 2025 (WAJIB)": data.pkt_2025 || "",
        "Hukuman Disiplin": data.hukuman_disiplin ? "Ya" : "Tidak",
        "Tugas Belajar": data.tugas_belajar ? "Ya" : "Tidak",
        "UPKP": data.upkp ? "Ya" : "Tidak",
        "Kemampuan Kerja": data.kemampuan_kerja || "",
        "Jenis (WAJIB)": data.jenis || "",
        "Rekomendasi": data.rekomendasi || "",
        "Atasan Langsung (AUTO dari Eselon IV)": data.atasan_langsung_nama || "",
        "Atasan dari Atasan (AUTO dari Eselon III)": data.atasan_dari_atasan_nama || "",
        "Keputusan": data.keputusan || "",
      };
    });

    // Add header row with notes about AUTO vs WAJIB fields
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    
    // Add a note sheet explaining the field types
    const noteData = [
      { "Keterangan": "Petunjuk Pengisian Excel Big Data Grading" },
      { "Keterangan": "" },
      { "Keterangan": "(WAJIB) = Field yang harus diisi secara manual" },
      { "Keterangan": "(AUTO) = Field yang terisi otomatis oleh sistem" },
      { "Keterangan": "(AUTO dari NIP) = Terisi otomatis berdasarkan data NIP pegawai" },
      { "Keterangan": "(AUTO dari Rekomendasi) = Terisi otomatis saat memilih rekomendasi Naik/Tetap/Turun" },
      { "Keterangan": "(AUTO dari Eselon) = Terisi otomatis berdasarkan Eselon III/IV" },
      { "Keterangan": "" },
      { "Keterangan": "SYARAT JABATAN BARU PU:" },
      { "Keterangan": "- Penata Layanan Operasional: Pendidikan D4/S1 + Golongan min. III/a" },
      { "Keterangan": "- Pengolah Data dan Informasi: Pendidikan D3 + Golongan min. II/c" },
      { "Keterangan": "- Pengadministrasi Perkantoran: Pendidikan SLTA/D1 + Golongan min. II/a" },
    ];
    const noteWs = XLSX.utils.json_to_sheet(noteData);
    
    XLSX.utils.book_append_sheet(wb, noteWs, "Petunjuk");
    XLSX.utils.book_append_sheet(wb, ws, "Big Data Grading");
    XLSX.writeFile(wb, `Grading_Big_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor dengan petunjuk pengisian");
  };

  // Helper function to convert Excel serial date to ISO date string (YYYY-MM-DD)
  // Excel stores dates as number of days since 1899-12-30
  const excelSerialToDate = (serial: any): string | null => {
    if (!serial) return null;
    
    // If already a valid date string (YYYY-MM-DD or DD/MM/YYYY format), return as-is or convert
    if (typeof serial === "string") {
      // Check if it's already ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(serial)) {
        return serial;
      }
      // Check if DD/MM/YYYY or DD-MM-YYYY format
      const dmyMatch = serial.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmyMatch) {
        const [, day, month, year] = dmyMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Check if MM/DD/YYYY format (American)
      const mdyMatch = serial.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (mdyMatch) {
        // Assume DD/MM/YYYY for Indonesian context
        return null; // Already handled above
      }
      // If it's a number string, convert it
      if (/^\d+$/.test(serial)) {
        const numSerial = parseInt(serial);
        if (numSerial > 30000 && numSerial < 60000) {
          // Valid Excel date range (roughly 1982-2064)
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const resultDate = new Date(excelEpoch.getTime() + numSerial * 24 * 60 * 60 * 1000);
          return resultDate.toISOString().split('T')[0];
        }
      }
      return serial; // Return as-is if can't parse
    }
    
    // If it's a number (Excel serial date)
    if (typeof serial === "number") {
      // Check if valid Excel date range (roughly 1982-2064)
      if (serial > 30000 && serial < 60000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const resultDate = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
        return resultDate.toISOString().split('T')[0];
      }
      // If small number, might be year (e.g., 2024), return null
      return null;
    }
    
    return null;
  };

  // Helper function to find column value with flexible header matching
  // Handles headers like "Nama Lengkap (WAJIB)", "NIP (AUTO)", etc.
  const findColumnValue = (row: any, possibleHeaders: string[]): string => {
    for (const header of possibleHeaders) {
      // Exact match first
      if (row[header] !== undefined) return String(row[header] || "");
      
      // Match with suffix stripped (handle "(WAJIB)", "(AUTO)", "(AUTO dari NIP)", etc.)
      for (const key of Object.keys(row)) {
        const normalizedKey = key.replace(/\s*\([^)]*\)\s*/g, "").trim();
        if (normalizedKey.toLowerCase() === header.toLowerCase()) {
          return String(row[key] || "");
        }
      }
    }
    return "";
  };

  // Helper to find date column value (handles Excel serial dates)
  const findDateColumnValue = (row: any, possibleHeaders: string[]): string | null => {
    for (const header of possibleHeaders) {
      // Exact match first
      if (row[header] !== undefined) {
        return excelSerialToDate(row[header]);
      }
      
      // Match with suffix stripped
      for (const key of Object.keys(row)) {
        const normalizedKey = key.replace(/\s*\([^)]*\)\s*/g, "").trim();
        if (normalizedKey.toLowerCase() === header.toLowerCase()) {
          return excelSerialToDate(row[key]);
        }
      }
    }
    return null;
  };

  // Helper to find boolean column value
  const findBooleanColumnValue = (row: any, possibleHeaders: string[]): boolean => {
    const value = findColumnValue(row, possibleHeaders);
    return value === "Ya" || value === "true" || value === "TRUE" || value === "1";
  };

  // Import Big Data from Excel with auto-fill pangkat, atasan langsung, atasan dari atasan
  const handleImportBigData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Fix: Select correct sheet - prioritize "Big Data Grading" or skip "Petunjuk"
      let worksheetName = workbook.SheetNames[0];
      if (workbook.SheetNames.includes("Big Data Grading")) {
        worksheetName = "Big Data Grading";
      } else if (workbook.SheetNames[0] === "Petunjuk" && workbook.SheetNames.length > 1) {
        worksheetName = workbook.SheetNames[1];
      }
      
      const worksheet = workbook.Sheets[worksheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("Sheet tidak berisi data. Pastikan data ada di sheet 'Big Data Grading'");
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const insertData = jsonData.map((row: any) => {
        // Use flexible column mapping for all fields
        const nip = findColumnValue(row, ["NIP", "nip"]);
        const namaLengkap = findColumnValue(row, ["Nama Lengkap", "nama_lengkap"]);
        let eselonIII = findColumnValue(row, ["Eselon III", "eselon_iii"]);
        let eselonIV = findColumnValue(row, ["Eselon IV", "eselon_iv"]);
        const pendidikan = findColumnValue(row, ["Pendidikan", "pendidikan"]);
        
        // AUTO-FILL: Lookup eselon_iii, eselon_iv, atasan_langsung, atasan_dari_atasan from pegawai_atasan (Core Base) first
        let atasanLangsungFromPegawaiAtasan = "";
        let atasanDariAtasanFromPegawaiAtasan = "";
        
        if (nip && pegawaiAtasanData.length > 0) {
          const matchedPegawaiAtasan = pegawaiAtasanData.find(pa => pa.nip === nip);
          if (matchedPegawaiAtasan) {
            // Auto-fill eselon_iii from pegawai_atasan if not provided in Excel
            if (!eselonIII && matchedPegawaiAtasan.eselon_iii) {
              eselonIII = matchedPegawaiAtasan.eselon_iii;
            }
            // Auto-fill eselon_iv from pegawai_atasan if not provided in Excel
            if (!eselonIV && matchedPegawaiAtasan.eselon_iv) {
              eselonIV = matchedPegawaiAtasan.eselon_iv;
            }
            // Get atasan langsung and atasan dari atasan from pegawai_atasan
            if (matchedPegawaiAtasan.atasan_langsung) {
              atasanLangsungFromPegawaiAtasan = matchedPegawaiAtasan.atasan_langsung;
            }
            if (matchedPegawaiAtasan.atasan_dari_atasan) {
              atasanDariAtasanFromPegawaiAtasan = matchedPegawaiAtasan.atasan_dari_atasan;
            }
          }
        }
        
        // Fallback: Lookup eselon_iii and eselon_iv from employees table based on NIP if not found in pegawai_atasan
        if (nip && employeesDataFull.length > 0) {
          const matchedEmployee = employeesDataFull.find(emp => emp.nip === nip);
          if (matchedEmployee) {
            // Auto-fill eselon_iii from employees if not provided in Excel and not from pegawai_atasan
            if (!eselonIII && matchedEmployee.eselon_iii) {
              eselonIII = matchedEmployee.eselon_iii;
            }
            // Auto-fill eselon_iv from employees if not provided in Excel and not from pegawai_atasan
            if (!eselonIV && matchedEmployee.eselon_iv) {
              eselonIV = matchedEmployee.eselon_iv;
            }
          }
        }
        const jenis = findColumnValue(row, ["Jenis", "jenis"]);
        const rekomendasi = findColumnValue(row, ["Rekomendasi", "rekomendasi"]);
        const gradeLama = findColumnValue(row, ["Grade Lama", "Grade", "grade"]);
        const jabatanLama = findColumnValue(row, ["Jabatan Lama", "Jabatan", "jabatan"]);
        const pkt2024 = findColumnValue(row, ["PKT 2024", "pkt_2024"]);
        const pkt2025 = findColumnValue(row, ["PKT 2025", "pkt_2025"]);
        const akumulasiMasaKerja = findColumnValue(row, ["Akumulasi Masa Kerja", "akumulasi_masa_kerja"]);
        const riwayatTahunLalu = findColumnValue(row, ["Riwayat Tahun Lalu", "riwayat_tahun_lalu"]);
        const kemampuanKerja = findColumnValue(row, ["Kemampuan Kerja", "kemampuan_kerja"]);
        const lokasi = findColumnValue(row, ["Lokasi", "lokasi"]);
        const lokasiPendidikanTerakhir = findColumnValue(row, ["Lokasi Pendidikan Terakhir", "lokasi_pendidikan_terakhir"]);
        const akumulasiTerakhir = findColumnValue(row, ["Akumulasi Terakhir", "akumulasi_terakhir"]);
        
        // Date fields - use findDateColumnValue to handle Excel serial numbers
        const tmtTerakhir = findDateColumnValue(row, ["TMT Terakhir", "tmt_terakhir"]);
        const tmtPangkat = findDateColumnValue(row, ["TMT Pangkat", "tmt_pangkat"]);
        const tmtPeringkatBaru = findDateColumnValue(row, ["TMT Peringkat Baru", "tmt_peringkat_baru"]);
        
        // Boolean fields
        const hukumanDisiplin = findBooleanColumnValue(row, ["Hukuman Disiplin", "Hukuman", "hukuman_disiplin"]);
        const tugasBelajar = findBooleanColumnValue(row, ["Tugas Belajar", "tugas_belajar"]);
        const upkp = findBooleanColumnValue(row, ["UPKP", "upkp"]);
        
        // Auto-fill pangkat from employees data based on NIP
        let pangkatFromNip = findColumnValue(row, ["Pangkat", "pangkat"]);
        let pangkatGolonganFromNip = findColumnValue(row, ["Golongan", "Pangkat/Gol", "pangkat_golongan"]);
        
        if (nip && employeesDataFull.length > 0) {
          const matchedEmployee = employeesDataFull.find(emp => emp.nip === nip);
          if (matchedEmployee) {
            // Extract pangkat and golongan from uraian_pangkat (e.g., "Penata - Iii/C" -> pangkat="Penata", gol="III/C")
            if (matchedEmployee.uraian_pangkat) {
              const pangkatParts = matchedEmployee.uraian_pangkat.split(" - ");
              if (pangkatParts.length >= 2) {
                if (!pangkatFromNip) pangkatFromNip = pangkatParts[0].trim();
                if (!pangkatGolonganFromNip) pangkatGolonganFromNip = pangkatParts[1].trim().toUpperCase();
              }
            }
          }
        }
        
        // Auto-fill Atasan Langsung - prioritize pegawai_atasan (Core Base), fallback to employees lookup
        let atasanLangsungNama = findColumnValue(row, ["Atasan Langsung", "atasan_langsung_nama"]);
        if (!atasanLangsungNama && atasanLangsungFromPegawaiAtasan) {
          atasanLangsungNama = atasanLangsungFromPegawaiAtasan;
        }
        if (!atasanLangsungNama && (eselonIV || eselonIII) && employeesDataFull.length > 0) {
          const foundAtasan = findAtasanLangsung(eselonIV, eselonIII, employeesDataFull);
          if (foundAtasan) {
            atasanLangsungNama = foundAtasan.nm_pegawai;
          }
        }
        
        // Auto-fill Atasan dari Atasan - prioritize pegawai_atasan (Core Base), fallback to employees lookup
        let atasanDariAtasanNama = findColumnValue(row, ["Atasan dari Atasan", "atasan_dari_atasan_nama"]);
        if (!atasanDariAtasanNama && atasanDariAtasanFromPegawaiAtasan) {
          atasanDariAtasanNama = atasanDariAtasanFromPegawaiAtasan;
        }
        if (!atasanDariAtasanNama && eselonIII && employeesDataFull.length > 0) {
          const foundAtasan = findAtasanDariAtasan(eselonIII, employeesDataFull);
          if (foundAtasan) {
            atasanDariAtasanNama = foundAtasan.nm_pegawai;
          }
        }
        
        // Auto-calculate Grade Baru from Grade Lama + Rekomendasi
        let gradeBaru = findColumnValue(row, ["Grade Baru", "grade_baru"]);
        if (!gradeBaru && gradeLama && rekomendasi) {
          gradeBaru = calculateGradeBaru(gradeLama, rekomendasi);
        }
        
        // Auto-calculate Jabatan Baru based on Jenis, Grade Baru, Pendidikan, Golongan
        let jabatanBaru = findColumnValue(row, ["Jabatan Baru", "jabatan_baru"]);
        if (!jabatanBaru && jenis && gradeBaru) {
          const gradeBaruNum = parseInt(gradeBaru);
          if (jenis === "PU" && !isNaN(gradeBaruNum)) {
            // For PU, determine jabatan family based on pendidikan and golongan
            const jabatanAnalysis = analyzeJabatanBaruWithGolongan(pendidikan || null, pangkatGolonganFromNip || null);
            if (jabatanAnalysis.eligible) {
              jabatanBaru = getJabatanWithTingkat(jabatanAnalysis.jabatan, gradeBaruNum);
            } else {
              // If not eligible, still try to assign based on pendidikan alone
              jabatanBaru = getJabatanWithTingkat(jabatanAnalysis.jabatan, gradeBaruNum);
            }
          } else if (jenis === "PTB" && !isNaN(gradeBaruNum)) {
            jabatanBaru = getPTBJabatan(gradeBaruNum, daftarGradeData);
          } else if (jenis === "PK" && !isNaN(gradeBaruNum)) {
            jabatanBaru = getPKJabatan(gradeBaruNum, daftarGradeData);
          }
        }
        
        // Auto-calculate Lampiran KEP based on jenis, rekomendasi, pkt, flags
        let lampiranKep = findColumnValue(row, ["Lampiran KEP", "lampiran_kep"]);
        if (!lampiranKep && jenis) {
          lampiranKep = calculateLampiranKep(jenis, rekomendasi, pkt2024, pkt2025, tugasBelajar, upkp);
        }
        
        return {
          nama_lengkap: namaLengkap,
          nip: nip,
          lampiran_kep: lampiranKep,
          pangkat: pangkatFromNip,
          pangkat_golongan: normalizeGolongan(pangkatGolonganFromNip),
          tmt_pangkat: tmtPangkat || null,
          pendidikan: pendidikan,
          lokasi: lokasi,
          lokasi_pendidikan_terakhir: lokasiPendidikanTerakhir,
          jabatan: jabatanLama,
          grade: gradeLama,
          akumulasi_masa_kerja: akumulasiMasaKerja,
          tmt_terakhir: tmtTerakhir || null,
          riwayat_tahun_lalu: riwayatTahunLalu,
          jabatan_baru: jabatanBaru,
          grade_baru: gradeBaru,
          akumulasi_terakhir: akumulasiTerakhir,
          tmt_peringkat_baru: tmtPeringkatBaru || null,
          eselon_iii: eselonIII,
          eselon_iv: eselonIV,
          pkt_2024: pkt2024,
          pkt_2025: pkt2025,
          hukuman_disiplin: hukumanDisiplin,
          tugas_belajar: tugasBelajar,
          upkp: upkp,
          kemampuan_kerja: kemampuanKerja,
          jenis: jenis,
          rekomendasi: rekomendasi,
          atasan_langsung_nama: atasanLangsungNama,
          atasan_dari_atasan_nama: atasanDariAtasanNama,
          created_by_email: userEmail,
        };
      }).filter(item => item.nama_lengkap && item.nip);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor. Pastikan kolom 'Nama Lengkap' dan 'NIP' terisi.");
        return;
      }

      const { error } = await supabase.from("grading_big_data").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor (field AUTO otomatis terisi)`);
      fetchGradingData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengimpor data");
    }

    e.target.value = "";
  };

  // Export Permohonan to Excel - enriched with Big Data fields
  const handleExportPermohonan = () => {
    const exportData = filteredPermohonanData.map((data, index) => {
      // Find matching big data record via grading_id
      const bigData = data.grading_id ? gradingData.find(g => g.id === data.grading_id) : null;

      return {
        "No": data.no_urut || index + 1,
        "Lampiran KEP": bigData?.lampiran_kep || "",
        "Nama/NIP": `${data.nama_lengkap}/ ${data.nip || ""}`,
        "Golongan": bigData?.pangkat_golongan || extractGolonganFromCombined(data.pangkat_gol_tmt || "") || "",
        "TMT Pangkat": bigData?.tmt_pangkat || "",
        "Pendidikan": data.pendidikan || bigData?.pendidikan || "",
        "Jabatan Lama": data.jabatan_lama || bigData?.jabatan || "",
        "Peringkat Lama": data.grade_lama || bigData?.grade || "",
        "Akumulasi Masa Kerja": bigData?.akumulasi_masa_kerja || "",
        "TMT Peringkat Terakhir": data.tmt_peringkat_terakhir || bigData?.tmt_terakhir || "",
        "Jabatan Baru": data.jabatan_baru || bigData?.jabatan_baru || "",
        "Predikat I": bigData?.pkt_2024 || "",
        "Akumulasi Masa Kerja Terakhir": bigData?.akumulasi_terakhir || "",
        "Predikat II": bigData?.pkt_2025 || "",
        "Kemampuan Kerja": bigData?.kemampuan_kerja || "",
        "TMT Peringkat Baru": bigData?.tmt_peringkat_baru || "",
        "Eselon III": bigData?.eselon_iii || "",
        "Eselon IV": bigData?.eselon_iv || "",
        "Atasan Langsung": bigData?.atasan_langsung_nama || "",
        "Atasan dari Atasan Langsung": bigData?.atasan_dari_atasan_nama || "",
        "Dari": data.dari || "",
        "Ke": data.ke || "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Permohonan Grading");
    XLSX.writeFile(wb, `Permohonan_Grading_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Export Lampiran Word from Big Data
  const handleExportLampiranWord = async () => {
    try {
      // Fetch eselonisasi data for sorting
      const { data: eselonData } = await supabase
        .from("eselonisasi")
        .select("*")
        .order("no_urut", { ascending: true });

      // Build enriched items from permohonan + big data
      const items = filteredPermohonanData.map(data => {
        const bigData = data.grading_id ? gradingData.find(g => g.id === data.grading_id) : null;
        // Format pangkat_gol_tmt as "Pangkat / Gol / TMT" (e.g., "Pengatur Tk. I / II/d / 1 April 2023")
        const pangkatGolTmt = bigData 
          ? formatPangkatGolTmt(
              bigData.pangkat || "",
              bigData.pangkat_golongan || "",
              bigData.tmt_pangkat || ""
            )
          : data.pangkat_gol_tmt || "";
        
        return {
          nama_lengkap: data.nama_lengkap,
          nip: data.nip || "",
          pangkat_gol_tmt: pangkatGolTmt,
          pendidikan: data.pendidikan || bigData?.pendidikan || "",
          jabatan_lama: data.jabatan_lama || bigData?.jabatan || "",
          grade_lama: data.grade_lama || bigData?.grade || "",
          akumulasi_masa_kerja: bigData?.akumulasi_masa_kerja || "",
          tmt_peringkat_terakhir: data.tmt_peringkat_terakhir || bigData?.tmt_terakhir || "",
          jabatan_baru: data.jabatan_baru || bigData?.jabatan_baru || "",
          grade_baru: data.grade_baru || bigData?.grade_baru || "",
          tmt_peringkat_baru: bigData?.tmt_peringkat_baru || "",
          pkt_2025: bigData?.pkt_2025 || "",
          eselon_iii: bigData?.eselon_iii || "",
          eselon_iv: bigData?.eselon_iv || "",
        };
      });

      // Use first permohonan's nomor_kep as default ND number
      const nomorND = filteredPermohonanData[0]?.nomor_kep || "ND-XX/KBC.1101/2026";
      const tanggalND = filteredPermohonanData[0]?.tanggal_kep || new Date().toISOString().split('T')[0];
      // Use selected lampiran title or default
      const title = selectedLampiranTitle || "PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL";

      await generateLampiranPermohonanWordFromBigData(
        items,
        eselonData || [],
        nomorND,
        tanggalND,
        title
      );
      toast.success("Lampiran Word berhasil di-generate");
    } catch (error: any) {
      toast.error(error.message || "Gagal generate lampiran Word");
    }
  };

  const handleImportPermohonan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Get max no_urut
      const { data: maxData } = await supabase
        .from("permohonan_grading")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);
      
      let nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut) 
        ? maxData[0].no_urut + 1 
        : 1;

      const insertData = jsonData.map((row: any) => {
        const item = {
          no_urut: nextNoUrut++,
          nomor_kep: row["Nomor KEP"] || row["nomor_kep"] || "",
          tanggal_kep: row["Tanggal KEP"] || row["tanggal_kep"] || null,
          hal: row["Hal"] || row["hal"] || "",
          nama_lengkap: row["Nama Lengkap"] || row["nama_lengkap"] || "",
          nip: String(row["NIP"] || row["nip"] || ""),
          pangkat_gol_tmt: row["Pangkat/Gol/TMT"] || row["pangkat_gol_tmt"] || "",
          pendidikan: row["Pendidikan"] || row["pendidikan"] || "",
          jabatan_lama: row["Jabatan Lama"] || row["jabatan_lama"] || "",
          grade_lama: row["Grade Lama"] || row["grade_lama"] || "",
          jabatan_baru: row["Jabatan Baru"] || row["jabatan_baru"] || "",
          grade_baru: row["Grade Baru"] || row["grade_baru"] || "",
          tmt_peringkat_terakhir: row["TMT Peringkat Terakhir"] || row["tmt_peringkat_terakhir"] || null,
          dari: row["Dari"] || row["dari"] || "",
          ke: row["Ke"] || row["ke"] || "",
          created_by_email: userEmail,
        };
        return item;
      }).filter(item => item.nomor_kep && item.nama_lengkap);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      const { error } = await supabase.from("permohonan_grading").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor`);
      fetchPermohonanData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengimpor data");
    }

    e.target.value = "";
  };

  // Export KEP & Salinan to Excel
  const handleExportKepSalinan = () => {
    const filteredData = kepSalinanData.filter(d => 
      !searchTerm || 
      d.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nip && d.nip.includes(searchTerm))
    );
    
    const exportData = filteredData.map((data, index) => ({
      "No": index + 1,
      "Nama Lengkap": data.nama_lengkap,
      "NIP": data.nip,
      "Nomor KEP": data.nomor_kep,
      "Tanggal KEP": data.tanggal_kep,
      "Jenis Dokumen": data.jenis_dokumen,
      "Keterangan": data.keterangan,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KEP Salinan");
    XLSX.writeFile(wb, `KEP_Salinan_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Import KEP & Salinan from Excel
  const handleImportKepSalinan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const insertData = jsonData.map((row: any) => ({
        nama_lengkap: row["Nama Lengkap"] || row["nama_lengkap"] || "",
        nip: String(row["NIP"] || row["nip"] || ""),
        nomor_kep: row["Nomor KEP"] || row["nomor_kep"] || "",
        tanggal_kep: row["Tanggal KEP"] || row["tanggal_kep"] || null,
        jenis_dokumen: row["Jenis Dokumen"] || row["jenis_dokumen"] || "",
        keterangan: row["Keterangan"] || row["keterangan"] || "",
        created_by_email: userEmail,
      })).filter((item: any) => item.nama_lengkap && item.nomor_kep);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      const { error } = await supabase.from("grading_kep_salinan").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor`);
      fetchKepSalinanData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengimpor data");
    }

    e.target.value = "";
  };

  // Export Petikan to Excel
  const handleExportPetikan = () => {
    const filteredData = petikanData.filter(d => 
      !searchTerm || 
      d.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nip && d.nip.includes(searchTerm))
    );
    
    const exportData = filteredData.map((data, index) => ({
      "No": index + 1,
      "Nama Lengkap": data.nama_lengkap,
      "NIP": data.nip,
      "Nomor Petikan": data.nomor_petikan,
      "Tanggal Petikan": data.tanggal_petikan,
      "Keterangan": data.keterangan,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Petikan");
    XLSX.writeFile(wb, `Petikan_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Import Petikan from Excel
  const handleImportPetikan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      const insertData = jsonData.map((row: any) => ({
        nama_lengkap: row["Nama Lengkap"] || row["nama_lengkap"] || "",
        nip: String(row["NIP"] || row["nip"] || ""),
        nomor_petikan: row["Nomor Petikan"] || row["nomor_petikan"] || "",
        tanggal_petikan: row["Tanggal Petikan"] || row["tanggal_petikan"] || null,
        keterangan: row["Keterangan"] || row["keterangan"] || "",
        created_by_email: userEmail,
      })).filter((item: any) => item.nama_lengkap && item.nomor_petikan);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      const { error } = await supabase.from("grading_petikan").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor`);
      fetchPetikanData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengimpor data");
    }

    e.target.value = "";
  };

  // Export Daftar Grade to Excel
  const handleExportDaftarGrade = () => {
    const filteredData = daftarGradeData.filter(d => 
      !searchTerm || 
      d.klaster.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const exportData = filteredData.map((data, index) => ({
      "No": data.no_urut || index + 1,
      "Klaster": data.klaster,
      "Grade": data.grade,
      "Jabatan": data.jabatan,
      "Tugas Jabatan": data.tugas_jabatan || "",
      "Syarat Pendidikan": data.syarat_pendidikan || "",
      "Syarat Golongan": data.syarat_golongan || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Grade");
    XLSX.writeFile(wb, `Daftar_Grade_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Import Daftar Grade from Excel
  const handleImportDaftarGrade = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Get max no_urut
      const { data: maxData } = await supabase
        .from("daftar_grade")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);
      
      let nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut) 
        ? maxData[0].no_urut + 1 
        : 1;

      const insertData = jsonData.map((row: any) => ({
        no_urut: nextNoUrut++,
        klaster: row["Klaster"] || row["klaster"] || "",
        grade: parseInt(row["Grade"] || row["grade"]) || 0,
        jabatan: row["Jabatan"] || row["jabatan"] || "",
        tugas_jabatan: row["Tugas Jabatan"] || row["tugas_jabatan"] || null,
        syarat_pendidikan: row["Syarat Pendidikan"] || row["syarat_pendidikan"] || null,
        syarat_golongan: row["Syarat Golongan"] || row["syarat_golongan"] || null,
        created_by_email: userEmail,
      })).filter((item: any) => item.klaster && item.jabatan && item.grade > 0);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      const { error } = await supabase.from("daftar_grade").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor`);
      fetchDaftarGradeData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengimpor data");
    }

    e.target.value = "";
  };

  // Filter data
  const filteredGradingData = gradingData.filter(data => {
    if (searchTerm && !data.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !data.nip.includes(searchTerm)) return false;
    if (filterLokasi && (data.lokasi_pendidikan_terakhir || data.lokasi) !== filterLokasi) return false;
    if (filterEselonIII && data.eselon_iii !== filterEselonIII) return false;
    
    // Big Data specific filters
    if (filterBigDataGolongan && data.pangkat_golongan !== filterBigDataGolongan) return false;
    if (filterBigDataPangkat && !data.pangkat?.toLowerCase().includes(filterBigDataPangkat.toLowerCase())) return false;
    if (filterBigDataPendidikan && data.pendidikan !== filterBigDataPendidikan) return false;
    if (filterBigDataGradeLama && data.grade !== filterBigDataGradeLama) return false;
    if (filterBigDataKlaster) {
      const dataKlaster = determineKlaster(data.jenis, data.jabatan_baru || data.jabatan);
      if (dataKlaster !== filterBigDataKlaster) return false;
    }
    
    // Maks Gol filter (color and value)
    const gradeLama = parseInt(data.grade) || 0;
    const maxGradeGol = getMaxGradeFromGolongan(data.pangkat_golongan, puSyaratGeneralData);
    const maxGradePend = getMaxGradeFromPendidikan(data.pendidikan, puSyaratGeneralData);
    const isGolonganValid = gradeLama <= maxGradeGol;
    const isPendidikanValid = gradeLama <= maxGradePend;
    
    if (filterBigDataMaksGol !== "all") {
      if (filterBigDataMaksGol === "valid" && !isGolonganValid) return false;
      if (filterBigDataMaksGol === "invalid" && isGolonganValid) return false;
    }
    if (filterBigDataMaksGolValue && maxGradeGol.toString() !== filterBigDataMaksGolValue) return false;
    
    // Maks Pend filter (color and value)
    if (filterBigDataMaksPend !== "all") {
      if (filterBigDataMaksPend === "valid" && !isPendidikanValid) return false;
      if (filterBigDataMaksPend === "invalid" && isPendidikanValid) return false;
    }
    if (filterBigDataMaksPendValue && maxGradePend.toString() !== filterBigDataMaksPendValue) return false;
    
    // QC filter
    if (filterQC !== "all") {
      const qcResult = validateGradeQC(data, daftarGradeData, puSyaratGeneralData);
      if (filterQC === "valid" && !qcResult.isValid) return false;
      if (filterQC === "invalid" && qcResult.isValid) return false;
    }
    
    // Single Core filters
    if (filterKlaster) {
      const dataKlaster = determineKlaster(data.jenis, data.jabatan_baru || data.jabatan);
      if (dataKlaster !== filterKlaster) return false;
    }
    if (filterKeputusan && data.keputusan !== filterKeputusan) return false;
    if (filterGradeBaru && (data.grade_baru || data.grade) !== filterGradeBaru) return false;
    if (filterJabatanBaru) {
      const jabatan = (data.jabatan_baru || data.jabatan || "").toLowerCase();
      if (!jabatan.includes(filterJabatanBaru.toLowerCase())) return false;
    }
    if (filterAnalisaNIP) {
      const nipAnalysis = analyzeGradePotential(data.nip);
      const analysisWithFlags = buildAnalisaNIPWithFlags(nipAnalysis, data);
      if (!analysisWithFlags.status.includes(filterAnalisaNIP)) return false;
    }
    // Filter Analisis Gol/Pend in Single Core
    if (filterAnalisisGolPend) {
      const golPendAnalysis = analyzeGolPendidikanPotential(gradeLama, maxGradeGol, maxGradePend);
      if (golPendAnalysis.status !== filterAnalisisGolPend) return false;
    }
    // Filter Analisa Y-1
    if (filterAnalisaY1) {
      const analisaY1 = analyzeY1Potential(data.riwayat_tahun_lalu, data.upkp, data.tugas_belajar);
      if (analisaY1.status !== filterAnalisaY1) return false;
    }
    // Filter Analisa Jabatan Baru (PU only)
    if (filterAnalisaJabatanBaru && data.jenis === "PU") {
      const analisaJabatan = analyzeJabatanBaru(data.pendidikan);
      if (!analisaJabatan.jabatan.includes(filterAnalisaJabatanBaru)) return false;
    }
    // Filter Isi Kuesioner - only show employees with rekomendasi "Naik" and matching jenis
    if (filterIsiKuesioner) {
      if (filterIsiKuesioner === "kosong") {
        // Show those without jenis or rekomendasi is not "Naik"
        if (data.jenis && data.rekomendasi === "Naik") return false;
      } else {
        // Show those with matching jenis AND rekomendasi is "Naik"
        if (data.jenis !== filterIsiKuesioner || data.rekomendasi !== "Naik") return false;
      }
    }
    return true;
  });

  const filteredPermohonanData = permohonanData.filter(data => {
    if (permohonanSearchTerm && 
        !data.nama_lengkap.toLowerCase().includes(permohonanSearchTerm.toLowerCase()) && 
        !(data.nip && data.nip.includes(permohonanSearchTerm)) &&
        !data.nomor_kep.toLowerCase().includes(permohonanSearchTerm.toLowerCase())) return false;
    if (filterPermohonanNoKep && data.nomor_kep !== filterPermohonanNoKep) return false;
    if (filterPermohonanGradeBaru && data.grade_baru !== filterPermohonanGradeBaru) return false;
    if (filterPermohonanJabatanBaru && !data.jabatan_baru?.toLowerCase().includes(filterPermohonanJabatanBaru.toLowerCase())) return false;
    if (filterPermohonanDari && data.dari !== filterPermohonanDari) return false;
    if (filterPermohonanKe && data.ke !== filterPermohonanKe) return false;
    return true;
  });

  // Group permohonan data by nomor_kep
  const permohonanGroupedByKep = filteredPermohonanData.reduce((acc, data) => {
    const key = data.nomor_kep || "no_kep";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(data);
    return acc;
  }, {} as Record<string, typeof filteredPermohonanData>);

  // Get unique values for permohonan filters
  const uniquePermohonanNoKep = [...new Set(permohonanData.map(d => d.nomor_kep).filter(Boolean))];
  const uniquePermohonanGradeBaru = [...new Set(permohonanData.map(d => d.grade_baru).filter(Boolean))].sort((a, b) => parseInt(a || "0") - parseInt(b || "0"));
  const uniquePermohonanDari = [...new Set(permohonanData.map(d => d.dari).filter(Boolean))];
  const uniquePermohonanKe = [...new Set(permohonanData.map(d => d.ke).filter(Boolean))];

  // Toggle expanded state for KEP group
  const toggleKepGroup = (kepNo: string) => {
    setExpandedKepGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kepNo)) {
        newSet.delete(kepNo);
      } else {
        newSet.add(kepNo);
      }
      return newSet;
    });
  };

  // Get unique values for filters
  const uniqueLocations = [...new Set(gradingData.map(d => d.lokasi_pendidikan_terakhir || d.lokasi).filter(Boolean))];
  const uniqueEselonIII = [...new Set(gradingData.map(d => d.eselon_iii).filter(Boolean))];
  const uniqueGolongan = [...new Set(gradingData.map(d => d.pangkat_golongan).filter(Boolean))].sort();
  const uniquePangkat = [...new Set(gradingData.map(d => d.pangkat).filter(Boolean))];
  const uniquePendidikanBigData = [...new Set(gradingData.map(d => d.pendidikan).filter(Boolean))];
  const uniqueGradeLama = [...new Set(gradingData.map(d => d.grade).filter(Boolean))].sort((a, b) => parseInt(a) - parseInt(b));
  const uniqueKlasterBigData = ["PU", "PK", "PTB", "Pelaksana Tertentu"];

  // Calculate statistics for dashboard
  const totalPegawai = gradingData.length;
  const potensiPKP = gradingData.filter(d => 
    (d.pkt_2024 === "Sangat Baik" || d.pkt_2024 === "Baik") &&
    (d.pkt_2025 === "Sangat Baik" || d.pkt_2025 === "Baik")
  ).length;
  const tidakPotensiPKP = gradingData.filter(d =>
    (d.pkt_2024 && !["Sangat Baik", "Baik"].includes(d.pkt_2024)) ||
    (d.pkt_2025 && !["Sangat Baik", "Baik"].includes(d.pkt_2025))
  ).length;
  const hukumanDisiplin = gradingData.filter(d => d.hukuman_disiplin).length;
  const tugasBelajar = gradingData.filter(d => d.tugas_belajar).length;
  const totalKep = kepSalinanData.length;
  const totalPetikan = petikanData.length;
  const totalPermohonan = permohonanData.length;

  // PKP Analysis helper
  const getPKPStatus = (data: GradingData) => {
    const pkt2024Good = data.pkt_2024 === "Sangat Baik" || data.pkt_2024 === "Baik";
    const pkt2025Good = data.pkt_2025 === "Sangat Baik" || data.pkt_2025 === "Baik";
    
    if (pkt2024Good && pkt2025Good) {
      return { status: "Potensi PKP", color: "bg-green-500 text-white" };
    } else if (data.pkt_2024 || data.pkt_2025) {
      return { status: "Tidak Potensi PKP", color: "bg-red-500 text-white" };
    }
    return { status: "Belum Ada Data", color: "bg-gray-400 text-white" };
  };

  if (authLoading || subMenuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header - Same style as Surat Tugas */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold">Grading</h1>
                <p className="text-sm text-blue-100">Kanwil DJBC Jawa Timur I</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Panel Admin
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setVoicebotOpen(true)}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Mic className="h-4 w-4" />
                Buka Voicebot
              </Button>
              <NotificationBell />
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Home className="h-5 w-5" />
                Beranda
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={signOut}
                className="text-white hover:bg-white/20"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* AI Search Bar */}
          <div className="mt-4">
            <AISearchBar placeholder="Cari dengan AI di seluruh database..." />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex min-w-full">
              {hasSubMenuAccess("grading:dashboard") && (
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:big-data") && (
                <TabsTrigger value="big-data">Big Data</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:single-core") && (
                <TabsTrigger value="single-core">Single Core</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:daftar-grade") && (
                <TabsTrigger value="daftar-grade">Daftar Grade</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:tabel-408") && (
                <TabsTrigger value="tabel-408" className="whitespace-nowrap">Tabel 408</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:mekanisme-54") && (
                <TabsTrigger value="mekanisme-54" className="whitespace-nowrap">Mekanisme 54</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:permohonan") && (
                <TabsTrigger value="permohonan">Permohonan</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:kelengkapan-simulasi") && (
                <TabsTrigger value="kelengkapan-simulasi" className="whitespace-nowrap">Simulasi</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:kuesioner") && (
                <TabsTrigger value="kuesioner">Kuesioner</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:hasil-evaluasi") && (
                <TabsTrigger value="hasil-evaluasi" className="whitespace-nowrap">Hasil Evaluasi</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:berita-acara") && (
                <TabsTrigger value="berita-acara" className="whitespace-nowrap">Berita Acara</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:sk-penetapan") && (
                <TabsTrigger value="sk-penetapan">SK Penetapan</TabsTrigger>
              )}
              {hasSubMenuAccess("grading:monev") && (
                <TabsTrigger value="monev">Monev</TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <GradingDashboard
              gradingData={gradingData}
              kepSalinanData={kepSalinanData}
              petikanData={petikanData}
              permohonanData={permohonanData}
              isAdmin={isAdmin}
            />
          </TabsContent>

          {/* Big Data Tab */}
          <TabsContent value="big-data" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau NIP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={filterLokasi || "all"} onValueChange={(val) => setFilterLokasi(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Lokasi</SelectItem>
                      {uniqueLocations.map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterEselonIII || "all"} onValueChange={(val) => setFilterEselonIII(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Eselon III" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Eselon III</SelectItem>
                      {uniqueEselonIII.map(es => (
                        <SelectItem key={es} value={es}>{es}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataGolongan || "all"} onValueChange={(val) => setFilterBigDataGolongan(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Golongan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Gol</SelectItem>
                      {uniqueGolongan.map(gol => (
                        <SelectItem key={gol} value={gol}>{gol}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataPangkat || "all"} onValueChange={(val) => setFilterBigDataPangkat(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Pangkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pangkat</SelectItem>
                      {uniquePangkat.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataPendidikan || "all"} onValueChange={(val) => setFilterBigDataPendidikan(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Pendidikan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Didik</SelectItem>
                      {uniquePendidikanBigData.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataGradeLama || "all"} onValueChange={(val) => setFilterBigDataGradeLama(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Grade</SelectItem>
                      {uniqueGradeLama.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataKlaster || "all"} onValueChange={(val) => setFilterBigDataKlaster(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Klaster" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Klaster</SelectItem>
                      {uniqueKlasterBigData.map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataMaksGol} onValueChange={(val) => setFilterBigDataMaksGol(val as "all" | "valid" | "invalid")}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Maks Gol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Maks Gol</SelectItem>
                      <SelectItem value="valid">✓ Hijau (Valid)</SelectItem>
                      <SelectItem value="invalid">✗ Merah (Invalid)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataMaksGolValue || "all"} onValueChange={(val) => setFilterBigDataMaksGolValue(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Max Gol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {[6, 7, 8, 9, 10, 11, 12].map(v => (
                        <SelectItem key={v} value={v.toString()}>({v})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataMaksPend} onValueChange={(val) => setFilterBigDataMaksPend(val as "all" | "valid" | "invalid")}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Maks Pend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Maks Pend</SelectItem>
                      <SelectItem value="valid">✓ Hijau (Valid)</SelectItem>
                      <SelectItem value="invalid">✗ Merah (Invalid)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBigDataMaksPendValue || "all"} onValueChange={(val) => setFilterBigDataMaksPendValue(val === "all" ? "" : val)}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Max Pend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      {[6, 8, 10, 12].map(v => (
                        <SelectItem key={v} value={v.toString()}>({v})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterQC} onValueChange={(val) => setFilterQC(val as "all" | "valid" | "invalid")}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="QC" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua QC</SelectItem>
                      <SelectItem value="valid">✓ Valid</SelectItem>
                      <SelectItem value="invalid">✗ Invalid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllBigDataOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Semua
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleExportBigData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  {isAdmin && (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportBigData}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Excel
                      </Button>
                    </div>
                  )}
                  {isAdmin && (
                    <Button variant="outline" onClick={handleSyncAtasan} title="Sinkronkan data Atasan Langsung & Atasan dari Atasan dari Corebase Pegawai & Atasan">
                      <Users className="h-4 w-4 mr-2" />
                      Sync Atasan
                    </Button>
                  )}
                  {isAdmin && (
                    <Button onClick={() => { resetForm(); setEditingData(null); setBigDataDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Data
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic text-right mt-2 w-full">
                  *Dibawah 2014/2015 dilakukan pengampuan apabila telah ditetapkan = skema Peraturan Lama
                </p>
              </div>
            </Card>

            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Lampiran KEP</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Pangkat</TableHead>
                    <TableHead>Golongan</TableHead>
                    <TableHead>Maks Gol</TableHead>
                    <TableHead>TMT Pangkat</TableHead>
                    <TableHead>Pendidikan</TableHead>
                    <TableHead>Maks Pend</TableHead>
                    <TableHead>Lokasi Pendidikan Terakhir</TableHead>
                    <TableHead>Jabatan Lama</TableHead>
                    <TableHead>Grade Lama</TableHead>
                    <TableHead>Klaster</TableHead>
                    <TableHead>QC</TableHead>
                    <TableHead>Akumulasi Masa Kerja</TableHead>
                    <TableHead>TMT Terakhir</TableHead>
                    <TableHead>Riwayat Tahun Lalu</TableHead>
                    <TableHead>Jabatan Baru</TableHead>
                    <TableHead>Grade Baru</TableHead>
                    <TableHead>Akumulasi Terakhir</TableHead>
                    <TableHead>TMT Peringkat Baru</TableHead>
                    <TableHead>Eselon III</TableHead>
                    <TableHead>Eselon IV</TableHead>
                    <TableHead>PKT 2024</TableHead>
                    <TableHead>PKT 2025</TableHead>
                    <TableHead>Huk. Disiplin</TableHead>
                    <TableHead>Tugas Belajar</TableHead>
                    <TableHead>UPKP</TableHead>
                    <TableHead>Kemampuan Kerja</TableHead>
                    <TableHead>Atasan Langsung</TableHead>
                    <TableHead>Atasan dari Atasan</TableHead>
                     {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={35} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredGradingData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={35} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGradingData.map((data, index) => {
                      const klaster = determineKlaster(data.jenis, data.jabatan_baru || data.jabatan);
                      const qcResult = validateGradeQC(data, daftarGradeData, puSyaratGeneralData);
                      const gradeLama = parseInt(data.grade) || 0;
                      const maxGradeGol = getMaxGradeFromGolongan(data.pangkat_golongan, puSyaratGeneralData);
                      const maxGradePend = getMaxGradeFromPendidikan(data.pendidikan, puSyaratGeneralData);
                      const isGolonganValid = gradeLama <= maxGradeGol;
                      const isPendidikanValid = gradeLama <= maxGradePend;
                      
                      return (
                        <TableRow key={data.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{data.lampiran_kep || "-"}</TableCell>
                          <TableCell className="font-medium">{data.nama_lengkap}</TableCell>
                          <TableCell>{data.nip}</TableCell>
                          <TableCell>{data.pangkat || "-"}</TableCell>
                          <TableCell>{data.pangkat_golongan}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${isGolonganValid ? "text-green-600" : "text-red-600"}`}>
                              ({maxGradeGol})
                            </span>
                          </TableCell>
                          <TableCell>{data.tmt_pangkat || "-"}</TableCell>
                          <TableCell>{data.pendidikan}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${isPendidikanValid ? "text-green-600" : "text-red-600"}`}>
                              ({maxGradePend})
                            </span>
                          </TableCell>
                          <TableCell>{data.lokasi_pendidikan_terakhir || data.lokasi}</TableCell>
                          <TableCell>{data.jabatan}</TableCell>
                          <TableCell>{data.grade}</TableCell>
                          <TableCell>
                            {klaster ? (
                              <Badge className={
                                klaster === "PTB" ? "bg-orange-500 hover:bg-orange-600 text-white" : 
                                klaster === "PU" ? "bg-green-500 hover:bg-green-600 text-white" : 
                                klaster === "PK" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
                              }>
                                {klaster}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center gap-1" title={qcResult.reason}>
                              {qcResult.isValid ? (
                                <Check className="h-5 w-5 text-green-500" />
                              ) : (
                                <span className="text-red-500 font-bold text-lg">✗</span>
                              )}
                              <span className="text-xs text-muted-foreground text-center max-w-24 truncate" title={qcResult.reason}>
                                {qcResult.reason}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{data.akumulasi_masa_kerja || "-"}</TableCell>
                          <TableCell>{data.tmt_terakhir}</TableCell>
                          <TableCell>
                            {data.riwayat_tahun_lalu ? (
                              <Badge variant={
                                data.riwayat_tahun_lalu === "Naik" ? "default" : 
                                data.riwayat_tahun_lalu === "Turun" ? "destructive" : 
                                "secondary"
                              }>
                                {data.riwayat_tahun_lalu}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{data.jabatan_baru || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={data.grade_baru && data.grade_baru !== data.grade ? "default" : "secondary"}>
                              {data.grade_baru || data.grade || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{data.akumulasi_terakhir || "-"}</TableCell>
                          <TableCell>{data.tmt_peringkat_baru || "-"}</TableCell>
                          <TableCell>{data.eselon_iii}</TableCell>
                          <TableCell>{data.eselon_iv}</TableCell>
                          <TableCell>
                            <Badge variant={data.pkt_2024 === "Sangat Baik" || data.pkt_2024 === "Baik" ? "default" : "destructive"}>
                              {data.pkt_2024 || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={data.pkt_2025 === "Sangat Baik" || data.pkt_2025 === "Baik" ? "default" : "destructive"}>
                              {data.pkt_2025 || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {data.hukuman_disiplin ? (
                              <Badge variant="destructive">Ya</Badge>
                            ) : (
                              <Badge variant="outline">Tidak</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {data.tugas_belajar ? (
                              <Badge variant="default">Ya</Badge>
                            ) : (
                              <Badge variant="outline">Tidak</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {data.upkp ? (
                              <Badge variant="default">Ya</Badge>
                            ) : (
                              <Badge variant="outline">Tidak</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {data.kemampuan_kerja ? (
                              <Badge variant={data.kemampuan_kerja === "Memenuhi" ? "default" : "destructive"}>
                                {data.kemampuan_kerja}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{data.atasan_langsung_nama || "-"}</TableCell>
                          <TableCell>{data.atasan_dari_atasan_nama || "-"}</TableCell>
                          {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditBigData(data)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("grading"); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Catatan: PKT (Predikat Kinerja Tahunan) - poin diambil dari HEK DEK atau KEP K3
            </p>
          </TabsContent>

          {/* Single Core Tab */}
          <TabsContent value="single-core" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama atau NIP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllSingleCoreOpen(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Semua
                      </Button>
                    )}
                    {(isAdmin || role === "user" || role === "super") && (
                    <Button 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                      onClick={() => {
                        const exportData = filteredGradingData.map((data, index) => ({
                          "Lampiran KEP": data.lampiran_kep || "",
                          "Nama/NIP": `${data.nama_lengkap}/${data.nip}`,
                          "Golongan": data.pangkat_golongan || "",
                          "TMT Pangkat": data.tmt_pangkat || "",
                          "Pendidikan": data.pendidikan || "",
                          "Jabatan Lama": data.jabatan || "",
                          "Peringkat Lama": data.grade || "",
                          "Akumulasi Masa Kerja": data.akumulasi_masa_kerja || "",
                          "TMT Peringkat Terakhir": data.tmt_terakhir || "",
                          "Jabatan Baru": data.jabatan_baru || "",
                          "Peringkat Baru": data.grade_baru || "",
                          "Predikat I": data.pkt_2024 || "",
                          "Akumulasi Masa Kerja Terakhir": data.akumulasi_terakhir || "",
                          "Predikat II": data.pkt_2025 || "",
                          "Kemampuan Kerja": data.kemampuan_kerja || "",
                          "TMT Peringkat Baru": data.tmt_peringkat_baru || "",
                          "Eselon III": data.eselon_iii || "",
                          "Eselon IV": data.eselon_iv || "",
                          "Atasan Langsung": data.atasan_langsung_nama || "",
                          "Atasan dari Atasan Langsung": data.atasan_dari_atasan_nama || "",
                        }));
                        const ws = XLSX.utils.json_to_sheet(exportData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Template Aplikasi Data");
                        XLSX.writeFile(wb, `Template_Aplikasi_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
                        toast.success("Data Grading Tools berhasil diekspor");
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Grading Tools +
                    </Button>
                    )}
                    <Button variant="outline" onClick={() => {
                      const exportData = filteredGradingData.map((data, index) => {
                        const nipAnalysis = analyzeGradePotential(data.nip);
                        const analysisWithFlags = buildAnalisaNIPWithFlags(nipAnalysis, data);
                        const gradeLama = parseInt(data.grade) || 0;
                        const maxGradeGol = getMaxGradeFromGolongan(data.pangkat_golongan, puSyaratGeneralData);
                        const maxGradePend = getMaxGradeFromPendidikan(data.pendidikan, puSyaratGeneralData);
                        const golPendAnalysis = analyzeGolPendidikanPotential(gradeLama, maxGradeGol, maxGradePend);
                        const analisaY1 = analyzeY1Potential(data.riwayat_tahun_lalu, data.upkp, data.tugas_belajar);
                        const klaster = determineKlaster(data.jenis, data.jabatan_baru || data.jabatan);
                        const analisaJabatanBaru = data.jenis === "PU" 
                          ? (() => { const a = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan); return a.eligible ? `${a.jabatan} (Memenuhi)` : `${a.jabatan} (${a.reason || 'Tidak Memenuhi'})`; })()
                          : "-";
                        return {
                          "No": index + 1,
                          "Nama": data.nama_lengkap,
                          "Jenis": data.jenis || "",
                          "Analisa NIP": analysisWithFlags.status,
                          "Analisis Gol/Pend": golPendAnalysis.status,
                          "Analisa Y-1": analisaY1.status,
                          "Analisa Jabatan Baru": analisaJabatanBaru,
                          "Grade Baru": data.grade_baru || data.grade || "",
                          "Kemampuan Kerja": data.kemampuan_kerja || "",
                          "Klaster": klaster || "",
                          "Rekomendasi": data.rekomendasi || "",
                        };
                      });
                      const ws = XLSX.utils.json_to_sheet(exportData);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Single Core Grading");
                      XLSX.writeFile(wb, `Single_Core_Grading_${new Date().toISOString().split('T')[0]}.xlsx`);
                      toast.success("Data berhasil diekspor");
                    }}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    {isAdmin && (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            try {
                              const bstr = evt.target?.result;
                              const wb = XLSX.read(bstr, { type: "binary" });
                              const ws = wb.Sheets[wb.SheetNames[0]];
                              const jsonData = XLSX.utils.sheet_to_json(ws) as any[];
                              let updatedCount = 0;
                              for (const row of jsonData) {
                                const nip = String(row["NIP"] || "").trim();
                                const keputusan = String(row["Keputusan"] || row["Rekomendasi"] || "").trim();
                                if (nip && keputusan) {
                                  const existingData = gradingData.find(g => g.nip === nip);
                                  if (existingData) {
                                    const currentGrade = parseInt(existingData.grade) || 0;
                                    let newGradeBaru = existingData.grade_baru || existingData.grade;
                                    let newJabatanBaru = existingData.jabatan_baru || existingData.jabatan;
                                    
                                    if (keputusan === "Naik" && currentGrade > 0) {
                                      const calculatedGrade = currentGrade + 1;
                                      newGradeBaru = calculatedGrade.toString();
                                      const matchingGrade = daftarGradeData.find(dg => dg.grade === calculatedGrade);
                                      if (matchingGrade) newJabatanBaru = matchingGrade.jabatan;
                                    } else if (keputusan === "Tetap") {
                                      newGradeBaru = existingData.grade;
                                      newJabatanBaru = existingData.jabatan;
                                    } else if (keputusan === "Turun" && currentGrade > 1) {
                                      const calculatedGrade = currentGrade - 1;
                                      newGradeBaru = calculatedGrade.toString();
                                      const matchingGrade = daftarGradeData.find(dg => dg.grade === calculatedGrade);
                                      if (matchingGrade) newJabatanBaru = matchingGrade.jabatan;
                                    }
                                    
                                    const { error } = await supabase
                                      .from("grading_big_data")
                                      .update({ rekomendasi: keputusan, grade_baru: newGradeBaru, jabatan_baru: newJabatanBaru })
                                      .eq("nip", nip);
                                    if (!error) updatedCount++;
                                  }
                                }
                              }
                              toast.success(`${updatedCount} data keputusan berhasil diimpor`);
                              fetchGradingData();
                            } catch (error: any) {
                              toast.error(error.message || "Gagal mengimpor data");
                            }
                            e.target.value = "";
                          };
                          reader.readAsBinaryString(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Excel
                      </Button>
                    </div>
                    )}
                  </div>
                </div>
                {/* Filters Row */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={filterKlaster || "all"} onValueChange={(v) => setFilterKlaster(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Klaster" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Klaster</SelectItem>
                      <SelectItem value="PU">PU</SelectItem>
                      <SelectItem value="PK">PK</SelectItem>
                      <SelectItem value="PTB">PTB</SelectItem>
                      <SelectItem value="Pelaksana Tertentu">Pelaksana Tertentu</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterKeputusan || "all"} onValueChange={(v) => setFilterKeputusan(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Keputusan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Keputusan</SelectItem>
                      <SelectItem value="Naik">Naik</SelectItem>
                      <SelectItem value="Tetap">Tetap</SelectItem>
                      <SelectItem value="Turun">Turun</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterGradeBaru || "all"} onValueChange={(v) => setFilterGradeBaru(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Grade Baru" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Grade</SelectItem>
                      {Array.from({ length: 17 }, (_, i) => i + 1).map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Filter Jabatan Baru..."
                    value={filterJabatanBaru}
                    onChange={(e) => setFilterJabatanBaru(e.target.value)}
                    className="w-48"
                  />
                  <Select value={filterAnalisaNIP || "all"} onValueChange={(v) => setFilterAnalisaNIP(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Analisa NIP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Analisa</SelectItem>
                      <SelectItem value="Potensi Naik">Potensi Naik</SelectItem>
                      <SelectItem value="Potensi Tetap">Potensi Tetap</SelectItem>
                      <SelectItem value="Belum Eligible">Belum Eligible</SelectItem>
                      <SelectItem value="Flag Hukdis">Flag Hukdis</SelectItem>
                      <SelectItem value="Flag UPKP">Flag UPKP</SelectItem>
                      <SelectItem value="Flag Tugas Belajar">Flag Tugas Belajar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAnalisisGolPend || "all"} onValueChange={(v) => setFilterAnalisisGolPend(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Analisis Gol/Pend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Analisis</SelectItem>
                      <SelectItem value="Bisa Naik">Bisa Naik</SelectItem>
                      <SelectItem value="Hanya Tetap">Hanya Tetap</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterIsiKuesioner || "all"} onValueChange={(v) => setFilterIsiKuesioner(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Isi Kuesioner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="PU">Isi Kuesioner PU</SelectItem>
                      <SelectItem value="PK">Isi Kuesioner PK</SelectItem>
                      <SelectItem value="PTB">Isi Kuesioner PTB</SelectItem>
                      <SelectItem value="kosong">Kosong / Tidak Ada</SelectItem>
                    </SelectContent>
                  </Select>
                  {(filterKlaster || filterKeputusan || filterGradeBaru || filterJabatanBaru || filterAnalisaNIP || filterAnalisisGolPend || filterAnalisaY1 || filterAnalisaJabatanBaru || filterIsiKuesioner) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFilterKlaster("");
                        setFilterKeputusan("");
                        setFilterGradeBaru("");
                        setFilterJabatanBaru("");
                        setFilterAnalisaNIP("");
                        setFilterAnalisisGolPend("");
                        setFilterAnalisaY1("");
                        setFilterAnalisaJabatanBaru("");
                        setFilterIsiKuesioner("");
                      }}
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Analisa NIP</TableHead>
                    <TableHead>Analisis Gol/Pend</TableHead>
                    <TableHead>Analisa Y-1</TableHead>
                    <TableHead>Analisa Jabatan Baru</TableHead>
                    <TableHead>Jabatan Baru</TableHead>
                    <TableHead>Grade Baru</TableHead>
                    <TableHead>Kemampuan Kerja</TableHead>
                    <TableHead>Klaster</TableHead>
                    <TableHead>Rekomendasi</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredGradingData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGradingData.map((data, index) => {
                      const pkpStatus = getPKPStatus(data);
                      const tmtData = extractTMTFromNIP(data.nip);
                      const nipAnalysis = analyzeGradePotential(data.nip);
                      const analysisWithFlags = buildAnalisaNIPWithFlags(nipAnalysis, data);
                      
                      // Calculate max grades for golongan and pendidikan
                      const gradeLama = parseInt(data.grade) || 0;
                      const maxGradeGol = getMaxGradeFromGolongan(data.pangkat_golongan, puSyaratGeneralData);
                      const maxGradePend = getMaxGradeFromPendidikan(data.pendidikan, puSyaratGeneralData);
                      const golPendAnalysis = analyzeGolPendidikanPotential(gradeLama, maxGradeGol, maxGradePend);
                      
                      // Determine cluster/flag status - can have multiple flags
                      const hasHukdis = data.hukuman_disiplin;
                      const hasUPKP = data.upkp;
                      const hasTugasBelajar = data.tugas_belajar;
                      
                      const clusterBadges: JSX.Element[] = [];
                      if (hasHukdis) {
                        clusterBadges.push(<Badge key="hukdis" className="bg-red-500 text-white">Hukdis</Badge>);
                      }
                      if (hasUPKP) {
                        clusterBadges.push(<Badge key="upkp" className="bg-green-500 text-white">UPKP</Badge>);
                      }
                      if (hasTugasBelajar) {
                        clusterBadges.push(<Badge key="tb" className="bg-green-500 text-white">Tugas Belajar</Badge>);
                      }
                      
                      const clusterDisplay = clusterBadges.length > 0 
                        ? <div className="flex flex-wrap gap-1">{clusterBadges}</div>
                        : <Badge variant="outline">-</Badge>;

                      return (
                        <TableRow key={data.id} className={hasHukdis ? "bg-red-50" : (hasUPKP || hasTugasBelajar) ? "bg-green-50" : ""}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{data.nama_lengkap}</TableCell>
                          <TableCell>
                            {data.jenis ? (
                              <Badge variant="outline">{data.jenis}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{data.nip}</span>
                              {tmtData && (
                                <>
                                  <span className="text-xs text-muted-foreground">
                                    CPNS: {tmtData.cpnsFormatted}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    PNS: {tmtData.pnsFormatted}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    Start: {tmtData.startYear}
                                  </span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={analysisWithFlags.color}>
                                {analysisWithFlags.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {analysisWithFlags.keterangan}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={golPendAnalysis.color}>
                              {golPendAnalysis.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const analisaY1 = analyzeY1Potential(data.riwayat_tahun_lalu, data.upkp, data.tugas_belajar);
                              return (
                                <Badge className={analisaY1.color}>
                                  {analisaY1.status}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {data.jenis === "PU" ? (
                              (() => {
                                // Use enhanced analysis with golongan validation
                                const analisaJabatan = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan);
                                return (
                                  <div className="flex flex-col gap-1">
                                    <Badge className={analisaJabatan.color}>
                                      {analisaJabatan.jabatan}
                                    </Badge>
                                    {analisaJabatan.eligible === false && analisaJabatan.reason && (
                                      <span className="text-xs text-destructive">
                                        {analisaJabatan.reason}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={data.jabatan_baru || data.jabatan || ""}
                              onValueChange={async (value) => {
                                const { error } = await supabase
                                  .from("grading_big_data")
                                  .update({ jabatan_baru: value })
                                  .eq("id", data.id);
                                if (error) {
                                  toast.error("Gagal menyimpan jabatan baru");
                                } else {
                                  toast.success("Jabatan baru berhasil disimpan");
                                  fetchGradingData();
                                }
                              }}
                            >
                              <SelectTrigger className="w-56">
                                <SelectValue placeholder="Pilih Jabatan" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Show current value as first option if not in list */}
                                {(data.jabatan_baru || data.jabatan) && (
                                  <SelectItem value={data.jabatan_baru || data.jabatan || ""}>
                                    ✓ {data.jabatan_baru || data.jabatan}
                                  </SelectItem>
                                )}
                                {/* Separator if current value exists */}
                                {(data.jabatan_baru || data.jabatan) && <SelectItem value="__separator__" disabled>── Memenuhi Syarat ──</SelectItem>}
                                {/* Get available jabatan options based on jenis */}
                                {(() => {
                                  const gradeBaru = parseInt(data.grade_baru || data.grade || "0");
                                  if (data.jenis === "PU") {
                                    const options = getJabatanBaruOptionsForPU(
                                      gradeBaru,
                                      data.pangkat_golongan || "",
                                      data.pendidikan || "",
                                      daftarGradeData
                                    );
                                    const currentValue = data.jabatan_baru || data.jabatan || "";
                                    const eligibleOptions = options.filter(opt => opt.eligible && opt.jabatan !== currentValue);
                                    const notEligibleOptions = options.filter(opt => !opt.eligible && opt.jabatan !== currentValue);
                                    return (
                                      <>
                                        {eligibleOptions.map((opt, i) => (
                                          <SelectItem key={`e-${i}`} value={opt.jabatan}>
                                            {opt.jabatan} ({opt.syarat_pendidikan || "-"} / {opt.syarat_golongan || "-"})
                                          </SelectItem>
                                        ))}
                                        {notEligibleOptions.length > 0 && (
                                          <SelectItem value="__sep2__" disabled>── Belum Memenuhi Syarat ──</SelectItem>
                                        )}
                                        {notEligibleOptions.map((opt, i) => (
                                          <SelectItem key={`n-${i}`} value={opt.jabatan}>
                                            ✗ {opt.jabatan} ({opt.syarat_pendidikan || "-"} / {opt.syarat_golongan || "-"})
                                          </SelectItem>
                                        ))}
                                      </>
                                    );
                                  } else if (data.jenis === "PTB") {
                                    const ptbOptions = daftarGradeData
                                      .filter(dg => dg.klaster === "PTB" && dg.grade === gradeBaru)
                                      .map(dg => dg.jabatan);
                                    const currentValue = data.jabatan_baru || data.jabatan || "";
                                    return ptbOptions
                                      .filter(jab => jab !== currentValue)
                                      .map((jab, i) => (
                                        <SelectItem key={i} value={jab}>{jab}</SelectItem>
                                      ));
                                  } else if (data.jenis === "PK") {
                                    const pkOptions = daftarGradeData
                                      .filter(dg => dg.klaster === "PK" && dg.grade === gradeBaru)
                                      .map(dg => dg.jabatan);
                                    const currentValue = data.jabatan_baru || data.jabatan || "";
                                    return pkOptions
                                      .filter(jab => jab !== currentValue)
                                      .map((jab, i) => (
                                        <SelectItem key={i} value={jab}>{jab}</SelectItem>
                                      ));
                                  } else {
                                    // Default: show all jabatan for this grade
                                    const allOptions = daftarGradeData
                                      .filter(dg => dg.grade === gradeBaru)
                                      .map(dg => dg.jabatan);
                                    const currentValue = data.jabatan_baru || data.jabatan || "";
                                    return [...new Set(allOptions)]
                                      .filter(jab => jab !== currentValue)
                                      .map((jab, i) => (
                                        <SelectItem key={i} value={jab}>{jab}</SelectItem>
                                      ));
                                  }
                                })()}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={data.grade_baru || data.grade || ""}
                              onValueChange={async (value) => {
                                const newGrade = parseInt(value) || 0;
                                let newJabatanBaru = data.jabatan_baru || data.jabatan;
                                
                                // Auto-calculate jabatan baru based on new grade
                                if (data.jenis === "PU" && data.pendidikan) {
                                  const analisaJabatan = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan);
                                  if (analisaJabatan.eligible) {
                                    const tingkat = getTingkatFromGrade(newGrade);
                                    newJabatanBaru = `${analisaJabatan.jabatan} ${tingkat}`;
                                  } else {
                                    const availableOptions = getJabatanBaruOptionsForPU(
                                      newGrade, 
                                      data.pangkat_golongan || "", 
                                      data.pendidikan || "", 
                                      daftarGradeData
                                    ).filter(opt => opt.eligible);
                                    if (availableOptions.length > 0) {
                                      newJabatanBaru = availableOptions[0].jabatan;
                                    }
                                  }
                                } else if (data.jenis === "PTB") {
                                  const ptbJabatan = getPTBJabatan(newGrade, daftarGradeData);
                                  if (ptbJabatan) newJabatanBaru = ptbJabatan;
                                } else if (data.jenis === "PK") {
                                  const pkJabatan = getPKJabatan(newGrade, daftarGradeData);
                                  if (pkJabatan) newJabatanBaru = pkJabatan;
                                }
                                
                                const { error } = await supabase
                                  .from("grading_big_data")
                                  .update({ grade_baru: value, jabatan_baru: newJabatanBaru })
                                  .eq("id", data.id);
                                if (error) {
                                  toast.error("Gagal menyimpan grade baru");
                                } else {
                                  toast.success(`Grade baru ${value} berhasil disimpan`);
                                  fetchGradingData();
                                }
                              }}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 17 }, (_, i) => i + 1).map(grade => (
                                  <SelectItem key={grade} value={grade.toString()}>{grade}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={data.kemampuan_kerja || ""}
                              onValueChange={async (value) => {
                                const { error } = await supabase
                                  .from("grading_big_data")
                                  .update({ kemampuan_kerja: value })
                                  .eq("id", data.id);
                                if (error) {
                                  toast.error("Gagal menyimpan kemampuan kerja");
                                } else {
                                  toast.success("Kemampuan kerja berhasil disimpan");
                                  fetchGradingData();
                                }
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Pilih..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Memenuhi">Memenuhi</SelectItem>
                                <SelectItem value="Tidak Memenuhi">Tidak Memenuhi</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{clusterDisplay}</TableCell>
                          <TableCell>
                            <Select
                              value={data.rekomendasi || ""}
                              onValueChange={async (value) => {
                                // Calculate new grade based on rekomendasi
                                const currentGrade = parseInt(data.grade) || 0;
                                let newGradeBaru = data.grade_baru || data.grade;
                                let newJabatanBaru = data.jabatan_baru || data.jabatan;
                                
                                if (value === "Naik" && currentGrade > 0) {
                                  const calculatedGrade = currentGrade + 1;
                                  newGradeBaru = calculatedGrade.toString();
                                  
                                  // For PU: Determine jabatan baru based on pendidikan AND golongan
                                  if (data.jenis === "PU" && data.pendidikan) {
                                    // Use enhanced analysis with golongan
                                    const analisaJabatan = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan);
                                    if (analisaJabatan.eligible) {
                                      const tingkat = getTingkatFromGrade(calculatedGrade);
                                      newJabatanBaru = `${analisaJabatan.jabatan} ${tingkat}`;
                                    } else {
                                      // Get available options for this grade that meet requirements
                                      const availableOptions = getJabatanBaruOptionsForPU(
                                        calculatedGrade, 
                                        data.pangkat_golongan || "", 
                                        data.pendidikan || "", 
                                        daftarGradeData
                                      ).filter(opt => opt.eligible);
                                      
                                      if (availableOptions.length > 0) {
                                        newJabatanBaru = availableOptions[0].jabatan;
                                      } else {
                                        // Fallback to pendidikan-only analysis
                                        const tingkat = getTingkatFromGrade(calculatedGrade);
                                        newJabatanBaru = `${analisaJabatan.jabatan} ${tingkat}`;
                                      }
                                    }
                                  } else if (data.jenis === "PTB") {
                                    // For PTB: Get from daftar_grade
                                    const ptbJabatan = getPTBJabatan(calculatedGrade, daftarGradeData);
                                    newJabatanBaru = ptbJabatan || data.jabatan;
                                  } else if (data.jenis === "PK") {
                                    // For PK: Get from daftar_grade
                                    const pkJabatan = getPKJabatan(calculatedGrade, daftarGradeData);
                                    newJabatanBaru = pkJabatan || data.jabatan;
                                  } else {
                                    // For other jenis, find jabatan baru from daftar_grade
                                    const matchingGrade = daftarGradeData.find(dg => 
                                      dg.grade === calculatedGrade
                                    );
                                    if (matchingGrade) {
                                      newJabatanBaru = matchingGrade.jabatan;
                                    }
                                  }
                                } else if (value === "Tetap") {
                                  newGradeBaru = data.grade;
                                  // For PU Tetap: still use pendidikan/golongan-based jabatan
                                  if (data.jenis === "PU" && data.pendidikan) {
                                    const analisaJabatan = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan);
                                    const tingkat = getTingkatFromGrade(currentGrade);
                                    newJabatanBaru = `${analisaJabatan.jabatan} ${tingkat}`;
                                  } else {
                                    newJabatanBaru = data.jabatan;
                                  }
                                } else if (value === "Turun" && currentGrade > 1) {
                                  const calculatedGrade = currentGrade - 1;
                                  newGradeBaru = calculatedGrade.toString();
                                  
                                  // For PU: use pendidikan/golongan-based jabatan
                                  if (data.jenis === "PU" && data.pendidikan) {
                                    const analisaJabatan = analyzeJabatanBaru(data.pendidikan, data.pangkat_golongan);
                                    const tingkat = getTingkatFromGrade(calculatedGrade);
                                    newJabatanBaru = `${analisaJabatan.jabatan} ${tingkat}`;
                                  } else if (data.jenis === "PTB") {
                                    const ptbJabatan = getPTBJabatan(calculatedGrade, daftarGradeData);
                                    newJabatanBaru = ptbJabatan || data.jabatan;
                                  } else if (data.jenis === "PK") {
                                    const pkJabatan = getPKJabatan(calculatedGrade, daftarGradeData);
                                    newJabatanBaru = pkJabatan || data.jabatan;
                                  } else {
                                    // For non-PU, find jabatan baru from daftar_grade
                                    const matchingGrade = daftarGradeData.find(dg => 
                                      dg.grade === calculatedGrade
                                    );
                                    if (matchingGrade) {
                                      newJabatanBaru = matchingGrade.jabatan;
                                    }
                                  }
                                }
                                
                                const { error } = await supabase
                                  .from("grading_big_data")
                                  .update({ 
                                    rekomendasi: value,
                                    grade_baru: newGradeBaru,
                                    jabatan_baru: newJabatanBaru
                                  })
                                  .eq("id", data.id);
                                if (error) {
                                  toast.error("Gagal menyimpan rekomendasi");
                                } else {
                                  toast.success(`Rekomendasi "${value}" berhasil disimpan. Grade Baru: ${newGradeBaru}`);
                                  fetchGradingData();
                                }
                              }}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue placeholder="Pilih" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Naik">Naik</SelectItem>
                                <SelectItem value="Tetap">Tetap</SelectItem>
                                <SelectItem value="Turun">Turun</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {/* Kuesioner flag based on jenis - only show when rekomendasi is Naik */}
                              {data.jenis && data.rekomendasi === "Naik" && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className={`text-xs ${
                                    data.jenis === "PTB" ? "border-orange-500 text-orange-600 hover:bg-orange-50" :
                                    data.jenis === "PK" ? "border-blue-500 text-blue-600 hover:bg-blue-50" :
                                    data.jenis === "PU" ? "border-green-500 text-green-600 hover:bg-green-50" :
                                    "border-purple-500 text-purple-600 hover:bg-purple-50"
                                  }`}
                                  onClick={() => {
                                    setActiveTab("kuesioner");
                                    toast.info(`Isi Kuesioner ${data.jenis} untuk ${data.nama_lengkap}`);
                                  }}
                                >
                                  Isi Kuesioner {data.jenis}
                                </Button>
                              )}
                              {isAdmin && (
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditBigData(data)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("grading"); }}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Permohonan Tab */}
          <TabsContent value="permohonan" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama, NIP, atau No KEP..."
                        value={permohonanSearchTerm}
                        onChange={(e) => setPermohonanSearchTerm(e.target.value)}
                        className="pl-9 w-72"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-start">
                    {/* Allert Grading+ Button dengan Tools info dalam satu kotak */}
                    <div className="flex items-center gap-2 border border-orange-300 rounded-lg p-2 bg-orange-50/50">
                      <Button 
                        variant="outline" 
                        className="border-orange-500 text-orange-600 hover:bg-orange-100"
                        onClick={() => window.open("https://grading-pelaksana.streamlit.app/", "_blank")}
                      >
                        Allert Grading +
                      </Button>
                      <div className="text-xs text-muted-foreground border-l border-orange-300 pl-2">
                        <span className="font-medium">User:</span> Grading<br />
                        <span className="font-medium">Pass:</span> {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')}
                      </div>
                    </div>
                    {/* Referensi Button */}
                    <Button 
                      variant="outline"
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                      onClick={() => window.open("https://t.kemenkeu.go.id/gradingpelaksanadjbc", "_blank")}
                    >
                      Referensi
                    </Button>
                    {/* Internal Button - Google Drive Link */}
                    <Button 
                      variant="outline"
                      className="border-green-500 text-green-600 hover:bg-green-50"
                      onClick={() => window.open("https://drive.google.com/drive/folders/1XdkQFbfM61FDRR1y1eKTUR0uct0GlDeQ", "_blank")}
                    >
                      Internal
                    </Button>
                    {isAdmin && (
                    <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllPermohonanOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus Semua
                    </Button>
                    )}
                    <Button variant="outline" onClick={handleExportPermohonan}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setLampiranWordSelectedIds(new Set(filteredPermohonanData.map(d => d.id)));
                      setLampiranWordDialogOpen(true);
                    }} className="border-blue-500 text-blue-600 hover:bg-blue-50">
                      <FileText className="h-4 w-4 mr-2" />
                      Lampiran Word
                    </Button>
                    {isAdmin && (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportPermohonan}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Excel
                      </Button>
                    </div>
                    )}
                    {isAdmin && (
                    <Button onClick={() => { resetPermohonanForm(); setEditingPermohonan(null); setPermohonanDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Data
                    </Button>
                    )}
                  </div>
                </div>
                {/* Filter Row */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={filterPermohonanNoKep || "all"} onValueChange={(v) => setFilterPermohonanNoKep(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter No KEP" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua No KEP</SelectItem>
                      {uniquePermohonanNoKep.map(kep => (
                        <SelectItem key={kep} value={kep}>{kep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPermohonanGradeBaru || "all"} onValueChange={(v) => setFilterPermohonanGradeBaru(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Grade Baru" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Grade</SelectItem>
                      {uniquePermohonanGradeBaru.map(grade => (
                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Filter Jabatan Baru..."
                    value={filterPermohonanJabatanBaru}
                    onChange={(e) => setFilterPermohonanJabatanBaru(e.target.value)}
                    className="w-48"
                  />
                  <Select value={filterPermohonanDari || "all"} onValueChange={(v) => setFilterPermohonanDari(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Dari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Dari</SelectItem>
                      {uniquePermohonanDari.map(dari => (
                        <SelectItem key={dari} value={dari}>{dari}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPermohonanKe || "all"} onValueChange={(v) => setFilterPermohonanKe(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Ke" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Ke</SelectItem>
                      {uniquePermohonanKe.map(ke => (
                        <SelectItem key={ke} value={ke}>{ke}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(filterPermohonanNoKep || filterPermohonanGradeBaru || filterPermohonanJabatanBaru || filterPermohonanDari || filterPermohonanKe) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setFilterPermohonanNoKep("");
                        setFilterPermohonanGradeBaru("");
                        setFilterPermohonanJabatanBaru("");
                        setFilterPermohonanDari("");
                        setFilterPermohonanKe("");
                      }}
                    >
                      Reset Filter
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>No KEP</TableHead>
                    <TableHead>Tgl KEP</TableHead>
                    <TableHead>Hal</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Pangkat/Gol/TMT</TableHead>
                    <TableHead>Pendidikan</TableHead>
                    <TableHead>Jabatan Lama</TableHead>
                    <TableHead>Grade Lama</TableHead>
                    <TableHead>Jabatan Baru</TableHead>
                    <TableHead>Grade Baru</TableHead>
                    <TableHead>TMT Peringkat Terakhir</TableHead>
                    <TableHead>Dari</TableHead>
                    <TableHead>Ke</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={17} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : Object.keys(permohonanGroupedByKep).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={17} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(permohonanGroupedByKep).map(([kepNo, groupData], groupIndex) => {
                      const isMultiple = groupData.length > 1;
                      const isExpanded = expandedKepGroups.has(kepNo);
                      const firstData = groupData[0];
                      
                      if (!isMultiple) {
                        // Single employee - show normal row
                        const data = firstData;
                        return (
                          <TableRow key={data.id}>
                            <TableCell></TableCell>
                            <TableCell>{data.no_urut || groupIndex + 1}</TableCell>
                            <TableCell className="font-medium">{data.nomor_kep}</TableCell>
                            <TableCell>{data.tanggal_kep}</TableCell>
                            <TableCell>
                              {data.hal && <Badge variant="outline">{data.hal}</Badge>}
                            </TableCell>
                            <TableCell>{data.nama_lengkap}</TableCell>
                            <TableCell>{data.nip}</TableCell>
                            <TableCell>{data.pangkat_gol_tmt}</TableCell>
                            <TableCell>{data.pendidikan}</TableCell>
                            <TableCell>{data.jabatan_lama}</TableCell>
                            <TableCell>{data.grade_lama}</TableCell>
                            <TableCell>{data.jabatan_baru}</TableCell>
                            <TableCell>{data.grade_baru}</TableCell>
                            <TableCell>{data.tmt_peringkat_terakhir}</TableCell>
                            <TableCell>
                              {data.dari && <Badge variant="outline">{data.dari}</Badge>}
                            </TableCell>
                            <TableCell>
                              {data.ke && <Badge variant="secondary">{data.ke}</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col gap-1 items-end">
                                {/* ND and Lampiran Buttons */}
                                <div className="flex gap-1 mb-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        const bigData = data.grading_id ? gradingData.find(g => g.id === data.grading_id) : null;
                                        // Count total employees with same nomor_kep
                                        const sameKepCount = permohonanData.filter(p => p.nomor_kep === data.nomor_kep).length;
                                        await generateNDPermohonan(
                                          [data],
                                          data.nomor_kep || "ND-XX/KBC.1101/2026",
                                          data.tanggal_kep || new Date().toISOString().split('T')[0],
                                          undefined,
                                          undefined,
                                          {
                                            satuanKerja: bigData?.eselon_iii || undefined,
                                            nomorKep: data.nomor_kep || undefined,
                                            tanggalKep: data.tanggal_kep || undefined,
                                            kategoriPenetapan: selectedLampiranTitle || undefined,
                                            unitTerkecil: bigData?.eselon_iv || undefined,
                                            totalPegawai: sameKepCount,
                                            atasanDariAtasan: bigData?.atasan_dari_atasan_nama || undefined,
                                          }
                                        );
                                        toast.success("ND berhasil di-generate");
                                      } catch (error: any) {
                                        toast.error("Gagal generate ND: " + error.message);
                                      }
                                    }}
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    ND
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs border-amber-500 text-amber-600 hover:bg-amber-50"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        await generateLampiranPermohonanWord(
                                          [data],
                                          data.nomor_kep || "ND-XX/KBC.1101/2026",
                                          data.tanggal_kep || new Date().toISOString().split('T')[0]
                                        );
                                        toast.success("Lampiran Word berhasil di-generate");
                                      } catch (error: any) {
                                        toast.error("Gagal generate Lampiran Word: " + error.message);
                                      }
                                    }}
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Lampiran
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      try {
                                        // Fetch eselonisasi data
                                        const { data: eselonData } = await supabase
                                          .from("eselonisasi")
                                          .select("*")
                                          .order("no_urut", { ascending: true });
                                        await generateLampiranPermohonan(
                                          [data],
                                          eselonData || [],
                                          data.nomor_kep || "ND-XX/KBC.1101/2026",
                                          data.tanggal_kep || new Date().toISOString().split('T')[0]
                                        );
                                        toast.success("Lampiran Excel berhasil di-generate");
                                      } catch (error: any) {
                                        toast.error("Gagal generate Lampiran Excel: " + error.message);
                                      }
                                    }}
                                  >
                                    <FileDown className="h-3 w-3 mr-1" />
                                    Excel
                                  </Button>
                                </div>
                                {data.hal === "Simulasi" && (
                                  <div className="flex gap-1 mb-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs border-green-500 text-green-600 hover:bg-green-50"
                                      onClick={() => {
                                        setActiveTab("kelengkapan-simulasi");
                                        toast.info(`Membuka Kelengkapan Data untuk ${data.nama_lengkap}`);
                                      }}
                                    >
                                      Kelengkapan Data
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs border-blue-500 text-blue-600 hover:bg-blue-50"
                                      onClick={() => {
                                        setActiveTab("kelengkapan-simulasi");
                                        toast.info(`Membuka Rekomendasi Hasil Simulasi untuk ${data.nama_lengkap}`);
                                      }}
                                    >
                                      Rekomendasi Hasil Simulasi
                                    </Button>
                                  </div>
                                )}
                                {data.hal === "Sidang" && (
                                  <div className="flex gap-1 mb-1">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs border-purple-500 text-purple-600 hover:bg-purple-50"
                                      onClick={() => {
                                        setActiveTab("hasil-evaluasi");
                                        toast.info(`Membuka Hasil Evaluasi untuk ${data.nama_lengkap}`);
                                      }}
                                    >
                                      Hasil Evaluasi
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-xs border-orange-500 text-orange-600 hover:bg-orange-50"
                                      onClick={() => {
                                        setActiveTab("berita-acara");
                                        toast.info(`Membuka BA Hasil Sidang untuk ${data.nama_lengkap}`);
                                      }}
                                    >
                                      BA Hasil Sidang
                                    </Button>
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditPermohonan(data)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("permohonan"); }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      // Multiple employees - show grouped row
                      return (
                        <>
                          {/* Group Header Row */}
                          <TableRow 
                            key={`group-${kepNo}`} 
                            className="bg-muted/50 hover:bg-muted cursor-pointer"
                            onClick={() => toggleKepGroup(kepNo)}
                          >
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            </TableCell>
                            <TableCell>{groupIndex + 1}</TableCell>
                            <TableCell className="font-medium">{firstData.nomor_kep}</TableCell>
                            <TableCell>{firstData.tanggal_kep}</TableCell>
                            <TableCell>
                              {firstData.hal && <Badge variant="outline">{firstData.hal}</Badge>}
                            </TableCell>
                            <TableCell colSpan={6}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-primary">{groupData.length} Pegawai</span>
                                <span className="text-muted-foreground text-sm">
                                  ({groupData.map(d => d.nama_lengkap.split(' ')[0]).join(', ')})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              {firstData.dari && <Badge variant="outline">{firstData.dari}</Badge>}
                            </TableCell>
                            <TableCell>
                              {firstData.ke && <Badge variant="secondary">{firstData.ke}</Badge>}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const firstBigData = firstData.grading_id ? gradingData.find(g => g.id === firstData.grading_id) : null;
                                      const eselonIVs = [...new Set(groupData.map(d => {
                                        const bd = d.grading_id ? gradingData.find(g => g.id === d.grading_id) : null;
                                        return bd?.eselon_iv || "";
                                      }).filter(Boolean))];
                                      await generateNDPermohonan(
                                        groupData,
                                        firstData.nomor_kep || "ND-XX/KBC.1101/2026",
                                        firstData.tanggal_kep || new Date().toISOString().split('T')[0],
                                        undefined,
                                        undefined,
                                        {
                                          satuanKerja: firstBigData?.eselon_iii || undefined,
                                          nomorKep: firstData.nomor_kep || undefined,
                                          tanggalKep: firstData.tanggal_kep || undefined,
                                          kategoriPenetapan: selectedLampiranTitle || undefined,
                                          unitTerkecil: eselonIVs.join(", ") || undefined,
                                          totalPegawai: groupData.length,
                                          atasanDariAtasan: firstBigData?.atasan_dari_atasan_nama || undefined,
                                        }
                                      );
                                      toast.success("ND berhasil di-generate");
                                    } catch (error: any) {
                                      toast.error("Gagal generate ND: " + error.message);
                                    }
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  ND
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const { data: eselonData } = await supabase
                                        .from("eselonisasi")
                                        .select("*")
                                        .order("no_urut", { ascending: true });
                                      await generateLampiranPermohonan(
                                        groupData,
                                        eselonData || [],
                                        firstData.nomor_kep || "ND-XX/KBC.1101/2026",
                                        firstData.tanggal_kep || new Date().toISOString().split('T')[0]
                                      );
                                      toast.success("Lampiran berhasil di-generate");
                                    } catch (error: any) {
                                      toast.error("Gagal generate Lampiran: " + error.message);
                                    }
                                  }}
                                >
                                  <FileDown className="h-3 w-3 mr-1" />
                                  Lampiran
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Child Rows */}
                          {isExpanded && groupData.map((data, childIndex) => (
                            <TableRow key={data.id} className="bg-blue-50/30">
                              <TableCell></TableCell>
                              <TableCell className="text-muted-foreground">{groupIndex + 1}.{childIndex + 1}</TableCell>
                              <TableCell className="text-muted-foreground">↳</TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="font-medium">{data.nama_lengkap}</TableCell>
                              <TableCell>{data.nip}</TableCell>
                              <TableCell>{data.pangkat_gol_tmt}</TableCell>
                              <TableCell>{data.pendidikan}</TableCell>
                              <TableCell>{data.jabatan_lama}</TableCell>
                              <TableCell>{data.grade_lama}</TableCell>
                              <TableCell>{data.jabatan_baru}</TableCell>
                              <TableCell>{data.grade_baru}</TableCell>
                              <TableCell>{data.tmt_peringkat_terakhir}</TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditPermohonan(data)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("permohonan"); }}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* SK Penetapan Tab - New Component with 3 Clusters */}
          <TabsContent value="sk-penetapan" className="space-y-4">
            <SKPenetapanTab userEmail={user?.email} isAdmin={isAdmin} />
          </TabsContent>

          {/* Monev Tab (formerly Petikan) */}
          <TabsContent value="monev" className="space-y-4">
            <MonevLaporanTab isAdmin={isAdmin} />
          </TabsContent>

          {/* Daftar Grade Tab */}
          <TabsContent value="daftar-grade" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari klaster atau jabatan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <Select value={daftarGradeKlasterFilter} onValueChange={setDaftarGradeKlasterFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Klaster" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Semua Klaster</SelectItem>
                      {KLASTER_OPTIONS.map(k => (
                        <SelectItem key={k} value={k}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={daftarGradeGradeFilter} onValueChange={setDaftarGradeGradeFilter}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50 max-h-60">
                      <SelectItem value="all">Semua Grade</SelectItem>
                      {Array.from(new Set(daftarGradeData.map(d => d.grade))).sort((a, b) => a - b).map(g => (
                        <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={daftarGradeJabatanFilter} onValueChange={setDaftarGradeJabatanFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Jabatan" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50 max-h-60">
                      <SelectItem value="all">Semua Jabatan</SelectItem>
                      {Array.from(new Set(daftarGradeData.map(d => d.jabatan))).sort().map(j => (
                        <SelectItem key={j} value={j}>{j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllDaftarGradeOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </Button>
                  )}
                  <Button variant="outline" onClick={handleExportDaftarGrade}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  {isAdmin && (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportDaftarGrade}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Excel
                    </Button>
                  </div>
                  )}
                  {isAdmin && (
                  <Button onClick={() => { resetDaftarGradeForm(); setEditingDaftarGrade(null); setDaftarGradeDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                  )}
                </div>
              </div>
            </Card>

            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Klaster</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Tugas Jabatan</TableHead>
                    <TableHead>Syarat Pendidikan</TableHead>
                    <TableHead>Syarat Golongan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : daftarGradeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    daftarGradeData
                      .filter(d => 
                        (!searchTerm || 
                          d.klaster.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
                        ) &&
                        (daftarGradeKlasterFilter === "all" || d.klaster === daftarGradeKlasterFilter) &&
                        (daftarGradeGradeFilter === "all" || String(d.grade) === daftarGradeGradeFilter) &&
                        (daftarGradeJabatanFilter === "all" || d.jabatan === daftarGradeJabatanFilter)
                      )
                      .sort((a, b) => a.grade - b.grade)
                      .map((data, index) => {
                        // Color-code rows by klaster
                        const rowBgClass = 
                          data.klaster === "PTB" ? "bg-orange-50 dark:bg-orange-950/20" : 
                          data.klaster === "PU" ? "bg-green-50 dark:bg-green-950/20" : 
                          data.klaster === "PK" ? "bg-blue-50 dark:bg-blue-950/20" : "";
                        
                        return (
                          <TableRow key={data.id} className={rowBgClass}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Badge className={
                                data.klaster === "PTB" ? "bg-orange-500 hover:bg-orange-600 text-white" : 
                                data.klaster === "PU" ? "bg-green-500 hover:bg-green-600 text-white" : 
                                data.klaster === "PK" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
                              }>
                                {data.klaster}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{data.grade}</TableCell>
                            <TableCell>{data.jabatan}</TableCell>
                            <TableCell>{data.klaster === "PK" ? (data.tugas_jabatan || "-") : "-"}</TableCell>
                            <TableCell>{data.klaster !== "PTB" ? (data.syarat_pendidikan || "-") : "-"}</TableCell>
                            <TableCell>{data.klaster !== "PTB" ? (data.syarat_golongan || "-") : "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditDaftarGrade(data)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("daftar-grade"); }}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* PU Syarat General Section */}
            <Card className="p-4 mt-6">
              <CardHeader className="px-0 pt-0">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <CardTitle className="text-lg">Khusus PU - Syarat General (Maksimal Grade)</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPuSyaratGeneral}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    {isAdmin && (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportPuSyaratGeneral}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                    )}
                    {isAdmin && (
                    <Button size="sm" onClick={() => { resetPuSyaratForm(); setEditingPuSyarat(null); setPuSyaratDialogOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Syarat Golongan */}
                  <div>
                    <h4 className="font-semibold mb-3">Syarat Golongan</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Golongan</TableHead>
                            <TableHead>Max Grade</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {puSyaratGeneralData
                            .filter(d => d.jenis === "golongan")
                            .map((data, index) => (
                              <TableRow key={data.id}>
                                <TableCell>{data.no_urut || index + 1}</TableCell>
                                <TableCell>{data.syarat}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">({data.max_grade})</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditPuSyarat(data)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("pu-syarat"); }}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  {/* Syarat Pendidikan */}
                  <div>
                    <h4 className="font-semibold mb-3">Syarat Pendidikan</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead>Pendidikan</TableHead>
                            <TableHead>Max Grade</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {puSyaratGeneralData
                            .filter(d => d.jenis === "pendidikan")
                            .map((data, index) => (
                              <TableRow key={data.id}>
                                <TableCell>{data.no_urut || index + 1}</TableCell>
                                <TableCell>{data.syarat}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">({data.max_grade})</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditPuSyarat(data)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setDeleteId(data.id); setDeleteType("pu-syarat"); }}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Konversi Predikat Kinerja Tahunan */}
            <KonversiPredikatKinerjaTable isAdmin={isAdmin} />
          </TabsContent>

          {/* Kelengkapan Data & Rekomendasi Hasil Simulasi (Simulasi) Tab */}
          <TabsContent value="kelengkapan-simulasi" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Kelengkapan Data & Rekomendasi Hasil Simulasi</h3>
                  <p className="text-sm text-muted-foreground">Data kelengkapan dan rekomendasi untuk permohonan dengan hal "Simulasi"</p>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllSimulasiOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />Hapus Semua
                  </Button>
                  )}
                  <Button variant="outline" onClick={handleExportSimulasi}>
                    <FileDown className="h-4 w-4 mr-2" />Export Excel
                  </Button>
                  {isAdmin && (
                  <>
                  <Button variant="outline" onClick={() => document.getElementById('import-simulasi-excel')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />Import Excel
                  </Button>
                  <input type="file" id="import-simulasi-excel" accept=".xlsx,.xls" className="hidden" onChange={handleImportSimulasi} />
                  </>
                  )}
                  {isAdmin && (
                  <Button onClick={() => { setEditingSimulasi(null); setSimulasiDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />Tambah Data
                  </Button>
                  )}
                </div>
              </div>
            </Card>
            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Unit Organisasi</TableHead>
                    <TableHead>Grade Awal</TableHead>
                    <TableHead>Rekomendasi Grade</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulasiData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Belum ada data. Klik "Tambah Data" untuk menambahkan.
                      </TableCell>
                    </TableRow>
                  ) : simulasiData.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama_lengkap}</TableCell>
                      <TableCell>{item.nip || "-"}</TableCell>
                      <TableCell>{item.unit_organisasi || "-"}</TableCell>
                      <TableCell>{item.grade_awal || "-"}</TableCell>
                      <TableCell>{item.rekomendasi_grade || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => generateKelengkapanDataPelaksana(item)}>
                            <FileText className="h-4 w-4 mr-1" />Kelengkapan
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => generateSimulasiSidangPenilaian(item)}>
                            <FileText className="h-4 w-4 mr-1" />Simulasi
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setEditingSimulasi(item); setSimulasiDialogOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteId(item.id); setDeleteType("simulasi"); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Kuesioner (Naik-Sidang) Tab */}
          <TabsContent value="kuesioner" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Kuesioner (Naik-Sidang)</h3>
                  <p className="text-sm text-muted-foreground">Data kuesioner untuk pegawai dengan rekomendasi "Naik" dan hal "Sidang"</p>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                  <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllKuesionerOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus Semua
                  </Button>
                  )}
                  <Button variant="outline" onClick={() => handleExportKuesioner()}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  {isAdmin && (
                  <>
                  <Button variant="outline" onClick={() => document.getElementById('import-kuesioner-excel')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Excel
                  </Button>
                  <input
                    type="file"
                    id="import-kuesioner-excel"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleImportKuesioner}
                  />
                  </>
                  )}
                  {isAdmin && (
                  <Button onClick={() => setKuesionerDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kuesioner
                  </Button>
                  )}
                </div>
              </div>
            </Card>
            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Jenis Kuesioner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atasan Langsung</TableHead>
                    <TableHead>NIP Atasan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kuesionerData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Belum ada data kuesioner. Klik "Tambah Kuesioner" untuk menambahkan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    kuesionerData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.nama_lengkap}</TableCell>
                        <TableCell>{item.nip || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.jenis_kuesioner || "-"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === "Sudah Diisi" ? "default" : "secondary"}>
                            {item.status || "Belum Diisi"}
                          </Badge>
                        </TableCell>
                        <TableCell>{(item.jawaban as any)?.atasan_langsung_nama || "-"}</TableCell>
                        <TableCell>{(item.jawaban as any)?.atasan_langsung_nip || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedKuesioner(item);
                                setKuesionerFormDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Isi/Lihat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                try {
                                  generateKuesionerPdf({
                                    id: item.id,
                                    nama_lengkap: item.nama_lengkap,
                                    nip: item.nip,
                                    jenis_kuesioner: item.jenis_kuesioner,
                                    jawaban: item.jawaban as Record<string, any> | null,
                                    status: item.status,
                                  });
                                  toast.success("Kuesioner berhasil diunduh");
                                } catch (error) {
                                  toast.error("Gagal mengunduh kuesioner");
                                }
                              }}
                              title="Unduh Kuesioner"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setDeleteId(item.id);
                                setDeleteType("kuesioner");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Hasil Evaluasi PU/PK/PTB Tab */}
          <TabsContent value="hasil-evaluasi" className="space-y-4">
            <HasilEvaluasiTab isAdmin={isAdmin} />
          </TabsContent>

          {/* Berita Acara Hasil Penilaian (Sidang) Tab */}
          <TabsContent value="berita-acara" className="space-y-4">
            <BeritaAcaraTab userEmail={user?.email} isAdmin={isAdmin} />
          </TabsContent>

          {/* Tabel 408 Tab */}
          <TabsContent value="tabel-408" className="space-y-4">
            <Tabel408Tab />
          </TabsContent>

          {/* Mekanisme 54 Tab */}
          <TabsContent value="mekanisme-54" className="space-y-4">
            <Mekanisme54Tab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Voicebot Dialog */}
      <Dialog open={voicebotOpen} onOpenChange={setVoicebotOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voicebot Assistant</DialogTitle>
          </DialogHeader>
          <Voicebot />
        </DialogContent>
      </Dialog>

      {/* Big Data Dialog */}
      <Dialog open={bigDataDialogOpen} onOpenChange={(open) => { setBigDataDialogOpen(open); if (!open) { setEditingData(null); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Data Pegawai" : "Tambah Data Pegawai"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Row 1: Lampiran KEP, Nama Lengkap (combobox dari daftar pegawai), NIP */}
              <div className="space-y-2">
                <Label>Lampiran KEP</Label>
                <Input
                  value={formData.lampiran_kep}
                  onChange={(e) => setFormData({ ...formData, lampiran_kep: e.target.value })}
                  placeholder="Nomor Lampiran KEP"
                />
              </div>
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
                      {formData.nama_lengkap || "Pilih atau ketik nama..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Cari nama pegawai..." 
                        onValueChange={(v) => setFormData({ ...formData, nama_lengkap: v })}
                      />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan. Ketik untuk input manual.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setFormData({ ...formData, nama_lengkap: "", nip: "", pangkat: "", pangkat_golongan: "" });
                              setNamaLengkapOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !formData.nama_lengkap ? "opacity-100" : "opacity-0")} />
                            Input Manual
                          </CommandItem>
                          {employeesDataFull.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={emp.nm_pegawai}
                              onSelect={() => {
                                // Extract pangkat and golongan from uraian_pangkat
                                const pangkatName = extractPangkatName(emp.uraian_pangkat || "");
                                const golongan = extractGolonganFromCombined(emp.uraian_pangkat || "") || extractGolonganFromPangkat(emp.uraian_pangkat || "");
                                setFormData({ 
                                  ...formData, 
                                  nama_lengkap: emp.nm_pegawai,
                                  nip: emp.nip || "",
                                  pangkat: pangkatName,
                                  pangkat_golongan: golongan
                                });
                                setNamaLengkapOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.nama_lengkap === emp.nm_pegawai ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span>{emp.nm_pegawai}</span>
                                <span className="text-xs text-muted-foreground">{emp.nip} - {emp.uraian_pangkat}</span>
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
                <Label>NIP *</Label>
                <Input
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Otomatis dari vlookup"
                  className={formData.nip ? "bg-muted" : ""}
                />
              </div>
              
              {/* Row 2: Pangkat, Golongan, TMT Pangkat */}
              <div className="space-y-2">
                <Label>Pangkat</Label>
                <Input
                  value={formData.pangkat}
                  onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                  placeholder="Otomatis dari vlookup"
                  className={formData.pangkat ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Golongan</Label>
                <Select 
                  value={formData.pangkat_golongan || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, pangkat_golongan: v === "none" ? "" : v })}
                >
                  <SelectTrigger className={formData.pangkat_golongan ? "bg-muted" : ""}>
                    <SelectValue placeholder="Pilih golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {GOLONGAN_OPTIONS.map(gol => (
                      <SelectItem key={gol} value={gol}>{gol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>TMT Pangkat</Label>
                <Input
                  type="date"
                  value={formData.tmt_pangkat}
                  onChange={(e) => setFormData({ ...formData, tmt_pangkat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pendidikan</Label>
                <Select 
                  value={formData.pendidikan || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, pendidikan: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pendidikan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {PENDIDIKAN_OPTIONS.map(pend => (
                      <SelectItem key={pend} value={pend}>{pend}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Row 3: Lokasi Pendidikan Terakhir, Jabatan Lama, Grade Lama */}
              <div className="space-y-2">
                <Label>Lokasi Pendidikan Terakhir</Label>
                <Input
                  value={formData.lokasi_pendidikan_terakhir}
                  onChange={(e) => setFormData({ ...formData, lokasi_pendidikan_terakhir: e.target.value })}
                  placeholder="Lokasi pendidikan terakhir"
                />
              </div>
              <div className="space-y-2">
                <Label>Jabatan Lama</Label>
                <Input
                  value={formData.jabatan}
                  onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                  placeholder="Jabatan lama pegawai"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Lama</Label>
                <Input
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="Grade lama"
                />
              </div>
              
              {/* Row 4: Akumulasi Masa Kerja, TMT Terakhir, Jabatan Baru */}
              <div className="space-y-2">
                <Label>Akumulasi Masa Kerja</Label>
                <Input
                  value={formData.akumulasi_masa_kerja}
                  onChange={(e) => setFormData({ ...formData, akumulasi_masa_kerja: e.target.value })}
                  placeholder="Contoh: 10 tahun 5 bulan"
                />
              </div>
              <div className="space-y-2">
                <Label>TMT Terakhir</Label>
                <Input
                  type="date"
                  value={formData.tmt_terakhir}
                  onChange={(e) => setFormData({ ...formData, tmt_terakhir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Riwayat Tahun Lalu</Label>
                <Select 
                  value={formData.riwayat_tahun_lalu || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, riwayat_tahun_lalu: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {RIWAYAT_TAHUN_LALU_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jabatan Baru</Label>
                {/* For PU klaster: show dropdown with eligible jabatan options based on grade, golongan, and pendidikan */}
                {formData.jenis === "PU" && (formData.grade_baru || formData.grade) ? (
                  (() => {
                    const gradeBaru = parseInt(formData.grade_baru || formData.grade || "0");
                    const jabatanOptions = getJabatanBaruOptionsForPU(
                      gradeBaru,
                      formData.pangkat_golongan || "",
                      formData.pendidikan || "",
                      daftarGradeData
                    );
                    const eligibleOptions = jabatanOptions.filter(opt => opt.eligible);
                    const ineligibleOptions = jabatanOptions.filter(opt => !opt.eligible);
                    
                    return (
                      <div className="space-y-1">
                        <Select
                          value={formData.jabatan_baru || ""}
                          onValueChange={(v) => setFormData({ ...formData, jabatan_baru: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jabatan baru..." />
                          </SelectTrigger>
                          <SelectContent>
                            {eligibleOptions.length > 0 && (
                              <>
                                <SelectItem value="__header_eligible" disabled className="font-semibold text-green-700">
                                  ✓ Memenuhi Syarat
                                </SelectItem>
                                {eligibleOptions.map(opt => (
                                  <SelectItem key={opt.jabatan} value={opt.jabatan}>
                                    {opt.jabatan} ({opt.syarat_golongan} / {opt.syarat_pendidikan})
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {ineligibleOptions.length > 0 && (
                              <>
                                <SelectItem value="__header_ineligible" disabled className="font-semibold text-red-700">
                                  ✗ Belum Memenuhi Syarat
                                </SelectItem>
                                {ineligibleOptions.map(opt => (
                                  <SelectItem key={opt.jabatan} value={opt.jabatan} className="text-muted-foreground">
                                    {opt.jabatan} ({opt.syarat_golongan} / {opt.syarat_pendidikan})
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {jabatanOptions.length === 0 && (
                              <SelectItem value="" disabled>Tidak ada opsi untuk grade ini</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {eligibleOptions.length === 0 && ineligibleOptions.length > 0 && (
                          <p className="text-xs text-destructive">
                            Tidak ada jabatan yang memenuhi syarat golongan/pendidikan Anda
                          </p>
                        )}
                      </div>
                    );
                  })()
                ) : formData.jenis === "PTB" || formData.jenis === "PK" ? (
                  // For PTB and PK: Show single fixed jabatan based on grade
                  (() => {
                    const gradeBaru = parseInt(formData.grade_baru || formData.grade || "0");
                    const fixedJabatan = formData.jenis === "PTB" 
                      ? getPTBJabatan(gradeBaru, daftarGradeData)
                      : getPKJabatan(gradeBaru, daftarGradeData);
                    
                    // Auto-set if not already set
                    if (fixedJabatan && formData.jabatan_baru !== fixedJabatan) {
                      setTimeout(() => setFormData({ ...formData, jabatan_baru: fixedJabatan }), 0);
                    }
                    
                    return (
                      <Input
                        value={fixedJabatan || formData.jabatan_baru || ""}
                        readOnly
                        className="bg-muted"
                        placeholder="Otomatis dari klaster dan grade"
                      />
                    );
                  })()
                ) : (
                  // Default: allow manual input
                  <Input
                    value={formData.jabatan_baru}
                    onChange={(e) => setFormData({ ...formData, jabatan_baru: e.target.value })}
                    placeholder="Jabatan baru pegawai"
                  />
                )}
              </div>
              
              {/* Row 5: Grade Baru (auto-calculated), Akumulasi Terakhir, TMT Peringkat Baru */}
              <div className="space-y-2">
                <Label>Grade Baru</Label>
                <Input
                  value={formData.rekomendasi && formData.grade 
                    ? calculateGradeBaru(formData.grade, formData.rekomendasi) 
                    : formData.grade_baru || ""}
                  onChange={(e) => setFormData({ ...formData, grade_baru: e.target.value })}
                  placeholder="Auto dari rekomendasi"
                  disabled={!!formData.rekomendasi && !!formData.grade}
                  className={formData.rekomendasi && formData.grade ? "bg-muted" : ""}
                />
                {formData.rekomendasi && formData.grade && (
                  <p className="text-xs text-muted-foreground">Otomatis dari rekomendasi</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Akumulasi Terakhir</Label>
                <Input
                  value={formData.akumulasi_terakhir}
                  onChange={(e) => setFormData({ ...formData, akumulasi_terakhir: e.target.value })}
                  placeholder="Akumulasi terakhir"
                />
              </div>
              <div className="space-y-2">
                <Label>TMT Peringkat Baru</Label>
                <Input
                  type="date"
                  value={formData.tmt_peringkat_baru}
                  onChange={(e) => setFormData({ ...formData, tmt_peringkat_baru: e.target.value })}
                />
              </div>
              
              {/* Row 6: Eselon III, Eselon IV, PKT 2024 */}
              <div className="space-y-2">
                <Label>Eselon III</Label>
                <Input
                  value={formData.eselon_iii}
                  onChange={(e) => {
                    const newEselonIII = e.target.value;
                    // Auto-fill Atasan dari Atasan based on Eselon III
                    const atasanDariAtasan = findAtasanDariAtasan(newEselonIII, employeesDataFull);
                    // Auto-fill Atasan Langsung based on Eselon IV and Eselon III
                    const atasanLangsung = findAtasanLangsung(formData.eselon_iv, newEselonIII, employeesDataFull);
                    
                    setFormData({ 
                      ...formData, 
                      eselon_iii: newEselonIII,
                      atasan_dari_atasan_id: atasanDariAtasan?.id || formData.atasan_dari_atasan_id,
                      atasan_dari_atasan_nama: atasanDariAtasan?.nm_pegawai || formData.atasan_dari_atasan_nama,
                      atasan_langsung_id: atasanLangsung?.id || formData.atasan_langsung_id,
                      atasan_langsung_nama: atasanLangsung?.nm_pegawai || formData.atasan_langsung_nama,
                    });
                  }}
                  placeholder="Nama Eselon III"
                />
              </div>
              <div className="space-y-2">
                <Label>Eselon IV</Label>
                <Input
                  value={formData.eselon_iv}
                  onChange={(e) => {
                    const newEselonIV = e.target.value;
                    // Auto-fill Atasan Langsung based on Eselon IV and Eselon III
                    const atasanLangsung = findAtasanLangsung(newEselonIV, formData.eselon_iii, employeesDataFull);
                    
                    setFormData({ 
                      ...formData, 
                      eselon_iv: newEselonIV,
                      atasan_langsung_id: atasanLangsung?.id || formData.atasan_langsung_id,
                      atasan_langsung_nama: atasanLangsung?.nm_pegawai || formData.atasan_langsung_nama,
                    });
                  }}
                  placeholder="Nama Eselon IV"
                />
              </div>
              <div className="space-y-2">
                <Label>PKT 2024</Label>
                <Select 
                  value={formData.pkt_2024 || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, pkt_2024: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih PKT 2024" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum Ada</SelectItem>
                    {PKT_OPTIONS.map(pkt => (
                      <SelectItem key={pkt} value={pkt}>{pkt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Row 7: PKT 2025, Hukuman Disiplin, Tugas Belajar */}
              <div className="space-y-2">
                <Label>PKT 2025</Label>
                <Select 
                  value={formData.pkt_2025 || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, pkt_2025: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih PKT 2025" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum Ada</SelectItem>
                    {PKT_OPTIONS.map(pkt => (
                      <SelectItem key={pkt} value={pkt}>{pkt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hukuman Disiplin</Label>
                <Select 
                  value={formData.hukuman_disiplin ? "ya" : "tidak"} 
                  onValueChange={(v) => setFormData({ ...formData, hukuman_disiplin: v === "ya" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tidak">Tidak</SelectItem>
                    <SelectItem value="ya">Ya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tugas Belajar</Label>
                <Select 
                  value={formData.tugas_belajar ? "ya" : "tidak"} 
                  onValueChange={(v) => setFormData({ ...formData, tugas_belajar: v === "ya" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tidak">Tidak</SelectItem>
                    <SelectItem value="ya">Ya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Row 8: UPKP, Kemampuan Kerja, Jenis */}
              <div className="space-y-2">
                <Label>UPKP</Label>
                <Select 
                  value={formData.upkp ? "ya" : "tidak"} 
                  onValueChange={(v) => setFormData({ ...formData, upkp: v === "ya" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tidak">Tidak</SelectItem>
                    <SelectItem value="ya">Ya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kemampuan Kerja</Label>
                <Select 
                  value={formData.kemampuan_kerja || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, kemampuan_kerja: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {KEMAMPUAN_KERJA_OPTIONS.map(kk => (
                      <SelectItem key={kk} value={kk}>{kk}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select 
                  value={formData.jenis || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, jenis: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {JENIS_OPTIONS.map(jenis => (
                      <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Row 9: Rekomendasi, Atasan Langsung, Atasan dari Atasan */}
              <div className="space-y-2">
                <Label>Rekomendasi</Label>
                <Select 
                  value={formData.rekomendasi || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, rekomendasi: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Rekomendasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {REKOMENDASI_OPTIONS.map(rek => (
                      <SelectItem key={rek} value={rek}>{rek}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Atasan Langsung <span className="text-xs text-muted-foreground">(auto dari Eselon IV)</span></Label>
                <Popover open={atasanLangsungOpen} onOpenChange={setAtasanLangsungOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={atasanLangsungOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.atasan_langsung_id
                        ? employeesData.find((emp) => emp.id === formData.atasan_langsung_id)?.nm_pegawai || "Pilih..."
                        : "Pilih..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari nama pegawai..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setFormData({ ...formData, atasan_langsung_id: "", atasan_langsung_nama: "" });
                              setAtasanLangsungOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !formData.atasan_langsung_id ? "opacity-100" : "opacity-0")} />
                            Pilih...
                          </CommandItem>
                          {employeesData.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={emp.nm_pegawai}
                              onSelect={() => {
                                setFormData({ 
                                  ...formData, 
                                  atasan_langsung_id: emp.id,
                                  atasan_langsung_nama: emp.nm_pegawai
                                });
                                setAtasanLangsungOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.atasan_langsung_id === emp.id ? "opacity-100" : "opacity-0")} />
                              {emp.nm_pegawai}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Atasan dari Atasan <span className="text-xs text-muted-foreground">(auto dari Eselon III)</span></Label>
                <Popover open={atasanDariAtasanOpen} onOpenChange={setAtasanDariAtasanOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={atasanDariAtasanOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.atasan_dari_atasan_id
                        ? employeesData.find((emp) => emp.id === formData.atasan_dari_atasan_id)?.nm_pegawai || "Pilih..."
                        : "Pilih..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari nama pegawai..." />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setFormData({ ...formData, atasan_dari_atasan_id: "", atasan_dari_atasan_nama: "" });
                              setAtasanDariAtasanOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", !formData.atasan_dari_atasan_id ? "opacity-100" : "opacity-0")} />
                            Pilih...
                          </CommandItem>
                          {employeesData.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={emp.nm_pegawai}
                              onSelect={() => {
                                setFormData({ 
                                  ...formData, 
                                  atasan_dari_atasan_id: emp.id,
                                  atasan_dari_atasan_nama: emp.nm_pegawai
                                });
                                setAtasanDariAtasanOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", formData.atasan_dari_atasan_id === emp.id ? "opacity-100" : "opacity-0")} />
                              {emp.nm_pegawai}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </ScrollArea>
          <p className="text-xs text-muted-foreground italic mt-4">
            Catatan: PKT (Predikat Kinerja Tahunan) - poin diambil dari HEK DEK atau KEP K3
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setBigDataDialogOpen(false); setEditingData(null); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleBigDataSubmit}>
              {editingData ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permohonan Dialog */}
      <Dialog open={permohonanDialogOpen} onOpenChange={(open) => { setPermohonanDialogOpen(open); if (!open) { setEditingPermohonan(null); resetPermohonanForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingPermohonan ? "Edit Data Permohonan" : "Tambah Data Permohonan"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nomor KEP *</Label>
                <Input
                  value={permohonanFormData.nomor_kep}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, nomor_kep: e.target.value })}
                  placeholder="Nomor KEP"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal KEP</Label>
                <Input
                  type="date"
                  value={permohonanFormData.tanggal_kep}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, tanggal_kep: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hal</Label>
                <Select value={permohonanFormData.hal || "none"} onValueChange={(v) => handleHalChange(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Hal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {HAL_OPTIONS.map(hal => (
                      <SelectItem key={hal} value={hal}>{hal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Kategori Mekanisme 54 - shown when Hal is selected */}
              {permohonanFormData.hal && (
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-sm font-medium">Kategori Penetapan ({permohonanFormData.hal})</Label>
                  <div className="p-3 bg-muted/30 rounded-lg border max-h-64 overflow-y-auto">
                    {(() => {
                      const grouped = getMekanisme54ForHal(permohonanFormData.hal || "");
                      const subJenisOrder = ["PU", "PK", "PTB"];
                      const subJenisLabels: Record<string, string> = { PU: "Pelaksana Umum", PK: "Pelaksana Khusus", PTB: "Pelaksana Tugas Belajar" };
                      if (Object.keys(grouped).length === 0) return <p className="text-sm text-muted-foreground">Tidak ada data kategori</p>;
                      return (
                        <div className="space-y-3">
                          {subJenisOrder.map(sj => {
                            if (!grouped[sj]) return null;
                            return (
                              <div key={sj}>
                                <p className="text-xs font-semibold text-primary mb-1">{subJenisLabels[sj] || sj} ({grouped[sj].length} kategori)</p>
                                <div className="space-y-1 ml-2">
                                  {grouped[sj].map(cat => {
                                    // Each category has its own unique title from deskripsi
                                    const categoryTitle = cat.deskripsi.toUpperCase();
                                    const isSelected = selectedLampiranTitle === categoryTitle;
                                    
                                    return (
                                      <div key={cat.id} className="flex items-start gap-2">
                                        <Checkbox
                                          id={`cat-${cat.id}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedLampiranTitle(categoryTitle);
                                            } else if (isSelected) {
                                              setSelectedLampiranTitle("");
                                            }
                                          }}
                                          className="mt-0.5"
                                        />
                                        <label 
                                          htmlFor={`cat-${cat.id}`}
                                          className="text-xs text-muted-foreground cursor-pointer"
                                        >
                                          <span className="font-medium text-foreground">{cat.kode_kategori}</span> - {cat.deskripsi}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  
                   {/* Title preview and additional options */}
                   <div className="space-y-2">
                     <Label className="text-xs text-muted-foreground">Pilih judul tabel untuk lampiran Word:</Label>
                     <Select
                       value={selectedLampiranTitle || "none"}
                       onValueChange={(v) => setSelectedLampiranTitle(v === "none" ? "" : v)}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Pilih judul lampiran..." />
                       </SelectTrigger>
                       <SelectContent className="max-h-64">
                         <SelectItem value="none">Pilih judul lampiran...</SelectItem>
                         {(() => {
                           const grouped = getMekanisme54ForHal(permohonanFormData.hal || "");
                           const allCategories: Mekanisme54CategoryOption[] = [];
                           const subJenisOrder = ["PU", "PK", "PTB"];
                           subJenisOrder.forEach(sj => {
                             if (grouped[sj]) {
                               grouped[sj].forEach(cat => allCategories.push(cat));
                             }
                           });
                           return allCategories.map((cat, idx) => {
                             const title = cat.deskripsi.toUpperCase();
                             return (
                               <SelectItem key={idx} value={title} className="text-xs">
                                 {cat.kode_kategori} - {cat.deskripsi}
                               </SelectItem>
                             );
                           });
                         })()}
                         <SelectItem value="PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL" className="text-xs">
                           Default - PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL
                         </SelectItem>
                       </SelectContent>
                     </Select>
                     {selectedLampiranTitle && (
                       <div className="p-2 bg-primary/5 rounded border border-primary/20">
                         <p className="text-xs text-primary">
                           ✓ Judul lampiran terpilih:
                         </p>
                         <p className="text-xs font-medium text-foreground mt-1">{selectedLampiranTitle}</p>
                       </div>
                     )}
                   </div>
                </div>
              )}
              <div className="space-y-2 md:col-span-3">
                <Label>Pilih dari Big Data {!editingPermohonan && "(Bisa memilih lebih dari 1 pegawai)"}</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="flex-1 justify-between font-normal"
                      >
                        {permohonanFormData.grading_id && permohonanFormData.grading_id !== "none"
                          ? `${gradingData.find(g => g.id === permohonanFormData.grading_id)?.nama_lengkap || ""} - ${gradingData.find(g => g.id === permohonanFormData.grading_id)?.nip || ""}`
                          : "Cari dan pilih pegawai dari Big Data..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Cari nama atau NIP..." 
                          value={bigDataSelectSearchTerm}
                          onValueChange={setBigDataSelectSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value=""
                              onSelect={() => handleSelectPegawaiForPermohonan("none")}
                            >
                              <Check className={cn("mr-2 h-4 w-4", !permohonanFormData.grading_id || permohonanFormData.grading_id === "none" ? "opacity-100" : "opacity-0")} />
                              Input Manual
                            </CommandItem>
                            {gradingData
                              .filter(data => 
                                !bigDataSelectSearchTerm || 
                                data.nama_lengkap.toLowerCase().includes(bigDataSelectSearchTerm.toLowerCase()) ||
                                data.nip.includes(bigDataSelectSearchTerm)
                              )
                              .slice(0, 50)
                              .map((data) => (
                                <CommandItem
                                  key={data.id}
                                  value={`${data.nama_lengkap} ${data.nip}`}
                                  onSelect={() => {
                                    handleSelectPegawaiForPermohonan(data.id);
                                    setBigDataSelectSearchTerm("");
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", permohonanFormData.grading_id === data.id ? "opacity-100" : "opacity-0")} />
                                  {data.nama_lengkap} - {data.nip}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {permohonanFormData.grading_id && permohonanFormData.grading_id !== "none" && (
                    <Button
                      type="button"
                      onClick={() => handleAddEmployeeToPermohonan(permohonanFormData.grading_id!)}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Tambah Pegawai
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Multi-Employee Preview Section */}
              {permohonanSelectedEmployees.length > 0 && (
                <div className="md:col-span-3 space-y-2">
                  <Label className="font-semibold">Preview Pegawai Terpilih ({permohonanSelectedEmployees.length} orang)</Label>
                  <div className="rounded-md border max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">No</TableHead>
                          <TableHead>Nama Lengkap</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead>Grade Lama → Baru</TableHead>
                          <TableHead className="w-12">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {permohonanSelectedEmployees.map((emp, idx) => (
                          <TableRow key={emp.grading_id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">{emp.nama_lengkap}</TableCell>
                            <TableCell>{emp.nip}</TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">{emp.grade_lama}</span>
                              <span className="mx-1">→</span>
                              <span className="font-medium text-green-600">{emp.grade_baru || emp.grade_lama}</span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEmployeeFromPermohonan(emp.grading_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pegawai di atas akan ditambahkan dengan nomor KEP, tanggal, hal, dari, dan ke yang sama.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Nama Lengkap *</Label>
                <Input
                  value={permohonanFormData.nama_lengkap}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, nama_lengkap: e.target.value })}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  value={permohonanFormData.nip}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, nip: e.target.value })}
                  placeholder="NIP"
                />
              </div>
              <div className="space-y-2">
                <Label>Pangkat/Gol/TMT</Label>
                <Input
                  value={permohonanFormData.pangkat_gol_tmt}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, pangkat_gol_tmt: e.target.value })}
                  placeholder="Pangkat/Gol/TMT"
                />
              </div>
              <div className="space-y-2">
                <Label>Pendidikan</Label>
                <Input
                  value={permohonanFormData.pendidikan}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, pendidikan: e.target.value })}
                  placeholder="Pendidikan"
                />
              </div>
              <div className="space-y-2">
                <Label>Jabatan Lama</Label>
                <Input
                  value={permohonanFormData.jabatan_lama}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, jabatan_lama: e.target.value })}
                  placeholder="Jabatan lama dari Big Data"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Lama</Label>
                <Input
                  value={permohonanFormData.grade_lama}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, grade_lama: e.target.value })}
                  placeholder="Grade lama dari Big Data"
                />
              </div>
              <div className="space-y-2">
                <Label>Jabatan Baru</Label>
                <Input
                  value={permohonanFormData.jabatan_baru}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, jabatan_baru: e.target.value })}
                  placeholder="Jabatan baru dari Single Core"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade Baru</Label>
                <Input
                  value={permohonanFormData.grade_baru}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, grade_baru: e.target.value })}
                  placeholder="Grade baru dari Single Core"
                />
              </div>
              <div className="space-y-2">
                <Label>TMT Peringkat Terakhir</Label>
                <Input
                  type="date"
                  value={permohonanFormData.tmt_peringkat_terakhir}
                  onChange={(e) => setPermohonanFormData({ ...permohonanFormData, tmt_peringkat_terakhir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Dari *</Label>
                <Select 
                  value={permohonanFormData.dari || "none"} 
                  onValueChange={(v) => {
                    const newDari = v === "none" ? "" : v;
                    setPermohonanFormData(prev => ({
                      ...prev, 
                      dari: newDari,
                      // Auto-generate hal when dari is PK and ke is PU
                      hal: (newDari === "PK" && prev.ke === "PU") ? "Simulasi" : prev.hal
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {DARI_KE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ke *</Label>
                <Select 
                  value={permohonanFormData.ke || "none"} 
                  onValueChange={(v) => {
                    const newKe = v === "none" ? "" : v;
                    setPermohonanFormData(prev => ({
                      ...prev, 
                      ke: newKe,
                      // Auto-generate hal when dari is PK and ke is PU
                      hal: (prev.dari === "PK" && newKe === "PU") ? "Simulasi" : prev.hal
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {DARI_KE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Show Kelengkapan Data info when PK to PU is selected */}
              {permohonanFormData.dari === "PK" && permohonanFormData.ke === "PU" && (
                <div className="md:col-span-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary">Simulasi Aktif</Badge>
                      <span className="text-sm font-medium">Kelengkapan Data Pelaksana</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ✓ Rekomendasi Hasil Simulasi akan diproses berdasarkan data Big Data
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setPermohonanDialogOpen(false); setEditingPermohonan(null); resetPermohonanForm(); }}>
              Batal
            </Button>
            <Button onClick={handlePermohonanSubmit}>
              {editingPermohonan ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* KEP & Salinan Dialog */}
      <Dialog open={kepSalinanDialogOpen} onOpenChange={setKepSalinanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Data KEP & Salinan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Pegawai *</Label>
              <Select value={kepFormData.grading_id || "none"} onValueChange={(v) => setKepFormData({ ...kepFormData, grading_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pegawai dari Big Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih pegawai...</SelectItem>
                  {gradingData.map(data => (
                    <SelectItem key={data.id} value={data.id}>
                      {data.nama_lengkap} - {data.nip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nomor KEP *</Label>
              <Input
                value={kepFormData.nomor_kep}
                onChange={(e) => setKepFormData({ ...kepFormData, nomor_kep: e.target.value })}
                placeholder="Nomor KEP"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal KEP</Label>
              <Input
                type="date"
                value={kepFormData.tanggal_kep}
                onChange={(e) => setKepFormData({ ...kepFormData, tanggal_kep: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis Dokumen</Label>
              <Select value={kepFormData.jenis_dokumen || "none"} onValueChange={(v) => setKepFormData({ ...kepFormData, jenis_dokumen: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dokumen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih jenis...</SelectItem>
                  <SelectItem value="KEP">KEP</SelectItem>
                  <SelectItem value="Salinan">Salinan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                value={kepFormData.keterangan}
                onChange={(e) => setKepFormData({ ...kepFormData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setKepSalinanDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleKepSalinanSubmit}>
              Tambah Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Petikan Dialog */}
      <Dialog open={petikanDialogOpen} onOpenChange={setPetikanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Data Petikan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Pegawai *</Label>
              <Select value={petikanFormData.grading_id || "none"} onValueChange={(v) => setPetikanFormData({ ...petikanFormData, grading_id: v === "none" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pegawai dari Big Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih pegawai...</SelectItem>
                  {gradingData.map(data => (
                    <SelectItem key={data.id} value={data.id}>
                      {data.nama_lengkap} - {data.nip}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nomor Petikan *</Label>
              <Input
                value={petikanFormData.nomor_petikan}
                onChange={(e) => setPetikanFormData({ ...petikanFormData, nomor_petikan: e.target.value })}
                placeholder="Nomor Petikan"
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Petikan</Label>
              <Input
                type="date"
                value={petikanFormData.tanggal_petikan}
                onChange={(e) => setPetikanFormData({ ...petikanFormData, tanggal_petikan: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                value={petikanFormData.keterangan}
                onChange={(e) => setPetikanFormData({ ...petikanFormData, keterangan: e.target.value })}
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPetikanDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handlePetikanSubmit}>
              Tambah Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Daftar Grade Dialog */}
      <Dialog open={daftarGradeDialogOpen} onOpenChange={(open) => { setDaftarGradeDialogOpen(open); if (!open) { setEditingDaftarGrade(null); resetDaftarGradeForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDaftarGrade ? "Edit Daftar Grade" : "Tambah Daftar Grade"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Klaster *</Label>
              <Select 
                value={daftarGradeFormData.klaster || "none"} 
                onValueChange={(v) => setDaftarGradeFormData({ 
                  ...daftarGradeFormData, 
                  klaster: v === "none" ? "" : v,
                  // Reset conditional fields when klaster changes
                  tugas_jabatan: v === "PK" ? daftarGradeFormData.tugas_jabatan : "",
                  syarat_pendidikan: v !== "PTB" ? daftarGradeFormData.syarat_pendidikan : "",
                  syarat_golongan: v !== "PTB" ? daftarGradeFormData.syarat_golongan : "",
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih klaster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih klaster...</SelectItem>
                  {KLASTER_OPTIONS.map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade *</Label>
              <Input
                type="number"
                value={daftarGradeFormData.grade || ""}
                onChange={(e) => setDaftarGradeFormData({ ...daftarGradeFormData, grade: parseInt(e.target.value) || 0 })}
                placeholder="Masukkan grade (angka)"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Jabatan *</Label>
              <Input
                value={daftarGradeFormData.jabatan || ""}
                onChange={(e) => setDaftarGradeFormData({ ...daftarGradeFormData, jabatan: e.target.value })}
                placeholder="Masukkan nama jabatan"
              />
            </div>
            
            {/* Tugas Jabatan - only for PK */}
            {daftarGradeFormData.klaster === "PK" && (
              <div className="space-y-2">
                <Label>Tugas Jabatan</Label>
                <Input
                  value={daftarGradeFormData.tugas_jabatan || ""}
                  onChange={(e) => setDaftarGradeFormData({ ...daftarGradeFormData, tugas_jabatan: e.target.value })}
                  placeholder="Masukkan tugas jabatan"
                />
              </div>
            )}
            
            {/* Syarat Pendidikan - for PU and PK - Multi-select checkboxes */}
            {(daftarGradeFormData.klaster === "PU" || daftarGradeFormData.klaster === "PK") && (
              <div className="space-y-2">
                <Label>Syarat Pendidikan</Label>
                <div className="flex flex-wrap gap-3 p-3 border rounded-md bg-muted/30">
                  {PENDIDIKAN_OPTIONS.map(p => {
                    const selectedPendidikan = (daftarGradeFormData.syarat_pendidikan || "").split(",").map(s => s.trim()).filter(Boolean);
                    const isChecked = selectedPendidikan.includes(p);
                    return (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updated: string[];
                            if (e.target.checked) {
                              updated = [...selectedPendidikan, p];
                            } else {
                              updated = selectedPendidikan.filter(s => s !== p);
                            }
                            setDaftarGradeFormData({ 
                              ...daftarGradeFormData, 
                              syarat_pendidikan: updated.join(", ") 
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{p}</span>
                      </label>
                    );
                  })}
                </div>
                {daftarGradeFormData.syarat_pendidikan && (
                  <p className="text-xs text-muted-foreground">
                    Dipilih: {daftarGradeFormData.syarat_pendidikan}
                  </p>
                )}
              </div>
            )}
            
            {/* Syarat Golongan - for PU and PK */}
            {(daftarGradeFormData.klaster === "PU" || daftarGradeFormData.klaster === "PK") && (
              <div className="space-y-2">
                <Label>Syarat Golongan</Label>
                <Select 
                  value={daftarGradeFormData.syarat_golongan || "none"} 
                  onValueChange={(v) => setDaftarGradeFormData({ ...daftarGradeFormData, syarat_golongan: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih syarat golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Pilih...</SelectItem>
                    {GOLONGAN_OPTIONS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDaftarGradeDialogOpen(false); setEditingDaftarGrade(null); resetDaftarGradeForm(); }}>
              Batal
            </Button>
            <Button onClick={handleDaftarGradeSubmit}>
              {editingDaftarGrade ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PU Syarat General Dialog */}
      <Dialog open={puSyaratDialogOpen} onOpenChange={(open) => { setPuSyaratDialogOpen(open); if (!open) { setEditingPuSyarat(null); resetPuSyaratForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPuSyarat ? "Edit PU Syarat General" : "Tambah PU Syarat General"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis *</Label>
              <Select 
                value={puSyaratFormData.jenis || "none"} 
                onValueChange={(v) => setPuSyaratFormData({ ...puSyaratFormData, jenis: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  <SelectItem value="golongan">Golongan</SelectItem>
                  <SelectItem value="pendidikan">Pendidikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Syarat *</Label>
              <Input
                value={puSyaratFormData.syarat || ""}
                onChange={(e) => setPuSyaratFormData({ ...puSyaratFormData, syarat: e.target.value })}
                placeholder={puSyaratFormData.jenis === "golongan" ? "Contoh: III/c - IV/e" : "Contoh: S1,D4,S2,S3"}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Grade *</Label>
              <Input
                type="number"
                value={puSyaratFormData.max_grade || ""}
                onChange={(e) => setPuSyaratFormData({ ...puSyaratFormData, max_grade: parseInt(e.target.value) || 0 })}
                placeholder="Masukkan max grade (angka)"
                min={1}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setPuSyaratDialogOpen(false); setEditingPuSyarat(null); resetPuSyaratForm(); }}>
              Batal
            </Button>
            <Button onClick={handlePuSyaratSubmit}>
              {editingPuSyarat ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => { setDeleteId(null); setDeleteType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Daftar Grade Confirmation Dialog */}
      <AlertDialog open={deleteAllDaftarGradeOpen} onOpenChange={setDeleteAllDaftarGradeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Daftar Grade?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data Daftar Grade? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllDaftarGrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Big Data Confirmation Dialog */}
      <AlertDialog open={deleteAllBigDataOpen} onOpenChange={setDeleteAllBigDataOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Big Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data Big Data? Data terkait di Permohonan juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllBigData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Permohonan Confirmation Dialog */}
      <AlertDialog open={deleteAllPermohonanOpen} onOpenChange={setDeleteAllPermohonanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Permohonan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data Permohonan? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllPermohonan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Kuesioner Confirmation Dialog */}
      <AlertDialog open={deleteAllKuesionerOpen} onOpenChange={setDeleteAllKuesionerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Kuesioner?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data Kuesioner? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllKuesioner} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Simulasi Confirmation Dialog */}
      <AlertDialog open={deleteAllSimulasiOpen} onOpenChange={setDeleteAllSimulasiOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Simulasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data Simulasi? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllSimulasi} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Single Core Confirmation Dialog */}
      <AlertDialog open={deleteAllSingleCoreOpen} onOpenChange={setDeleteAllSingleCoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data Single Core?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan menghapus semua data Big Data (Single Core). Data terkait di Permohonan juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllBigData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tambah Kuesioner Dialog */}
      <TambahKuesionerDialog
        open={kuesionerDialogOpen}
        onOpenChange={setKuesionerDialogOpen}
        gradingData={gradingData}
        onSuccess={fetchKuesionerData}
        existingKuesionerNIPs={kuesionerData.map(k => k.nip).filter(Boolean)}
      />

      {/* Kuesioner Form Dialog */}
      <KuesionerFormDialog
        open={kuesionerFormDialogOpen}
        onOpenChange={setKuesionerFormDialogOpen}
        kuesionerData={selectedKuesioner}
        onSuccess={fetchKuesionerData}
      />

      {/* Simulasi Dialog */}
      <SimulasiDialog
        open={simulasiDialogOpen}
        onOpenChange={setSimulasiDialogOpen}
        editingData={editingSimulasi}
        onSuccess={fetchSimulasiData}
      />
      {/* Lampiran Word Selection Dialog */}
      <Dialog open={lampiranWordDialogOpen} onOpenChange={setLampiranWordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Pilih Data untuk Generate Lampiran Word</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-4">
            <div className="space-y-3">
              {/* Select All / Deselect All */}
              <div className="flex items-center gap-3 pb-2 border-b">
                <Checkbox
                  checked={lampiranWordSelectedIds.size === filteredPermohonanData.length && filteredPermohonanData.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setLampiranWordSelectedIds(new Set(filteredPermohonanData.map(d => d.id)));
                    } else {
                      setLampiranWordSelectedIds(new Set());
                    }
                  }}
                />
                <span className="text-sm font-medium">Pilih Semua ({filteredPermohonanData.length} data)</span>
              </div>
              {/* Group by No KEP */}
              {Object.entries(
                filteredPermohonanData.reduce((acc, d) => {
                  const key = d.nomor_kep || "Tanpa No KEP";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(d);
                  return acc;
                }, {} as Record<string, typeof filteredPermohonanData>)
              ).map(([kepNo, items]) => (
                <div key={kepNo} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md">
                    <Checkbox
                      checked={items.every(d => lampiranWordSelectedIds.has(d.id))}
                      onCheckedChange={(checked) => {
                        const newSet = new Set(lampiranWordSelectedIds);
                        items.forEach(d => {
                          if (checked) newSet.add(d.id);
                          else newSet.delete(d.id);
                        });
                        setLampiranWordSelectedIds(newSet);
                      }}
                    />
                    <span className="text-sm font-semibold">KEP: {kepNo}</span>
                    <Badge variant="secondary" className="text-xs">{items.length} pegawai</Badge>
                    {items[0]?.hal && <Badge variant="outline" className="text-xs">{items[0].hal}</Badge>}
                  </div>
                  <div className="ml-6 space-y-0.5">
                    {items.map(d => (
                      <div key={d.id} className="flex items-center gap-2 py-0.5">
                        <Checkbox
                          checked={lampiranWordSelectedIds.has(d.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(lampiranWordSelectedIds);
                            if (checked) newSet.add(d.id);
                            else newSet.delete(d.id);
                            setLampiranWordSelectedIds(newSet);
                          }}
                        />
                        <span className="text-xs">{d.nama_lengkap}</span>
                        <span className="text-xs text-muted-foreground">({d.nip})</span>
                        {d.hal && <Badge variant="outline" className="text-[10px] py-0">{d.hal}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">{lampiranWordSelectedIds.size} dari {filteredPermohonanData.length} dipilih</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLampiranWordDialogOpen(false)}>Batal</Button>
              <Button 
                disabled={lampiranWordSelectedIds.size === 0}
                onClick={async () => {
                  setLampiranWordDialogOpen(false);
                  // Filter only selected items
                  const selectedData = filteredPermohonanData.filter(d => lampiranWordSelectedIds.has(d.id));
                  try {
                    const { data: eselonData } = await supabase
                      .from("eselonisasi")
                      .select("*")
                      .order("no_urut", { ascending: true });
                    const items = selectedData.map(data => {
                      const bigData = data.grading_id ? gradingData.find(g => g.id === data.grading_id) : null;
                      // Format pangkat_gol_tmt as "Pangkat / Gol / TMT" (e.g., "Pengatur Tk. I / II/d / 1 April 2023")
                      const pangkatGolTmt = bigData 
                        ? formatPangkatGolTmt(
                            bigData.pangkat || "",
                            bigData.pangkat_golongan || "",
                            bigData.tmt_pangkat || ""
                          )
                        : data.pangkat_gol_tmt || "";
                      
                      return {
                        nama_lengkap: data.nama_lengkap,
                        nip: data.nip || "",
                        pangkat_gol_tmt: pangkatGolTmt,
                        pendidikan: data.pendidikan || bigData?.pendidikan || "",
                        jabatan_lama: data.jabatan_lama || bigData?.jabatan || "",
                        grade_lama: data.grade_lama || bigData?.grade || "",
                        akumulasi_masa_kerja: bigData?.akumulasi_masa_kerja || "",
                        tmt_peringkat_terakhir: data.tmt_peringkat_terakhir || bigData?.tmt_terakhir || "",
                        jabatan_baru: data.jabatan_baru || bigData?.jabatan_baru || "",
                        grade_baru: data.grade_baru || bigData?.grade_baru || "",
                        tmt_peringkat_baru: bigData?.tmt_peringkat_baru || "",
                        pkt_2025: bigData?.pkt_2025 || "",
                        eselon_iii: bigData?.eselon_iii || "",
                        eselon_iv: bigData?.eselon_iv || "",
                      };
                    });
                    const nomorND = selectedData[0]?.nomor_kep || "ND-XX/KBC.1101/2026";
                    const tanggalND = selectedData[0]?.tanggal_kep || new Date().toISOString().split('T')[0];
                    // Use selected lampiran title or default
                    const title = selectedLampiranTitle || "PELAKSANA UMUM YANG DIMUTASIKAN ANTAR UNIT TERKECIL";
                    await generateLampiranPermohonanWordFromBigData(items, eselonData || [], nomorND, tanggalND, title);
                    toast.success("Lampiran Word berhasil di-generate");
                  } catch (error: any) {
                    toast.error(error.message || "Gagal generate lampiran Word");
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate ({lampiranWordSelectedIds.size})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
