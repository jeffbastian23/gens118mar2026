import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Search, Upload, FileText, FileDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { generateHasilEvaluasiDocument, generateHasilEvaluasiPU, generateHasilEvaluasiPK, generateHasilEvaluasiPTB, generateHasilEvaluasiPT, generateHasilEvaluasiPULandscape } from "@/utils/hasilEvaluasiDocumentGenerator";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HasilEvaluasiData {
  id: string;
  jenis_evaluasi: string;
  satuan_kerja: string | null;
  no_urut: number | null;
  nama_nip: string;
  pangkat_gol_ruang_tmt: string | null;
  pendidikan: string | null;
  jabatan_kedudukan: string | null;
  peringkat_lama: string | null;
  pkt_y_minus_1: string | null;
  pkt_y: string | null;
  kemampuan_kerja: string | null;
  jabatan_tugas_kedudukan: string | null;
  predikat_kinerja_terakhir_peringkat_lama: string | null;
  akumulasi_masa_kerja_terakhir_peringkat_lama: string | null;
  akumulasi_masa_kerja_sd_tahun_y: string | null;
  predikat_kinerja_tahunan_y: string | null;
  lokasi: string | null;
  tanggal: string | null;
  nama_atasan_dari_atasan_langsung: string | null;
  nip_atasan_dari_atasan_langsung: string | null;
  nama_atasan_langsung: string | null;
  nip_atasan_langsung: string | null;
  created_at: string;
}

interface HasilEvaluasiTabProps {
  isAdmin?: boolean;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  nm_unit_organisasi: string;
}

interface BigDataEmployee {
  id: string;
  nama_lengkap: string;
  nip: string;
  pendidikan: string | null;
  grade: string | null;
  pangkat: string | null;
  pangkat_golongan: string | null;
  tmt_pangkat: string | null;
  jabatan: string | null;
  pkt_2024: string | null;
  pkt_2025: string | null;
  kemampuan_kerja: string | null;
  lokasi: string | null;
  jenis: string | null;
  atasan_langsung_nama: string | null;
  atasan_langsung_id: string | null;
  atasan_dari_atasan_nama: string | null;
  atasan_dari_atasan_id: string | null;
  akumulasi_masa_kerja: string | null;
  akumulasi_terakhir: string | null;
}

const PKT_OPTIONS = ["Sangat Baik", "Baik", "Butuh Perbaikan", "Kurang", "Sangat Kurang"];
const KEMAMPUAN_KERJA_OPTIONS = ["Memenuhi", "Tidak Memenuhi"];

