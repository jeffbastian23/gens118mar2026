import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Download, Upload, Edit, Check, ChevronsUpDown, X, Search, FileText, Info, FileDown, Copy, FileSpreadsheet, ChevronDown, Users, ListPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { generateKEPDocument, generateSalinanDocument, generatePetikanDocument, generatePetikanAllDocument, generateBlankKEPTemplate, generateLampiranKEPDocument, generateLampiranSalinanDocument, KATEGORI_CATATAN_KONSIDERAN, type KonsideranND as KonsideranNDType, type PetikanGeneratorData } from "@/utils/kepDocumentGenerator";

// Jenis Kategori options
const JENIS_KATEGORI_OPTIONS = [
  { value: "Pertama", label: "Pertama" },
  { value: "Kembali", label: "Kembali" },
  { value: "Simulasi", label: "Simulasi" },
  { value: "Sidang", label: "Sidang" },
];

interface KonsideranND {
  naskah_dinas: string;
  nomor_nd: string;
  tanggal_nd: string;
  perihal: string;
}

interface SKPenetapanData {
  id: string;
  no_urut: number;
  nomor_kep: string;
  tanggal_kep: string | null;
  jenis_kategori: string | null;
  konsideran_list: KonsideranND[];
  tujuan_salinan: string[];
  nama_pejabat: string | null;
  nip_pejabat: string | null;
  lampiran_pegawai_ids: string[];
  created_at: string;
  created_by_email: string | null;
}

interface SalinanData {
  id: string;
  no_urut: number;
  nomor_salinan: string;
  tanggal_salinan: string | null;
  nama_ub: string | null;
  nip_ub: string | null;
  sk_penetapan_id: string | null;
  created_at: string;
}

interface PetikanData {
  id: string;
  no_urut: number;
  nomor_petikan: string;
  tanggal_petikan: string | null;
  nama_pejabat: string | null;
  nip_pejabat: string | null;
  sk_penetapan_id: string | null;
  kep_salinan_id: string | null; // Link to specific KEP row
  // Lampiran detail fields
  nama_pegawai_lampiran: string | null;
  nip_pegawai_lampiran: string | null;
  jabatan_lama: string | null;
  jabatan_baru: string | null;
  keterangan_lampiran: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  nm_unit_organisasi: string;
}

interface SKPenetapanTabProps {
  userEmail?: string;
  isAdmin?: boolean;
}

// Interface for big data employees with lampiran_kep
interface BigDataEmployee {
  id: string;
  nama_lengkap: string;
  nip: string;
  lampiran_kep: string | null;
  jabatan?: string;
  jabatan_baru?: string;
  grade?: string;
  grade_baru?: string;
  pangkat?: string;
  tmt_peringkat_baru?: string;
  akumulasi_masa_kerja?: string;
  pkt_2024?: string;
  pkt_2025?: string;
  kemampuan_kerja?: string;
  pendidikan?: string;
  eselon_iii?: string;
  eselon_iv?: string;
}

// Interface for Mekanisme 54 categories
interface Mekanisme54Category {
  id: string;
  jenis_penetapan: string;
  sub_jenis: string;
  kode_kategori: string;
  deskripsi: string;
}

// Interface for Permohonan data to be selected
interface PermohonanOption {
  id: string;
  hal: string;
  nomor_kep: string | null; // Link to KEP by nomor_kep
  nama_lengkap: string;
  nip: string;
  pangkat_gol_tmt: string | null;
  pendidikan: string | null;
  jabatan_lama: string | null;
  grade_lama: string | null;
  jabatan_baru: string | null;
  grade_baru: string | null;
  tmt_peringkat_terakhir: string | null;
}

