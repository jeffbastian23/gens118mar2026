import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2, Search, Download, Upload, GraduationCap, Award, FileSpreadsheet, FileText, Phone, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { useSubMenuAccess } from "@/hooks/useSubMenuAccess";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  nm_pegawai: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
  kontak: string | null;
}

interface DistribusiSurat {
  id: string;
  jenis_dokumen: string;
  nama_pegawai: string;
  jabatan: string;
  satuan_kerja: string;
  tanggal_distribusi: string;
  keterangan: string[];
  nomor_kontak: string;
  klaster_info: string;
  created_by: string | null;
  created_at: string;
}

const SATUAN_KERJA_OPTIONS = [
  "Kanwil DJBC Jawa Timur I",
  "KPPBC TMP A Surabaya",
  "KPPBC TMP B Pasuruan",
  "KPPBC TMP C Probolinggo",
  "KPPBC TMP C Situbondo",
  "KPPBC TMP C Tanjung Wangi",
  "KPPBC TMP C Gresik",
  "KPPBC TMP C Tuban",
  "KPPBC TMP C Wilayah Khusus Juanda",
  "KPPBC TMP C Madura"
];

const JENIS_DOKUMEN_OPTIONS = ["Ijazah", "Satya Lencana"];
const STORAGE_KEY = "distribusi_surat_data_v2";