export default function HasilEvaluasiTab({ isAdmin = true }: HasilEvaluasiTabProps) {
  const [data, setData] = useState<HasilEvaluasiData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bigDataEmployees, setBigDataEmployees] = useState<BigDataEmployee[]>([]);
  const [satuanKerjaOptions, setSatuanKerjaOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<HasilEvaluasiData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  
  // Unduh Word Dialog states
  const [unduhWordDialogOpen, setUnduhWordDialogOpen] = useState(false);
  const [unduhWordJenis, setUnduhWordJenis] = useState<'PU' | 'PK' | 'PTB' | 'PT'>('PU');
  const [selectedForDownload, setSelectedForDownload] = useState<string[]>([]);
  
  // Combobox states
  const [atasanLangsungOpen, setAtasanLangsungOpen] = useState(false);
  const [atasanDariAtasanOpen, setAtasanDariAtasanOpen] = useState(false);
  const [namaNipOpen, setNamaNipOpen] = useState(false);
  
  // Multi-select states for preview (like Permohonan)
  const [selectedMultipleEmployees, setSelectedMultipleEmployees] = useState<BigDataEmployee[]>([]);
  
  // Multi-select input open state
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [multiSelectSearch, setMultiSelectSearch] = useState("");
  
  // Grouping states (like in Permohonan)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<HasilEvaluasiData>>({
    jenis_evaluasi: 'PU',
    satuan_kerja: '',
    nama_nip: '',
    pangkat_gol_ruang_tmt: '',
    pendidikan: '',
    jabatan_kedudukan: '',
    peringkat_lama: '',
    pkt_y_minus_1: '',
    pkt_y: '',
    kemampuan_kerja: '',
    jabatan_tugas_kedudukan: '',
    predikat_kinerja_terakhir_peringkat_lama: '',
    akumulasi_masa_kerja_terakhir_peringkat_lama: '',
    akumulasi_masa_kerja_sd_tahun_y: '',
    predikat_kinerja_tahunan_y: '',
    lokasi: '',
    tanggal: '',
    nama_atasan_dari_atasan_langsung: '',
    nip_atasan_dari_atasan_langsung: '',
    nama_atasan_langsung: '',
    nip_atasan_langsung: '',
  });

  useEffect(() => {
    fetchData();
    fetchEmployees();
    fetchBigDataEmployees();
    fetchSatuanKerja();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_format_hasil_evaluasi")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setData(data || []);
    } catch (error: any) {
      console.error("Error fetching hasil evaluasi:", error);
      toast.error("Gagal memuat data hasil evaluasi");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, nm_pegawai, nip, nm_unit_organisasi")
        .order("nm_pegawai");
      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  // Fetch satuan kerja from satuan_kerja table
  const fetchSatuanKerja = async () => {
    try {
      const { data, error } = await supabase
        .from("satuan_kerja")
        .select("id, nama_satuan_kerja")
        .order("no_urut");
      if (error) throw error;
      const satuanKerjaNames = (data || []).map(sk => sk.nama_satuan_kerja);
      setSatuanKerjaOptions(satuanKerjaNames);
    } catch (error: any) {
      console.error("Error fetching satuan kerja:", error);
      // Fallback to employees nm_unit_organisasi if satuan_kerja table fails
      const uniqueSatuanKerja = [...new Set(employees.map(e => e.nm_unit_organisasi).filter(Boolean))];
      setSatuanKerjaOptions(uniqueSatuanKerja);
    }
  };

  const fetchBigDataEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("grading_big_data")
        .select("id, nama_lengkap, nip, pendidikan, grade, pangkat, pangkat_golongan, tmt_pangkat, jabatan, pkt_2024, pkt_2025, kemampuan_kerja, lokasi, jenis, atasan_langsung_nama, atasan_langsung_id, atasan_dari_atasan_nama, atasan_dari_atasan_id, akumulasi_masa_kerja, akumulasi_terakhir")
        .order("nama_lengkap")
        .limit(1000);
      if (error) throw error;
      setBigDataEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching big data employees:", error);
    }
  };

  // Format TMT date for display
  const formatTMT = (tmtDate: string | null): string => {
    if (!tmtDate) return '';
    try {
      const date = new Date(tmtDate);
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return tmtDate;
    }
  };

  // Handle Big Data employee selection - auto-fill fields
  const handleBigDataSelect = (employeeName: string) => {
    const employee = bigDataEmployees.find(e => e.nama_lengkap === employeeName);
    if (employee) {
      // Format: pangkat / golongan / TMT pangkat
      const pangkatGolTmt = [
        employee.pangkat,
        employee.pangkat_golongan,
        employee.tmt_pangkat ? formatTMT(employee.tmt_pangkat) : null
      ].filter(Boolean).join(' / ');
      
      // Get atasan's NIP from employees table
      const atasanLangsung = employees.find(e => e.nm_pegawai === employee.atasan_langsung_nama);
      const atasanDariAtasan = employees.find(e => e.nm_pegawai === employee.atasan_dari_atasan_nama);
      
      setFormData({
        ...formData,
        nama_nip: `${employee.nama_lengkap}/${employee.nip}`,
        pendidikan: employee.pendidikan || '',
        peringkat_lama: employee.grade || '',
        pangkat_gol_ruang_tmt: pangkatGolTmt,
        jabatan_kedudukan: employee.jabatan || '',
        jabatan_tugas_kedudukan: employee.jabatan || '',
        pkt_y_minus_1: employee.pkt_2024 || '',
        pkt_y: employee.pkt_2025 || '',
        predikat_kinerja_terakhir_peringkat_lama: employee.pkt_2024 || '',
        predikat_kinerja_tahunan_y: employee.pkt_2025 || '',
        kemampuan_kerja: employee.kemampuan_kerja || '',
        lokasi: employee.lokasi || '',
        nama_atasan_langsung: employee.atasan_langsung_nama || '',
        nip_atasan_langsung: atasanLangsung?.nip || '',
        nama_atasan_dari_atasan_langsung: employee.atasan_dari_atasan_nama || '',
        nip_atasan_dari_atasan_langsung: atasanDariAtasan?.nip || '',
        // Auto-fill akumulasi fields from Big Data for PK type
        akumulasi_masa_kerja_terakhir_peringkat_lama: employee.akumulasi_terakhir || '',
        akumulasi_masa_kerja_sd_tahun_y: employee.akumulasi_masa_kerja || '',
      });
    }
    setNamaNipOpen(false);
  };

  const resetForm = () => {
    setFormData({
      jenis_evaluasi: 'PU',
      satuan_kerja: '',
      nama_nip: '',
      pangkat_gol_ruang_tmt: '',
      pendidikan: '',
      jabatan_kedudukan: '',
      peringkat_lama: '',
      pkt_y_minus_1: '',
      pkt_y: '',
      kemampuan_kerja: '',
      jabatan_tugas_kedudukan: '',
      predikat_kinerja_terakhir_peringkat_lama: '',
      akumulasi_masa_kerja_terakhir_peringkat_lama: '',
      akumulasi_masa_kerja_sd_tahun_y: '',
      predikat_kinerja_tahunan_y: '',
      lokasi: '',
      tanggal: '',
      nama_atasan_dari_atasan_langsung: '',
      nip_atasan_dari_atasan_langsung: '',
      nama_atasan_langsung: '',
      nip_atasan_langsung: '',
    });
    // Reset multi-select state
    setSelectedMultipleEmployees([]);
    setMultiSelectSearch("");
  };

  // Handler for adding employee to multi-select preview
  const handleAddEmployeeToPreview = (employee: BigDataEmployee) => {
    // Check if already added
    if (selectedMultipleEmployees.some(e => e.id === employee.id)) {
      toast.warning("Pegawai sudah ada dalam daftar");
      return;
    }
    
    setSelectedMultipleEmployees(prev => [...prev, employee]);
    toast.success(`${employee.nama_lengkap} ditambahkan ke daftar`);
    setMultiSelectSearch("");
  };

  // Handler for removing employee from multi-select preview
  const handleRemoveEmployeeFromPreview = (employeeId: string) => {
    setSelectedMultipleEmployees(prev => prev.filter(e => e.id !== employeeId));
  };

  const handleAtasanLangsungSelect = (employeeName: string) => {
    const employee = employees.find(e => e.nm_pegawai === employeeName);
    setFormData({
      ...formData,
      nama_atasan_langsung: employeeName,
      nip_atasan_langsung: employee?.nip || '',
    });
    setAtasanLangsungOpen(false);
  };

  const handleAtasanDariAtasanSelect = (employeeName: string) => {
    const employee = employees.find(e => e.nm_pegawai === employeeName);
    setFormData({
      ...formData,
      nama_atasan_dari_atasan_langsung: employeeName,
      nip_atasan_dari_atasan_langsung: employee?.nip || '',
    });
    setAtasanDariAtasanOpen(false);
  };

  const handleSubmit = async () => {
    // For editing mode, require nama_nip from formData
    // For add mode, either require nama_nip from formData OR selectedMultipleEmployees
    if (editingData) {
      if (!formData.nama_nip || !formData.jenis_evaluasi) {
        toast.error("Nama/NIP dan Jenis Evaluasi wajib diisi");
        return;
      }
    } else {
      // Add mode - check if we have any employees to add
      if (selectedMultipleEmployees.length === 0 && !formData.nama_nip) {
        toast.error("Pilih minimal 1 pegawai untuk ditambahkan");
        return;
      }
      if (!formData.jenis_evaluasi) {
        toast.error("Jenis Evaluasi wajib diisi");
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get next no_urut
      const { data: existingData } = await supabase
        .from("grading_format_hasil_evaluasi")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);
      
      let nextNoUrut = existingData && existingData.length > 0 ? (existingData[0].no_urut || 0) + 1 : 1;

      if (editingData) {
        // Edit mode - single update
        const insertData = {
          jenis_evaluasi: formData.jenis_evaluasi || 'PU',
          satuan_kerja: formData.satuan_kerja || null,
          nama_nip: formData.nama_nip || '',
          pangkat_gol_ruang_tmt: formData.pangkat_gol_ruang_tmt || null,
          pendidikan: formData.pendidikan || null,
          jabatan_kedudukan: formData.jabatan_kedudukan || null,
          peringkat_lama: formData.peringkat_lama || null,
          pkt_y_minus_1: formData.pkt_y_minus_1 || null,
          pkt_y: formData.pkt_y || null,
          kemampuan_kerja: formData.kemampuan_kerja || null,
          jabatan_tugas_kedudukan: formData.jabatan_tugas_kedudukan || null,
          predikat_kinerja_terakhir_peringkat_lama: formData.predikat_kinerja_terakhir_peringkat_lama || null,
          akumulasi_masa_kerja_terakhir_peringkat_lama: formData.akumulasi_masa_kerja_terakhir_peringkat_lama || null,
          akumulasi_masa_kerja_sd_tahun_y: formData.akumulasi_masa_kerja_sd_tahun_y || null,
          predikat_kinerja_tahunan_y: formData.predikat_kinerja_tahunan_y || null,
          lokasi: formData.lokasi || null,
          tanggal: formData.tanggal || null,
          nama_atasan_dari_atasan_langsung: formData.nama_atasan_dari_atasan_langsung || null,
          nip_atasan_dari_atasan_langsung: formData.nip_atasan_dari_atasan_langsung || null,
          nama_atasan_langsung: formData.nama_atasan_langsung || null,
          nip_atasan_langsung: formData.nip_atasan_langsung || null,
          no_urut: editingData.no_urut || nextNoUrut,
          created_by_email: user?.email || null,
        };

        const { error } = await supabase
          .from("grading_format_hasil_evaluasi")
          .update(insertData)
          .eq("id", editingData.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        // Add mode - bulk insert for multiple employees
        const employeesToInsert = selectedMultipleEmployees.length > 0 
          ? selectedMultipleEmployees 
          : [bigDataEmployees.find(e => formData.nama_nip?.includes(e.nama_lengkap))].filter(Boolean);
        
        if (employeesToInsert.length === 0) {
          toast.error("Tidak ada pegawai valid untuk ditambahkan");
          return;
        }

        // Get atasan info for bulk insert
        const bulkInsertData = employeesToInsert.map((employee, index) => {
          if (!employee) return null;
          
          // Format: pangkat / golongan / TMT pangkat
          const pangkatGolTmt = [
            employee.pangkat,
            employee.pangkat_golongan,
            employee.tmt_pangkat ? formatTMT(employee.tmt_pangkat) : null
          ].filter(Boolean).join(' / ');
          
          // Get atasan's NIP from employees table
          const atasanLangsung = employees.find(e => e.nm_pegawai === employee.atasan_langsung_nama);
          const atasanDariAtasan = employees.find(e => e.nm_pegawai === employee.atasan_dari_atasan_nama);

          return {
            jenis_evaluasi: formData.jenis_evaluasi || 'PU',
            satuan_kerja: formData.satuan_kerja || null,
            nama_nip: `${employee.nama_lengkap}/${employee.nip}`,
            pangkat_gol_ruang_tmt: pangkatGolTmt || null,
            pendidikan: employee.pendidikan || null,
            jabatan_kedudukan: employee.jabatan || null,
            peringkat_lama: employee.grade || null,
            pkt_y_minus_1: employee.pkt_2024 || null,
            pkt_y: employee.pkt_2025 || null,
            kemampuan_kerja: employee.kemampuan_kerja || null,
            jabatan_tugas_kedudukan: employee.jabatan || null,
            predikat_kinerja_terakhir_peringkat_lama: employee.pkt_2024 || null,
            akumulasi_masa_kerja_terakhir_peringkat_lama: employee.akumulasi_terakhir || null,
            akumulasi_masa_kerja_sd_tahun_y: employee.akumulasi_masa_kerja || null,
            predikat_kinerja_tahunan_y: employee.pkt_2025 || null,
            lokasi: formData.lokasi || employee.lokasi || null,
            tanggal: formData.tanggal || null,
            nama_atasan_dari_atasan_langsung: employee.atasan_dari_atasan_nama || formData.nama_atasan_dari_atasan_langsung || null,
            nip_atasan_dari_atasan_langsung: atasanDariAtasan?.nip || formData.nip_atasan_dari_atasan_langsung || null,
            nama_atasan_langsung: employee.atasan_langsung_nama || formData.nama_atasan_langsung || null,
            nip_atasan_langsung: atasanLangsung?.nip || formData.nip_atasan_langsung || null,
            no_urut: nextNoUrut + index,
            created_by_email: user?.email || null,
          };
        }).filter(Boolean);

        if (bulkInsertData.length === 0) {
          toast.error("Tidak ada data valid untuk diinsert");
          return;
        }

        const { error } = await supabase
          .from("grading_format_hasil_evaluasi")
          .insert(bulkInsertData);
        if (error) throw error;
        toast.success(`${bulkInsertData.length} data berhasil ditambahkan`);
      }

      setDialogOpen(false);
      setEditingData(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving hasil evaluasi:", error);
      toast.error("Gagal menyimpan data: " + error.message);
    }
  };

  const handleEdit = (item: HasilEvaluasiData) => {
    setEditingData(item);
    setFormData({
      jenis_evaluasi: item.jenis_evaluasi,
      satuan_kerja: item.satuan_kerja || '',
      nama_nip: item.nama_nip || '',
      pangkat_gol_ruang_tmt: item.pangkat_gol_ruang_tmt || '',
      pendidikan: item.pendidikan || '',
      jabatan_kedudukan: item.jabatan_kedudukan || '',
      peringkat_lama: item.peringkat_lama || '',
      pkt_y_minus_1: item.pkt_y_minus_1 || '',
      pkt_y: item.pkt_y || '',
      kemampuan_kerja: item.kemampuan_kerja || '',
      jabatan_tugas_kedudukan: item.jabatan_tugas_kedudukan || '',
      predikat_kinerja_terakhir_peringkat_lama: item.predikat_kinerja_terakhir_peringkat_lama || '',
      akumulasi_masa_kerja_terakhir_peringkat_lama: item.akumulasi_masa_kerja_terakhir_peringkat_lama || '',
      akumulasi_masa_kerja_sd_tahun_y: item.akumulasi_masa_kerja_sd_tahun_y || '',
      predikat_kinerja_tahunan_y: item.predikat_kinerja_tahunan_y || '',
      lokasi: item.lokasi || '',
      tanggal: item.tanggal || '',
      nama_atasan_dari_atasan_langsung: item.nama_atasan_dari_atasan_langsung || '',
      nip_atasan_dari_atasan_langsung: item.nip_atasan_dari_atasan_langsung || '',
      nama_atasan_langsung: item.nama_atasan_langsung || '',
      nip_atasan_langsung: item.nip_atasan_langsung || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("grading_format_hasil_evaluasi")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data: " + error.message);
    } finally {
      setDeleteId(null);
    }
  };

  // Export to Excel
  const handleExport = () => {
    const exportData = filteredData.map((d, i) => ({
      No: i + 1,
      "Jenis Evaluasi": d.jenis_evaluasi,
      "Satuan Kerja": d.satuan_kerja || "",
      "Nama/NIP": d.nama_nip,
      "Pangkat/Gol/TMT": d.pangkat_gol_ruang_tmt || "",
      "Pendidikan": d.pendidikan || "",
      "Jabatan/Kedudukan": d.jabatan_kedudukan || "",
      "Peringkat Lama": d.peringkat_lama || "",
      "PKT Y-1": d.pkt_y_minus_1 || "",
      "PKT Y": d.pkt_y || "",
      "Kemampuan Kerja": d.kemampuan_kerja || "",
      "Lokasi": d.lokasi || "",
      "Tanggal": d.tanggal || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Evaluasi");
    XLSX.writeFile(wb, `Hasil_Evaluasi_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  // Import from Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { data: { user } } = await supabase.auth.getUser();

      const insertData = jsonData.map((row: any) => ({
        jenis_evaluasi: row["Jenis Evaluasi"] || "PU",
        satuan_kerja: row["Satuan Kerja"] || null,
        nama_nip: row["Nama/NIP"] || "",
        pangkat_gol_ruang_tmt: row["Pangkat/Gol/TMT"] || null,
        pendidikan: row["Pendidikan"] || null,
        jabatan_kedudukan: row["Jabatan/Kedudukan"] || null,
        peringkat_lama: row["Peringkat Lama"] || null,
        pkt_y_minus_1: row["PKT Y-1"] || null,
        pkt_y: row["PKT Y"] || null,
        kemampuan_kerja: row["Kemampuan Kerja"] || null,
        lokasi: row["Lokasi"] || null,
        tanggal: row["Tanggal"] || null,
        created_by_email: user?.email || null,
      })).filter((item: any) => item.nama_nip);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      const { error } = await supabase.from("grading_format_hasil_evaluasi").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor`);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal mengimpor data: " + error.message);
    }

    e.target.value = "";
  };

  // Delete all data (already declared at top)
  
  const handleDeleteAll = async () => {
    try {
      const ids = filteredData.map(d => d.id);
      if (ids.length === 0) {
        toast.error("Tidak ada data untuk dihapus");
        return;
      }
      
      const { error } = await supabase
        .from("grading_format_hasil_evaluasi")
        .delete()
        .in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} data berhasil dihapus`);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data: " + error.message);
    } finally {
      setDeleteAllOpen(false);
    }
  };

  // Generate Word document for single item
  const handleGenerateWord = async (item: HasilEvaluasiData) => {
    try {
      await generateHasilEvaluasiDocument(item);
      toast.success(`Dokumen hasil evaluasi ${item.jenis_evaluasi} berhasil di-generate`);
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast.error("Gagal generate dokumen: " + error.message);
    }
  };

  // Bulk generate Word document for selected items
  const handleBulkDownloadWord = async () => {
    if (selectedForDownload.length === 0) {
      toast.error("Pilih minimal 1 nama untuk di-generate");
      return;
    }
    
    try {
      const selectedItems = data.filter(d => selectedForDownload.includes(d.id) && d.jenis_evaluasi === unduhWordJenis);
      if (selectedItems.length === 0) {
        toast.error(`Tidak ada data dengan jenis ${unduhWordJenis} yang dipilih`);
        return;
      }
      
      switch (unduhWordJenis) {
        case 'PU':
          await generateHasilEvaluasiPU(selectedItems);
          break;
        case 'PK':
          await generateHasilEvaluasiPK(selectedItems);
          break;
        case 'PTB':
          await generateHasilEvaluasiPTB(selectedItems);
          break;
        case 'PT':
          await generateHasilEvaluasiPT(selectedItems);
          break;
      }
      
      toast.success(`Dokumen hasil evaluasi ${unduhWordJenis} dengan ${selectedItems.length} data berhasil di-generate`);
      setUnduhWordDialogOpen(false);
      setSelectedForDownload([]);
    } catch (error: any) {
      console.error("Error generating bulk document:", error);
      toast.error("Gagal generate dokumen: " + error.message);
    }
  };

  // Get filtered data by jenis for unduh word dialog
  const getDataByJenis = (jenis: 'PU' | 'PK' | 'PTB' | 'PT') => {
    return data.filter(d => d.jenis_evaluasi === jenis);
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.nama_nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.satuan_kerja?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterJenis === "all" || item.jenis_evaluasi === filterJenis;
    return matchesSearch && matchesFilter;
  });

  const renderFormFields = () => {
    const jenisEvaluasi = formData.jenis_evaluasi;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jenis Evaluasi */}
          <div className="space-y-2">
            <Label>Jenis Evaluasi *</Label>
            <Select 
              value={formData.jenis_evaluasi} 
              onValueChange={(v: 'PU' | 'PK' | 'PTB') => {
                setFormData({ ...formData, jenis_evaluasi: v, nama_nip: '' });
                // Clear multi-select when jenis changes
                setSelectedMultipleEmployees([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis evaluasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PU">Pelaksana Umum (PU)</SelectItem>
                <SelectItem value="PK">Pelaksana Khusus (PK)</SelectItem>
                <SelectItem value="PTB">Pelaksana Tugas Belajar (PTB)</SelectItem>
                <SelectItem value="PT">Pelaksana Tertentu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pada... (Satuan Kerja) */}
          <div className="space-y-2">
            <Label>Pada... (Satuan Kerja)</Label>
            <Select 
              value={formData.satuan_kerja || "none"} 
              onValueChange={(v) => setFormData({ ...formData, satuan_kerja: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih satuan kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pilih...</SelectItem>
                {satuanKerjaOptions.map(sk => (
                  <SelectItem key={sk} value={sk}>{sk}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nama/NIP Yang Dinilai - Multi-select with grouping preview */}
        <div className="space-y-3">
          <Label className="font-semibold">Nama/NIP Yang Dinilai * {!editingData && "(atau klik dari preview untuk mengisi detail)"}</Label>
          
          {/* Multi-select Combobox */}
          <Popover open={namaNipOpen} onOpenChange={setNamaNipOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={namaNipOpen}
                className="w-full justify-between font-normal"
              >
                {editingData 
                  ? (formData.nama_nip || "Pilih pegawai dari Big Data...")
                  : (selectedMultipleEmployees.length > 0 
                      ? `${selectedMultipleEmployees.length} pegawai terpilih`
                      : "Pilih pegawai dari Big Data..."
                    )
                }
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Cari nama atau NIP pegawai..." />
                <CommandList>
                  <CommandEmpty>Tidak ditemukan di Big Data dengan jenis {formData.jenis_evaluasi}</CommandEmpty>
                  <CommandGroup>
                    {bigDataEmployees
                      .filter(emp => {
                        // Match by jenis_evaluasi
                        if (formData.jenis_evaluasi === 'PT') {
                          return emp.jenis === 'Pelaksana Tertentu';
                        }
                        if (formData.jenis_evaluasi === 'PTB') {
                          return emp.jenis === 'PTB';
                        }
                        return emp.jenis === formData.jenis_evaluasi;
                      })
                      .slice(0, formData.jenis_evaluasi === 'PT' ? 50 : 1000)
                      .map((employee) => {
                        const isSelected = editingData 
                          ? formData.nama_nip?.includes(employee.nama_lengkap)
                          : selectedMultipleEmployees.some(e => e.id === employee.id);
                        
                        return (
                          <CommandItem
                            key={employee.id}
                            value={`${employee.nama_lengkap} ${employee.nip}`}
                            onSelect={() => {
                              if (editingData) {
                                // In edit mode, single select
                                handleBigDataSelect(employee.nama_lengkap);
                              } else {
                                // In add mode, multi-select toggle
                                if (selectedMultipleEmployees.some(e => e.id === employee.id)) {
                                  handleRemoveEmployeeFromPreview(employee.id);
                                } else {
                                  handleAddEmployeeToPreview(employee);
                                }
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{employee.nama_lengkap}</span>
                              <span className="text-xs text-muted-foreground">{employee.nip} - {employee.jenis}</span>
                            </div>
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {employee.grade || '-'}
                            </span>
                          </CommandItem>
                        );
                      })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <p className="text-xs text-muted-foreground">
            Menampilkan pegawai dengan jenis: {formData.jenis_evaluasi === 'PT' ? 'Pelaksana Tertentu' : formData.jenis_evaluasi} dari Single Core Big Data
          </p>

          {/* Multi-Select Preview Section (like Permohonan) - Grouping layout */}
          {!editingData && selectedMultipleEmployees.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-amber-500/30">
                <span className="bg-amber-500/10 text-amber-600 font-semibold px-3 py-1 rounded-full text-xs">
                  PREVIEW
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  Pegawai Terpilih ({selectedMultipleEmployees.length} orang)
                </span>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="rounded-md border pr-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>NIP</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="w-12">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMultipleEmployees.map((emp, idx) => (
                        <TableRow 
                          key={emp.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleBigDataSelect(emp.nama_lengkap)}
                        >
                          <TableCell className="text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{emp.nama_lengkap}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{emp.nip}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {emp.grade || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEmployeeFromPreview(emp.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Klik baris pegawai dari daftar di atas untuk mengisi detail. Pegawai di atas akan di-generate dengan informasi header yang sama.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pangkat/Gol Ruang/TMT - Auto-filled from Big Data */}
        <div className="space-y-2">
          <Label>Pangkat/Gol Ruang/TMT Gol</Label>
          <Input
            value={formData.pangkat_gol_ruang_tmt}
            onChange={(e) => setFormData({ ...formData, pangkat_gol_ruang_tmt: e.target.value })}
            placeholder="Otomatis dari Big Data"
            className={formData.pangkat_gol_ruang_tmt ? "bg-muted" : ""}
            readOnly={!!formData.pangkat_gol_ruang_tmt}
          />
        </div>

        {/* Pendidikan - Auto-filled from Big Data */}
        <div className="space-y-2">
          <Label>Pendidikan</Label>
          <Input
            value={formData.pendidikan}
            onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
            placeholder="Otomatis dari Big Data"
            className={formData.pendidikan ? "bg-muted" : ""}
            readOnly={!!formData.pendidikan}
          />
        </div>

        {/* Jabatan/Kedudukan - varies by type, auto-filled from Big Data */}
        {jenisEvaluasi === 'PK' ? (
          <div className="space-y-2">
            <Label>Jabatan/Tugas/Kedudukan</Label>
            <Input
              value={formData.jabatan_tugas_kedudukan}
              onChange={(e) => setFormData({ ...formData, jabatan_tugas_kedudukan: e.target.value })}
              placeholder="Otomatis dari Big Data"
              className={formData.jabatan_tugas_kedudukan ? "bg-muted" : ""}
              readOnly={!!formData.jabatan_tugas_kedudukan}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Jabatan/Kedudukan</Label>
            <Input
              value={formData.jabatan_kedudukan}
              onChange={(e) => setFormData({ ...formData, jabatan_kedudukan: e.target.value })}
              placeholder="Otomatis dari Big Data"
              className={formData.jabatan_kedudukan ? "bg-muted" : ""}
              readOnly={!!formData.jabatan_kedudukan}
            />
          </div>
        )}

        {/* Peringkat Lama - Auto-filled from Big Data (grade lama) */}
        <div className="space-y-2">
          <Label>Peringkat Lama</Label>
          <Input
            value={formData.peringkat_lama}
            onChange={(e) => setFormData({ ...formData, peringkat_lama: e.target.value })}
            placeholder="Otomatis dari Big Data"
            className={formData.peringkat_lama ? "bg-muted" : ""}
            readOnly={!!formData.peringkat_lama}
          />
        </div>

        {/* PU-specific fields */}
        {jenisEvaluasi === 'PU' && (
          <>
            <div className="space-y-2">
              <Label>Predikat Kinerja Tahunan (Y-1)</Label>
              <Select 
                value={formData.pkt_y_minus_1 || "none"} 
                onValueChange={(v) => setFormData({ ...formData, pkt_y_minus_1: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {PKT_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Predikat Kinerja Tahunan (Y)</Label>
              <Select 
                value={formData.pkt_y || "none"} 
                onValueChange={(v) => setFormData({ ...formData, pkt_y: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {PKT_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kemampuan Kerja Pelaksana</Label>
              <Select 
                value={formData.kemampuan_kerja || "none"} 
                onValueChange={(v) => setFormData({ ...formData, kemampuan_kerja: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kemampuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {KEMAMPUAN_KERJA_OPTIONS.map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* PK-specific fields */}
        {jenisEvaluasi === 'PK' && (
          <>
            <div className="space-y-2">
              <Label>Predikat Kinerja Terakhir pada Peringkat Lama</Label>
              <Select 
                value={formData.predikat_kinerja_terakhir_peringkat_lama || "none"} 
                onValueChange={(v) => setFormData({ ...formData, predikat_kinerja_terakhir_peringkat_lama: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {PKT_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Akumulasi Masa Kerja Terakhir pada Peringkat Lama</Label>
              <Input
                value={formData.akumulasi_masa_kerja_terakhir_peringkat_lama}
                onChange={(e) => setFormData({ ...formData, akumulasi_masa_kerja_terakhir_peringkat_lama: e.target.value })}
                placeholder="Contoh: 2 tahun 6 bulan"
              />
            </div>
            <div className="space-y-2">
              <Label>Akumulasi Masa Kerja s.d Tahun (Y)</Label>
              <Input
                value={formData.akumulasi_masa_kerja_sd_tahun_y}
                onChange={(e) => setFormData({ ...formData, akumulasi_masa_kerja_sd_tahun_y: e.target.value })}
                placeholder="Contoh: 5 tahun"
              />
            </div>
            <div className="space-y-2">
              <Label>Predikat Kinerja Tahunan (Y)</Label>
              <Select 
                value={formData.predikat_kinerja_tahunan_y || "none"} 
                onValueChange={(v) => setFormData({ ...formData, predikat_kinerja_tahunan_y: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {PKT_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* PTB-specific fields */}
        {jenisEvaluasi === 'PTB' && (
          <>
            <div className="space-y-2">
              <Label>Predikat Kinerja Tahunan (Y-1)</Label>
              <Select 
                value={formData.pkt_y_minus_1 || "none"} 
                onValueChange={(v) => setFormData({ ...formData, pkt_y_minus_1: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {PKT_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Predikat Kinerja Tahunan (Y)</Label>
              <Select 
                value={formData.pkt_y || "none"} 
                onValueChange={(v) => setFormData({ ...formData, pkt_y: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih predikat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Pilih...</SelectItem>
                  {PKT_OPTIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Atasan Langsung with vlookup */}
        <div className="space-y-2">
          <Label>Nama Atasan Langsung</Label>
          <Popover open={atasanLangsungOpen} onOpenChange={setAtasanLangsungOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={atasanLangsungOpen}
                className="w-full justify-between font-normal"
              >
                {formData.nama_atasan_langsung || "Pilih atasan langsung..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Cari pegawai..." />
                <CommandList>
                  <CommandEmpty>Tidak ditemukan</CommandEmpty>
                  <CommandGroup>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={employee.nm_pegawai}
                        onSelect={handleAtasanLangsungSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.nama_atasan_langsung === employee.nm_pegawai ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {employee.nm_pegawai}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>NIP Atasan Langsung</Label>
          <Input
            value={formData.nip_atasan_langsung}
            readOnly
            className="bg-muted"
            placeholder="Otomatis dari nama"
          />
        </div>

        {/* Atasan dari Atasan Langsung with vlookup */}
        <div className="space-y-2">
          <Label>Nama Atasan dari Atasan Langsung</Label>
          <Popover open={atasanDariAtasanOpen} onOpenChange={setAtasanDariAtasanOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={atasanDariAtasanOpen}
                className="w-full justify-between font-normal"
              >
                {formData.nama_atasan_dari_atasan_langsung || "Pilih atasan dari atasan langsung..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Cari pegawai..." />
                <CommandList>
                  <CommandEmpty>Tidak ditemukan</CommandEmpty>
                  <CommandGroup>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={employee.nm_pegawai}
                        onSelect={handleAtasanDariAtasanSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.nama_atasan_dari_atasan_langsung === employee.nm_pegawai ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {employee.nm_pegawai}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>NIP Atasan dari Atasan Langsung</Label>
          <Input
            value={formData.nip_atasan_dari_atasan_langsung}
            readOnly
            className="bg-muted"
            placeholder="Otomatis dari nama"
          />
        </div>

        {/* Lokasi and Tanggal - moved after atasan langsung fields */}
        <div className="space-y-2">
          <Label>Lokasi</Label>
          <Input
            value={formData.lokasi}
            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
            placeholder="Lokasi"
          />
        </div>

        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input
            type="date"
            value={formData.tanggal}
            onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
          />
        </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Format Hasil Evaluasi PU/PK/PTB/PT</h3>
            <p className="text-sm text-muted-foreground">Data hasil evaluasi untuk Pelaksana Umum, Pelaksana Khusus, Pelaksana Tugas Belajar, dan Pelaksana Tertentu</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setUnduhWordDialogOpen(true); setUnduhWordJenis('PU'); setSelectedForDownload([]); }}>
              <FileDown className="h-4 w-4 mr-2" />
              Unduh Word
            </Button>
            {isAdmin && (
              <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            )}
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            {isAdmin && (
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Excel
                </Button>
              </div>
            )}
            {isAdmin && (
              <Button onClick={() => { resetForm(); setEditingData(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Hasil Evaluasi
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama/NIP atau satuan kerja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterJenis} onValueChange={setFilterJenis}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jenis</SelectItem>
            <SelectItem value="PU">Pelaksana Umum (PU)</SelectItem>
            <SelectItem value="PK">Pelaksana Khusus (PK)</SelectItem>
            <SelectItem value="PTB">Pelaksana Tugas Belajar (PTB)</SelectItem>
            <SelectItem value="PT">Pelaksana Tertentu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Satuan Kerja</TableHead>
              <TableHead>Nama/NIP</TableHead>
              <TableHead>Pangkat/Gol</TableHead>
              <TableHead>Peringkat Lama</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Belum ada data hasil evaluasi. Klik "Tambah Hasil Evaluasi" untuk menambahkan data baru.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      item.jenis_evaluasi === 'PU' && "bg-blue-100 text-blue-700",
                      item.jenis_evaluasi === 'PK' && "bg-green-100 text-green-700",
                      item.jenis_evaluasi === 'PTB' && "bg-purple-100 text-purple-700",
                      item.jenis_evaluasi === 'PT' && "bg-orange-100 text-orange-700"
                    )}>
                      {item.jenis_evaluasi}
                    </span>
                  </TableCell>
                  <TableCell>{item.satuan_kerja}</TableCell>
                  <TableCell>{item.nama_nip}</TableCell>
                  <TableCell>{item.pangkat_gol_ruang_tmt}</TableCell>
                  <TableCell>{item.peringkat_lama}</TableCell>
                  <TableCell>{item.lokasi}</TableCell>
                  <TableCell>{item.tanggal}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleGenerateWord(item)} title="Generate Word">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingData(null); resetForm(); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingData ? "Edit Hasil Evaluasi" : "Tambah Hasil Evaluasi"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            {renderFormFields()}
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingData(null); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingData ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Semua</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {filteredData.length} data yang terfilter? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unduh Word Dialog */}
      <Dialog open={unduhWordDialogOpen} onOpenChange={setUnduhWordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Unduh Word - Hasil Evaluasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Jenis Selection */}
            <div className="space-y-2">
              <Label>Pilih Jenis Evaluasi</Label>
              <div className="flex gap-2">
                {(['PU', 'PK', 'PTB', 'PT'] as const).map(jenis => (
                  <Button
                    key={jenis}
                    variant={unduhWordJenis === jenis ? "default" : "outline"}
                    onClick={() => { setUnduhWordJenis(jenis); setSelectedForDownload([]); }}
                    className="flex-1"
                  >
                    {jenis === 'PT' ? 'Pelaksana Tertentu' : jenis}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Name Selection with Checkboxes */}
            <div className="space-y-2">
              <Label>Pilih Nama untuk di-Generate ({getDataByJenis(unduhWordJenis).length} data tersedia)</Label>
              <ScrollArea className="h-[300px] border rounded-md p-3">
                {getDataByJenis(unduhWordJenis).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Tidak ada data dengan jenis {unduhWordJenis}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getDataByJenis(unduhWordJenis).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          id={item.id}
                          checked={selectedForDownload.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedForDownload([...selectedForDownload, item.id]);
                            } else {
                              setSelectedForDownload(selectedForDownload.filter(id => id !== item.id));
                            }
                          }}
                        />
                        <label htmlFor={item.id} className="flex-1 text-sm cursor-pointer">
                          <span className="font-medium">{item.nama_nip}</span>
                          <span className="text-muted-foreground ml-2">- {item.satuan_kerja || 'Tanpa Satker'}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{selectedForDownload.length} nama dipilih</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedForDownload(getDataByJenis(unduhWordJenis).map(d => d.id))}>
                    Pilih Semua
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedForDownload([])}>
                    Hapus Semua
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setUnduhWordDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleBulkDownloadWord} disabled={selectedForDownload.length === 0}>
              <FileDown className="h-4 w-4 mr-2" />
              Generate Word ({selectedForDownload.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
