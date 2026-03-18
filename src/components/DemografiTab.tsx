import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, GraduationCap, Clock, Pencil, Trash2, Calculator, X, Filter, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DemografiTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_pangkat: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
  jabatan_kategori?: string | null;
}

interface PendidikanData {
  pendidikan: string;
  satuan_kerja?: string;
}

interface PensiunData {
  usia_tahun: number;
  jenis_kelamin: string | null;
  unit_organisasi: string | null;
}

interface KantorStats {
  kantor: string;
  golIV: number;
  golIII: number;
  golII: number;
  golI: number;
  jumlah: number;
}

interface PendidikanStats {
  pendidikan: string;
  total: number;
  persentase: string;
}

interface UsiaStats {
  range: string;
  total: number;
  persentase: string;
}

interface GenderStats {
  gender: string;
  total: number;
  persentase: string;
}

interface CalculatorItem {
  name: string;
  count: number;
}

interface KantorJabatanStats {
  kantor: string;
  jabatanCounts: Record<string, number>;
  jumlah: number;
}

// Function to extract simplified jabatan from uraian_jabatan (same as JabatanTab)
function extractSimplifiedJabatan(uraianJabatan: string): string {
  if (!uraianJabatan) return "-";
  
  const jabatanLower = uraianJabatan.toLowerCase();
  
  // Kepala Kantor Wilayah - must be checked before Kepala Kantor
  if (jabatanLower.includes("kepala kantor wilayah")) {
    return "Kepala Kantor Wilayah";
  }
  
  // Kepala Kantor - includes KPPBC, Balai Laboratorium, etc.
  if (jabatanLower.includes("kepala kantor pengawasan") || 
      jabatanLower.includes("kepala kantor pelayanan") ||
      jabatanLower.includes("kepala kantor bea") ||
      jabatanLower.includes("kepala kantor balai")) {
    return "Kepala Kantor";
  }
  
  if (jabatanLower.includes("kepala bidang")) {
    return "Kepala Bidang";
  }
  if (jabatanLower.includes("kepala bagian")) {
    return "Kepala Bagian";
  }
  if (jabatanLower.includes("kepala seksi")) {
    return "Kepala Seksi";
  }
  if (jabatanLower.includes("kepala subbagian") || jabatanLower.includes("kasubbag")) {
    return "Kepala Subbagian";
  }
  
  // Pemeriksa categories
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli utama")) {
    return "Pemeriksa Bea dan Cukai Ahli Utama";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli madya") || jabatanLower.includes("pemeriksa bea dan cukai madya")) {
    return "Pemeriksa Bea dan Cukai Madya";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli muda") || jabatanLower.includes("pemeriksa bea dan cukai muda")) {
    return "Pemeriksa Bea dan Cukai Muda";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli pertama") || jabatanLower.includes("pemeriksa bea dan cukai pertama")) {
    return "Pemeriksa Bea dan Cukai Pertama";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai penyelia")) {
    return "Pemeriksa Bea dan Cukai Penyelia";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai mahir")) {
    return "Pemeriksa Bea dan Cukai Mahir";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai terampil")) {
    return "Pemeriksa Bea dan Cukai Terampil";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai lanjutan")) {
    return "Pemeriksa Bea dan Cukai Lanjutan";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai pelaksana")) {
    return "Pemeriksa Bea dan Cukai Pelaksana";
  }
  
  // Pelaksana categories
  if (jabatanLower.includes("pelaksana pemeriksa")) {
    return "Pelaksana Pemeriksa";
  }
  
  // Other functional positions
  if (jabatanLower.includes("pranata komputer")) {
    return "Pranata Komputer";
  }
  if (jabatanLower.includes("pranata keuangan apbn mahir")) {
    return "Pranata Keuangan APBN Mahir";
  }
  if (jabatanLower.includes("pranata keuangan apbn terampil")) {
    return "Pranata Keuangan APBN Terampil";
  }
  if (jabatanLower.includes("analis")) {
    return "Analis";
  }
  if (jabatanLower.includes("auditor")) {
    return "Auditor";
  }
  
  // Default: extract text before "pada" or comma
  const padaIndex = uraianJabatan.toLowerCase().indexOf(" pada ");
  if (padaIndex !== -1) {
    return uraianJabatan.substring(0, padaIndex).trim();
  }
  
  const commaIndex = uraianJabatan.indexOf(",");
  if (commaIndex !== -1) {
    return uraianJabatan.substring(0, commaIndex).trim();
  }
  
  return uraianJabatan.trim();
}

