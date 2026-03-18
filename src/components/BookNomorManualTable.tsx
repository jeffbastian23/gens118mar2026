import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Search, FileSpreadsheet, Pencil, Check, X, CalendarIcon, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface BookNomorManual {
  id: string;
  jenis_surat: string;
  nomor_urut: number;
  nomor_lengkap: string;
  tanggal: string;
  perihal: string;
  kepada: string;
  nama_bidang: string;
  nama_lengkap: string;
  user_email: string | null;
  created_at: string;
  jenis_perihal?: string;
  nominal?: number;
  status_approval?: string;
  approved_at?: string;
  approved_by?: string;
  approved_by_name?: string;
}

const JENIS_SURAT_OPTIONS = ["SPKTNP", "SPP", "SPSA"];
const JENIS_PERIHAL_OPTIONS = ["Kurang Bayar", "Tambah Bayar"];

const BIDANG_OPTIONS = [
  "Bagian Umum",
  "Bidang Fasilitas",
  "Bidang KC",
  "Bidang P2",
  "Bidang KI",
  "Sub Unsur Audit",
  "Sub Unsur Keban"
];

export default function BookNomorManualTable() {
  const { user, fullName, role } = useAuth();
  const canEdit = role !== "overview";
  const isAdmin = role === "admin";
  const [data, setData] = useState<BookNomorManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<BookNomorManual | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState<string>("all");
  const [exportFilterJenis, setExportFilterJenis] = useState<string[]>(["SPP", "SPSA", "SPKTNP"]);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>();
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    jenis_surat: "",
    tanggal: format(new Date(), "yyyy-MM-dd"),
    jenis_perihal: "",
    nominal: 0,
    kepada: "",
    nama_bidang: "",
    perekam: "",
    perekam_custom: ""
  });
  const [users, setUsers] = useState<{id: string, full_name: string | null, email: string}[]>([]);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });
    
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from("book_nomor_manual")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } else {
      setData((result || []) as BookNomorManual[]);
    }
    setLoading(false);
  };

  const getNextNomor = async (jenisSurat: string, tanggal: string): Promise<number> => {
    // Use year from selected date to find correct sequence
    const selectedDate = new Date(tanggal);
    const yearFromDate = selectedDate.getFullYear();
    const { data: existing } = await supabase
      .from("book_nomor_manual")
      .select("nomor_urut")
      .eq("jenis_surat", jenisSurat)
      .gte("tanggal", `${yearFromDate}-01-01`)
      .lte("tanggal", `${yearFromDate}-12-31`)
      .order("nomor_urut", { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return (existing[0] as { nomor_urut: number }).nomor_urut + 1;
    }
    return 1;
  };

  const generateNomorLengkap = (jenisSurat: string, nomorUrut: number, tanggal: string): string => {
    // Use year from selected date for proper numbering
    const selectedDate = new Date(tanggal);
    const yearFromDate = selectedDate.getFullYear();
    return `${jenisSurat}-${nomorUrut}/WBC.11/${yearFromDate}`;
  };

  // Format nominal to currency string
  const formatNominal = (nominal: number): string => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(nominal);
  };

  // Generate perihal string from jenis_perihal and nominal
  const generatePerihal = (jenisPerihal: string, nominal: number): string => {
    return `${jenisPerihal} ${formatNominal(nominal)}`;
  };

  // Get today's date for min date restriction
  const getMinDate = (): string => {
    return format(new Date(), "yyyy-MM-dd");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.jenis_surat) {
      toast.error("Pilih jenis surat terlebih dahulu");
      return;
    }

    if (!formData.jenis_perihal) {
      toast.error("Pilih jenis perihal terlebih dahulu");
      return;
    }

    // Validate date is today or future
    const selectedDate = new Date(formData.tanggal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error("Tanggal tidak boleh lebih awal dari hari ini");
      return;
    }

    try {
      const nomorUrut = await getNextNomor(formData.jenis_surat, formData.tanggal);
      const nomorLengkap = generateNomorLengkap(formData.jenis_surat, nomorUrut, formData.tanggal);
      const perihal = generatePerihal(formData.jenis_perihal, formData.nominal);
      
      // Determine nama_lengkap from perekam field
      let namaLengkap = fullName || user?.email || "Unknown";
      if (formData.perekam === "custom" && formData.perekam_custom) {
        namaLengkap = formData.perekam_custom;
      } else if (formData.perekam && formData.perekam !== "custom") {
        namaLengkap = formData.perekam;
      }

      const { error } = await supabase.from("book_nomor_manual").insert({
        jenis_surat: formData.jenis_surat,
        nomor_urut: nomorUrut,
        nomor_lengkap: nomorLengkap,
        tanggal: formData.tanggal,
        perihal: perihal,
        jenis_perihal: formData.jenis_perihal,
        nominal: formData.nominal,
        kepada: formData.kepada,
        nama_bidang: formData.nama_bidang,
        nama_lengkap: namaLengkap,
        user_email: user?.email || null,
        status_approval: "pending"
      });

      if (error) throw error;

      toast.success(`Nomor ${nomorLengkap} berhasil dibuat dan menunggu persetujuan`);
      setShowAddDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error creating book nomor:", error);
      toast.error("Gagal menyimpan data");
    }
  };

  const handleApproval = async (id: string, approved: boolean) => {
    try {
      const item = data.find(d => d.id === id);
      if (!item) {
        toast.error("Data tidak ditemukan");
        return;
      }

      const newStatus = approved ? "approved" : "declined";
      
      let updateData: any = {
        status_approval: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: user?.email || "unknown",
        approved_by_name: fullName || user?.email || "unknown"
      };

      // If approved, regenerate nomor_lengkap with correct sequence based on item's date
      if (approved) {
        // Use year from item's tanggal for correct numbering
        const itemDate = new Date(item.tanggal);
        const yearFromDate = itemDate.getFullYear();
        
        // Get the highest nomor_urut among approved items for this jenis_surat in the item's year
        const { data: approvedItems } = await supabase
          .from("book_nomor_manual")
          .select("nomor_urut")
          .eq("jenis_surat", item.jenis_surat)
          .eq("status_approval", "approved")
          .gte("tanggal", `${yearFromDate}-01-01`)
          .lte("tanggal", `${yearFromDate}-12-31`)
          .order("nomor_urut", { ascending: false })
          .limit(1);

        const nextNomorUrut = approvedItems && approvedItems.length > 0 
          ? (approvedItems[0] as { nomor_urut: number }).nomor_urut + 1 
          : 1;
        
        const newNomorLengkap = `${item.jenis_surat}-${nextNomorUrut}/WBC.11/${yearFromDate}`;
        
        updateData.nomor_urut = nextNomorUrut;
        updateData.nomor_lengkap = newNomorLengkap;
      }

      const { error } = await supabase
        .from("book_nomor_manual")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(`Data ${approved ? "disetujui dengan nomor " + updateData.nomor_lengkap : "ditolak"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating approval:", error);
      toast.error("Gagal memperbarui status");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Only allow update if not yet approved
    if (editingItem.status_approval === "approved") {
      toast.error("Data yang sudah disetujui tidak dapat diubah");
      return;
    }

    try {
      const perihal = generatePerihal(formData.jenis_perihal, formData.nominal);
      
      const { error } = await supabase
        .from("book_nomor_manual")
        .update({
          tanggal: formData.tanggal,
          perihal: perihal,
          jenis_perihal: formData.jenis_perihal,
          nominal: formData.nominal,
          kepada: formData.kepada,
          nama_bidang: formData.nama_bidang
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast.success("Data berhasil diperbarui");
      setShowEditDialog(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error("Gagal memperbarui data");
    }
  };

  const handleDelete = async (id: string) => {
    const item = data.find(d => d.id === id);
    if (item?.status_approval === "approved") {
      toast.error("Data yang sudah disetujui tidak dapat dihapus");
      return;
    }
    
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    const { error } = await supabase.from("book_nomor_manual").delete().eq("id", id);

    if (error) {
      toast.error("Gagal menghapus data");
      return;
    }

    toast.success("Data berhasil dihapus");
    fetchData();
  };

  const openEdit = (item: BookNomorManual) => {
    if (item.status_approval === "approved") {
      toast.error("Data yang sudah disetujui tidak dapat diubah");
      return;
    }
    
    setEditingItem(item);
    setFormData({
      jenis_surat: item.jenis_surat,
      tanggal: item.tanggal,
      jenis_perihal: item.jenis_perihal || "",
      nominal: item.nominal || 0,
      kepada: item.kepada,
      nama_bidang: item.nama_bidang,
      perekam: "",
      perekam_custom: ""
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      jenis_surat: "",
      tanggal: format(new Date(), "yyyy-MM-dd"),
      jenis_perihal: "",
      nominal: 0,
      kepada: "",
      nama_bidang: "",
      perekam: "",
      perekam_custom: ""
    });
  };

  const toggleExportJenis = (jenis: string) => {
    setExportFilterJenis((prev) =>
      prev.includes(jenis)
        ? prev.filter((j) => j !== jenis)
        : [...prev, jenis]
    );
  };

  const getExportFilteredData = () => {
    return data.filter((item) => {
      // Filter by jenis
      if (!exportFilterJenis.includes(item.jenis_surat)) return false;

      // Filter by date range
      if (exportStartDate) {
        const itemDate = new Date(item.tanggal);
        if (itemDate < exportStartDate) return false;
      }

      if (exportEndDate) {
        const itemDate = new Date(item.tanggal);
        if (itemDate > exportEndDate) return false;
      }

      return true;
    });
  };

  const handleExportWithFilters = () => {
    const exportFiltered = getExportFilteredData();

    if (exportFiltered.length === 0) {
      toast.error("Tidak ada data yang sesuai dengan filter");
      return;
    }

    const exportData = exportFiltered.map((item, index) => ({
      "No": index + 1,
      "Jenis Surat": item.jenis_surat,
      "Nomor Lengkap": item.nomor_lengkap,
      "Tanggal": format(new Date(item.tanggal), "dd MMMM yyyy", { locale: id }),
      "Perihal": item.perihal,
      "Kepada": item.kepada,
      "Bidang/Bagian": item.nama_bidang,
      "Status": item.status_approval === "approved" ? "Disetujui" : 
               item.status_approval === "declined" ? "Ditolak" : "Pending",
      "Dibuat Oleh": item.nama_lengkap,
      "Waktu Input": format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: id })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Book Nomor Manual");
    
    // Generate filename with filter info
    let filename = "Book_Nomor_";
    if (exportFilterJenis.length < 3) {
      filename += exportFilterJenis.join("_") + "_";
    }
    if (exportStartDate) {
      filename += format(exportStartDate, "yyyyMMdd") + "_";
    }
    if (exportEndDate) {
      filename += "to_" + format(exportEndDate, "yyyyMMdd") + "_";
    }
    filename += format(new Date(), "yyyyMMdd") + ".xlsx";
    
    XLSX.writeFile(wb, filename);
    toast.success(`${exportFiltered.length} data berhasil diexport`);
    setShowExportDialog(false);
  };

  const filteredData = data.filter(item => {
    const matchSearch = 
      item.nomor_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kepada.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis = filterJenis === "all" || item.jenis_surat === filterJenis;
    return matchSearch && matchJenis;
  });

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nomor, perihal, kepada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterJenis} onValueChange={setFilterJenis}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Jenis Surat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {JENIS_SURAT_OPTIONS.map(jenis => (
                <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                try {
                  const data = await file.arrayBuffer();
                  const workbook = XLSX.read(data);
                  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                  const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
                  
                  let successCount = 0;
                  let errorCount = 0;
                  
                  for (const row of jsonData) {
                    try {
                      const jenisSurat = row["Jenis Surat"] || row["jenis_surat"] || "";
                      const tanggal = row["Tanggal"] || row["tanggal"] || format(new Date(), "yyyy-MM-dd");
                      const jenisPerihal = row["Jenis Perihal"] || row["jenis_perihal"] || "";
                      const nominal = parseFloat(row["Nominal"] || row["nominal"] || "0");
                      const kepada = row["Kepada"] || row["kepada"] || "";
                      const namaBidang = row["Bidang/Bagian"] || row["nama_bidang"] || "";
                      
                      if (!jenisSurat) continue;
                      
                      const nomorUrut = await getNextNomor(jenisSurat, tanggal);
                      const nomorLengkap = generateNomorLengkap(jenisSurat, nomorUrut, tanggal);
                      const perihal = jenisPerihal && nominal ? generatePerihal(jenisPerihal, nominal) : (row["Perihal"] || row["perihal"] || "");
                      
                      const { error } = await supabase.from("book_nomor_manual").insert({
                        jenis_surat: jenisSurat,
                        nomor_urut: nomorUrut,
                        nomor_lengkap: nomorLengkap,
                        tanggal: tanggal,
                        perihal: perihal,
                        jenis_perihal: jenisPerihal,
                        nominal: nominal,
                        kepada: kepada,
                        nama_bidang: namaBidang,
                        nama_lengkap: fullName || user?.email || "Unknown",
                        user_email: user?.email || null,
                        status_approval: "pending"
                      });
                      
                      if (error) {
                        errorCount++;
                      } else {
                        successCount++;
                      }
                    } catch (err) {
                      errorCount++;
                    }
                  }
                  
                  if (successCount > 0) {
                    toast.success(`${successCount} data berhasil diimport`);
                  }
                  if (errorCount > 0) {
                    toast.error(`${errorCount} data gagal diimport`);
                  }
                  
                  fetchData();
                  e.target.value = "";
                } catch (err) {
                  toast.error("Gagal membaca file Excel");
                }
              }}
            />
          </label>
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          {canEdit && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Nomor
            </Button>
          )}
          {isAdmin && (
            <Button variant="destructive" onClick={async () => {
              if (data.length === 0) {
                toast.error("Tidak ada data untuk dihapus");
                return;
              }
              if (!confirm(`Yakin ingin menghapus SEMUA ${data.length} data book nomor manual?`)) return;
              const { error } = await supabase.from("book_nomor_manual").delete().neq("id", "00000000-0000-0000-0000-000000000000");
              if (error) {
                toast.error("Gagal menghapus semua data");
                return;
              }
              toast.success("Semua data berhasil dihapus");
              fetchData();
            }}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Semua
            </Button>
          )}
        </div>
      </div>

      {/* Card-based responsive layout */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Tidak ada data</div>
        ) : (
          filteredData.map((item, index) => (
            <div key={item.id} className="rounded-lg border bg-card p-4 space-y-3">
              {/* Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm font-medium">{index + 1}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.jenis_surat === "SPKTNP" ? "bg-blue-100 text-blue-700" :
                    item.jenis_surat === "SPP" ? "bg-green-100 text-green-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {item.jenis_surat}
                  </span>
                  <span className="font-mono text-sm font-medium">{item.nomor_lengkap}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.status_approval === "approved" ? "bg-green-100 text-green-700" :
                  item.status_approval === "declined" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {item.status_approval === "approved" ? "Disetujui" :
                   item.status_approval === "declined" ? "Ditolak" : "Pending"}
                </span>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span className="ml-2">{format(new Date(item.tanggal), "dd MMM yyyy", { locale: id })}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Perihal:</span>
                  <span className="ml-2">{item.perihal}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kepada:</span>
                  <span className="ml-2">{item.kepada}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bidang:</span>
                  <span className="ml-2">{item.nama_bidang}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dibuat Oleh:</span>
                  <span className="ml-2">{item.nama_lengkap}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Waktu Input:</span>
                  <span className="ml-2 text-xs">{format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: id })}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Diputus Oleh:</span>
                  <span className="ml-2">{item.approved_by_name || item.approved_by || "-"}</span>
                </div>
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  {isAdmin && item.status_approval === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproval(item.id, true)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Setuju
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproval(item.id, false)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Tolak
                      </Button>
                    </>
                  )}
                  {item.status_approval !== "approved" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Nomor Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Surat *</Label>
              <Select
                value={formData.jenis_surat}
                onValueChange={(val) => setFormData({ ...formData, jenis_surat: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis surat" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_SURAT_OPTIONS.map(jenis => (
                    <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal * (hari ini atau ke depan)</Label>
              <Input
                type="date"
                value={formData.tanggal}
                min={getMinDate()}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Perihal *</Label>
              <Select
                value={formData.jenis_perihal}
                onValueChange={(val) => setFormData({ ...formData, jenis_perihal: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis perihal" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_PERIHAL_OPTIONS.map(jp => (
                    <SelectItem key={jp} value={jp}>{jp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nominal (Rp) *</Label>
              <Input
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: parseFloat(e.target.value) || 0 })}
                placeholder="Masukkan nominal"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kepada (Nama Perusahaan/Perseorangan) *</Label>
              <Input
                value={formData.kepada}
                onChange={(e) => setFormData({ ...formData, kepada: e.target.value })}
                placeholder="Masukkan nama perusahaan atau perseorangan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Bidang/Bagian *</Label>
              <Select
                value={formData.nama_bidang}
                onValueChange={(val) => setFormData({ ...formData, nama_bidang: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bidang/bagian" />
                </SelectTrigger>
                <SelectContent>
                  {BIDANG_OPTIONS.map(bidang => (
                    <SelectItem key={bidang} value={bidang}>{bidang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Perekam</Label>
              <Select
                value={formData.perekam}
                onValueChange={(val) => setFormData({ ...formData, perekam: val, perekam_custom: val === "custom" ? formData.perekam_custom : "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih perekam" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.full_name || u.email}>{u.full_name || u.email}</SelectItem>
                  ))}
                  <SelectItem value="custom">Lainnya (input manual)</SelectItem>
                </SelectContent>
              </Select>
              {formData.perekam === "custom" && (
                <Input
                  placeholder="Masukkan nama perekam"
                  value={formData.perekam_custom}
                  onChange={(e) => setFormData({ ...formData, perekam_custom: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Data</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Surat</Label>
              <Input value={formData.jenis_surat} disabled />
            </div>

            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={formData.tanggal}
                min={getMinDate()}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Jenis Perihal *</Label>
              <Select
                value={formData.jenis_perihal}
                onValueChange={(val) => setFormData({ ...formData, jenis_perihal: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis perihal" />
                </SelectTrigger>
                <SelectContent>
                  {JENIS_PERIHAL_OPTIONS.map(jp => (
                    <SelectItem key={jp} value={jp}>{jp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nominal (Rp) *</Label>
              <Input
                type="number"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kepada *</Label>
              <Input
                value={formData.kepada}
                onChange={(e) => setFormData({ ...formData, kepada: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Bidang/Bagian *</Label>
              <Select
                value={formData.nama_bidang}
                onValueChange={(val) => setFormData({ ...formData, nama_bidang: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bidang/bagian" />
                </SelectTrigger>
                <SelectContent>
                  {BIDANG_OPTIONS.map(bidang => (
                    <SelectItem key={bidang} value={bidang}>{bidang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setShowEditDialog(false);
                setEditingItem(null);
                resetForm();
              }}>
                Batal
              </Button>
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Dialog with Filters */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Book Nomor Manual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Jenis Filter */}
            <div className="space-y-2">
              <Label>Jenis Surat</Label>
              <div className="flex flex-wrap gap-3">
                {JENIS_SURAT_OPTIONS.map((jenis) => (
                  <div key={jenis} className="flex items-center space-x-2">
                    <Checkbox
                      id={`export-jenis-${jenis}`}
                      checked={exportFilterJenis.includes(jenis)}
                      onCheckedChange={() => toggleExportJenis(jenis)}
                    />
                    <label
                      htmlFor={`export-jenis-${jenis}`}
                      className={cn(
                        "text-sm font-medium cursor-pointer px-2 py-1 rounded",
                        jenis === "SPP" && "bg-green-100 text-green-700",
                        jenis === "SPSA" && "bg-orange-100 text-orange-700",
                        jenis === "SPKTNP" && "bg-blue-100 text-blue-700"
                      )}
                    >
                      {jenis}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Dari</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exportStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportStartDate ? format(exportStartDate, "dd/MM/yyyy") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportStartDate}
                      onSelect={setExportStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tanggal Sampai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exportEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportEndDate ? format(exportEndDate, "dd/MM/yyyy") : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exportEndDate}
                      onSelect={setExportEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Preview Count */}
            <div className="p-3 bg-muted rounded-lg text-center">
              <span className="text-2xl font-bold text-primary">{getExportFilteredData().length}</span>
              <p className="text-sm text-muted-foreground">data akan diexport</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleExportWithFilters}
              disabled={getExportFilteredData().length === 0 || exportFilterJenis.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
