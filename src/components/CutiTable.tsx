import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, FileText, Upload, Trash2, Download, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toProperCase, cn, formatDateToDDMMYYYY } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth, isAdminRole } from "@/hooks/useAuth";

interface CutiData {
  id?: string;
  nip: string;
  nama_pegawai: string;
  pangkat_pegawai: string | null;
  jabatan_pegawai: string | null;
  tahun_cuti: number;
  tanggal_cuti_tahunan: string | null;
  tanggal_cuti_sakit: string | null;
  tanggal_cuti_alasan_penting: string | null;
  tanggal_cuti_melahirkan: string | null;
  tanggal_cuti_besar_non_keagamaan: string | null;
  tanggal_pengganti_cuti_bersama: string | null;
  total_cuti_tahunan: number | null;
  total_cuti_sakit: number | null;
  total_cuti_alasan_penting: number | null;
  total_cuti_melahirkan: number | null;
  total_cuti_besar_non_keagamaan: number | null;
  total_pengganti_cuti_bersama: number | null;
  cuti_setengah: string | null;
  alasan: string | null;
  flag_cuti_tambahan: boolean | null;
  tgl_awal_tambahan: string | null;
  tgl_akhir_tambahan: string | null;
  proses: string | null;
  status: string | null;
}

const PRIMARY_COLOR = '#1e5ba8';