// Extract golongan from uraian_pangkat (e.g., "Penata Muda-III/a" => "III")
const extractGolongan = (uraianPangkat: string): string | null => {
  if (!uraianPangkat) return null;
  const match = uraianPangkat.match(/-\s*(IV|III|II|I)\/[a-z]/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
};

// Extract kantor name from nm_unit_organisasi - now returns full merged name
const extractKantor = (unitOrganisasi: string): string => {
  if (!unitOrganisasi) return "Tidak diketahui";

  if (unitOrganisasi.includes(",")) {
    const parts = unitOrganisasi.split(",");
    return parts.slice(1).join(",").trim();
  }
  
  return unitOrganisasi;
};

// Group kantor name for aggregation
const getGroupKantorName = (fullName: string): string => {
  const lower = fullName.toLowerCase();
  
  if (lower.includes("kantor wilayah") || lower.includes("kanwil")) {
    return "Kantor Wilayah Jawa Timur I";
  }
  
  if (lower.includes("tanjung perak")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak";
  if (lower.includes("juanda")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda";
  if (lower.includes("pasuruan")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean A Pasuruan";
  if (lower.includes("sidoarjo")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Sidoarjo";
  if (lower.includes("gresik")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik";
  if (lower.includes("bojonegoro")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro";
  if (lower.includes("madura")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Madura";
  if (lower.includes("balai laboratorium")) return "Balai Laboratorium Bea dan Cukai Surabaya";
  
  return fullName;
};

// Get sub-unit name for Kanwil breakdown
const getSubUnitName = (unitOrganisasi: string): string | null => {
  const lower = unitOrganisasi.toLowerCase();
  
  if (lower.includes("bagian umum")) return "Bagian Umum";
  if (lower.includes("bidang kepatuhan internal")) return "Bidang Kepatuhan Internal";
  if (lower.includes("bidang penindakan dan penyidikan")) return "Bidang Penindakan dan Penyidikan";
  if (lower.includes("bidang fasilitas kepabeanan")) return "Bidang Fasilitas Kepabeanan dan Cukai";
  if (lower.includes("bidang kepabeanan dan cukai")) return "Bidang Kepabeanan dan Cukai";
  if (lower.includes("kantor wilayah") || lower.includes("kanwil")) {
    if (!lower.includes("bagian") && !lower.includes("bidang")) {
      return "Kantor Wilayah Jawa Timur I";
    }
  }
  
  return null;
};

// Define pendidikan order - matching pendidikan table format
const PENDIDIKAN_ORDER = [
  "Sekolah Menengah Atas",
  "Diploma I",
  "Diploma III",
  "Diploma IV",
  "Sarjana",
  "Master",
  "Doktoral",
];

// Normalize pendidikan value to match pendidikan table format
const normalizePendidikan = (pendidikan: string): string => {
  if (!pendidikan) return "Tidak diketahui";
  const lower = pendidikan.toLowerCase().trim();
  
  if (lower === "sekolah menengah atas" || lower === "sma" || lower === "smk" || lower === "sma/smk") return "Sekolah Menengah Atas";
  if (lower === "diploma i" || lower === "di" || lower === "d1" || lower === "d-1") return "Diploma I";
  if (lower === "diploma iii" || lower === "diii" || lower === "d3" || lower === "d-3") return "Diploma III";
  if (lower === "diploma iv" || lower === "div" || lower === "d4" || lower === "d-4") return "Diploma IV";
  if (lower === "sarjana" || lower === "s1" || lower === "s-1") return "Sarjana";
  if (lower === "master" || lower === "s2" || lower === "s-2" || lower === "magister") return "Master";
  if (lower === "doktoral" || lower === "s3" || lower === "s-3" || lower === "doktor") return "Doktoral";
  
  return pendidikan;
};

// Get short display name for satuan kerja
const getShortDisplayName = (kantor: string): string => {
  return kantor
    .replace("Kantor Pengawasan dan Pelayanan Bea dan Cukai ", "KPPBC ")
    .replace("Tipe Madya Pabean ", "TMP ")
    .replace("Kantor Wilayah Jawa Timur I", "Kanwil DJBC Jawa Timur I")
    .replace("Balai Laboratorium Bea dan Cukai Surabaya", "BLBC Surabaya");
};

// Get group kantor name from unit_organisasi in pensiun table
const getGroupKantorFromPensiun = (unitOrganisasi: string | null): string => {
  if (!unitOrganisasi) return "Tidak diketahui";
  const lower = unitOrganisasi.toLowerCase();
  
  // Kanwil group - includes Kanwil itself and all Bidang/Bagian
  if (lower.includes("kantor wilayah") || lower.includes("kanwil") ||
      lower.includes("bidang") || lower === "bagian umum") {
    return "Kantor Wilayah Jawa Timur I";
  }
  
  if (lower.includes("tanjung perak")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak";
  if (lower.includes("juanda")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda";
  if (lower.includes("pasuruan")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean A Pasuruan";
  if (lower.includes("sidoarjo")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Sidoarjo";
  if (lower.includes("gresik")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik";
  if (lower.includes("bojonegoro")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro";
  if (lower.includes("madura")) return "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Madura";
  if (lower.includes("balai laboratorium")) return "Balai Laboratorium Bea dan Cukai Surabaya";
  
  return unitOrganisasi;
};

// Define Kanwil sub-units for aggregation
const KANWIL_SUB_UNITS = [
  "Kantor Wilayah Jawa Timur I",
  "Bagian Umum",
  "Bidang Kepabeanan dan Cukai",
  "Bidang Fasilitas Kepabeanan dan Cukai",
  "Bidang Penindakan dan Penyidikan",
  "Bidang Kepatuhan Internal",
];

export default function DemografiTab({ isAdmin, canEdit }: DemografiTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendidikanData, setPendidikanData] = useState<PendidikanData[]>([]);
  const [pensiunData, setPensiunData] = useState<PensiunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSatker, setSelectedSatker] = useState<string[]>([]);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorItems, setCalculatorItems] = useState<CalculatorItem[]>([]);
  const [calculatorTitle, setCalculatorTitle] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all employees
      let allEmployees: Employee[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allEmployees = [...allEmployees, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      setEmployees(allEmployees);

      // Fetch pendidikan data
      let allPendidikan: PendidikanData[] = [];
      page = 0;
      
      while (true) {
        const { data, error } = await supabase
          .from("pendidikan")
          .select("pendidikan")
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allPendidikan = [...allPendidikan, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      setPendidikanData(allPendidikan);

      // Fetch pensiun data (for age and gender)
      let allPensiun: PensiunData[] = [];
      page = 0;
      
      while (true) {
        const { data, error } = await supabase
          .from("pensiun")
          .select("usia_tahun, jenis_kelamin, unit_organisasi")
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allPensiun = [...allPensiun, ...data];
        if (data.length < pageSize) break;
        page++;
      }
      setPensiunData(allPensiun);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique satuan kerja from employees
  const allSatuanKerja = useMemo(() => {
    const kantorSet = new Set<string>();
    employees.forEach(emp => {
      const kantor = extractKantor(emp.nm_unit_organisasi);
      const groupName = getGroupKantorName(kantor);
      kantorSet.add(groupName);
    });
    return Array.from(kantorSet).sort();
  }, [employees]);

  // Filter employees based on selected satuan kerja
  const filteredEmployees = useMemo(() => {
    if (selectedSatker.length === 0) return employees;
    return employees.filter(emp => {
      const kantor = extractKantor(emp.nm_unit_organisasi);
      const groupName = getGroupKantorName(kantor);
      return selectedSatker.includes(groupName);
    });
  }, [employees, selectedSatker]);

  // Calculate kantor statistics
  const kantorStats = useMemo((): KantorStats[] => {
    const kantorMap = new Map<string, { golIV: number; golIII: number; golII: number; golI: number }>();

    filteredEmployees.forEach(emp => {
      const kantor = extractKantor(emp.nm_unit_organisasi);
      const golongan = extractGolongan(emp.uraian_pangkat);
      const groupName = getGroupKantorName(kantor);

      if (!kantorMap.has(groupName)) {
        kantorMap.set(groupName, { golIV: 0, golIII: 0, golII: 0, golI: 0 });
      }

      const stats = kantorMap.get(groupName)!;
      if (golongan === "IV") stats.golIV++;
      else if (golongan === "III") stats.golIII++;
      else if (golongan === "II") stats.golII++;
      else if (golongan === "I") stats.golI++;
    });

    return Array.from(kantorMap.entries())
      .map(([kantor, stats]) => ({
        kantor,
        golIV: stats.golIV,
        golIII: stats.golIII,
        golII: stats.golII,
        golI: stats.golI,
        jumlah: stats.golIV + stats.golIII + stats.golII + stats.golI,
      }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [filteredEmployees]);

  // Calculate Kanwil breakdown for calculator
  const kanwilBreakdown = useMemo((): CalculatorItem[] => {
    const breakdown = new Map<string, number>();
    
    employees.forEach(emp => {
      const subUnit = getSubUnitName(emp.nm_unit_organisasi);
      if (subUnit) {
        breakdown.set(subUnit, (breakdown.get(subUnit) || 0) + 1);
      }
    });

    return KANWIL_SUB_UNITS.map(name => ({
      name,
      count: breakdown.get(name) || 0,
    })).filter(item => item.count > 0);
  }, [employees]);

  // Calculate totals for kantor stats
  const kantorTotals = useMemo(() => {
    return kantorStats.reduce(
      (acc, curr) => ({
        golIV: acc.golIV + curr.golIV,
        golIII: acc.golIII + curr.golIII,
        golII: acc.golII + curr.golII,
        golI: acc.golI + curr.golI,
        jumlah: acc.jumlah + curr.jumlah,
      }),
      { golIV: 0, golIII: 0, golII: 0, golI: 0, jumlah: 0 }
    );
  }, [kantorStats]);

  // Get all unique simplified jabatan types from employees
  const allJabatanTypes = useMemo(() => {
    const jabatanSet = new Set<string>();
    filteredEmployees.forEach(emp => {
      const jabatan = extractSimplifiedJabatan(emp.uraian_jabatan);
      if (jabatan && jabatan !== "-") {
        jabatanSet.add(jabatan);
      }
    });
    return Array.from(jabatanSet).sort();
  }, [filteredEmployees]);

  // Calculate kantor jabatan statistics
  const kantorJabatanStats = useMemo((): KantorJabatanStats[] => {
    const kantorMap = new Map<string, Record<string, number>>();

    filteredEmployees.forEach(emp => {
      const kantor = extractKantor(emp.nm_unit_organisasi);
      const groupName = getGroupKantorName(kantor);
      const jabatan = extractSimplifiedJabatan(emp.uraian_jabatan);

      if (!kantorMap.has(groupName)) {
        kantorMap.set(groupName, {});
      }

      const stats = kantorMap.get(groupName)!;
      if (jabatan && jabatan !== "-") {
        stats[jabatan] = (stats[jabatan] || 0) + 1;
      }
    });

    return Array.from(kantorMap.entries())
      .map(([kantor, jabatanCounts]) => ({
        kantor,
        jabatanCounts,
        jumlah: Object.values(jabatanCounts).reduce((sum, count) => sum + count, 0),
      }))
      .sort((a, b) => b.jumlah - a.jumlah);
  }, [filteredEmployees]);

  // Calculate totals for kantor jabatan stats
  const kantorJabatanTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    let totalJumlah = 0;
    
    kantorJabatanStats.forEach(item => {
      Object.entries(item.jabatanCounts).forEach(([jabatan, count]) => {
        totals[jabatan] = (totals[jabatan] || 0) + count;
      });
      totalJumlah += item.jumlah;
    });
    
    return { jabatanCounts: totals, jumlah: totalJumlah };
  }, [kantorJabatanStats]);

  const pendidikanStats = useMemo((): PendidikanStats[] => {
    const pendidikanMap = new Map<string, number>();
    const totalData = pendidikanData.length;

    // When no filter is applied, use all data
    if (selectedSatker.length === 0) {
      pendidikanData.forEach(item => {
        const pendidikan = normalizePendidikan(item.pendidikan);
        pendidikanMap.set(pendidikan, (pendidikanMap.get(pendidikan) || 0) + 1);
      });
    } else {
      // When filter is applied, proportionally reduce based on employee filter ratio
      const filterRatio = filteredEmployees.length / employees.length;
      pendidikanData.forEach(item => {
        const pendidikan = normalizePendidikan(item.pendidikan);
        pendidikanMap.set(pendidikan, (pendidikanMap.get(pendidikan) || 0) + 1);
      });
      // Apply ratio
      pendidikanMap.forEach((value, key) => {
        pendidikanMap.set(key, Math.round(value * filterRatio));
      });
    }

    const filteredTotal = selectedSatker.length === 0 ? totalData : Math.round(totalData * (filteredEmployees.length / employees.length));

    return PENDIDIKAN_ORDER.map((pendidikan) => {
      const total = pendidikanMap.get(pendidikan) || 0;
      return {
        pendidikan,
        total,
        persentase: filteredTotal > 0 ? ((total / filteredTotal) * 100).toFixed(2) + "%" : "0%",
      };
    });
  }, [pendidikanData, selectedSatker, filteredEmployees.length, employees.length]);

  // Calculate pendidikan totals
  const pendidikanTotals = useMemo(() => {
    return pendidikanStats.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
      }),
      { total: 0 }
    );
  }, [pendidikanStats]);

  // Calculate usia statistics - filter directly from pensiun data, no ratio
  const usiaStats = useMemo((): UsiaStats[] => {
    const usiaRanges = [
      { range: "< 25", min: 0, max: 24 },
      { range: "25-30", min: 25, max: 30 },
      { range: "31-35", min: 31, max: 35 },
      { range: "36-40", min: 36, max: 40 },
      { range: "41-45", min: 41, max: 45 },
      { range: "46-50", min: 46, max: 50 },
      { range: "51-55", min: 51, max: 55 },
      { range: "> 55", min: 56, max: 999 },
    ];

    // Filter pensiun data directly based on unit_organisasi
    const filteredPensiunData = selectedSatker.length === 0 
      ? pensiunData 
      : pensiunData.filter(item => {
          const groupName = getGroupKantorFromPensiun(item.unit_organisasi);
          return selectedSatker.includes(groupName);
        });

    const usiaMap = new Map<string, number>();

    filteredPensiunData.forEach(item => {
      const usia = item.usia_tahun;
      if (usia === null || usia === undefined) return;
      
      for (const r of usiaRanges) {
        if (usia >= r.min && usia <= r.max) {
          usiaMap.set(r.range, (usiaMap.get(r.range) || 0) + 1);
          break;
        }
      }
    });

    const filteredTotal = filteredPensiunData.length;

    return usiaRanges.map(({ range }) => {
      const total = usiaMap.get(range) || 0;
      return {
        range,
        total,
        persentase: filteredTotal > 0 ? ((total / filteredTotal) * 100).toFixed(2) + "%" : "0%",
      };
    });
  }, [pensiunData, selectedSatker]);

  // Calculate usia totals
  const usiaTotals = useMemo(() => {
    return usiaStats.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
      }),
      { total: 0 }
    );
  }, [usiaStats]);

  // Calculate gender statistics from pensiun data - filter directly, no ratio
  const genderStats = useMemo((): GenderStats[] => {
    // Filter pensiun data directly based on unit_organisasi
    const filteredPensiunData = selectedSatker.length === 0 
      ? pensiunData 
      : pensiunData.filter(item => {
          const groupName = getGroupKantorFromPensiun(item.unit_organisasi);
          return selectedSatker.includes(groupName);
        });

    const genderMap = new Map<string, number>();

    filteredPensiunData.forEach(item => {
      const gender = item.jenis_kelamin === "P" ? "Pria" : 
                     item.jenis_kelamin === "W" ? "Wanita" : 
                     "Tidak diketahui";
      genderMap.set(gender, (genderMap.get(gender) || 0) + 1);
    });

    const filteredTotal = filteredPensiunData.length;

    return ["Pria", "Wanita", "Tidak diketahui"]
      .map(gender => {
        const total = genderMap.get(gender) || 0;
        return {
          gender,
          total,
          persentase: filteredTotal > 0 ? ((total / filteredTotal) * 100).toFixed(2) + "%" : "0%",
        };
      })
      .filter(item => item.total > 0);
  }, [pensiunData, selectedSatker]);

  // Calculate gender totals
  const genderTotals = useMemo(() => {
    return genderStats.reduce(
      (acc, curr) => ({
        total: acc.total + curr.total,
      }),
      { total: 0 }
    );
  }, [genderStats]);

  // Handle satker checkbox change
  const handleSatkerChange = (satker: string, checked: boolean) => {
    if (checked) {
      setSelectedSatker(prev => [...prev, satker]);
    } else {
      setSelectedSatker(prev => prev.filter(s => s !== satker));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedSatker.length === allSatuanKerja.length) {
      setSelectedSatker([]);
    } else {
      setSelectedSatker(allSatuanKerja);
    }
  };

  // Handle card click for calculator
  const handleCardClick = (item: KantorStats) => {
    if (item.kantor === "Kantor Wilayah Jawa Timur I") {
      setCalculatorTitle("Kanwil DJBC Jawa Timur I");
      setCalculatorItems(kanwilBreakdown);
      setCalculatorOpen(true);
    }
  };

  // Check if a card has breakdown (is accumulative)
  const isAccumulativeCard = (kantor: string): boolean => {
    return kantor === "Kantor Wilayah Jawa Timur I";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat data demografi...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Satuan Kerja */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filter Satuan Kerja
            {selectedSatker.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedSatker.length} dipilih
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedSatker.length === allSatuanKerja.length && allSatuanKerja.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Pilih Semua
              </label>
            </div>
            <div className="w-px h-6 bg-border" />
            {allSatuanKerja.map((satker) => (
              <div key={satker} className="flex items-center space-x-2">
                <Checkbox
                  id={satker}
                  checked={selectedSatker.includes(satker)}
                  onCheckedChange={(checked) => handleSatkerChange(satker, checked as boolean)}
                />
                <label htmlFor={satker} className="text-sm cursor-pointer">
                  {getShortDisplayName(satker)}
                </label>
              </div>
            ))}
          </div>
          {selectedSatker.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setSelectedSatker([])}
            >
              <X className="h-4 w-4 mr-1" />
              Reset Filter
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table 1: Komposisi Pegawai per Kantor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Komposisi Pegawai Menurut Kantor dan Golongan
              <Badge variant="secondary" className="ml-2">
                Total: {filteredEmployees.length} Pegawai
              </Badge>
            </CardTitle>
            {(isAdmin || canEdit) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast.info("Fitur edit akan diimplementasikan")}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast.info("Fitur hapus akan diimplementasikan")}
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                  <TableHead className="text-white font-bold w-12">No</TableHead>
                  <TableHead className="text-white font-bold">Kantor</TableHead>
                  <TableHead className="text-white font-bold text-center">Gol. IV</TableHead>
                  <TableHead className="text-white font-bold text-center">Gol. III</TableHead>
                  <TableHead className="text-white font-bold text-center">Gol. II</TableHead>
                  <TableHead className="text-white font-bold text-center">Gol. I</TableHead>
                  <TableHead className="text-white font-bold text-center">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kantorStats.map((item, index) => (
                  <TableRow key={item.kantor}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.kantor}</TableCell>
                    <TableCell className="text-center">{item.golIV}</TableCell>
                    <TableCell className="text-center">{item.golIII}</TableCell>
                    <TableCell className="text-center">{item.golII}</TableCell>
                    <TableCell className="text-center">{item.golI}</TableCell>
                    <TableCell className="text-center font-bold">{item.jumlah}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                  <TableCell colSpan={2} className="text-white font-bold text-center">Jumlah</TableCell>
                  <TableCell className="text-white font-bold text-center">{kantorTotals.golIV}</TableCell>
                  <TableCell className="text-white font-bold text-center">{kantorTotals.golIII}</TableCell>
                  <TableCell className="text-white font-bold text-center">{kantorTotals.golII}</TableCell>
                  <TableCell className="text-white font-bold text-center">{kantorTotals.golI}</TableCell>
                  <TableCell className="text-white font-bold text-center">{kantorTotals.jumlah}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Table 2: Komposisi Pegawai Menurut Kantor dan Jabatan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Komposisi Pegawai Menurut Kantor dan Jabatan
              <Badge variant="secondary" className="ml-2">
                Total: {filteredEmployees.length} Pegawai
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                    <TableHead className="text-white font-bold w-12 sticky left-0 bg-[#1e5ba8]">No</TableHead>
                    <TableHead className="text-white font-bold sticky left-12 bg-[#1e5ba8] min-w-[200px]">Kantor</TableHead>
                    {allJabatanTypes.map(jabatan => (
                      <TableHead key={jabatan} className="text-white font-bold text-center whitespace-nowrap px-2 min-w-[80px]">
                        {jabatan}
                      </TableHead>
                    ))}
                    <TableHead className="text-white font-bold text-center">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kantorJabatanStats.map((item, index) => (
                    <TableRow key={item.kantor}>
                      <TableCell className="font-medium sticky left-0 bg-background">{index + 1}</TableCell>
                      <TableCell className="sticky left-12 bg-background">{item.kantor}</TableCell>
                      {allJabatanTypes.map(jabatan => (
                        <TableCell key={jabatan} className="text-center">
                          {item.jabatanCounts[jabatan] || 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold">{item.jumlah}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                    <TableCell colSpan={2} className="text-white font-bold text-center sticky left-0 bg-[#1e5ba8]">Jumlah</TableCell>
                    {allJabatanTypes.map(jabatan => (
                      <TableCell key={jabatan} className="text-white font-bold text-center">
                        {kantorJabatanTotals.jabatanCounts[jabatan] || 0}
                      </TableCell>
                    ))}
                    <TableCell className="text-white font-bold text-center">{kantorJabatanTotals.jumlah}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Total Pegawai per Satuan Kerja Summary */}
      <Card className="relative">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Total Pegawai per Satuan Kerja
            <Badge variant="secondary" className="ml-2">
              {kantorStats.length} Satuan Kerja
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kantorStats.map((item) => {
              const displayName = getShortDisplayName(item.kantor);
              const isAccumulative = isAccumulativeCard(item.kantor);
              
              return (
                <div 
                  key={item.kantor} 
                  className={`p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors ${
                    isAccumulative ? 'cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40' : ''
                  }`}
                  onClick={() => isAccumulative && handleCardClick(item)}
                  title={isAccumulative ? "Klik untuk melihat detail akumulasi" : undefined}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground font-medium truncate flex-1" title={item.kantor}>
                      {displayName}
                    </p>
                    {isAccumulative && (
                      <Calculator className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary mt-1">{item.jumlah}</p>
                  <p className="text-xs text-muted-foreground">pegawai</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Two column layout for Usia and Pendidikan */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Table 2: Komposisi Pegawai menurut Usia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Komposisi Pegawai Menurut Usia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                    <TableHead className="text-white font-bold w-12">No</TableHead>
                    <TableHead className="text-white font-bold">Range Usia</TableHead>
                    <TableHead className="text-white font-bold text-center">Total Pegawai</TableHead>
                    <TableHead className="text-white font-bold text-center">Persentase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usiaStats.map((item, index) => (
                    <TableRow key={item.range}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.range} Tahun</TableCell>
                      <TableCell className="text-center">{item.total}</TableCell>
                      <TableCell className="text-center font-bold">{item.persentase}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                    <TableCell colSpan={2} className="text-white font-bold text-center">Total</TableCell>
                    <TableCell className="text-white font-bold text-center">{usiaTotals.total}</TableCell>
                    <TableCell className="text-white font-bold text-center">100,00%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Table 3: Komposisi Pegawai menurut Pendidikan Formal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Komposisi Pegawai Menurut Pendidikan Formal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                    <TableHead className="text-white font-bold w-12">No</TableHead>
                    <TableHead className="text-white font-bold">Pendidikan</TableHead>
                    <TableHead className="text-white font-bold text-center">Total Pegawai</TableHead>
                    <TableHead className="text-white font-bold text-center">Persentase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendidikanStats.map((item, index) => (
                    <TableRow key={item.pendidikan}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.pendidikan}</TableCell>
                      <TableCell className="text-center">{item.total}</TableCell>
                      <TableCell className="text-center font-bold">{item.persentase}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                    <TableCell colSpan={2} className="text-white font-bold text-center">Total</TableCell>
                    <TableCell className="text-white font-bold text-center">{pendidikanTotals.total}</TableCell>
                    <TableCell className="text-white font-bold text-center">100,00%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Table 4: Komposisi Pegawai menurut Jenis Kelamin */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Komposisi Pegawai Menurut Jenis Kelamin
            <Badge variant="secondary" className="ml-2">
              Total: {genderTotals.total} Pegawai
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                  <TableHead className="text-white font-bold w-12">No</TableHead>
                  <TableHead className="text-white font-bold">Jenis Kelamin</TableHead>
                  <TableHead className="text-white font-bold text-center">Total Pegawai</TableHead>
                  <TableHead className="text-white font-bold text-center">Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genderStats.map((item, index) => (
                  <TableRow key={item.gender}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.gender}</TableCell>
                    <TableCell className="text-center">{item.total}</TableCell>
                    <TableCell className="text-center font-bold">{item.persentase}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-[#1e5ba8] hover:bg-[#1e5ba8]">
                  <TableCell colSpan={2} className="text-white font-bold text-center">Total</TableCell>
                  <TableCell className="text-white font-bold text-center">{genderTotals.total}</TableCell>
                  <TableCell className="text-white font-bold text-center">100,00%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Calculator Dialog */}
      <Dialog open={calculatorOpen} onOpenChange={setCalculatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Detail Akumulasi: {calculatorTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {calculatorItems.map((item, index) => (
              <div 
                key={item.name}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <span className="text-sm">{item.name}</span>
                <span className="font-bold text-primary">{item.count}</span>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="font-bold">Total Akumulasi</span>
                <span className="font-bold text-xl text-primary">
                  {calculatorItems.reduce((sum, item) => sum + item.count, 0)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
