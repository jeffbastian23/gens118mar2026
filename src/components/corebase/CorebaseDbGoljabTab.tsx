import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import { ExcelToolbar, exportToExcel } from "./CorebaseExcelUtils";

const GOLONGAN_PANGKAT_MAP: Record<string, string> = {
  "I/a": "Juru Muda",
  "I/b": "Juru Muda Tingkat I",
  "I/c": "Juru",
  "I/d": "Juru Tingkat I",
  "II/a": "Pengatur Muda",
  "II/b": "Pengatur Muda Tingkat I",
  "II/c": "Pengatur",
  "II/d": "Pengatur Tingkat I",
  "III/a": "Penata Muda",
  "III/b": "Penata Muda Tingkat I",
  "III/c": "Penata",
  "III/d": "Penata Tingkat I",
  "IV/a": "Pembina",
  "IV/b": "Pembina Tingkat I",
  "IV/c": "Pembina Muda",
  "IV/d": "Pembina Madya",
  "IV/e": "Pembina Utama",
};

const GOLONGAN_OPTIONS = Object.keys(GOLONGAN_PANGKAT_MAP);
const PANGKAT_OPTIONS = Object.values(GOLONGAN_PANGKAT_MAP);
import { fetchAllRows, cleanNama, cleanNip } from "./CorebaseFetchUtils";

/**
 * Convert jabatan to jabatan konversi based on rules
 */
function convertJabatan(jabatan: string | null): string {
  if (!jabatan) return "-";
  const j = jabatan.trim();

  // Pelaksana-level keywords
  const pelaksanaKeywords = [
    "Pawang Anjing Pelacak",
    "Instruktur Anjing Pelacak",
    "Sekretaris Eselon",
    "Pelaksana Tugas Belajar",
    "Pengadministrasi Perkantoran",
    "Pengolah Data dan Informasi",
    "Penata Layanan Operasional",
  ];
  for (const keyword of pelaksanaKeywords) {
    if (j.startsWith(keyword) || j.includes(keyword)) return "Pelaksana";
  }

  // Pemeriksa Bea Cukai conversions - order matters (check more specific first)
  if (j.includes("Madya") || j.includes("Ahli Madya")) return "Pemeriksa Bea Cukai Madya";
  if (j.includes("Muda") || j.includes("Ahli Muda")) return "Pemeriksa Bea Cukai Muda";
  if (j.includes("Pertama") || j.includes("Ahli Pertama")) return "Pemeriksa Bea Cukai Pertama";
  if (j.includes("Pelaksana Lanjutan") || j.includes("Mahir")) return "Pemeriksa Bea Cukai Mahir";
  if (j.includes("Pelaksana") || j.includes("Terampil")) return "Pemeriksa Bea Cukai Terampil";

  return j;
}

interface CorebaseDbGoljab {
  id: string;
  nama: string;
  nip: string;
  golongan: string | null;
  pangkat: string | null;
  jabatan: string | null;
  unit: string | null;
  satuan_kerja: string | null;
  created_at: string;
}