export default function DistribusiSuratTable() {
  const { user, role } = useAuth();
  const { isAdmin } = useSubMenuAccess("surat-masuk");
  const canEdit = role !== "overview";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [distribusi, setDistribusi] = useState<DistribusiSurat[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DistribusiSurat | null>(null);
  const [activeJenis, setActiveJenis] = useState("Ijazah");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSatker, setFilterSatker] = useState("all");
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  
  const [formData, setFormData] = useState({
    jenis_dokumen: "Ijazah",
    nama_pegawai: "",
    jabatan: "",
    satuan_kerja: "",
    tanggal_distribusi: format(new Date(), "yyyy-MM-dd"),
    keterangan: [] as string[],
    nomor_kontak: "",
    klaster_info: ""
  });

  useEffect(() => {
    fetchEmployees();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old data format if needed
      const migrated = parsed.map((item: any) => ({
        ...item,
        jabatan: item.jabatan || item.nip || "",
        keterangan: Array.isArray(item.keterangan) ? item.keterangan : (item.keterangan ? [item.keterangan] : []),
        nomor_kontak: item.nomor_kontak || "",
        klaster_info: item.klaster_info || ""
      }));
      setDistribusi(migrated);
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      // Fetch all employees with pagination to avoid 1000 row limit
      let allEmployees: Employee[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, uraian_jabatan, nm_unit_organisasi, kontak")
          .order("nm_pegawai")
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

      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const saveToStorage = (data: DistribusiSurat[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setDistribusi(data);
  };

  const resetForm = () => {
    setFormData({
      jenis_dokumen: activeJenis,
      nama_pegawai: "",
      jabatan: "",
      satuan_kerja: "",
      tanggal_distribusi: format(new Date(), "yyyy-MM-dd"),
      keterangan: [],
      nomor_kontak: "",
      klaster_info: ""
    });
    setEmployeeSearch("");
  };

  const handleSelectEmployee = (employee: Employee) => {
    setFormData({
      ...formData,
      nama_pegawai: employee.nm_pegawai,
      jabatan: employee.uraian_jabatan,
      satuan_kerja: employee.nm_unit_organisasi,
      nomor_kontak: employee.kontak || ""
    });
    setEmployeeOpen(false);
  };

  const handleAddKeterangan = () => {
    setFormData(prev => ({
      ...prev,
      keterangan: [...prev.keterangan, ""]
    }));
  };

  const handleUpdateKeterangan = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.keterangan];
      updated[index] = value;
      return { ...prev, keterangan: updated };
    });
  };

  const handleRemoveKeterangan = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keterangan: prev.keterangan.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: DistribusiSurat = {
      id: crypto.randomUUID(),
      jenis_dokumen: formData.jenis_dokumen,
      nama_pegawai: formData.nama_pegawai,
      jabatan: formData.jabatan,
      satuan_kerja: formData.satuan_kerja,
      tanggal_distribusi: formData.tanggal_distribusi,
      keterangan: formData.keterangan.filter(k => k.trim() !== ""),
      nomor_kontak: formData.nomor_kontak,
      klaster_info: formData.klaster_info,
      created_by: user?.email || null,
      created_at: new Date().toISOString()
    };

    saveToStorage([newItem, ...distribusi]);
    toast.success("Data distribusi berhasil ditambahkan");
    setShowAddDialog(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const updated = distribusi.map(item => 
      item.id === selectedItem.id 
        ? { 
            ...item, 
            ...formData, 
            keterangan: formData.keterangan.filter(k => k.trim() !== "")
          }
        : item
    );

    saveToStorage(updated);
    toast.success("Data distribusi berhasil diubah");
    setShowEditDialog(false);
    setSelectedItem(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    const filtered = distribusi.filter(item => item.id !== id);
    saveToStorage(filtered);
    toast.success("Data berhasil dihapus");
  };

  const openEditDialog = (item: DistribusiSurat) => {
    setSelectedItem(item);
    setFormData({
      jenis_dokumen: item.jenis_dokumen,
      nama_pegawai: item.nama_pegawai,
      jabatan: item.jabatan,
      satuan_kerja: item.satuan_kerja,
      tanggal_distribusi: item.tanggal_distribusi,
      keterangan: item.keterangan || [],
      nomor_kontak: item.nomor_kontak || "",
      klaster_info: item.klaster_info || ""
    });
    setShowEditDialog(true);
  };

  const generateReceipt = (item: DistribusiSurat) => {
    // Create simple text receipt
    const receiptContent = `
TANDA TERIMA DISTRIBUSI ${item.jenis_dokumen.toUpperCase()}
==========================================

Nama Pegawai    : ${item.nama_pegawai}
Jabatan         : ${item.jabatan}
Satuan Kerja    : ${item.satuan_kerja}
Tanggal         : ${format(new Date(item.tanggal_distribusi), "dd MMMM yyyy", { locale: id })}
Nomor Kontak    : ${item.nomor_kontak || "-"}
${item.klaster_info ? `Klaster         : ${item.klaster_info}` : ""}
Keterangan      : ${item.keterangan?.join(", ") || "-"}

==========================================
Tanggal Cetak: ${format(new Date(), "dd MMMM yyyy HH:mm", { locale: id })}
    `.trim();

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tanda_terima_${item.nama_pegawai.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tanda terima berhasil diunduh");
  };

  const exportToExcel = () => {
    const filtered = filteredData;
    const exportData = filtered.map((item, idx) => ({
      "No": idx + 1,
      "Jenis Dokumen": item.jenis_dokumen,
      "Nama Pegawai": item.nama_pegawai,
      "Jabatan": item.jabatan,
      "Satuan Kerja": item.satuan_kerja,
      "Tanggal Distribusi": format(new Date(item.tanggal_distribusi), "dd/MM/yyyy"),
      "Nomor Kontak": item.nomor_kontak || "-",
      "Klaster": item.klaster_info || "-",
      "Keterangan": item.keterangan?.join("; ") || "-"
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Distribusi Surat");
    XLSX.writeFile(wb, `distribusi_surat_${activeJenis.toLowerCase()}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  const handleDeleteAll = () => {
    if (distribusi.length === 0) {
      toast.error("Tidak ada data untuk dihapus");
      return;
    }
    if (!confirm(`Yakin ingin menghapus SEMUA ${distribusi.length} data distribusi surat?`)) return;
    saveToStorage([]);
    toast.success("Semua data berhasil dihapus");
  };

  const importFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(ws);
      
      const newItems: DistribusiSurat[] = data.map((row: any) => ({
        id: crypto.randomUUID(),
        jenis_dokumen: row["Jenis Dokumen"] || activeJenis,
        nama_pegawai: row["Nama Pegawai"] || "",
        jabatan: row["Jabatan"]?.toString() || "",
        satuan_kerja: row["Satuan Kerja"] || "",
        tanggal_distribusi: format(new Date(), "yyyy-MM-dd"),
        keterangan: row["Keterangan"] ? row["Keterangan"].split(";").map((k: string) => k.trim()) : [],
        nomor_kontak: row["Nomor Kontak"]?.toString() || "",
        klaster_info: row["Klaster"]?.toString() || "",
        created_by: user?.email || null,
        created_at: new Date().toISOString()
      }));
      
      saveToStorage([...newItems, ...distribusi]);
      toast.success(`${newItems.length} data berhasil diimport`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Filter data based on active jenis and search
  const filteredData = distribusi.filter(item => {
    const matchesJenis = item.jenis_dokumen === activeJenis;
    const matchesSearch = 
      item.nama_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSatker = filterSatker === "all" || item.satuan_kerja === filterSatker;
    return matchesJenis && matchesSearch && matchesSatker;
  });

  // Stats
  const stats = {
    ijazah: distribusi.filter(d => d.jenis_dokumen === "Ijazah").length,
    satyaLencana: distribusi.filter(d => d.jenis_dokumen === "Satya Lencana").length,
    bySatker: SATUAN_KERJA_OPTIONS.map(satker => ({
      satker,
      ijazah: distribusi.filter(d => d.jenis_dokumen === "Ijazah" && d.satuan_kerja === satker).length,
      satyaLencana: distribusi.filter(d => d.jenis_dokumen === "Satya Lencana" && d.satuan_kerja === satker).length
    }))
  };

  const filteredEmployees = employees.filter(emp => 
    emp.nm_pegawai.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.uraian_jabatan.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  // Memoize FormFields to prevent recreation on every render which causes input focus loss
  const renderFormFields = useCallback((isEdit = false) => (
    <>
      <div className="space-y-2">
        <Label>Jenis Dokumen *</Label>
        <Select value={formData.jenis_dokumen} onValueChange={(v) => setFormData(prev => ({ ...prev, jenis_dokumen: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih jenis dokumen" />
          </SelectTrigger>
          <SelectContent>
            {JENIS_DOKUMEN_OPTIONS.map((jenis) => (
              <SelectItem key={jenis} value={jenis}>{jenis}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.jenis_dokumen === "Ijazah" && (
        <div className="space-y-2">
          <Label>Klaster Ijazah</Label>
          <Input
            value={formData.klaster_info}
            onChange={(e) => setFormData(prev => ({ ...prev, klaster_info: e.target.value }))}
            placeholder="Contoh: Klaster 1, S2, dll"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Nama Pegawai *</Label>
        <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={employeeOpen}
              className="w-full justify-between"
            >
              {formData.nama_pegawai || "Pilih pegawai..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Cari nama pegawai..." 
                value={employeeSearch}
                onValueChange={setEmployeeSearch}
              />
              <CommandList>
                <CommandEmpty>Tidak ditemukan pegawai.</CommandEmpty>
                <CommandGroup className="max-h-60 overflow-y-auto">
                  {filteredEmployees.slice(0, 100).map((emp) => (
                    <CommandItem
                      key={emp.id}
                      value={emp.nm_pegawai}
                      onSelect={() => handleSelectEmployee(emp)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          formData.nama_pegawai === emp.nm_pegawai ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{emp.nm_pegawai}</span>
                        <span className="text-xs text-muted-foreground">{emp.uraian_jabatan}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jabatan</Label>
          <Input
            value={formData.jabatan}
            onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
            placeholder="Otomatis terisi"
            readOnly
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label>Satuan Kerja</Label>
          <Input
            value={formData.satuan_kerja}
            onChange={(e) => setFormData(prev => ({ ...prev, satuan_kerja: e.target.value }))}
            placeholder="Otomatis terisi"
            readOnly
            className="bg-muted/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tanggal Distribusi *</Label>
          <Input
            type="date"
            value={formData.tanggal_distribusi}
            onChange={(e) => setFormData(prev => ({ ...prev, tanggal_distribusi: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Nomor Kontak</Label>
          <div className="relative">
            <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={formData.nomor_kontak}
              onChange={(e) => setFormData(prev => ({ ...prev, nomor_kontak: e.target.value }))}
              placeholder="Otomatis terisi"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Keterangan</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddKeterangan}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </div>
        {formData.keterangan.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Klik + untuk menambah keterangan</p>
        ) : (
          <div className="space-y-2">
            {formData.keterangan.map((ket, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={ket}
                  onChange={(e) => handleUpdateKeterangan(index, e.target.value)}
                  placeholder={`Keterangan ${index + 1}`}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRemoveKeterangan(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  ), [formData, employeeOpen, employeeSearch, filteredEmployees, handleAddKeterangan, handleRemoveKeterangan, handleSelectEmployee]);
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ijazah</p>
                <p className="text-2xl font-bold">{stats.ijazah}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Satya Lencana</p>
                <p className="text-2xl font-bold">{stats.satyaLencana}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Distribusi</p>
                <p className="text-2xl font-bold">{distribusi.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per Satker Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik per Satuan Kerja</CardTitle>
          <CardDescription>Ringkasan distribusi dokumen per satuan kerja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Satuan Kerja</TableHead>
                  <TableHead className="text-center">Ijazah</TableHead>
                  <TableHead className="text-center">Satya Lencana</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.bySatker.map((stat) => (
                  <TableRow key={stat.satker}>
                    <TableCell className="font-medium">{stat.satker}</TableCell>
                    <TableCell className="text-center">{stat.ijazah}</TableCell>
                    <TableCell className="text-center">{stat.satyaLencana}</TableCell>
                    <TableCell className="text-center font-semibold">{stat.ijazah + stat.satyaLencana}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Main Data Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Database Distribusi Surat</CardTitle>
              <CardDescription>Data distribusi ijazah dan satya lencana ke satuan kerja</CardDescription>
            </div>
            {canEdit && (
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => { setFormData({ ...formData, jenis_dokumen: activeJenis }); setShowAddDialog(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Data
                </Button>
                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
                <label>
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel
                    </span>
                  </Button>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importFromExcel} />
                </label>
                {isAdmin && (
                  <Button variant="destructive" onClick={handleDeleteAll}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Semua
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tabs for Ijazah / Satya Lencana */}
          <Tabs value={activeJenis} onValueChange={setActiveJenis}>
            <TabsList>
              <TabsTrigger value="Ijazah" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                Ijazah
              </TabsTrigger>
              <TabsTrigger value="Satya Lencana" className="gap-2">
                <Award className="w-4 h-4" />
                Satya Lencana
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs">Cari Nama/Jabatan</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Filter Satuan Kerja</Label>
              <Select value={filterSatker} onValueChange={setFilterSatker}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Satker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Satuan Kerja</SelectItem>
                  {SATUAN_KERJA_OPTIONS.map((satker) => (
                    <SelectItem key={satker} value={satker}>{satker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Satuan Kerja</TableHead>
                  <TableHead>Tanggal Distribusi</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Belum ada data distribusi {activeJenis.toLowerCase()}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama_pegawai}</TableCell>
                      <TableCell>{item.jabatan}</TableCell>
                      <TableCell>{item.satuan_kerja}</TableCell>
                      <TableCell>{format(new Date(item.tanggal_distribusi), "dd MMM yyyy", { locale: id })}</TableCell>
                      <TableCell>{item.nomor_kontak || "-"}</TableCell>
                      <TableCell>
                        {item.keterangan && item.keterangan.length > 0 
                          ? item.keterangan.join(", ") 
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => generateReceipt(item)}
                            title="Generate Tanda Terima"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) resetForm(); setShowAddDialog(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Data Distribusi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields(false)}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Simpan</Button>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { resetForm(); setSelectedItem(null); } setShowEditDialog(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Distribusi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            {renderFormFields(true)}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Simpan Perubahan</Button>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setSelectedItem(null); setShowEditDialog(false); }}>Batal</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