export default function SKPenetapanTab({ userEmail, isAdmin = true }: SKPenetapanTabProps) {
  const [skData, setSkData] = useState<SKPenetapanData[]>([]);
  const [salinanData, setSalinanData] = useState<SalinanData[]>([]);
  const [petikanData, setPetikanData] = useState<PetikanData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [satuanKerjaOptions, setSatuanKerjaOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<SKPenetapanData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"sk" | "salinan" | "petikan" | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Big data employees for sub-takik
  const [bigDataEmployees, setBigDataEmployees] = useState<BigDataEmployee[]>([]);
  const [expandedKepRows, setExpandedKepRows] = useState<Set<string>>(new Set());
  
  // Mekanisme 54 categories and permohonan data for lampiran dropdown
  const [mekanisme54Categories, setMekanisme54Categories] = useState<Mekanisme54Category[]>([]);
  const [permohonanOptions, setPermohonanOptions] = useState<PermohonanOption[]>([]);
  const [lampiranDropdownOpen, setLampiranDropdownOpen] = useState<string | null>(null);
  const [eselonisasiOrder, setEselonisasiOrder] = useState<Record<string, number>>({});
  
  // Import Excel states
  const [importing, setImporting] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);
  
  // Petikan edit states
  const [petikanEditDialogOpen, setPetikanEditDialogOpen] = useState(false);
  const [editingPetikanData, setEditingPetikanData] = useState<PetikanData | null>(null);
  const [petikanEditForm, setPetikanEditForm] = useState({
    nomor_petikan: "",
    tanggal_petikan: "",
    nama_pegawai: "",
    nip_pegawai: "",
    hal: "",
    pangkat: "",
    pendidikan: "",
    jabatan_lama: "",
    grade_lama: "",
    jabatan_baru: "",
    grade_baru: "",
    tmt: "",
    keterangan: "",
  });

  // Klaster I - KEP form states
  const [formData, setFormData] = useState({
    nomor_kep: "",
    tanggal_kep: "",
    jenis_kategori: "",
    konsideran_list: [] as KonsideranND[],
    tujuan_salinan: [] as string[],
    nama_pejabat: "",
    nip_pejabat: "",
    lampiran_pegawai_ids: [] as string[],
  });

  // Klaster II - Salinan form states
  const [salinanForm, setSalinanForm] = useState({
    nomor_salinan: "",
    tanggal_salinan: "",
    nama_ub: "",
    nip_ub: "",
  });

  // Klaster III - Petikan form states
  const [petikanForm, setPetikanForm] = useState({
    nomor_petikan: "",
    tanggal_petikan: "",
    nama_pejabat: "",
    nip_pejabat: "",
  });

  // Combobox states
  const [pejabatOpen, setPejabatOpen] = useState(false);
  const [salinanUbOpen, setSalinanUbOpen] = useState(false);
  const [petikanPejabatOpen, setPetikanPejabatOpen] = useState(false);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  
  // File input ref
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    loadData();
    loadEmployees();
    loadSatuanKerjaOptions();
    loadBigDataEmployees();
    loadMekanisme54Categories();
    loadPermohonanOptions();
    loadEselonisasiOrder();
  }, []);

  const loadData = async () => {
    try {
      // Load from grading_kep_salinan table (existing table)
      const { data: kepData, error: kepError } = await supabase
        .from("grading_kep_salinan")
        .select("*")
        .order("created_at", { ascending: false });

      if (kepError) throw kepError;

      // Transform to our interface
      const transformed: SKPenetapanData[] = (kepData || []).map((item, idx) => ({
        id: item.id,
        no_urut: idx + 1,
        nomor_kep: item.nomor_kep,
        tanggal_kep: item.tanggal_kep,
        jenis_kategori: item.hal || null,
        konsideran_list: [],
        tujuan_salinan: [],
        nama_pejabat: item.nama_lengkap,
        nip_pejabat: item.nip,
        lampiran_pegawai_ids: [],
        created_at: item.created_at,
        created_by_email: item.created_by_email,
      }));

      setSkData(transformed);

      // Load petikan data (lampiran details)
      const { data: petData, error: petError } = await supabase
        .from("grading_petikan")
        .select("*")
        .order("created_at", { ascending: false });

      if (petError) throw petError;

      const petTransformed: PetikanData[] = (petData || []).map((item, idx) => ({
        id: item.id,
        no_urut: idx + 1,
        nomor_petikan: item.nomor_petikan,
        tanggal_petikan: item.tanggal_petikan,
        nama_pejabat: item.nama_lengkap,
        nip_pejabat: item.nip,
        sk_penetapan_id: item.grading_id,
        kep_salinan_id: (item as any).kep_salinan_id || null, // Link to KEP row
        // Use keterangan field to store additional info (parsed from keterangan if available)
        nama_pegawai_lampiran: item.nama_lengkap || null,
        nip_pegawai_lampiran: item.nip || null,
        jabatan_lama: null,
        jabatan_baru: null,
        keterangan_lampiran: item.keterangan || null,
        created_at: item.created_at,
      }));

      setPetikanData(petTransformed);

    } catch (error: any) {
      console.error("Error loading SK Penetapan:", error);
      toast.error("Gagal memuat data SK Penetapan");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // Fetch all employees (>1000) using pagination
      let allEmployees: Employee[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: result, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, nm_unit_organisasi")
          .order("nm_pegawai")
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (result && result.length > 0) {
          allEmployees = [...allEmployees, ...result];
          hasMore = result.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadSatuanKerjaOptions = async () => {
    try {
      const { data: result, error } = await supabase
        .from("employees")
        .select("nm_unit_organisasi")
        .order("nm_unit_organisasi");

      if (error) throw error;
      
      const unique = [...new Set((result || []).map(e => e.nm_unit_organisasi).filter(Boolean))];
      setSatuanKerjaOptions(unique);
    } catch (error) {
      console.error("Error loading satuan kerja:", error);
    }
  };

  // Load big data employees for sub-takik
  const loadBigDataEmployees = async () => {
    try {
      const { data: result, error } = await supabase
        .from("grading_big_data")
        .select("id, nama_lengkap, nip, lampiran_kep, jabatan, jabatan_baru, grade, grade_baru, pangkat, tmt_peringkat_baru, akumulasi_masa_kerja, pkt_2024, pkt_2025, kemampuan_kerja, pendidikan, eselon_iii, eselon_iv")
        .order("lampiran_kep", { ascending: true });

      if (error) throw error;
      setBigDataEmployees(result || []);
    } catch (error) {
      console.error("Error loading big data employees:", error);
    }
  };

  // Load Mekanisme 54 categories for dropdown
  const loadMekanisme54Categories = async () => {
    try {
      const { data: result, error } = await supabase
        .from("mekanisme_54")
        .select("id, jenis_penetapan, sub_jenis, kode_kategori, deskripsi")
        .order("jenis_penetapan")
        .order("kode_kategori");

      if (error) throw error;
      setMekanisme54Categories(result || []);
    } catch (error) {
      console.error("Error loading mekanisme 54:", error);
    }
  };

  // Load permohonan options for lampiran dropdown from permohonan_grading table
  const loadPermohonanOptions = async () => {
    try {
      const { data: result, error } = await supabase
        .from("permohonan_grading")
        .select("id, hal, nomor_kep, nama_lengkap, nip, pangkat_gol_tmt, pendidikan, jabatan_lama, grade_lama, jabatan_baru, grade_baru, tmt_peringkat_terakhir")
        .not("nomor_kep", "is", null)
        .order("nomor_kep")
        .order("nama_lengkap");

      if (error) throw error;
      setPermohonanOptions(result || []);
    } catch (error) {
      console.error("Error loading permohonan options:", error);
    }
  };

  // Load eselonisasi order mapping (tingkat_eselon -> min no_urut)
  const loadEselonisasiOrder = async () => {
    try {
      const { data: result, error } = await supabase
        .from("eselonisasi")
        .select("tingkat_eselon, no_urut")
        .order("no_urut");
      
      if (error) throw error;
      
      // Build mapping: eselon_iii name -> minimum no_urut (for sorting)
      const orderMap: Record<string, number> = {};
      // Also build a mapping from tingkat_eselon to eselon_iii (employees table naming)
      const eselonToEselon3: Record<string, string> = {
        "Bagian Umum": "Bagian Umum",
        "Bidang Kepabeanan dan Cukai": "Bidang Kepabeanan dan Cukai",
        "Bidang Fasilitas Kepabeanan dan Cukai": "Bidang Fasilitas Kepabeanan dan Cukai",
        "Bidang Penindakan dan Penyidikan": "Bidang Penindakan dan Penyidikan",
        "Bidang Kepatuhan Internal": "Bidang Kepatuhan Internal",
      };
      
      (result || []).forEach((item) => {
        const key = item.tingkat_eselon;
        if (!orderMap[key] || item.no_urut < orderMap[key]) {
          orderMap[key] = item.no_urut;
        }
      });
      
      setEselonisasiOrder(orderMap);
    } catch (error) {
      console.error("Error loading eselonisasi order:", error);
    }
  };

  // Sort lampiran employees by eselonisasi order (eselon III first, then eselon IV)
  const sortEmployeesByEselonisasi = <T extends { nip: string }>(emps: T[]): T[] => {
    if (Object.keys(eselonisasiOrder).length === 0) return emps;
    
    // Map eselon_iii from employees table to eselonisasi tingkat_eselon
    const eselon3ToTingkat: Record<string, string> = {
      "Bagian Umum": "Bagian Umum",
      "Bidang Kepabeanan dan Cukai": "Bidang Kepabeanan dan Cukai",
      "Bidang Fasilitas Kepabeanan dan Cukai": "Bidang Fasilitas Kepabeanan dan Cukai",
      "Bidang Penindakan dan Penyidikan": "Bidang Penindakan dan Penyidikan",
      "Bidang Kepatuhan Internal": "Bidang Kepatuhan Internal",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Tanjung Perak": "KPPBC TMP Tanjung Perak",
      "Kantor Pengawasan Dan Pelayanan Bea Dan Cukai Tipe Madya Pabean Juanda": "KPPBC TMP Juanda",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean Juanda": "KPPBC TMP Juanda",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean A Pasuruan": "KPPBC TMP A Pasuruan",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Gresik": "KPPBC TMP B Gresik",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean B Sidoarjo": "KPPBC TMP B Sidoarjo",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Madura": "KPPBC TMP C Madura",
      "Kantor Pengawasan dan Pelayanan Bea dan Cukai Tipe Madya Pabean C Bojonegoro": "KPPBC TMP C Bojonegoro",
      "Balai Laboratorium Bea dan Cukai Kelas I Surabaya": "BLBC Kelas I Surabaya",
    };
    
    return [...emps].sort((a, b) => {
      const empA = bigDataEmployees.find(e => e.nip === a.nip) || employees.find(e => e.nip === a.nip);
      const empB = bigDataEmployees.find(e => e.nip === b.nip) || employees.find(e => e.nip === b.nip);
      
      const eselonA = (empA as any)?.eselon_iii || "";
      const eselonB = (empB as any)?.eselon_iii || "";
      
      const tingkatA = eselon3ToTingkat[eselonA] || eselonA;
      const tingkatB = eselon3ToTingkat[eselonB] || eselonB;
      
      const orderA = eselonisasiOrder[tingkatA] ?? 999;
      const orderB = eselonisasiOrder[tingkatB] ?? 999;
      
      return orderA - orderB;
    });
  };

  // Get permohonan grouped by hal (Pertama, Kembali, Simulasi, Sidang)
  const getPermohonanByHal = (hal: string): PermohonanOption[] => {
    return permohonanOptions.filter(p => p.hal === hal);
  };

  // Map hal to jenis_penetapan for mekanisme_54
  const halToJenisPenetapan: Record<string, string> = {
    "Pertama": "Penetapan Pertama",
    "Kembali": "Penetapan Kembali",
    "Simulasi": "Penetapan Simulasi",
    "Sidang": "Penetapan Sidang",
  };

  // Get categories by jenis_penetapan
  const getCategoriesByJenis = (jenisPenetapan: string): Mekanisme54Category[] => {
    return mekanisme54Categories.filter(c => c.jenis_penetapan === jenisPenetapan);
  };

  // Handle selecting a permohonan to add as lampiran
  const handleAddLampiranFromPermohonan = async (kepId: string, permohonan: PermohonanOption) => {
    try {
      // First, find the matching grading_big_data record by NIP
      let gradingBigDataId: string | null = null;
      
      const matchingBigData = bigDataEmployees.find(emp => emp.nip === permohonan.nip);
      if (matchingBigData) {
        gradingBigDataId = matchingBigData.id;
      }

      // Get the KEP data for reference
      const kepData = skData.find(sk => sk.id === kepId);
      const kepNomorRef = kepData?.nomor_kep || '';

      // Add as petikan/lampiran - kep_salinan_id links to the specific KEP row
      const { error } = await supabase
        .from("grading_petikan")
        .insert({
          grading_id: gradingBigDataId, // This references grading_big_data.id, can be null
          kep_salinan_id: kepId, // Link to the specific KEP row
          nomor_petikan: `LAMPIRAN-${kepNomorRef}-${new Date().getTime()}`,
          tanggal_petikan: new Date().toISOString().split('T')[0],
          nama_lengkap: permohonan.nama_lengkap,
          nip: permohonan.nip,
          keterangan: `Hal: ${permohonan.hal} | Pangkat: ${permohonan.pangkat_gol_tmt || '-'} | Pendidikan: ${permohonan.pendidikan || '-'} | Jabatan Lama: ${permohonan.jabatan_lama || '-'} | Grade Lama: ${permohonan.grade_lama || '-'} | Jabatan Baru: ${permohonan.jabatan_baru || '-'} | Grade Baru: ${permohonan.grade_baru || '-'} | TMT: ${permohonan.tmt_peringkat_terakhir || '-'}`,
          created_by_email: userEmail,
        });

      if (error) throw error;
      toast.success(`Data ${permohonan.nama_lengkap} berhasil ditambahkan ke lampiran KEP ${kepNomorRef}`);
      setLampiranDropdownOpen(null);
      
      // Auto expand the KEP row to show the new lampiran
      setExpandedKepRows(prev => new Set([...prev, kepId]));
      
      loadData();
    } catch (error: any) {
      console.error("Error adding lampiran:", error);
      toast.error("Gagal menambahkan lampiran: " + error.message);
    }
  };

  // Get lampiran for a specific KEP by kep_salinan_id
  const getLampiranForKep = (kepId: string): PetikanData[] => {
    return petikanData.filter(p => p.kep_salinan_id === kepId);
  };

  // Get permohonan filtered by KEP's nomor_kep from permohonan_grading
  const getPermohonanByKepNomor = (nomorKep: string): PermohonanOption[] => {
    if (!nomorKep) return [];
    return permohonanOptions.filter(p => 
      p.nomor_kep && p.nomor_kep.toLowerCase() === nomorKep.toLowerCase()
    );
  };

  // Get employees for a specific KEP number
  const getEmployeesForKep = (nomorKep: string): BigDataEmployee[] => {
    return bigDataEmployees.filter(emp => 
      emp.lampiran_kep && emp.lampiran_kep.toLowerCase().includes(nomorKep.toLowerCase().replace("kep-", "").replace("-", "."))
    );
  };

  // Toggle row expansion
  const toggleRowExpansion = (kepId: string) => {
    const newExpanded = new Set(expandedKepRows);
    if (newExpanded.has(kepId)) {
      newExpanded.delete(kepId);
    } else {
      newExpanded.add(kepId);
    }
    setExpandedKepRows(newExpanded);
  };

  // Handle import Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);
      
      const importData = data.map((row: any) => ({
        nomor_kep: row['Nomor KEP'] || row['nomor_kep'] || '',
        tanggal_kep: row['Tanggal KEP'] || row['tanggal_kep'] || null,
        hal: row['Jenis Kategori'] || row['jenis_kategori'] || row['hal'] || null,
        nama_lengkap: row['Nama Pejabat'] || row['nama_pejabat'] || row['nama_lengkap'] || '',
        nip: row['NIP Pejabat'] || row['nip_pejabat'] || row['nip'] || null,
        jenis_dokumen: 'KEP',
        created_by_email: userEmail,
      })).filter((item: any) => item.nomor_kep);

      if (importData.length === 0) {
        toast.error("Tidak ada data valid dalam file Excel");
        return;
      }

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < importData.length; i += batchSize) {
        const batch = importData.slice(i, i + batchSize);
        const { error } = await supabase.from("grading_kep_salinan").insert(batch);
        if (error) throw error;
      }

      toast.success(`Berhasil mengimport ${importData.length} data SK Penetapan!`);
      loadData();
    } catch (error: any) {
      console.error("Error importing:", error);
      toast.error(error.message || "Gagal mengimport data");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nomor_kep: "",
      tanggal_kep: "",
      jenis_kategori: "",
      konsideran_list: [],
      tujuan_salinan: [],
      nama_pejabat: "",
      nip_pejabat: "",
      lampiran_pegawai_ids: [],
    });
    setSalinanForm({
      nomor_salinan: "",
      tanggal_salinan: "",
      nama_ub: "",
      nip_ub: "",
    });
    setPetikanForm({
      nomor_petikan: "",
      tanggal_petikan: "",
      nama_pejabat: "",
      nip_pejabat: "",
    });
    setEditingData(null);
  };

  const handleAddKonsideran = () => {
    setFormData({
      ...formData,
      konsideran_list: [
        ...formData.konsideran_list,
        { naskah_dinas: "", nomor_nd: "", tanggal_nd: "", perihal: "" }
      ],
    });
  };

  const handleRemoveKonsideran = (index: number) => {
    setFormData({
      ...formData,
      konsideran_list: formData.konsideran_list.filter((_, i) => i !== index),
    });
  };

  const handleUpdateKonsideran = (index: number, field: keyof KonsideranND, value: string) => {
    const updated = [...formData.konsideran_list];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, konsideran_list: updated });
  };

  const handleToggleTujuanSalinan = (sk: string) => {
    const newTujuan = formData.tujuan_salinan.includes(sk)
      ? formData.tujuan_salinan.filter(t => t !== sk)
      : [...formData.tujuan_salinan, sk];
    setFormData({ ...formData, tujuan_salinan: newTujuan });
  };

  const handleSelectPejabat = (emp: Employee) => {
    setFormData({
      ...formData,
      nama_pejabat: emp.nm_pegawai,
      nip_pejabat: emp.nip || "",
    });
    setPejabatOpen(false);
  };

  const handleSelectSalinanUb = (emp: Employee) => {
    setSalinanForm({
      ...salinanForm,
      nama_ub: emp.nm_pegawai,
      nip_ub: emp.nip || "",
    });
    setSalinanUbOpen(false);
  };

  const handleSelectPetikanPejabat = (emp: Employee) => {
    setPetikanForm({
      ...petikanForm,
      nama_pejabat: emp.nm_pegawai,
      nip_pejabat: emp.nip || "",
    });
    setPetikanPejabatOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.nomor_kep) {
      toast.error("Nomor KEP wajib diisi");
      return;
    }

    try {
      const payload = {
        nomor_kep: formData.nomor_kep,
        tanggal_kep: formData.tanggal_kep || null,
        hal: formData.jenis_kategori || null,
        nama_lengkap: formData.nama_pejabat || "",
        nip: formData.nip_pejabat || null,
        jenis_dokumen: "KEP",
        keterangan: formData.konsideran_list.length > 0 
          ? `Konsideran: ${formData.konsideran_list.map(k => k.perihal).filter(Boolean).join(", ")}`
          : null,
        created_by_email: userEmail,
      };

      if (editingData) {
        const { error } = await supabase
          .from("grading_kep_salinan")
          .update(payload)
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data SK Penetapan berhasil diperbarui");
      } else {
        // Only insert SK Penetapan - no automatic Salinan/Petikan creation
        const { error } = await supabase
          .from("grading_kep_salinan")
          .insert(payload);

        if (error) throw error;
        toast.success("Data SK Penetapan berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error saving SK Penetapan:", error);
      toast.error("Gagal menyimpan: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;

    try {
      if (deleteType === "sk") {
        const { error } = await supabase
          .from("grading_kep_salinan")
          .delete()
          .eq("id", deleteId);
        if (error) throw error;
        toast.success("Data SK Penetapan berhasil dihapus");
      } else if (deleteType === "petikan") {
        const { error } = await supabase
          .from("grading_petikan")
          .delete()
          .eq("id", deleteId);
        if (error) throw error;
        toast.success("Data Petikan berhasil dihapus");
      }

      setDeleteId(null);
      setDeleteType(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus: " + error.message);
    }
  };

  const handleDeleteAll = async () => {
    try {
      // Delete all petikan first
      await supabase.from("grading_petikan").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      // Delete all SK Penetapan
      const { error } = await supabase.from("grading_kep_salinan").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data SK Penetapan berhasil dihapus");
      setDeleteAllOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error deleting all:", error);
      toast.error("Gagal menghapus: " + error.message);
    }
  };

  const handleExport = () => {
    if (skData.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const exportData = skData.map((item, idx) => ({
      No: idx + 1,
      "Nomor KEP": item.nomor_kep || "",
      "Tanggal KEP": item.tanggal_kep || "",
      "Jenis Kategori": item.jenis_kategori || "",
      "Nama Pejabat": item.nama_pejabat || "",
      "NIP Pejabat": item.nip_pejabat || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SK Penetapan");
    XLSX.writeFile(wb, `sk_penetapan_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data berhasil diexport");
  };

  const filteredSkData = skData.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.nomor_kep?.toLowerCase().includes(term) ||
      item.nama_pejabat?.toLowerCase().includes(term) ||
      item.jenis_kategori?.toLowerCase().includes(term)
    );
  });

  const filteredEmployees = employees.filter(emp => {
    if (!employeeSearch) return true;
    const term = employeeSearch.toLowerCase();
    return emp.nm_pegawai.toLowerCase().includes(term) || emp.nip?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">SK Penetapan (KEP, Salinan & Petikan)</h3>
            <p className="text-sm text-muted-foreground">Kelola data SK Penetapan dengan 3 klaster</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
            {isAdmin && (
              <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Importing..." : "Import Excel"}
              </Button>
            )}
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={async () => {
              try {
                const response = await fetch("/templates/KEPUTUSAN_KEP.docx");
                if (!response.ok) throw new Error("Template tidak ditemukan");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "TEMPLATE_KEP.docx";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Template KEP berhasil diunduh");
              } catch (error) {
                toast.error("Gagal mengunduh template");
              }
            }}>
              <FileDown className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            {isAdmin && (
              <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteAllOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah SK Penetapan
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="rounded-md border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">No</TableHead>
              <TableHead>Nomor KEP</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jenis Kategori</TableHead>
              <TableHead>Nama Pejabat</TableHead>
              <TableHead>NIP</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredSkData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Belum ada data. Klik "Tambah SK Penetapan" untuk menambahkan.
                </TableCell>
              </TableRow>
            ) : (
              filteredSkData.map((item, idx) => {
                const kepLampiran = getLampiranForKep(item.id);
                const isExpanded = expandedKepRows.has(item.id);
                const matchingPermohonan = getPermohonanByKepNomor(item.nomor_kep);
                
                return (
                  <React.Fragment key={item.id}>
                    {/* KEP Row */}
                    <TableRow className={cn(kepLampiran.length > 0 && "border-b-0")}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {kepLampiran.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleRowExpansion(item.id)}
                            >
                              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                            </Button>
                          )}
                          <span>{item.nomor_kep || "-"}</span>
                          {kepLampiran.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {kepLampiran.length} lampiran
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.tanggal_kep || "-"}</TableCell>
                      <TableCell>
                        {item.jenis_kategori && (
                          <Badge variant="outline">{item.jenis_kategori}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.nama_pejabat || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{item.nip_pejabat || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* Dropdown untuk tambah lampiran dari permohonan - filtered by kategori */}
                          <DropdownMenu open={lampiranDropdownOpen === item.id} onOpenChange={(open) => setLampiranDropdownOpen(open ? item.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" title="Tambah Lampiran dari Permohonan">
                                <ListPlus className="h-4 w-4 text-blue-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-background border shadow-lg z-50">
                              <div className="px-2 py-1.5 text-sm font-semibold border-b">
                                Pilih Permohonan (KEP: {item.nomor_kep || '-'})
                              </div>
                              
                              {matchingPermohonan.length > 0 ? (
                                matchingPermohonan.map((p) => (
                                  <DropdownMenuItem
                                    key={p.id}
                                    onClick={() => handleAddLampiranFromPermohonan(item.id, p)}
                                    className="flex flex-col items-start py-2"
                                  >
                                    <span className="font-medium">{p.nama_lengkap}</span>
                                    <span className="text-xs text-muted-foreground">{p.nip} | {p.hal}</span>
                                  </DropdownMenuItem>
                                ))
                              ) : (
                                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                  Belum ada data permohonan dengan No KEP "{item.nomor_kep || '-'}"
                                </div>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => {
                            setEditingData(item);
                            setFormData({
                              nomor_kep: item.nomor_kep || "",
                              tanggal_kep: item.tanggal_kep || "",
                              jenis_kategori: item.jenis_kategori || "",
                              konsideran_list: item.konsideran_list || [],
                              tujuan_salinan: item.tujuan_salinan || [],
                              nama_pejabat: item.nama_pejabat || "",
                              nip_pejabat: item.nip_pejabat || "",
                              lampiran_pegawai_ids: item.lampiran_pegawai_ids || [],
                            });
                            setDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Generate KEP" onClick={async () => {
                            try {
                              await generateKEPDocument({
                                nomor_kep: item.nomor_kep,
                                tanggal_kep: item.tanggal_kep || "",
                                jenis_kategori: item.jenis_kategori || "Penetapan Pertama",
                                konsideran_list: item.konsideran_list || [],
                                tujuan_salinan: item.tujuan_salinan || [],
                                nama_pejabat: item.nama_pejabat || "",
                              });
                              toast.success("Dokumen KEP berhasil di-generate");
                            } catch (error) {
                              toast.error("Gagal generate dokumen KEP");
                            }
                          }}>
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Generate Salinan" onClick={async () => {
                            try {
                              await generateSalinanDocument({
                                nomor_kep: item.nomor_kep,
                                tanggal_kep: item.tanggal_kep || "",
                                jenis_kategori: item.jenis_kategori || "Penetapan Pertama",
                                konsideran_list: item.konsideran_list || [],
                                tujuan_salinan: item.tujuan_salinan || [],
                                nama_pejabat: item.nama_pejabat || "",
                                nama_ub: "Himawan Indarjono",
                              });
                              toast.success("Dokumen Salinan berhasil di-generate");
                            } catch (error) {
                              toast.error("Gagal generate dokumen Salinan");
                            }
                          }}>
                            <Copy className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setDeleteId(item.id); setDeleteType("sk"); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Sub-rows for Lampiran */}
                    {isExpanded && kepLampiran.length > 0 && (
                      <TableRow className="bg-muted/30 hover:bg-muted/50">
                        <TableCell colSpan={7} className="p-0">
                          <div className="pl-8 pr-4 py-2 space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Lampiran KEP {item.nomor_kep}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs"
                                  onClick={async () => {
                                    const rawEmployees = kepLampiran.map((lamp) => {
                                      const ket = lamp.keterangan_lampiran || "";
                                      const parse = (f: string) => { const m = ket.match(new RegExp(`${f}:\\s*([^|]+)`)); return m ? m[1].trim() : "-"; };
                                      const bigData = bigDataEmployees.find(b => b.nip === lamp.nip_pegawai_lampiran);
                                      return { no: 0, nama: lamp.nama_pegawai_lampiran || "-", nip: lamp.nip_pegawai_lampiran || "-", pangkat: parse("Pangkat"), pendidikan: parse("Pendidikan"), jabatan_lama: parse("Jabatan Lama"), jabatan_baru: parse("Jabatan Baru"), grade_lama: parse("Grade Lama"), grade_baru: parse("Grade Baru"), tmt_peringkat: parse("TMT"), akumulasi_masa_kerja: bigData?.akumulasi_masa_kerja || "-", pkt_periode_1: bigData?.pkt_2024 || "-", pkt_periode_2: bigData?.pkt_2025 || "-", kemampuan_kerja: bigData?.kemampuan_kerja || "-", tmt_peringkat_baru: bigData?.tmt_peringkat_baru || "-" };
                                    });
                                    // Sort by eselonisasi order
                                    const sorted = sortEmployeesByEselonisasi(rawEmployees);
                                    const employees = sorted.map((e, i) => ({ ...e, no: i + 1 }));
                                    // Get title from permohonan hal
                                    const firstPermohonan = matchingPermohonan[0];
                                    const lampiranTitle = firstPermohonan ? `${item.jenis_kategori || "Penetapan"} - ${firstPermohonan.hal}` : undefined;
                                    try {
                                      await generateLampiranKEPDocument({ nomor_kep: item.nomor_kep, tanggal_kep: item.tanggal_kep || "", jenis_kategori: item.jenis_kategori || "Penetapan Pertama", nama_pejabat: item.nama_pejabat || "", employees });
                                      toast.success("Dokumen Lampiran KEP All berhasil di-generate");
                                    } catch { toast.error("Gagal generate"); }
                                  }}
                                >
                                  <FileText className="h-3 w-3 mr-1" /> Generate Lampiran All
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs"
                                  onClick={async () => {
                                    const rawEmployees = kepLampiran.map((lamp) => {
                                      const ket = lamp.keterangan_lampiran || "";
                                      const parse = (f: string) => { const m = ket.match(new RegExp(`${f}:\\s*([^|]+)`)); return m ? m[1].trim() : "-"; };
                                      const bigData = bigDataEmployees.find(b => b.nip === lamp.nip_pegawai_lampiran);
                                      return { no: 0, nama: lamp.nama_pegawai_lampiran || "-", nip: lamp.nip_pegawai_lampiran || "-", pangkat: parse("Pangkat"), pendidikan: parse("Pendidikan"), jabatan_lama: parse("Jabatan Lama"), jabatan_baru: parse("Jabatan Baru"), grade_lama: parse("Grade Lama"), grade_baru: parse("Grade Baru"), tmt_peringkat: parse("TMT"), akumulasi_masa_kerja: bigData?.akumulasi_masa_kerja || "-", pkt_periode_1: bigData?.pkt_2024 || "-", pkt_periode_2: bigData?.pkt_2025 || "-", kemampuan_kerja: bigData?.kemampuan_kerja || "-", tmt_peringkat_baru: bigData?.tmt_peringkat_baru || "-" };
                                    });
                                    const sorted = sortEmployeesByEselonisasi(rawEmployees);
                                    const employees = sorted.map((e, i) => ({ ...e, no: i + 1 }));
                                    try {
                                      await generateLampiranSalinanDocument({ nomor_kep: item.nomor_kep, tanggal_kep: item.tanggal_kep || "", jenis_kategori: item.jenis_kategori || "Penetapan Pertama", nama_pejabat: item.nama_pejabat || "", nama_ub: "Himawan Indarjono", employees });
                                      toast.success("Dokumen Salinan Lampiran All berhasil di-generate");
                                    } catch { toast.error("Gagal generate"); }
                                  }}
                                >
                                  <Copy className="h-3 w-3 mr-1" /> Generate Salinan All
                                </Button>
                              </div>
                            </div>
                            <div className="rounded-md border bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow className="text-xs">
                                    <TableHead className="w-10 py-2">No</TableHead>
                                    <TableHead className="py-2">Nama</TableHead>
                                    <TableHead className="py-2">NIP</TableHead>
                                    <TableHead className="py-2">Keterangan</TableHead>
                                    <TableHead className="w-40 py-2 text-right">Aksi</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {kepLampiran.map((lampiran, lIdx) => {
                                    // Parse keterangan to extract details for generate
                                    const keterangan = lampiran.keterangan_lampiran || "";
                                    const parseField = (field: string): string => {
                                      const regex = new RegExp(`${field}:\\s*([^|]+)`);
                                      const match = keterangan.match(regex);
                                      return match ? match[1].trim() : "-";
                                    };
                                    const pangkat = parseField("Pangkat");
                                    const jabatanLama = parseField("Jabatan Lama");
                                    const gradeLama = parseField("Grade Lama");
                                    const jabatanBaru = parseField("Jabatan Baru");
                                    const gradeBaru = parseField("Grade Baru");
                                    const tmtPeringkat = parseField("TMT");

                                    return (
                                    <TableRow key={lampiran.id} className="text-sm">
                                      <TableCell className="py-2">{lIdx + 1}</TableCell>
                                      <TableCell className="py-2 font-medium">{lampiran.nama_pegawai_lampiran || "-"}</TableCell>
                                      <TableCell className="py-2 text-muted-foreground">{lampiran.nip_pegawai_lampiran || "-"}</TableCell>
                                      <TableCell className="py-2">
                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                          {lampiran.keterangan_lampiran || "-"}
                                        </span>
                                      </TableCell>
                                      <TableCell className="py-2 text-right">
                                        <div className="flex justify-end gap-1">
                                          {/* Generate Lampiran KEP Button */}
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            title="Generate Lampiran KEP"
                                            onClick={async () => {
                                              try {
                                                await generateLampiranKEPDocument({
                                                  nomor_kep: item.nomor_kep || "",
                                                  tanggal_kep: item.tanggal_kep || "",
                                                  jenis_kategori: item.jenis_kategori || "Penetapan Pertama",
                                                  nama_pejabat: item.nama_pejabat || "",
                                                  employees: [{
                                                    no: lIdx + 1,
                                                    nama: lampiran.nama_pegawai_lampiran || "-",
                                                    nip: lampiran.nip_pegawai_lampiran || "-",
                                                    pangkat: pangkat,
                                                    pendidikan: parseField("Pendidikan"),
                                                    jabatan_lama: jabatanLama,
                                                    jabatan_baru: jabatanBaru,
                                                    grade_lama: gradeLama,
                                                    grade_baru: gradeBaru,
                                                    tmt_peringkat: tmtPeringkat,
                                                    akumulasi_masa_kerja: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.akumulasi_masa_kerja || "-"; })(),
                                                    pkt_periode_1: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.pkt_2024 || "-"; })(),
                                                    pkt_periode_2: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.pkt_2025 || "-"; })(),
                                                    kemampuan_kerja: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.kemampuan_kerja || "-"; })(),
                                                    tmt_peringkat_baru: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.tmt_peringkat_baru || "-"; })(),
                                                  }],
                                                });
                                                toast.success("Dokumen Lampiran KEP berhasil di-generate");
                                              } catch (error) {
                                                toast.error("Gagal generate dokumen Lampiran KEP");
                                              }
                                            }}
                                          >
                                            <FileText className="h-3.5 w-3.5 text-primary" />
                                          </Button>

                                          {/* Generate Salinan Lampiran Button */}
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            title="Generate Salinan Lampiran"
                                            onClick={async () => {
                                              try {
                                                await generateLampiranSalinanDocument({
                                                  nomor_kep: item.nomor_kep || "",
                                                  tanggal_kep: item.tanggal_kep || "",
                                                  jenis_kategori: item.jenis_kategori || "Penetapan Pertama",
                                                  nama_pejabat: item.nama_pejabat || "",
                                                  nama_ub: "Himawan Indarjono",
                                                  employees: [{
                                                    no: lIdx + 1,
                                                    nama: lampiran.nama_pegawai_lampiran || "-",
                                                    nip: lampiran.nip_pegawai_lampiran || "-",
                                                    pangkat: pangkat,
                                                    pendidikan: parseField("Pendidikan"),
                                                    jabatan_lama: jabatanLama,
                                                    jabatan_baru: jabatanBaru,
                                                    grade_lama: gradeLama,
                                                    grade_baru: gradeBaru,
                                                    tmt_peringkat: tmtPeringkat,
                                                    akumulasi_masa_kerja: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.akumulasi_masa_kerja || "-"; })(),
                                                    pkt_periode_1: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.pkt_2024 || "-"; })(),
                                                    pkt_periode_2: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.pkt_2025 || "-"; })(),
                                                    kemampuan_kerja: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.kemampuan_kerja || "-"; })(),
                                                    tmt_peringkat_baru: (() => { const bd = bigDataEmployees.find(b => b.nip === lampiran.nip_pegawai_lampiran); return bd?.tmt_peringkat_baru || "-"; })(),
                                                  }],
                                                });
                                                toast.success("Dokumen Salinan Lampiran berhasil di-generate");
                                              } catch (error) {
                                                toast.error("Gagal generate dokumen Salinan Lampiran");
                                              }
                                            }}
                                          >
                                            <Copy className="h-3.5 w-3.5 text-green-600" />
                                          </Button>

                                          {/* Delete Button */}
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7"
                                            onClick={() => { setDeleteId(lampiran.id); setDeleteType("petikan"); }}
                                            title="Hapus Lampiran"
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold">Data Petikan (Detail Lampiran)</h4>
            <p className="text-sm text-muted-foreground">
              Detail isi batang tubuh (lampiran) dari setiap SK Penetapan yang telah dibuat
            </p>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            disabled={petikanData.length === 0}
            onClick={async () => {
              const employees: PetikanGeneratorData[] = petikanData.map(item => {
                const ket = item.keterangan_lampiran || "";
                const parse = (f: string) => { const m = ket.match(new RegExp(`${f}:\\s*([^|]+)`)); return m ? m[1].trim() : "-"; };
                return {
                  nomor_kep: item.nomor_petikan,
                  hal: parse("Hal") || "Pertama",
                  menetapkan: "",
                  tanggal_kep: item.tanggal_petikan || "",
                  nama_pegawai: item.nama_pegawai_lampiran || item.nama_pejabat || "",
                  nip_pegawai: item.nip_pegawai_lampiran || item.nip_pejabat || "",
                  pangkat_gol_tmt: parse("Pangkat"),
                  pendidikan: parse("Pendidikan"),
                  jabatan_lama: parse("Jabatan Lama") || item.jabatan_lama || "",
                  jabatan_baru: parse("Jabatan Baru") || item.jabatan_baru || "",
                  tmt_peringkat_terakhir: parse("TMT"),
                  keterangan: ket,
                  nama_pejabat: skData[0]?.nama_pejabat || "",
                };
              });
              try {
                await generatePetikanAllDocument({ employees, nama_pejabat: skData[0]?.nama_pejabat || "" });
                toast.success("Dokumen Petikan All berhasil di-generate");
              } catch { toast.error("Gagal generate Petikan All"); }
            }}
          >
            <Users className="h-4 w-4 mr-2" /> Generate Petikan All
          </Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nomor Petikan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Pegawai</TableHead>
                <TableHead>NIP Pegawai</TableHead>
                <TableHead>Jabatan Lama</TableHead>
                <TableHead>Jabatan Baru</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {petikanData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                    Belum ada data petikan. Tambahkan SK Penetapan terlebih dahulu.
                  </TableCell>
                </TableRow>
              ) : (
                petikanData.map((item, idx) => (
                  <TableRow key={item.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.nomor_petikan || "-"}</TableCell>
                    <TableCell>{item.tanggal_petikan || "-"}</TableCell>
                    <TableCell>{item.nama_pegawai_lampiran || item.nama_pejabat || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{item.nip_pegawai_lampiran || item.nip_pejabat || "-"}</TableCell>
                    <TableCell>{item.jabatan_lama || "-"}</TableCell>
                    <TableCell>{item.jabatan_baru || "-"}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {item.keterangan_lampiran || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Edit Petikan" onClick={() => {
                          setEditingPetikanData(item);
                          const ket = item.keterangan_lampiran || "";
                          const pf = (field: string): string => {
                            const regex = new RegExp(`${field}:\\s*([^|]+)`);
                            const match = ket.match(regex);
                            return match ? match[1].trim() : "";
                          };
                          setPetikanEditForm({
                            nomor_petikan: item.nomor_petikan || "",
                            tanggal_petikan: item.tanggal_petikan || "",
                            nama_pegawai: item.nama_pegawai_lampiran || item.nama_pejabat || "",
                            nip_pegawai: item.nip_pegawai_lampiran || item.nip_pejabat || "",
                            hal: pf("Hal"),
                            pangkat: pf("Pangkat"),
                            pendidikan: pf("Pendidikan"),
                            jabatan_lama: pf("Jabatan Lama") || item.jabatan_lama || "",
                            grade_lama: pf("Grade Lama"),
                            jabatan_baru: pf("Jabatan Baru") || item.jabatan_baru || "",
                            grade_baru: pf("Grade Baru"),
                            tmt: pf("TMT"),
                            keterangan: ket,
                          });
                          setPetikanEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Generate Petikan" onClick={async () => {
                          // Parse keterangan to extract details
                          const keterangan = item.keterangan_lampiran || "";
                          const parseField = (field: string): string => {
                            const regex = new RegExp(`${field}:\\s*([^|]+)`);
                            const match = keterangan.match(regex);
                            return match ? match[1].trim() : "-";
                          };
                          try {
                            await generatePetikanDocument({
                              nomor_kep: item.nomor_petikan,
                              hal: parseField("Hal") || "Pertama",
                              menetapkan: "",
                              tanggal_kep: item.tanggal_petikan || "",
                              nama_pegawai: item.nama_pegawai_lampiran || item.nama_pejabat || "",
                              nip_pegawai: item.nip_pegawai_lampiran || item.nip_pejabat || "",
                              pangkat_gol_tmt: parseField("Pangkat"),
                              pendidikan: parseField("Pendidikan"),
                              jabatan_lama: parseField("Jabatan Lama") || item.jabatan_lama || "",
                              jabatan_baru: parseField("Jabatan Baru") || item.jabatan_baru || "",
                              tmt_peringkat_terakhir: parseField("TMT"),
                              keterangan: keterangan,
                              nama_pejabat: skData[0]?.nama_pejabat || "",
                            });
                            toast.success("Dokumen Petikan berhasil di-generate");
                          } catch (error) {
                            toast.error("Gagal generate dokumen Petikan");
                          }
                        }}>
                          <FileSpreadsheet className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeleteId(item.id); setDeleteType("petikan"); }}>
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
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit SK Penetapan" : "Tambah SK Penetapan"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* KLASTER I - KEP */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/30">
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold px-3 py-1">
                    KLASTER I
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    Data KEP (Keputusan)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor KEP *</Label>
                    <Input
                      value={formData.nomor_kep}
                      onChange={(e) => setFormData({ ...formData, nomor_kep: e.target.value })}
                      placeholder="Masukkan nomor KEP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal KEP</Label>
                    <Input
                      type="date"
                      value={formData.tanggal_kep}
                      onChange={(e) => setFormData({ ...formData, tanggal_kep: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Kategori</Label>
                    <Select value={formData.jenis_kategori} onValueChange={(v) => setFormData({ ...formData, jenis_kategori: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {JENIS_KATEGORI_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Konsideran Naskah Dinas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Konsideran Naskah Dinas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddKonsideran}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Konsideran
                    </Button>
                  </div>
                  
                  {/* Catatan konsideran berdasarkan kategori */}
                  {formData.jenis_kategori && KATEGORI_CATATAN_KONSIDERAN[formData.jenis_kategori] && (
                    <Alert className="bg-primary/5 border-primary/20">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-sm text-muted-foreground">
                        {KATEGORI_CATATAN_KONSIDERAN[formData.jenis_kategori]}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {formData.konsideran_list.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada konsideran. Klik "Tambah Konsideran" untuk menambahkan.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.konsideran_list.map((k, idx) => (
                        <Card key={idx} className="p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Konsideran {idx + 1}</Label>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveKonsideran(idx)}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Naskah Dinas</Label>
                              <Input
                                value={k.naskah_dinas}
                                onChange={(e) => handleUpdateKonsideran(idx, "naskah_dinas", e.target.value)}
                                placeholder="Jenis naskah dinas"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Nomor ND</Label>
                              <Input
                                value={k.nomor_nd}
                                onChange={(e) => handleUpdateKonsideran(idx, "nomor_nd", e.target.value)}
                                placeholder="Nomor naskah dinas"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Tanggal ND</Label>
                              <Input
                                type="date"
                                value={k.tanggal_nd}
                                onChange={(e) => handleUpdateKonsideran(idx, "tanggal_nd", e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Perihal</Label>
                              <Input
                                value={k.perihal}
                                onChange={(e) => handleUpdateKonsideran(idx, "perihal", e.target.value)}
                                placeholder="Perihal naskah dinas"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tujuan Salinan */}
                <div className="space-y-3">
                  <Label>Tujuan Salinan (Satuan Kerja)</Label>
                  <Card className="p-3">
                    <ScrollArea className="max-h-[150px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {satuanKerjaOptions.map((sk) => (
                          <div key={sk} className="flex items-center gap-2">
                            <Checkbox
                              checked={formData.tujuan_salinan.includes(sk)}
                              onCheckedChange={() => handleToggleTujuanSalinan(sk)}
                            />
                            <Label className="text-sm font-normal cursor-pointer" onClick={() => handleToggleTujuanSalinan(sk)}>
                              {sk}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>

                {/* Nama Pejabat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Pejabat</Label>
                    <Popover open={pejabatOpen} onOpenChange={setPejabatOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          {formData.nama_pejabat || "Pilih pejabat..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari nama pegawai..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {filteredEmployees.slice(0, 200).map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.nm_pegawai} ${emp.nip || ''}`}
                                  onSelect={() => handleSelectPejabat(emp)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", formData.nama_pejabat === emp.nm_pegawai ? "opacity-100" : "opacity-0")} />
                                  <div className="flex flex-col">
                                    <span>{emp.nm_pegawai}</span>
                                    <span className="text-xs text-muted-foreground">{emp.nip}</span>
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
                    <Label>NIP Pejabat</Label>
                    <Input
                      value={formData.nip_pejabat}
                      className="bg-muted"
                      readOnly
                      placeholder="Otomatis dari nama pejabat"
                    />
                  </div>
                </div>
              </div>

              {/* KLASTER II - Salinan */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-green-500/30">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 font-semibold px-3 py-1">
                    KLASTER II
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    Data Salinan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor Salinan</Label>
                    <Input
                      value={salinanForm.nomor_salinan}
                      onChange={(e) => setSalinanForm({ ...salinanForm, nomor_salinan: e.target.value })}
                      placeholder="Masukkan nomor salinan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={salinanForm.tanggal_salinan}
                      onChange={(e) => setSalinanForm({ ...salinanForm, tanggal_salinan: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Ub</Label>
                    <Popover open={salinanUbOpen} onOpenChange={setSalinanUbOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          {salinanForm.nama_ub || "Pilih nama..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari nama pegawai..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {filteredEmployees.slice(0, 200).map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.nm_pegawai} ${emp.nip || ''}`}
                                  onSelect={() => handleSelectSalinanUb(emp)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", salinanForm.nama_ub === emp.nm_pegawai ? "opacity-100" : "opacity-0")} />
                                  <div className="flex flex-col">
                                    <span>{emp.nm_pegawai}</span>
                                    <span className="text-xs text-muted-foreground">{emp.nip}</span>
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
                    <Label>NIP</Label>
                    <Input
                      value={salinanForm.nip_ub}
                      className="bg-muted"
                      readOnly
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>

              {/* KLASTER III - Petikan */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-amber-500/30">
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 font-semibold px-3 py-1">
                    KLASTER III
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    Data Petikan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor Petikan</Label>
                    <Input
                      value={petikanForm.nomor_petikan}
                      onChange={(e) => setPetikanForm({ ...petikanForm, nomor_petikan: e.target.value })}
                      placeholder="Masukkan nomor petikan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={petikanForm.tanggal_petikan}
                      onChange={(e) => setPetikanForm({ ...petikanForm, tanggal_petikan: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Pejabat</Label>
                    <Popover open={petikanPejabatOpen} onOpenChange={setPetikanPejabatOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          {petikanForm.nama_pejabat || "Pilih nama..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari nama pegawai..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {filteredEmployees.slice(0, 200).map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={`${emp.nm_pegawai} ${emp.nip || ''}`}
                                  onSelect={() => handleSelectPetikanPejabat(emp)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", petikanForm.nama_pejabat === emp.nm_pegawai ? "opacity-100" : "opacity-0")} />
                                  <div className="flex flex-col">
                                    <span>{emp.nm_pegawai}</span>
                                    <span className="text-xs text-muted-foreground">{emp.nip}</span>
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
                    <Label>NIP</Label>
                    <Input
                      value={petikanForm.nip_pejabat}
                      className="bg-muted"
                      readOnly
                      placeholder="Auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingData ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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

      {/* Petikan Edit Dialog */}
      <Dialog open={petikanEditDialogOpen} onOpenChange={(open) => { if (!open) { setEditingPetikanData(null); } setPetikanEditDialogOpen(open); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Data Petikan</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Petikan</Label>
                  <Input value={petikanEditForm.nomor_petikan} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, nomor_petikan: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal</Label>
                  <Input type="date" value={petikanEditForm.tanggal_petikan} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, tanggal_petikan: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pegawai</Label>
                  <Input value={petikanEditForm.nama_pegawai} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, nama_pegawai: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>NIP Pegawai</Label>
                  <Input value={petikanEditForm.nip_pegawai} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, nip_pegawai: e.target.value })} />
                </div>
              </div>
              
              {/* Detail fields */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Detail Penetapan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hal</Label>
                    <Select value={petikanEditForm.hal} onValueChange={(v) => setPetikanEditForm({ ...petikanEditForm, hal: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih hal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {JENIS_KATEGORI_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pangkat / Gol / TMT</Label>
                    <Input value={petikanEditForm.pangkat} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, pangkat: e.target.value })} placeholder="cth: Pengatur Tk. I / II/d / 1 April 2023" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pendidikan</Label>
                    <Input value={petikanEditForm.pendidikan} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, pendidikan: e.target.value })} placeholder="cth: S1" />
                  </div>
                  <div className="space-y-2">
                    <Label>TMT Peringkat Terakhir</Label>
                    <Input type="date" value={petikanEditForm.tmt} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, tmt: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Jabatan Lama</Label>
                    <Input value={petikanEditForm.jabatan_lama} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, jabatan_lama: e.target.value })} placeholder="cth: Pengolah Data dan Informasi Tk.III" />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade Lama</Label>
                    <Input value={petikanEditForm.grade_lama} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, grade_lama: e.target.value })} placeholder="cth: 8" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jabatan Baru</Label>
                    <Input value={petikanEditForm.jabatan_baru} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, jabatan_baru: e.target.value })} placeholder="cth: Pengolah Data dan Informasi Tk. II" />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade Baru</Label>
                    <Input value={petikanEditForm.grade_baru} onChange={(e) => setPetikanEditForm({ ...petikanEditForm, grade_baru: e.target.value })} placeholder="cth: 9" />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPetikanEditDialogOpen(false)}>Batal</Button>
            <Button onClick={async () => {
              if (!editingPetikanData) return;
              try {
                // Reconstruct keterangan from individual fields
                const keteranganParts = [
                  petikanEditForm.hal ? `Hal: ${petikanEditForm.hal}` : null,
                  petikanEditForm.pangkat ? `Pangkat: ${petikanEditForm.pangkat}` : null,
                  petikanEditForm.pendidikan ? `Pendidikan: ${petikanEditForm.pendidikan}` : null,
                  petikanEditForm.jabatan_lama ? `Jabatan Lama: ${petikanEditForm.jabatan_lama}` : null,
                  petikanEditForm.grade_lama ? `Grade Lama: ${petikanEditForm.grade_lama}` : null,
                  petikanEditForm.jabatan_baru ? `Jabatan Baru: ${petikanEditForm.jabatan_baru}` : null,
                  petikanEditForm.grade_baru ? `Grade Baru: ${petikanEditForm.grade_baru}` : null,
                  petikanEditForm.tmt ? `TMT: ${petikanEditForm.tmt}` : null,
                ].filter(Boolean).join(" | ");
                
                await supabase.from("grading_petikan").update({
                  nomor_petikan: petikanEditForm.nomor_petikan,
                  tanggal_petikan: petikanEditForm.tanggal_petikan || null,
                  nama_lengkap: petikanEditForm.nama_pegawai,
                  nip: petikanEditForm.nip_pegawai,
                  keterangan: keteranganParts,
                }).eq("id", editingPetikanData.id);
                toast.success("Data Petikan berhasil diperbarui");
                setPetikanEditDialogOpen(false);
                setEditingPetikanData(null);
                loadData();
              } catch (error: any) {
                toast.error("Gagal menyimpan: " + error.message);
              }
            }}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data SK Penetapan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data SK Penetapan? Data Petikan juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}