interface CorebaseDbGoljabTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseDbGoljabTab({ isAdmin, canEdit }: CorebaseDbGoljabTabProps) {
  const [data, setData] = useState<CorebaseDbGoljab[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGolongan, setFilterGolongan] = useState("");
  const [filterPangkat, setFilterPangkat] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterJabatanKonversi, setFilterJabatanKonversi] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterSatuanKerja, setFilterSatuanKerja] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CorebaseDbGoljab | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    golongan: "",
    pangkat: "",
    jabatan: "",
    unit: "",
    satuan_kerja: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await fetchAllRows<CorebaseDbGoljab>("corebase_db_goljab" as any, "nama", true);
      setData(result);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data DB Goljab");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      let synced = 0;
      for (const item of data) {
        const cleanedNama = cleanNama(item.nama);
        const cleanedNip = cleanNip(item.nip);
        const updates: any = {};
        if (cleanedNama !== item.nama) updates.nama = cleanedNama;
        if (cleanedNip !== item.nip) updates.nip = cleanedNip;

        // Auto-fill pangkat from golongan
        if (item.golongan && GOLONGAN_PANGKAT_MAP[item.golongan]) {
          const expectedPangkat = GOLONGAN_PANGKAT_MAP[item.golongan];
          if (expectedPangkat !== item.pangkat) updates.pangkat = expectedPangkat;
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await (supabase.from("corebase_db_goljab" as any) as any).update(updates).eq("id", item.id);
          if (!error) synced++;
        }
      }
      toast.success(`Sync selesai! ${synced} data diperbarui.`);
      await fetchData();
    } catch (error: any) {
      console.error("Sync error:", error);
      toast.error("Gagal melakukan sync");
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        nama: formData.nama,
        nip: formData.nip,
        golongan: formData.golongan || null,
        pangkat: formData.pangkat || null,
        jabatan: formData.jabatan || null,
        unit: formData.unit || null,
        satuan_kerja: formData.satuan_kerja || null,
      };

      if (editingItem) {
        const { error } = await (supabase.from("corebase_db_goljab" as any) as any)
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await (supabase.from("corebase_db_goljab" as any) as any).insert(payload);
        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleEdit = (item: CorebaseDbGoljab) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nip: item.nip,
      golongan: item.golongan || "",
      pangkat: item.pangkat || "",
      jabatan: item.jabatan || "",
      unit: item.unit || "",
      satuan_kerja: item.satuan_kerja || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const { error } = await (supabase.from("corebase_db_goljab" as any) as any).delete().eq("id", id);
      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({ nama: "", nip: "", golongan: "", pangkat: "", jabatan: "", unit: "", satuan_kerja: "" });
  };

  const handleExport = () => {
    const columns = [
      { key: "nama", label: "Nama" },
      { key: "nip", label: "NIP" },
      { key: "golongan", label: "Golongan" },
      { key: "pangkat", label: "Pangkat" },
      { key: "jabatan", label: "Jabatan" },
      { key: "jabatan_konversi", label: "Jabatan (Konversi)" },
      { key: "unit", label: "Unit" },
      { key: "satuan_kerja", label: "Satuan Kerja" },
    ];
    const exportData = filteredData.map(item => ({
      ...item,
      jabatan_konversi: convertJabatan(item.jabatan),
    }));
    exportToExcel(exportData, columns, "db_goljab");
  };

  const handleImport = async (jsonData: any[]) => {
    try {
      const records = jsonData.map((row) => ({
        nama: row["Nama"] || "",
        nip: String(row["NIP"] || ""),
        golongan: row["Golongan"] || null,
        pangkat: row["Pangkat"] || null,
        jabatan: row["Jabatan"] || null,
        unit: row["Unit"] || null,
        satuan_kerja: row["Satuan Kerja"] || null,
      }));
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await (supabase.from("corebase_db_goljab" as any) as any).insert(batch);
        if (error) throw error;
      }
      toast.success(`${records.length} data berhasil diimpor`);
      fetchData();
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error("Gagal mengimpor data: " + (error.message || ""));
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await (supabase.from("corebase_db_goljab" as any) as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus semua data");
    }
  };

  // Get unique values for filters
  const uniqueGolongan = [...new Set(data.map(d => d.golongan).filter(Boolean))] as string[];
  const uniquePangkat = [...new Set(data.map(d => d.pangkat).filter(Boolean))] as string[];
  const uniqueJabatan = [...new Set(data.map(d => d.jabatan).filter(Boolean))] as string[];
  const uniqueJabatanKonversi = [...new Set(data.map(d => convertJabatan(d.jabatan)).filter(v => v !== "-"))] as string[];
  const uniqueUnit = [...new Set(data.map(d => d.unit).filter(Boolean))] as string[];
  const uniqueSatuanKerja = [...new Set(data.map(d => d.satuan_kerja).filter(Boolean))] as string[];

  const filteredData = data.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.nip.includes(searchTerm);
    if (!matchSearch) return false;
    if (filterGolongan && filterGolongan !== "all" && item.golongan !== filterGolongan) return false;
    if (filterPangkat && filterPangkat !== "all" && item.pangkat !== filterPangkat) return false;
    if (filterJabatan && filterJabatan !== "all" && item.jabatan !== filterJabatan) return false;
    if (filterJabatanKonversi && filterJabatanKonversi !== "all" && convertJabatan(item.jabatan) !== filterJabatanKonversi) return false;
    if (filterUnit && filterUnit !== "all" && item.unit !== filterUnit) return false;
    if (filterSatuanKerja && filterSatuanKerja !== "all" && item.satuan_kerja !== filterSatuanKerja) return false;
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            DB Goljab
            <Badge variant="secondary" className="ml-2">Total: {data.length}</Badge>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync"}
              </Button>
            )}
            <ExcelToolbar
              onExport={handleExport}
              onImport={handleImport}
              onDeleteAll={handleDeleteAll}
              canEdit={canEdit}
              tableName="DB Goljab"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama/NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Data" : "Tambah Data Baru"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama *</Label>
                      <Input value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>NIP *</Label>
                      <Input value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Golongan</Label>
                      <Select value={formData.golongan} onValueChange={(val) => setFormData({ ...formData, golongan: val, pangkat: GOLONGAN_PANGKAT_MAP[val] || formData.pangkat })}>
                        <SelectTrigger><SelectValue placeholder="Pilih Golongan" /></SelectTrigger>
                        <SelectContent>
                          {GOLONGAN_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pangkat</Label>
                      <Select value={formData.pangkat} onValueChange={(val) => setFormData({ ...formData, pangkat: val })}>
                        <SelectTrigger><SelectValue placeholder="Pilih Pangkat" /></SelectTrigger>
                        <SelectContent>
                          {PANGKAT_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Jabatan</Label>
                      <Input value={formData.jabatan} onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Satuan Kerja</Label>
                      <Input value={formData.satuan_kerja} onChange={(e) => setFormData({ ...formData, satuan_kerja: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleSubmit}>Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Row */}
        <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-muted/30 rounded-lg border">
          <div className="space-y-1">
            <Label className="text-xs">Golongan</Label>
            <Select value={filterGolongan} onValueChange={setFilterGolongan}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueGolongan.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pangkat</Label>
            <Select value={filterPangkat} onValueChange={setFilterPangkat}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniquePangkat.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jabatan</Label>
            <Select value={filterJabatan} onValueChange={setFilterJabatan}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueJabatan.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jabatan (Konversi)</Label>
            <Select value={filterJabatanKonversi} onValueChange={setFilterJabatanKonversi}>
              <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueJabatanKonversi.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit</Label>
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueUnit.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Satuan Kerja</Label>
            <Select value={filterSatuanKerja} onValueChange={setFilterSatuanKerja}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueSatuanKerja.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterGolongan(""); setFilterPangkat(""); setFilterJabatan(""); setFilterJabatanKonversi(""); setFilterUnit(""); setFilterSatuanKerja(""); }}>
            Reset Filter
          </Button>
          <Badge variant="outline" className="h-8 flex items-center text-xs">Hasil: {filteredData.length}</Badge>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Golongan</TableHead>
                <TableHead>Pangkat</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Jabatan (Konversi)</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Satuan Kerja</TableHead>
                {canEdit && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={canEdit ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                    <TableCell>{item.golongan || "-"}</TableCell>
                    <TableCell>{item.pangkat || "-"}</TableCell>
                    <TableCell>{item.jabatan || "-"}</TableCell>
                    <TableCell>{convertJabatan(item.jabatan)}</TableCell>
                    <TableCell>{item.unit || "-"}</TableCell>
                    <TableCell>{item.satuan_kerja || "-"}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
