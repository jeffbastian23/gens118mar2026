import { useState, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Download, Upload, Edit, Check, ChevronsUpDown, X, FileText, FileSpreadsheet, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { generateBeritaAcaraSidangDocument, generateLampiranByCategory } from "@/utils/beritaAcaraSidangGenerator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BigDataCategorySummary from "./BigDataCategorySummary";

// Category options
const KATEGORI_OPTIONS = [
  { value: "PU_NAIK_TURUN_TETAP", label: "PU Naik/Turun/Tetap" },
  { value: "PU_BELUM_REKOMENDASI", label: "PU Belum Rekomendasi" },
  { value: "PK_NAIK_TETAP", label: "PK Naik/Tetap" },
  { value: "PK_BELUM_REKOMENDASI", label: "PK Belum Rekomendasi" },
  { value: "PTB_NAIK_TURUN_TETAP", label: "PTB Naik/Turun/Tetap" },
  { value: "PTB_BELUM_REKOMENDASI", label: "PTB Belum Rekomendasi" },
];

// Fields by category
const CATEGORY_FIELDS: Record<string, string[]> = {
  PU_NAIK_TURUN_TETAP: [
    "bagian_satuan_kerja", "subbagian_seksi", "nama_nip", "pangkat_gol_ruang_tmt_gol", 
    "pendidikan", "jabatan_lama", "peringkat_lama", "tmt_peringkat_terakhir",
    "predikat_kinerja_i", "predikat_kinerja_ii", "kemampuan_kerja_pu", 
    "rekomendasi", "jabatan_baru", "peringkat_baru", "keterangan"
  ],
  PU_BELUM_REKOMENDASI: [
    "bagian_satuan_kerja", "subbagian_seksi", "nama_nip", "pangkat_gol_ruang_tmt_gol",
    "pendidikan", "jabatan", "peringkat", "tmt_peringkat_terakhir", "predikat_kinerja_i"
  ],
  PK_NAIK_TETAP: [
    "bagian_satuan_kerja", "subbagian_seksi", "nama_nip", "pangkat_gol_ruang_tmt_gol",
    "pendidikan", "jabatan_tugas_lama", "peringkat_lama", "akumulasi_masa_kerja_lama",
    "tmt_peringkat_terakhir", "predikat_kinerja", "akumulasi_masa_kerja_akhir",
    "rekomendasi", "jabatan_tugas_baru", "peringkat_baru", "keterangan"
  ],
  PK_BELUM_REKOMENDASI: [
    "bagian_satuan_kerja", "subbagian_seksi", "nama_nip", "pangkat_gol_ruang_tmt_gol",
    "pendidikan", "jabatan_tugas", "peringkat", "akumulasi_masa_kerja",
    "tmt_peringkat_terakhir", "predikat_kinerja", "akumulasi_masa_kerja_terakhir"
  ],
  PTB_NAIK_TURUN_TETAP: [
    "bagian_satuan_kerja", "subbagian_seksi", "nama_nip", "pangkat_gol_ruang_tmt_gol",
    "pendidikan", "jabatan_lama", "peringkat_lama", "tmt_peringkat_terakhir",
    "predikat_kinerja_i", "predikat_kinerja_ii", "rekomendasi", 
    "jabatan_baru", "peringkat_baru", "keterangan"
  ],
  PTB_BELUM_REKOMENDASI: [
    "bagian_satuan_kerja", "subbagian_seksi", "nama_nip", "pangkat_gol_ruang_tmt_gol",
    "pendidikan", "jabatan", "peringkat", "tmt_peringkat_terakhir", "predikat_kinerja_i"
  ],
};

// Field labels
const FIELD_LABELS: Record<string, string> = {
  bagian_satuan_kerja: "Bagian/Satuan Kerja",
  subbagian_seksi: "Subbagian/Seksi",
  nama_nip: "Nama/NIP",
  pangkat_gol_ruang_tmt_gol: "Pangkat/Gol Ruang/TMT Gol",
  pendidikan: "Pendidikan",
  jabatan_lama: "Jabatan Lama",
  jabatan: "Jabatan",
  jabatan_tugas_lama: "Jabatan/Tugas Lama",
  jabatan_tugas: "Jabatan/Tugas",
  peringkat_lama: "Peringkat Lama",
  peringkat: "Peringkat",
  tmt_peringkat_terakhir: "TMT Peringkat Terakhir",
  predikat_kinerja_i: "Predikat Kinerja I",
  predikat_kinerja_ii: "Predikat Kinerja II",
  predikat_kinerja: "Predikat Kinerja",
  kemampuan_kerja_pu: "Kemampuan Kerja PU",
  rekomendasi: "Rekomendasi",
  jabatan_baru: "Jabatan Baru",
  jabatan_tugas_baru: "Jabatan/Tugas Baru",
  peringkat_baru: "Peringkat Baru",
  keterangan: "Keterangan",
  akumulasi_masa_kerja_lama: "Akumulasi Masa Kerja Lama",
  akumulasi_masa_kerja: "Akumulasi Masa Kerja",
  akumulasi_masa_kerja_akhir: "Akumulasi Masa Kerja Akhir",
  akumulasi_masa_kerja_terakhir: "Akumulasi Masa Kerja Terakhir",
};

interface PegawaiKlasterII {
  id: string;
  nama: string;
  nip: string;
  lokasi?: string | null;
  eselon_iii?: string | null;
  eselon_iv?: string | null;
  pangkat?: string | null;
  pangkat_golongan?: string | null;
  pendidikan?: string | null;
  jabatan?: string | null;
  grade?: string | null;
  tmt_terakhir?: string | null;
  pkt_2024?: string | null;
  pkt_2025?: string | null;
  kemampuan_kerja?: string | null;
  rekomendasi?: string | null;
  jabatan_baru?: string | null;
  grade_baru?: string | null;
  akumulasi_masa_kerja?: string | null;
  akumulasi_terakhir?: string | null;
}

interface BeritaAcaraData {
  id: string;
  no_urut: number | null;
  nomor_ba: string | null;
  tanggal: string | null;
  lokasi: string | null;
  satuan_kerja: string | null;
  nama_pimpinan: string | null;
  nip_pimpinan: string | null;
  kategori: string | null;
  peserta: { nama: string; nip: string }[];
  pegawai_klaster_ii: PegawaiKlasterII[];
  detail_kategori: Record<string, string>;
  created_at: string;
  created_by_email: string | null;
}

interface EselonisasiData {
  id: string;
  no_urut: number | null;
  nama_unit: string;
  tingkat_eselon: string;
  kode_unit: string | null;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  nm_unit_organisasi: string;
}

interface BeritaAcaraTabProps {
  userEmail?: string;
  isAdmin?: boolean;
}

export default function BeritaAcaraTab({ userEmail, isAdmin = true }: BeritaAcaraTabProps) {
  const [data, setData] = useState<BeritaAcaraData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [eselonisasiData, setEselonisasiData] = useState<EselonisasiData[]>([]);
  const [satuanKerjaOptions, setSatuanKerjaOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingData, setViewingData] = useState<BeritaAcaraData | null>(null);
  const [editingData, setEditingData] = useState<BeritaAcaraData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    nomor_ba: "",
    tanggal: "",
    lokasi: "",
    satuan_kerja: "",
    nama_pimpinan: "",
    nip_pimpinan: "",
    kategori: "",
    peserta: [] as { nama: string; nip: string }[],
    detail_kategori: {} as Record<string, string>,
    // Store selected employees from BigData for preview
    previewPegawai: [] as { id: string; nama: string; nip: string; lokasi?: string; eselon_iv?: string; pangkat?: string; pangkat_golongan?: string; pendidikan?: string; jabatan?: string; grade?: string }[],
  });

  // Combobox states
  const [pimpinanOpen, setPimpinanOpen] = useState(false);
  const [pesertaOpen, setPesertaOpen] = useState<number | null>(null);

  // Load data
  useEffect(() => {
    loadData();
    loadEmployees();
    loadSatuanKerjaOptions();
    loadEselonisasiData();
  }, []);

  const loadData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("berita_acara_sidang")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      
      const parsed = (result || []).map((item: any) => ({
        ...item,
        peserta: Array.isArray(item.peserta) ? item.peserta : [],
        pegawai_klaster_ii: Array.isArray(item.pegawai_klaster_ii) ? item.pegawai_klaster_ii : [],
        detail_kategori: typeof item.detail_kategori === 'object' && item.detail_kategori !== null 
          ? item.detail_kategori 
          : {},
      }));
      
      setData(parsed);
    } catch (error: any) {
      console.error("Error loading berita acara:", error);
      toast.error("Gagal memuat data berita acara");
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      // Fetch all employees (more than 1000) using pagination
      let allEmployees: Employee[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: result, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, nm_unit_organisasi")
          .order("nm_pegawai", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (result && result.length > 0) {
          allEmployees = [...allEmployees, ...result];
          from += batchSize;
          hasMore = result.length === batchSize;
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
      
      // Get unique values and replace duplicate KPPBC Juanda with Kanwil DJBC Jatim I
      const rawUnique = [...new Set((result || []).map(e => e.nm_unit_organisasi).filter(Boolean))];
      
      // Replace duplicate entry
      const unique = rawUnique.map(sk => {
        if (sk === "Kantor Pengawasan dan Pelayanan Kepabeanan Dan Cukai Tipe Madya Pabean Juanda" ||
            sk === "Kantor Pengawasan Dan Pelayanan Kepabeanan Dan Cukai Tipe Madya Pabean Juanda" ||
            sk === "Kantor Pengawasan Dan Pelayanan Bea Dan Cukai Tipe Madya Pabean Juanda") {
          return "Kantor Wilayah DJBC Jawa Timur I";
        }
        return sk;
      });
      
      // Deduplicate after replacement
      const finalUnique = [...new Set(unique)].sort();
      setSatuanKerjaOptions(finalUnique);
    } catch (error) {
      console.error("Error loading satuan kerja:", error);
    }
  };

  const loadEselonisasiData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("eselonisasi")
        .select("id, no_urut, nama_unit, tingkat_eselon, kode_unit")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setEselonisasiData(result || []);
    } catch (error) {
      console.error("Error loading eselonisasi:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      nomor_ba: "",
      tanggal: "",
      lokasi: "",
      satuan_kerja: "",
      nama_pimpinan: "",
      nip_pimpinan: "",
      kategori: "",
      peserta: [],
      detail_kategori: {},
      previewPegawai: [],
    });
    setEditingData(null);
  };

  const handleView = (item: BeritaAcaraData) => {
    setViewingData(item);
    setViewDialogOpen(true);
  };

  const handleEdit = (item: BeritaAcaraData) => {
    setEditingData(item);
    setFormData({
      nomor_ba: item.nomor_ba || "",
      tanggal: item.tanggal || "",
      lokasi: item.lokasi || "",
      satuan_kerja: item.satuan_kerja || "",
      nama_pimpinan: item.nama_pimpinan || "",
      nip_pimpinan: item.nip_pimpinan || "",
      kategori: item.kategori || "",
      peserta: item.peserta || [],
      detail_kategori: item.detail_kategori || {},
      previewPegawai: (item.pegawai_klaster_ii || []).map(p => ({
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        lokasi: p.lokasi || undefined,
        eselon_iv: p.eselon_iv || undefined,
        pangkat: p.pangkat || undefined,
        pangkat_golongan: p.pangkat_golongan || undefined,
        pendidikan: p.pendidikan || undefined,
        jabatan: p.jabatan || undefined,
        grade: p.grade || undefined,
      })),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nomor_ba) {
      toast.error("Nomor BA wajib diisi");
      return;
    }

    try {
      // Convert previewPegawai to pegawai_klaster_ii format for storage
      const pegawaiKlasterII = formData.previewPegawai.map(p => ({
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        lokasi: p.lokasi || null,
        eselon_iii: null,
        eselon_iv: p.eselon_iv || null,
        pangkat: p.pangkat || null,
        pangkat_golongan: p.pangkat_golongan || null,
        pendidikan: p.pendidikan || null,
        jabatan: p.jabatan || null,
        grade: p.grade || null,
      }));

      const payload = {
        nomor_ba: formData.nomor_ba,
        tanggal: formData.tanggal || null,
        lokasi: formData.lokasi || null,
        satuan_kerja: formData.satuan_kerja || null,
        nama_pimpinan: formData.nama_pimpinan || null,
        nip_pimpinan: formData.nip_pimpinan || null,
        kategori: formData.kategori || null,
        peserta: formData.peserta,
        pegawai_klaster_ii: pegawaiKlasterII,
        detail_kategori: formData.detail_kategori,
        created_by_email: userEmail,
      };

      if (editingData) {
        const { error } = await supabase
          .from("berita_acara_sidang")
          .update(payload)
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Berita acara berhasil diperbarui");
      } else {
        // Get next no_urut
        const { data: maxData } = await supabase
          .from("berita_acara_sidang")
          .select("no_urut")
          .order("no_urut", { ascending: false })
          .limit(1);

        const nextNo = (maxData?.[0]?.no_urut || 0) + 1;

        const { error } = await supabase
          .from("berita_acara_sidang")
          .insert({ ...payload, no_urut: nextNo });

        if (error) throw error;
        toast.success("Berita acara berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error saving berita acara:", error);
      toast.error("Gagal menyimpan berita acara: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("berita_acara_sidang")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Berita acara berhasil dihapus");
      setDeleteId(null);
      loadData();
    } catch (error: any) {
      console.error("Error deleting:", error);
      toast.error("Gagal menghapus: " + error.message);
    }
  };

  const handleSelectPimpinan = (emp: Employee) => {
    setFormData({
      ...formData,
      nama_pimpinan: emp.nm_pegawai,
      nip_pimpinan: emp.nip || "",
    });
    setPimpinanOpen(false);
  };

  const handleAddPeserta = () => {
    setFormData({
      ...formData,
      peserta: [...formData.peserta, { nama: "", nip: "" }],
    });
  };

  const handleRemovePeserta = (index: number) => {
    setFormData({
      ...formData,
      peserta: formData.peserta.filter((_, i) => i !== index),
    });
  };

  const handleSelectPeserta = (emp: Employee, index: number) => {
    const newPeserta = [...formData.peserta];
    newPeserta[index] = { nama: emp.nm_pegawai, nip: emp.nip || "" };
    setFormData({ ...formData, peserta: newPeserta });
    setPesertaOpen(null);
  };

  const handleKategoriChange = (value: string) => {
    setFormData({
      ...formData,
      kategori: value,
      detail_kategori: {},
      previewPegawai: [], // Reset preview when category changes
    });
  };

  // Handler for adding multiple employees from BigDataCategorySummary
  const handleAddPesertaFromBigData = (employees: { nama: string; nip: string }[]) => {
    // Filter out duplicates based on NIP
    const existingNips = new Set(formData.peserta.map(p => p.nip));
    const newEmployees = employees.filter(e => !existingNips.has(e.nip));
    
    if (newEmployees.length === 0) {
      toast.info("Pegawai yang dipilih sudah ada di daftar peserta");
      return;
    }

    setFormData({
      ...formData,
      peserta: [...formData.peserta, ...newEmployees],
    });
  };

  // Handler for updating preview pegawai from BigData (for Klaster II)
  const handleUpdatePreviewPegawai = (employees: { id: string; nama: string; nip: string; lokasi?: string; eselon_iv?: string; pangkat?: string; pangkat_golongan?: string; pendidikan?: string; jabatan?: string; grade?: string }[]) => {
    setFormData({
      ...formData,
      previewPegawai: employees,
    });
  };

  // Handler to remove employee from preview
  const handleRemoveFromPreview = (id: string) => {
    setFormData({
      ...formData,
      previewPegawai: formData.previewPegawai.filter(p => p.id !== id),
    });
  };

  const handleDetailChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      detail_kategori: {
        ...formData.detail_kategori,
        [field]: value,
      },
    });
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const exportData = data.map((item, idx) => ({
      No: idx + 1,
      "Nomor BA": item.nomor_ba || "",
      Tanggal: item.tanggal || "",
      Lokasi: item.lokasi || "",
      "Satuan Kerja": item.satuan_kerja || "",
      "Nama Pimpinan": item.nama_pimpinan || "",
      "NIP Pimpinan": item.nip_pimpinan || "",
      Kategori: KATEGORI_OPTIONS.find(k => k.value === item.kategori)?.label || item.kategori || "",
      Peserta: item.peserta.map(p => `${p.nama} (${p.nip})`).join("; "),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Berita Acara");
    XLSX.writeFile(wb, `berita_acara_sidang_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data berhasil diexport");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      for (const row of jsonData as any[]) {
        const { error } = await supabase.from("berita_acara_sidang").insert({
          nomor_ba: row["Nomor BA"] || "",
          tanggal: row["Tanggal"] || null,
          lokasi: row["Lokasi"] || null,
          satuan_kerja: row["Satuan Kerja"] || null,
          nama_pimpinan: row["Nama Pimpinan"] || null,
          nip_pimpinan: row["NIP Pimpinan"] || null,
          kategori: row["Kategori"] || null,
          peserta: [],
          detail_kategori: {},
          created_by_email: userEmail,
        });

        if (!error) successCount++;
      }

      toast.success(`${successCount} data berhasil diimport`);
      loadData();
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error("Gagal import: " + error.message);
    }

    e.target.value = "";
  };

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.nomor_ba?.toLowerCase().includes(term) ||
      item.nama_pimpinan?.toLowerCase().includes(term) ||
      item.lokasi?.toLowerCase().includes(term) ||
      item.satuan_kerja?.toLowerCase().includes(term)
    );
  });

  const currentFields = formData.kategori ? CATEGORY_FIELDS[formData.kategori] || [] : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Berita Acara Hasil Penilaian (Sidang)</h3>
            <p className="text-sm text-muted-foreground">Data berita acara hasil penilaian untuk permohonan dengan hal "Sidang"</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Cari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            {isAdmin && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (data.length === 0) {
                    toast.info("Tidak ada data untuk dihapus");
                    return;
                  }
                  toast.info("Pilih data yang akan dihapus dari tabel");
                }}
              >
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
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Berita Acara
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
              <TableHead>Nomor BA</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Satuan Kerja</TableHead>
              <TableHead>Pimpinan</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Peserta</TableHead>
              <TableHead>Pegawai</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Belum ada data berita acara. Klik "Tambah Berita Acara" untuk menambahkan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.nomor_ba || "-"}</TableCell>
                  <TableCell>{item.tanggal || "-"}</TableCell>
                  <TableCell>{item.lokasi || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.satuan_kerja || "-"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{item.nama_pimpinan || "-"}</div>
                      {item.nip_pimpinan && (
                        <div className="text-muted-foreground text-xs">{item.nip_pimpinan}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {KATEGORI_OPTIONS.find(k => k.value === item.kategori)?.label || item.kategori || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.peserta.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.peserta.slice(0, 2).map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {p.nama}
                          </Badge>
                        ))}
                        {item.peserta.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.peserta.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    {(item.pegawai_klaster_ii || []).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(item.pegawai_klaster_ii || []).slice(0, 2).map((p, i) => (
                          <Badge key={i} variant="default" className="text-xs bg-green-600">
                            {p.nama}
                          </Badge>
                        ))}
                        {(item.pegawai_klaster_ii || []).length > 2 && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            +{(item.pegawai_klaster_ii || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={async () => {
                                try {
                                  await generateBeritaAcaraSidangDocument(item);
                                  toast.success("Berita Acara berhasil diunduh");
                                } catch (error: any) {
                                  toast.error("Gagal generate BA: " + error.message);
                                }
                              }}
                              title="Generate Berita Acara"
                            >
                              <FileText className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Generate BA</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={async () => {
                                if (!item.kategori) {
                                  toast.error("Pilih kategori terlebih dahulu");
                                  return;
                                }
                                
                                // For Klaster II categories, use pegawai_klaster_ii if available
                                const pegawaiKlaster = item.pegawai_klaster_ii || [];
                                
                                if (pegawaiKlaster.length === 0 && (!item.peserta || item.peserta.length === 0)) {
                                  toast.error("Pilih pegawai/peserta terlebih dahulu");
                                  return;
                                }
                                
                                try {
                                  let pesertaBigData: any[] = [];
                                  
                                  // If pegawai_klaster_ii exists, use it for lampiran generation
                                  if (pegawaiKlaster.length > 0) {
                                    // Fetch eselonisasi for sorting
                                    const { data: eselonData } = await supabase
                                      .from("eselonisasi")
                                      .select("id, no_urut, nama_unit, tingkat_eselon, kode_unit")
                                      .order("no_urut", { ascending: true });
                                    
                                    // Fetch Big Data for pegawai_klaster_ii
                                    const pegawaiNips = pegawaiKlaster.map(p => p.nip).filter(Boolean);
                                    
                                    if (pegawaiNips.length > 0) {
                                      const { data: bigData } = await supabase
                                        .from("grading_big_data")
                                        .select("*")
                                        .in("nip", pegawaiNips);
                                      
                                      if (bigData && bigData.length > 0) {
                                        // Sort by eselonisasi order
                                        const sortedBigData = [...bigData].sort((a, b) => {
                                          const getEselonOrder = (emp: any): number => {
                                            if (!eselonData) return 999;
                                            // Match by eselon_iv (kode_unit)
                                            const match = eselonData.find(e => 
                                              e.kode_unit?.toLowerCase() === emp.eselon_iv?.toLowerCase()
                                            );
                                            return match?.no_urut || 999;
                                          };
                                          return getEselonOrder(a) - getEselonOrder(b);
                                        });
                                        
                                        pesertaBigData = sortedBigData.map(bd => ({
                                          nama: bd.nama_lengkap,
                                          nip: bd.nip,
                                          lokasi: bd.lokasi,
                                          eselon_iii: bd.eselon_iii,
                                          eselon_iv: bd.eselon_iv,
                                          pangkat: bd.pangkat,
                                          pangkat_golongan: bd.pangkat_golongan,
                                          tmt_pangkat: bd.tmt_pangkat,
                                          pendidikan: bd.pendidikan,
                                          jabatan: bd.jabatan,
                                          grade: bd.grade,
                                          tmt_terakhir: bd.tmt_terakhir,
                                          pkt_2024: bd.pkt_2024,
                                          pkt_2025: bd.pkt_2025,
                                          kemampuan_kerja: bd.kemampuan_kerja,
                                          rekomendasi: bd.rekomendasi,
                                          jabatan_baru: bd.jabatan_baru,
                                          grade_baru: bd.grade_baru,
                                          akumulasi_masa_kerja: bd.akumulasi_masa_kerja,
                                          akumulasi_terakhir: bd.akumulasi_terakhir,
                                        }));
                                      }
                                    }
                                  } else {
                                    // Fallback to peserta-based approach
                                    const pesertaNips = item.peserta.map(p => p.nip).filter(Boolean);
                                    
                                    if (pesertaNips.length > 0) {
                                      const { data: bigData } = await supabase
                                        .from("grading_big_data")
                                        .select("*")
                                        .in("nip", pesertaNips);
                                      
                                      if (bigData) {
                                        pesertaBigData = bigData.map(bd => ({
                                          nama: bd.nama_lengkap,
                                          nip: bd.nip,
                                          lokasi: bd.lokasi,
                                          eselon_iii: bd.eselon_iii,
                                          eselon_iv: bd.eselon_iv,
                                          pangkat: bd.pangkat,
                                          pangkat_golongan: bd.pangkat_golongan,
                                          tmt_pangkat: bd.tmt_pangkat,
                                          pendidikan: bd.pendidikan,
                                          jabatan: bd.jabatan,
                                          grade: bd.grade,
                                          tmt_terakhir: bd.tmt_terakhir,
                                          pkt_2024: bd.pkt_2024,
                                          pkt_2025: bd.pkt_2025,
                                          kemampuan_kerja: bd.kemampuan_kerja,
                                          rekomendasi: bd.rekomendasi,
                                          jabatan_baru: bd.jabatan_baru,
                                          grade_baru: bd.grade_baru,
                                          akumulasi_masa_kerja: bd.akumulasi_masa_kerja,
                                          akumulasi_terakhir: bd.akumulasi_terakhir,
                                        }));
                                      }
                                    }
                                  }
                                  
                                  await generateLampiranByCategory({
                                    ...item,
                                    pesertaBigData,
                                  });
                                  toast.success("Lampiran berhasil diunduh dengan data pegawai");
                                } catch (error: any) {
                                  toast.error("Gagal generate Lampiran: " + error.message);
                                }
                              }}
                              disabled={!item.kategori}
                              title="Generate Lampiran"
                            >
                              <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Generate Lampiran</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleView(item)}
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lihat Detail</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
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
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Berita Acara" : "Tambah Berita Acara"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* KLASTER I - Informasi Berita Acara */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/30">
                  <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold px-3 py-1">
                    KLASTER I
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    Informasi Berita Acara (Generate BA)
                  </span>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nomor BA *</Label>
                    <Input
                      value={formData.nomor_ba}
                      onChange={(e) => setFormData({ ...formData, nomor_ba: e.target.value })}
                      placeholder="Masukkan nomor BA"
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
                  <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <Input
                      value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                      placeholder="Masukkan lokasi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Satuan Kerja</Label>
                    <Select value={formData.satuan_kerja} onValueChange={(v) => setFormData({ ...formData, satuan_kerja: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih satuan kerja" />
                      </SelectTrigger>
                      <SelectContent>
                        {satuanKerjaOptions.map((sk) => (
                          <SelectItem key={sk} value={sk}>{sk}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Pimpinan</Label>
                    <Popover open={pimpinanOpen} onOpenChange={setPimpinanOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal">
                          {formData.nama_pimpinan || "Pilih pimpinan..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari nama pegawai..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {employees.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={emp.nm_pegawai}
                                  onSelect={() => handleSelectPimpinan(emp)}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", formData.nama_pimpinan === emp.nm_pegawai ? "opacity-100" : "opacity-0")} />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIP Pimpinan</Label>
                    <Input
                      value={formData.nip_pimpinan}
                      className="bg-muted"
                      readOnly
                      placeholder="Otomatis dari nama pimpinan"
                    />
                  </div>
                </div>

                {/* Peserta */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Peserta (Panelis)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddPeserta}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Peserta
                    </Button>
                  </div>
                  {formData.peserta.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada peserta. Klik "Tambah Peserta" untuk menambahkan.</p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-3">
                        {formData.peserta.map((p, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <div className="flex-1">
                              <Popover open={pesertaOpen === idx} onOpenChange={(open) => setPesertaOpen(open ? idx : null)}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between font-normal">
                                    {p.nama || "Pilih peserta..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                  <Command>
                                    <CommandInput placeholder="Cari nama pegawai..." />
                                    <CommandList>
                                      <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                                      <CommandGroup>
                                        <ScrollArea className="h-[250px]">
                                          <div className="pr-3">
                                            {employees.map((emp) => (
                                              <CommandItem
                                                key={emp.id}
                                                value={emp.nm_pegawai}
                                                onSelect={() => handleSelectPeserta(emp, idx)}
                                              >
                                                <Check className={cn("mr-2 h-4 w-4", p.nama === emp.nm_pegawai ? "opacity-100" : "opacity-0")} />
                                                <div className="flex flex-col">
                                                  <span>{emp.nm_pegawai}</span>
                                                  <span className="text-xs text-muted-foreground">{emp.nip}</span>
                                                </div>
                                              </CommandItem>
                                            ))}
                                          </div>
                                        </ScrollArea>
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <Input
                              value={p.nip}
                              className="w-48 bg-muted"
                              readOnly
                              placeholder="NIP"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePeserta(idx)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>

              {/* KLASTER II - Data Pegawai & Lampiran */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b-2 border-green-500/30">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 font-semibold px-3 py-1">
                    KLASTER II
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    Data Pegawai & Generate Lampiran
                  </span>
                </div>

                {/* Kategori Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Kategori *</Label>
                    <Select value={formData.kategori} onValueChange={handleKategoriChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori untuk menampilkan data pegawai" />
                      </SelectTrigger>
                      <SelectContent>
                        {KATEGORI_OPTIONS.map((k) => (
                          <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Big Data Category Summary - show only when kategori is selected */}
                {formData.kategori && (
                  <div>
                    <BigDataCategorySummary 
                      kategori={formData.kategori} 
                      onAddPeserta={handleAddPesertaFromBigData}
                      onSelectedEmployeesChange={(emps) => handleUpdatePreviewPegawai(emps.map(e => ({
                        id: e.id,
                        nama: e.nama_lengkap,
                        nip: e.nip,
                        lokasi: e.lokasi || undefined,
                        eselon_iv: e.eselon_iv || undefined,
                        pangkat: e.pangkat_golongan || undefined,
                        pangkat_golongan: e.pangkat_golongan || undefined,
                        pendidikan: e.pendidikan || undefined,
                        jabatan: e.jabatan || undefined,
                        grade: e.grade || undefined,
                      })))}
                    />
                  </div>
                )}

                {!formData.kategori && (
                  <div className="text-center py-6 border border-dashed rounded-md bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      Pilih kategori terlebih dahulu untuk menampilkan daftar pegawai dari Big Data
                    </p>
                  </div>
                )}
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

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detail Berita Acara</DialogTitle>
          </DialogHeader>
          {viewingData && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nomor BA</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">{viewingData.nomor_ba || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tanggal</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">{viewingData.tanggal || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Lokasi</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">{viewingData.lokasi || "-"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Satuan Kerja</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">{viewingData.satuan_kerja || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Kategori</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {KATEGORI_OPTIONS.find(k => k.value === viewingData.kategori)?.label || viewingData.kategori || "-"}
                    </div>
                  </div>
                </div>

                {/* Pimpinan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nama Pimpinan</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">{viewingData.nama_pimpinan || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">NIP Pimpinan</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">{viewingData.nip_pimpinan || "-"}</div>
                  </div>
                </div>

                {/* Peserta */}
                {viewingData.peserta && viewingData.peserta.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Peserta</Label>
                    <div className="border rounded-md divide-y">
                      {viewingData.peserta.map((p, idx) => (
                        <div key={idx} className="p-2 flex items-center gap-4">
                          <span className="text-sm font-medium text-muted-foreground w-8">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="font-medium">{p.nama}</div>
                            <div className="text-sm text-muted-foreground">{p.nip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detail Kategori */}
                {viewingData.kategori && Object.keys(viewingData.detail_kategori || {}).length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Detail {KATEGORI_OPTIONS.find(k => k.value === viewingData.kategori)?.label}
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(CATEGORY_FIELDS[viewingData.kategori] || []).map((field) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">{FIELD_LABELS[field] || field}</Label>
                          <div className="p-2 bg-muted rounded-md text-sm">
                            {viewingData.detail_kategori?.[field] || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => {
              if (viewingData) {
                handleEdit(viewingData);
                setViewDialogOpen(false);
              }
            }}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus berita acara ini? Tindakan ini tidak dapat dibatalkan.
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
    </div>
  );
}