export default function CutiTable() {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role); // admin dan sapu_jagat bisa akses tombol aksi
  const [data, setData] = useState<CutiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [jenisCutiStats, setJenisCutiStats] = useState<{ name: string; value: number }[]>([]);
  const [statusStats, setStatusStats] = useState<{ name: string; value: number }[]>([]);
  const [tahunStats, setTahunStats] = useState<{ name: string; value: number }[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Export filters
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filterBulan, setFilterBulan] = useState<string>("all");
  const [filterTahun, setFilterTahun] = useState<string>("all");
  const [filterJenisCuti, setFilterJenisCuti] = useState<string>("all");
  const [filterProses, setFilterProses] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data using pagination to avoid limits
      let allData: CutiData[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: dbData, error } = await supabase
          .from("cuti")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;

        if (dbData && dbData.length > 0) {
          allData = [...allData, ...dbData];
          from += pageSize;
          hasMore = dbData.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      setData(allData as CutiData[]);
      calculateStats(allData as CutiData[]);
      console.log(`Loaded ${allData.length} total records from database`);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data cuti");
    } finally {
      setLoading(false);
    }
  };

  const convertExcelDate = (excelDate: any): string => {
    if (!excelDate) return "";
    
    // If it's already a string (formatted date), return it
    if (typeof excelDate === 'string') return excelDate;
    
    // If it's a number (Excel serial date)
    if (typeof excelDate === 'number') {
      try {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
      } catch {
        return "";
      }
    }
    
    return "";
  };

  const convertJenisCutiToDbFormat = (jenisCuti: string, tanggal: string, lama: number) => {
    const jenis = jenisCuti.toUpperCase().trim();
    const result: any = {
      tanggal_cuti_tahunan: null,
      tanggal_cuti_sakit: null,
      tanggal_cuti_alasan_penting: null,
      tanggal_cuti_melahirkan: null,
      tanggal_cuti_besar_non_keagamaan: null,
      tanggal_pengganti_cuti_bersama: null,
      total_cuti_tahunan: null,
      total_cuti_sakit: null,
      total_cuti_alasan_penting: null,
      total_cuti_melahirkan: null,
      total_cuti_besar_non_keagamaan: null,
      total_pengganti_cuti_bersama: null,
    };

    if (jenis.includes("TAHUNAN")) {
      result.tanggal_cuti_tahunan = tanggal;
      result.total_cuti_tahunan = lama;
    } else if (jenis.includes("SAKIT")) {
      result.tanggal_cuti_sakit = tanggal;
      result.total_cuti_sakit = lama;
    } else if (jenis.includes("ALASAN PENTING")) {
      result.tanggal_cuti_alasan_penting = tanggal;
      result.total_cuti_alasan_penting = lama;
    } else if (jenis.includes("MELAHIRKAN")) {
      result.tanggal_cuti_melahirkan = tanggal;
      result.total_cuti_melahirkan = lama;
    } else if (jenis.includes("BESAR") || jenis.includes("NON KEAGAMAAN")) {
      result.tanggal_cuti_besar_non_keagamaan = tanggal;
      result.total_cuti_besar_non_keagamaan = lama;
    } else if (jenis.includes("BERSAMA") || jenis.includes("PENGGANTI")) {
      result.tanggal_pengganti_cuti_bersama = tanggal;
      result.total_pengganti_cuti_bersama = lama;
    } else {
      // Default to cuti tahunan if type is unknown
      result.tanggal_cuti_tahunan = tanggal;
      result.total_cuti_tahunan = lama;
    }

    return result;
  };

  const getJenisCutiFromData = (item: CutiData): string[] => {
    const jenis: string[] = [];
    if (item.tanggal_cuti_tahunan) jenis.push("CUTI TAHUNAN");
    if (item.tanggal_cuti_sakit) jenis.push("CUTI SAKIT");
    if (item.tanggal_cuti_alasan_penting) jenis.push("CUTI KARENA ALASAN PENTING");
    if (item.tanggal_cuti_melahirkan) jenis.push("CUTI MELAHIRKAN");
    if (item.tanggal_cuti_besar_non_keagamaan) jenis.push("CUTI BESAR NON KEAGAMAAN");
    if (item.tanggal_pengganti_cuti_bersama) jenis.push("CUTI PENGGANTI BERSAMA");
    return jenis.length > 0 ? jenis : ["Tidak diketahui"];
  };

  const calculateStats = (cutiData: CutiData[]) => {
    // Calculate jenis cuti statistics
    const jenisCutiMap = new Map<string, number>();
    cutiData.forEach(item => {
      const jenisArray = getJenisCutiFromData(item);
      jenisArray.forEach(jenis => {
        jenisCutiMap.set(jenis, (jenisCutiMap.get(jenis) || 0) + 1);
      });
    });
    const jenisCutiData = Array.from(jenisCutiMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    setJenisCutiStats(jenisCutiData);

    // Calculate status statistics
    const statusMap = new Map<string, number>();
    cutiData.forEach(item => {
      const status = item.status || "Tidak diketahui";
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const statusData = Array.from(statusMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    setStatusStats(statusData);

    // Calculate tahun statistics
    const tahunMap = new Map<string, number>();
    cutiData.forEach(item => {
      const tahun = String(item.tahun_cuti) || "Tidak diketahui";
      tahunMap.set(tahun, (tahunMap.get(tahun) || 0) + 1);
    });
    const tahunData = Array.from(tahunMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    setTahunStats(tahunData);
  };

  const handleImportExcel = async (file: File) => {
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("File Excel kosong atau format tidak sesuai");
        setImporting(false);
        return;
      }

      // Map Excel data to database format
      const cutiData = jsonData.map((row: any) => {
        const nip = String(row.NIP || row.nip || "").replace(/^'/, "");
        const namaPegawai = row["NAMA PEGAWAI"] || row["Nama Pegawai"] || row.nama_pegawai || "";
        const pangkatPegawai = row["PANGKAT PEGAWAI"] || row["Pangkat"] || row.pangkat_pegawai || null;
        const jabatanPegawai = row["JABATAN PEGAWAI"] || row["Jabatan"] || row.jabatan_pegawai || null;
        const jenisCuti = row["JENIS CUTI"] || row["Jenis Cuti"] || row.jenis_cuti || "";
        const tglAwal = convertExcelDate(row["TGL AWAL"] || row["Tanggal Awal"] || row.tgl_awal);
        const tglAkhir = convertExcelDate(row["TGL AKHIR"] || row["Tanggal Akhir"] || row.tgl_akhir);
        const tahunCuti = parseInt(row["TAHUN CUTI"] || row["Tahun Cuti"] || row.tahun_cuti) || new Date().getFullYear();
        const lamaCuti = parseFloat(row["LAMA CUTI"] || row["Lama Cuti"] || row.lama_cuti) || 0;
        const cutiSetengah = row["CUTI SETENGAH"] || row["Cuti Setengah"] || row.cuti_setengah || null;
        const alasan = row["ALASAN"] || row["Alasan"] || row.alasan || null;
        const flagCutiTambahan = row["FLAG CUTI TAMBAHAN"] === "t" || row["FLAG CUTI TAMBAHAN"] === true || row.flag_cuti_tambahan === true;
        const tglAwalTambahan = convertExcelDate(row["TGL AWAL TAMBAHAN"] || row.tgl_awal_tambahan) || null;
        const tglAkhirTambahan = convertExcelDate(row["TGL AKHIR TAMBAHAN"] || row.tgl_akhir_tambahan) || null;
        const proses = row["PROSES"] || row["Proses"] || row.proses || null;
        const status = row["STATUS"] || row["Status"] || row.status || null;

        // Format tanggal range untuk disimpan
        const tanggalRange = tglAwal && tglAkhir && tglAwal !== tglAkhir
          ? `${tglAwal} s/d ${tglAkhir}`
          : tglAwal || "";

        // Convert jenis cuti to database format
        const cutiFields = convertJenisCutiToDbFormat(jenisCuti, tanggalRange, lamaCuti);

        return {
          nip,
          nama_pegawai: namaPegawai,
          pangkat_pegawai: pangkatPegawai,
          jabatan_pegawai: jabatanPegawai,
          tahun_cuti: tahunCuti,
          ...cutiFields,
          cuti_setengah: cutiSetengah,
          alasan,
          flag_cuti_tambahan: flagCutiTambahan,
          tgl_awal_tambahan: tglAwalTambahan,
          tgl_akhir_tambahan: tglAkhirTambahan,
          proses,
          status,
        };
      });

      // Validate data
      const validData = cutiData.filter(item => item.nip && item.nama_pegawai);
      
      if (validData.length === 0) {
        toast.error("Tidak ada data valid untuk diimport. Pastikan kolom NIP dan Nama Pegawai terisi.");
        setImporting(false);
        return;
      }

      // Insert data in batches
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < validData.length; i += batchSize) {
        const batch = validData.slice(i, i + batchSize);
        const { error } = await supabase.from("cuti").insert(batch);
        if (error) {
          console.error("Batch insert error:", error);
          errorCount += batch.length;
          toast.error(`Error pada batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      if (successCount > 0) {
        toast.success(`Berhasil import ${successCount} data cuti dari ${cutiData.length} total data!`);
        setImportDialogOpen(false);
        await loadData();
      } else {
        toast.error("Gagal import data. Periksa format Excel dan coba lagi.");
      }
    } catch (error: any) {
      console.error("Error importing Excel:", error);
      toast.error(error.message || "Gagal import data. Pastikan format Excel sesuai.");
    } finally {
      setImporting(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus semua data cuti? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const { error } = await supabase.from("cuti").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      
      // Clear data and stats immediately
      setData([]);
      setJenisCutiStats([]);
      setStatusStats([]);
      setTahunStats([]);
      
      toast.success("Semua data cuti berhasil dihapus");
    } catch (error: any) {
      console.error("Error clearing data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const getUniqueValuesString = (field: 'proses' | 'status') => {
    const values = new Set(data.map(item => String(item[field] || '')).filter(v => v));
    return Array.from(values).sort();
  };

  const getAllTanggalFromData = (item: CutiData): string[] => {
    const tanggals: string[] = [];
    if (item.tanggal_cuti_tahunan) tanggals.push(item.tanggal_cuti_tahunan);
    if (item.tanggal_cuti_sakit) tanggals.push(item.tanggal_cuti_sakit);
    if (item.tanggal_cuti_alasan_penting) tanggals.push(item.tanggal_cuti_alasan_penting);
    if (item.tanggal_cuti_melahirkan) tanggals.push(item.tanggal_cuti_melahirkan);
    if (item.tanggal_cuti_besar_non_keagamaan) tanggals.push(item.tanggal_cuti_besar_non_keagamaan);
    if (item.tanggal_pengganti_cuti_bersama) tanggals.push(item.tanggal_pengganti_cuti_bersama);
    return tanggals;
  };

  const getFirstTanggal = (item: CutiData): string => {
    const tanggals = getAllTanggalFromData(item);
    return tanggals.length > 0 ? tanggals[0].split(' ')[0] : '';
  };

  const getTotalCutiFromData = (item: CutiData): number => {
    return (item.total_cuti_tahunan || 0) +
           (item.total_cuti_sakit || 0) +
           (item.total_cuti_alasan_penting || 0) +
           (item.total_cuti_melahirkan || 0) +
           (item.total_cuti_besar_non_keagamaan || 0) +
           (item.total_pengganti_cuti_bersama || 0);
  };

  const getBulanOptions = () => {
    const months = new Set<number>();
    data.forEach(item => {
      const tanggal = getFirstTanggal(item);
      if (tanggal) {
        const date = new Date(tanggal);
        if (!isNaN(date.getTime())) {
          months.add(date.getMonth() + 1);
        }
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  };

  const getTahunOptions = () => {
    const years = new Set<number>();
    data.forEach(item => {
      const tanggal = getFirstTanggal(item);
      if (tanggal) {
        const date = new Date(tanggal);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const handleExportExcel = () => {
    let filteredExportData = [...data];

    // Apply filters
    if (filterBulan !== "all") {
      filteredExportData = filteredExportData.filter(item => {
        const tanggal = getFirstTanggal(item);
        if (!tanggal) return false;
        const date = new Date(tanggal);
        return !isNaN(date.getTime()) && date.getMonth() + 1 === parseInt(filterBulan);
      });
    }

    if (filterTahun !== "all") {
      filteredExportData = filteredExportData.filter(item => {
        const tanggal = getFirstTanggal(item);
        if (!tanggal) return false;
        const date = new Date(tanggal);
        return !isNaN(date.getTime()) && date.getFullYear() === parseInt(filterTahun);
      });
    }

    if (filterJenisCuti !== "all") {
      filteredExportData = filteredExportData.filter(item => {
        const jenis = getJenisCutiFromData(item);
        return jenis.includes(filterJenisCuti);
      });
    }

    if (filterProses !== "all") {
      filteredExportData = filteredExportData.filter(item => 
        item.proses === filterProses
      );
    }

    if (filterStatus !== "all") {
      filteredExportData = filteredExportData.filter(item => 
        item.status === filterStatus
      );
    }

    // Filter by date range
    if (filterStartDate) {
      filteredExportData = filteredExportData.filter(item => {
        const tanggal = getFirstTanggal(item);
        if (!tanggal) return false;
        const itemDate = new Date(tanggal);
        return !isNaN(itemDate.getTime()) && itemDate >= filterStartDate;
      });
    }

    if (filterEndDate) {
      filteredExportData = filteredExportData.filter(item => {
        const tanggal = getFirstTanggal(item);
        if (!tanggal) return false;
        const itemDate = new Date(tanggal);
        return !isNaN(itemDate.getTime()) && itemDate <= filterEndDate;
      });
    }

    if (filteredExportData.length === 0) {
      toast.error("Tidak ada data yang sesuai dengan filter");
      return;
    }

    // Aggregate data by employee with detailed information
    const employeeMap = new Map<string, { 
      nip: string; 
      nama: string; 
      totalCuti: number;
      tanggalList: string[];
      jenisCutiList: string[];
      prosesList: string[];
      statusList: string[];
      tanggalCutiTahunan: string[];
      totalCutiTahunan: number;
      tanggalCutiSakit: string[];
      totalCutiSakit: number;
      tanggalCutiAlasanPenting: string[];
      totalCutiAlasanPenting: number;
      tanggalCutiPenggantiBersama: string[];
      totalCutiPenggantiBersama: number;
      tanggalCutiMelahirkan: string[];
      totalCutiMelahirkan: number;
      tanggalCutiBesarNonKeagamaan: string[];
      totalCutiBesarNonKeagamaan: number;
      totalSelesai: number;
      totalDikembalikan: number;
      totalProses: number;
      totalBaru: number;
    }>();
    
    filteredExportData.forEach(item => {
      const key = `${item.nip}_${item.nama_pegawai}`;
      const tanggalList = getAllTanggalFromData(item);
      const jenisList = getJenisCutiFromData(item);
      const tanggal = tanggalList.join('; ');
      const jenis = jenisList.join('; ');
      
      if (employeeMap.has(key)) {
        const existing = employeeMap.get(key)!;
        existing.totalCuti += 1;
        existing.tanggalList.push(tanggal);
        existing.jenisCutiList.push(jenis);
        existing.prosesList.push(item.proses || '-');
        existing.statusList.push(item.status || '-');
        
        // Add detailed leave type data
        if (item.tanggal_cuti_tahunan) existing.tanggalCutiTahunan.push(item.tanggal_cuti_tahunan);
        existing.totalCutiTahunan += (item.total_cuti_tahunan || 0);
        
        if (item.tanggal_cuti_sakit) existing.tanggalCutiSakit.push(item.tanggal_cuti_sakit);
        existing.totalCutiSakit += (item.total_cuti_sakit || 0);
        
        if (item.tanggal_cuti_alasan_penting) existing.tanggalCutiAlasanPenting.push(item.tanggal_cuti_alasan_penting);
        existing.totalCutiAlasanPenting += (item.total_cuti_alasan_penting || 0);
        
        if (item.tanggal_pengganti_cuti_bersama) existing.tanggalCutiPenggantiBersama.push(item.tanggal_pengganti_cuti_bersama);
        existing.totalCutiPenggantiBersama += (item.total_pengganti_cuti_bersama || 0);
        
        if (item.tanggal_cuti_melahirkan) existing.tanggalCutiMelahirkan.push(item.tanggal_cuti_melahirkan);
        existing.totalCutiMelahirkan += (item.total_cuti_melahirkan || 0);
        
        if (item.tanggal_cuti_besar_non_keagamaan) existing.tanggalCutiBesarNonKeagamaan.push(item.tanggal_cuti_besar_non_keagamaan);
        existing.totalCutiBesarNonKeagamaan += (item.total_cuti_besar_non_keagamaan || 0);
        
        // Count status
        if (item.status?.toLowerCase() === 'selesai') existing.totalSelesai += 1;
        else if (item.status?.toLowerCase() === 'dikembalikan') existing.totalDikembalikan += 1;
        else if (item.proses?.toLowerCase() === 'proses') existing.totalProses += 1;
        else if (item.status?.toLowerCase() === 'baru' || !item.status) existing.totalBaru += 1;
      } else {
        employeeMap.set(key, {
          nip: item.nip,
          nama: item.nama_pegawai,
          totalCuti: 1,
          tanggalList: [tanggal],
          jenisCutiList: [jenis],
          prosesList: [item.proses || '-'],
          statusList: [item.status || '-'],
          tanggalCutiTahunan: item.tanggal_cuti_tahunan ? [item.tanggal_cuti_tahunan] : [],
          totalCutiTahunan: item.total_cuti_tahunan || 0,
          tanggalCutiSakit: item.tanggal_cuti_sakit ? [item.tanggal_cuti_sakit] : [],
          totalCutiSakit: item.total_cuti_sakit || 0,
          tanggalCutiAlasanPenting: item.tanggal_cuti_alasan_penting ? [item.tanggal_cuti_alasan_penting] : [],
          totalCutiAlasanPenting: item.total_cuti_alasan_penting || 0,
          tanggalCutiPenggantiBersama: item.tanggal_pengganti_cuti_bersama ? [item.tanggal_pengganti_cuti_bersama] : [],
          totalCutiPenggantiBersama: item.total_pengganti_cuti_bersama || 0,
          tanggalCutiMelahirkan: item.tanggal_cuti_melahirkan ? [item.tanggal_cuti_melahirkan] : [],
          totalCutiMelahirkan: item.total_cuti_melahirkan || 0,
          tanggalCutiBesarNonKeagamaan: item.tanggal_cuti_besar_non_keagamaan ? [item.tanggal_cuti_besar_non_keagamaan] : [],
          totalCutiBesarNonKeagamaan: item.total_cuti_besar_non_keagamaan || 0,
          totalSelesai: item.status?.toLowerCase() === 'selesai' ? 1 : 0,
          totalDikembalikan: item.status?.toLowerCase() === 'dikembalikan' ? 1 : 0,
          totalProses: item.proses?.toLowerCase() === 'proses' ? 1 : 0,
          totalBaru: (item.status?.toLowerCase() === 'baru' || !item.status) ? 1 : 0,
        });
      }
    });

    // Convert map to array and prepare for export
    const exportData = Array.from(employeeMap.values())
      .sort((a, b) => a.nama.localeCompare(b.nama))
      .map((item, index) => ({
        "No": index + 1,
        "NIP": item.nip,
        "Nama Pegawai": toProperCase(item.nama),
        "Total Cuti": item.totalCuti,
        "Tanggal": formatDateToDDMMYYYY(item.tanggalList.join('; ')),
        "Tanggal Cuti Tahunan": formatDateToDDMMYYYY(item.tanggalCutiTahunan.join('; ')) || '-',
        "Total Cuti Tahunan": item.totalCutiTahunan,
        "Tanggal Cuti Sakit": formatDateToDDMMYYYY(item.tanggalCutiSakit.join('; ')) || '-',
        "Total Cuti Sakit": item.totalCutiSakit,
        "Tanggal Cuti Alasan Penting": formatDateToDDMMYYYY(item.tanggalCutiAlasanPenting.join('; ')) || '-',
        "Total Cuti Alasan Penting": item.totalCutiAlasanPenting,
        "Tanggal Cuti Pengganti Bersama": formatDateToDDMMYYYY(item.tanggalCutiPenggantiBersama.join('; ')) || '-',
        "Total Cuti Pengganti Bersama": item.totalCutiPenggantiBersama,
        "Tanggal Cuti Melahirkan": formatDateToDDMMYYYY(item.tanggalCutiMelahirkan.join('; ')) || '-',
        "Total Cuti Melahirkan": item.totalCutiMelahirkan,
        "Cuti Besar Non Keagamaan": formatDateToDDMMYYYY(item.tanggalCutiBesarNonKeagamaan.join('; ')) || '-',
        "Total Cuti Besar Non Keagamaan": item.totalCutiBesarNonKeagamaan,
        "Jenis Cuti": item.jenisCutiList.join('; '),
        "Proses": item.prosesList.join('; '),
        "Status": item.statusList.join('; '),
        "Total Selesai": item.totalSelesai,
        "Total Dikembalikan": item.totalDikembalikan,
        "Total Proses": item.totalProses,
        "Total Baru": item.totalBaru,
      }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 5 },  // No
      { wch: 20 }, // NIP
      { wch: 35 }, // Nama Pegawai
      { wch: 12 }, // Total Cuti
      { wch: 50 }, // Tanggal
      { wch: 40 }, // Tanggal Cuti Tahunan
      { wch: 15 }, // Total Cuti Tahunan
      { wch: 40 }, // Tanggal Cuti Sakit
      { wch: 15 }, // Total Cuti Sakit
      { wch: 40 }, // Tanggal Cuti Alasan Penting
      { wch: 20 }, // Total Cuti Alasan Penting
      { wch: 40 }, // Tanggal Cuti Pengganti Bersama
      { wch: 20 }, // Total Cuti Pengganti Bersama
      { wch: 40 }, // Tanggal Cuti Melahirkan
      { wch: 18 }, // Total Cuti Melahirkan
      { wch: 40 }, // Cuti Besar Non Keagamaan
      { wch: 25 }, // Total Cuti Besar Non Keagamaan
      { wch: 40 }, // Jenis Cuti
      { wch: 30 }, // Proses
      { wch: 30 }, // Status
      { wch: 15 }, // Total Selesai
      { wch: 18 }, // Total Dikembalikan
      { wch: 15 }, // Total Proses
      { wch: 12 }, // Total Baru
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Rekap Cuti Pegawai");

    // Generate filename with current date
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const filename = `Rekap_Cuti_Pegawai_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);
    toast.success(`Berhasil export rekap ${exportData.length} pegawai dari ${filteredExportData.length} data cuti!`);
    setExportDialogOpen(false);
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase().trim();
    const jenisArray = getJenisCutiFromData(item).join(' ').toLowerCase();
    const tanggalArray = getAllTanggalFromData(item).join(' ').toLowerCase();
    const nip = (item.nip || '').toLowerCase();
    const nama = (item.nama_pegawai || '').toLowerCase();
    const status = (item.status || '').toLowerCase();
    const proses = (item.proses || '').toLowerCase();
    const jabatan = (item.jabatan_pegawai || '').toLowerCase();
    const pangkat = (item.pangkat_pegawai || '').toLowerCase();
    
    return (
      nip.includes(search) ||
      nama.includes(search) ||
      jenisArray.includes(search) ||
      tanggalArray.includes(search) ||
      status.includes(search) ||
      proses.includes(search) ||
      jabatan.includes(search) ||
      pangkat.includes(search)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat data cuti...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Dashboard Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Jenis Cuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jenisCutiStats} layout="vertical" margin={{ left: 150, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} style={{ fontSize: '10px' }} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusStats} layout="vertical" margin={{ left: 100, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tahun Cuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={tahunStats} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 14 }}
                  interval={0}
                  angle={0}
                />
                <YAxis 
                  tick={{ fontSize: 14 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 14 }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="value" 
                  fill={PRIMARY_COLOR}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Progress Cuti Status */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Cuti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Selesai: {data.filter(item => item.status?.toLowerCase() === 'selesai').length}
              </span>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Dikembalikan: {data.filter(item => item.status?.toLowerCase() === 'dikembalikan').length}
              </span>
            </div>
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
              Total: {data.filter(item => 
                item.status?.toLowerCase() === 'selesai' || 
                item.status?.toLowerCase() === 'dikembalikan'
              ).length}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-4">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                Proses: {data.filter(item => item.proses?.toLowerCase() === 'proses').length}
              </span>
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                Baru: {data.filter(item => item.status?.toLowerCase() === 'baru' || !item.status).length}
              </span>
            </div>
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
              Total: {data.filter(item => 
                item.proses?.toLowerCase() === 'proses' || 
                item.status?.toLowerCase() === 'baru' || 
                !item.status
              ).length}
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ 
                width: `${data.length > 0 
                  ? (data.filter(item => 
                      item.status?.toLowerCase() === 'selesai' || 
                      item.status?.toLowerCase() === 'dikembalikan'
                    ).length / data.length) * 100 
                  : 0}%` 
              }}
            />
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ 
                width: `${data.length > 0 
                  ? (data.filter(item => 
                      item.proses?.toLowerCase() === 'proses' || 
                      item.status?.toLowerCase() === 'baru' || 
                      !item.status
                    ).length / data.length) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Cuti Pegawai</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari NIP, nama, jenis cuti, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Menampilkan {filteredData.length} dari {data.length} data cuti
          </p>
          {/* Action Buttons - Only show for admin */}
          {isAdmin && (
            <div className="flex gap-3 flex-wrap mt-3">
              {data.length > 0 && (
                <Button onClick={() => setExportDialogOpen(true)} className="gap-2" variant="outline">
                  <Download className="h-4 w-4" />
                  Rekap Cuti
                </Button>
              )}
              <Button onClick={() => setImportDialogOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Insert Cuti
              </Button>
              {data.length > 0 && (
                <Button variant="destructive" onClick={handleClearData} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Hapus Semua Data
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada data yang ditemukan
              </div>
            ) : (
              filteredData.map((item, index) => {
                const jenisArray = getJenisCutiFromData(item);
                const tanggalArray = getAllTanggalFromData(item);
                const totalCuti = getTotalCutiFromData(item);
                
                return (
                  <Card key={`${item.id || ''}_${item.nip}_${index}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Left section - Employee info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-base truncate">{item.nama_pegawai}</h3>
                              <p className="text-sm text-muted-foreground">NIP: {item.nip}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {item.pangkat_pegawai && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{item.pangkat_pegawai}</span>
                                )}
                                {item.jabatan_pegawai && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[200px]">{item.jabatan_pegawai}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Middle section - Cuti details */}
                        <div className="flex-1 min-w-0 lg:border-l lg:pl-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Jenis Cuti:</span>
                              <p className="font-medium text-primary">{jenisArray.join(', ')}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tanggal:</span>
                              <p className="font-medium">{tanggalArray.join(', ') || '-'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tahun:</span>
                              <p className="font-medium">{item.tahun_cuti}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Hari:</span>
                              <p className="font-medium">{totalCuti} {item.cuti_setengah && `(${item.cuti_setengah})`}</p>
                            </div>
                          </div>
                          {item.alasan && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Alasan:</span>
                              <p className="text-muted-foreground italic truncate">{item.alasan}</p>
                            </div>
                          )}
                        </div>

                        {/* Right section - Status */}
                        <div className="flex flex-row lg:flex-col gap-2 lg:items-end shrink-0">
                          {item.proses && (
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              item.proses.toLowerCase() === 'proses' 
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {item.proses}
                            </span>
                          )}
                          {item.status && (
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              item.status.toLowerCase() === 'selesai' 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : item.status.toLowerCase() === 'dikembalikan'
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                : item.status.toLowerCase() === 'baru'
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Data Cuti</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Pilih file Excel (.xlsx) dengan format yang sesuai untuk diimport.
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportExcel(file);
                  }
                }}
                disabled={importing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImportDialogOpen(false)} disabled={importing}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog with Filters */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Export Rekap Cuti
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih filter untuk mengekspor data cuti sesuai kriteria yang diinginkan.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filterStartDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, "dd/MM/yyyy") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Akhir</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filterEndDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, "dd/MM/yyyy") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bulan</label>
                <Select value={filterBulan} onValueChange={setFilterBulan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    {getBulanOptions().map(month => (
                      <SelectItem key={month} value={String(month)}>
                        {new Date(2000, month - 1).toLocaleString('id-ID', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tahun</label>
                <Select value={filterTahun} onValueChange={setFilterTahun}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {getTahunOptions().map(tahun => (
                      <SelectItem key={tahun} value={String(tahun)}>{tahun}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Jenis Cuti</label>
                <Select value={filterJenisCuti} onValueChange={setFilterJenisCuti}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    {jenisCutiStats.map(stat => (
                      <SelectItem key={stat.name} value={stat.name}>{stat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Proses</label>
                <Select value={filterProses} onValueChange={setFilterProses}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Proses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Proses</SelectItem>
                    {getUniqueValuesString('proses').map(proses => (
                      <SelectItem key={proses} value={proses}>{proses}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {getUniqueValuesString('status').map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setExportDialogOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handleExportExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}