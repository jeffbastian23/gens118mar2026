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
import { MapPin, Plus, Pencil, Trash2, Search, Info, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ExcelToolbar, exportToExcel } from "./CorebaseExcelUtils";
import { fetchAllRows, cleanNama, cleanNip } from "./CorebaseFetchUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CorebaseDbRekamJejak {
  id: string;
  nama: string;
  nip: string;
  nama_satker: string | null;
  unit_es_iii: string | null;
  unit_es_iv: string | null;
  jenis: string | null;
  es_jenjang_jp: string | null;
  nama_jab_sub_unsur: string | null;
  tmt_satker: string | null;
  durasi_satker: string | null;
  created_at: string;
}

interface CorebaseDbRekamJejakTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseDbRekamJejakTab({ isAdmin, canEdit }: CorebaseDbRekamJejakTabProps) {
  const [data, setData] = useState<CorebaseDbRekamJejak[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CorebaseDbRekamJejak | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    nama_satker: "",
    unit_es_iii: "",
    unit_es_iv: "",
    jenis: "",
    kategori: "",
    es_jenjang_jp: "",
    nama_jab_sub_unsur: "",
    tmt_satker: "",
    durasi_satker: "",
  });

  const [syncing, setSyncing] = useState(false);
  const [filterUnitEsIII, setFilterUnitEsIII] = useState("");
  const [filterUnitEsIV, setFilterUnitEsIV] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterEsJenjangJP, setFilterEsJenjangJP] = useState("");

  // Get unique values for filters
  const uniqueUnitEsIII = [...new Set(data.map(d => d.unit_es_iii).filter(Boolean))] as string[];
  const uniqueUnitEsIV = [...new Set(data.map(d => d.unit_es_iv).filter(Boolean))] as string[];
  const uniqueJenisValues = [...new Set(data.map(d => d.jenis).filter(Boolean))] as string[];
  const uniqueEsJenjangJP = [...new Set(data.map(d => d.es_jenjang_jp).filter(Boolean))] as string[];

  const filteredData = data.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.nip.includes(searchTerm);
    if (!matchSearch) return false;
    if (filterUnitEsIII && filterUnitEsIII !== "all" && item.unit_es_iii !== filterUnitEsIII) return false;
    if (filterUnitEsIV && filterUnitEsIV !== "all" && item.unit_es_iv !== filterUnitEsIV) return false;
    if (filterJenis && filterJenis !== "all" && item.jenis !== filterJenis) return false;
    if (filterEsJenjangJP && filterEsJenjangJP !== "all" && item.es_jenjang_jp !== filterEsJenjangJP) return false;
    return true;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await fetchAllRows<CorebaseDbRekamJejak>("corebase_db_rekam_jejak", "nama", true);
      setData(result);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data DB Rekam Jejak");
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
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("corebase_db_rekam_jejak").update(updates).eq("id", item.id);
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
        nama_satker: formData.nama_satker || null,
        unit_es_iii: formData.unit_es_iii || null,
        unit_es_iv: formData.unit_es_iv || null,
        jenis: formData.jenis || null,
        es_jenjang_jp: formData.es_jenjang_jp || null,
        nama_jab_sub_unsur: formData.nama_jab_sub_unsur || null,
        tmt_satker: formData.tmt_satker || null,
        durasi_satker: formData.durasi_satker || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("corebase_db_rekam_jejak")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase.from("corebase_db_rekam_jejak").insert(payload);
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

  const handleEdit = (item: CorebaseDbRekamJejak) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nip: item.nip,
      nama_satker: item.nama_satker || "",
      unit_es_iii: item.unit_es_iii || "",
      unit_es_iv: item.unit_es_iv || "",
      jenis: item.jenis || "",
      kategori: (item as any).kategori || "",
      es_jenjang_jp: item.es_jenjang_jp || "",
      nama_jab_sub_unsur: item.nama_jab_sub_unsur || "",
      tmt_satker: item.tmt_satker || "",
      durasi_satker: item.durasi_satker || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const { error } = await supabase.from("corebase_db_rekam_jejak").delete().eq("id", id);
      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      nama: "",
      nip: "",
      nama_satker: "",
      unit_es_iii: "",
      unit_es_iv: "",
      jenis: "",
      kategori: "",
      es_jenjang_jp: "",
      nama_jab_sub_unsur: "",
      tmt_satker: "",
      durasi_satker: "",
    });
  };

  // Mapping Jenis ke Kategori
  const JENIS_KATEGORI_MAP: Record<string, { options: string[]; description: string }> = {
    "JMPT": { 
      options: ["II.a", "II.b"], 
      description: "Jabatan Manajerial-Pimpinan Tinggi (JMPT)" 
    },
    "JMA": { 
      options: ["III.a", "III.b"], 
      description: "Jabatan Manajerial-Administrator (JMA)" 
    },
    "JMP": { 
      options: ["IV.a", "IV.b"], 
      description: "Jabatan Manajerial-Pengawas (JMP)" 
    },
    "JNMFA": { 
      options: ["Utama", "Madya", "Muda", "Pertama"], 
      description: "Jabatan non Manajerial-Fungsional Keahlian (JNMFA)" 
    },
    "JNMFT": { 
      options: ["Penyelia", "Mahir", "Terampil", "Pemula"], 
      description: "Jabatan non Manajerial-Fungsional Keterampilan (JNMFT)" 
    },
    "JNMP": { 
      options: ["PU", "PK", "PTB", "PAKP", "PPAP"], 
      description: "Jabatan non Manajerial-Pelaksana (JNMP)" 
    },
  };

  const jenisOptions = ["JMPT", "JMA", "JMP", "JNMFA", "JNMFT", "JNMP"];
  const esJenjangOptions = ["Eselon", "Fungsional", "Pelaksana PU", "PTB", "PK"];

  const handleExport = () => {
    const columns = [
      { key: "nama", label: "Nama" },
      { key: "nip", label: "NIP" },
      { key: "nama_satker", label: "Nama Satker" },
      { key: "unit_es_iii", label: "Unit Es III" },
      { key: "unit_es_iv", label: "Unit Es IV" },
      { key: "jenis", label: "Jenis" },
      { key: "kategori", label: "Kategori" },
      { key: "es_jenjang_jp", label: "Es/Jenjang/JP" },
      { key: "nama_jab_sub_unsur", label: "Nama Jab/Sub Unsur" },
      { key: "tmt_satker", label: "TMT Satker" },
      { key: "durasi_satker", label: "Durasi Satker" },
    ];
    exportToExcel(data, columns, "db_rekam_jejak");
  };

  const handleImport = async (jsonData: any[]) => {
    try {
      const records = jsonData.map((row) => ({
        nama: String(row["Nama"] || ""),
        nip: String(row["NIP"] || "").replace(/^'/, ""),
        nama_satker: row["Nama Satker"] || null,
        unit_es_iii: row["Unit Es III"] || null,
        unit_es_iv: row["Unit Es IV"] || null,
        jenis: row["Jenis"] || null,
        es_jenjang_jp: row["Es/Jenjang/JP"] || null,
        nama_jab_sub_unsur: row["Nama Jab/Sub Unsur"] || null,
        tmt_satker: row["TMT Satker"] || null,
        durasi_satker: row["Durasi Satker"] ? String(row["Durasi Satker"]) : null,
      }));
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("corebase_db_rekam_jejak").insert(batch);
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
      const { error } = await supabase.from("corebase_db_rekam_jejak").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus semua data");
    }
  };

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
            <MapPin className="h-5 w-5" />
            DB Rekam Jejak
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
              tableName="DB Rekam Jejak"
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? "Edit Data" : "Tambah Data Baru"}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Nama *</Label>
                      <Input
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NIP *</Label>
                      <Input
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Satker</Label>
                      <Input
                        value={formData.nama_satker}
                        onChange={(e) => setFormData({ ...formData, nama_satker: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Es III</Label>
                      <Input
                        value={formData.unit_es_iii}
                        onChange={(e) => setFormData({ ...formData, unit_es_iii: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Es IV</Label>
                      <Input
                        value={formData.unit_es_iv}
                        onChange={(e) => setFormData({ ...formData, unit_es_iv: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Jenis</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="font-semibold mb-2">Keterangan Jenis:</p>
                              <ul className="text-sm space-y-1">
                                <li><strong>JMPT</strong>: Jabatan Manajerial-Pimpinan Tinggi</li>
                                <li><strong>JMA</strong>: Jabatan Manajerial-Administrator</li>
                                <li><strong>JMP</strong>: Jabatan Manajerial-Pengawas</li>
                                <li><strong>JNMFA</strong>: Jabatan non Manajerial-Fungsional Keahlian</li>
                                <li><strong>JNMFT</strong>: Jabatan non Manajerial-Fungsional Keterampilan</li>
                                <li><strong>JNMP</strong>: Jabatan non Manajerial-Pelaksana</li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select value={formData.jenis} onValueChange={(v) => setFormData({ ...formData, jenis: v, kategori: "" })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          {jenisOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.jenis && JENIS_KATEGORI_MAP[formData.jenis] && (
                      <div className="space-y-2">
                        <Label>Kategori ({JENIS_KATEGORI_MAP[formData.jenis].description})</Label>
                        <Select value={formData.kategori} onValueChange={(v) => setFormData({ ...formData, kategori: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {JENIS_KATEGORI_MAP[formData.jenis].options.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Es/Jenjang/JP</Label>
                      <Select value={formData.es_jenjang_jp} onValueChange={(v) => setFormData({ ...formData, es_jenjang_jp: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih opsi" />
                        </SelectTrigger>
                        <SelectContent>
                          {esJenjangOptions.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Jab/Sub Unsur</Label>
                      <Input
                        value={formData.nama_jab_sub_unsur}
                        onChange={(e) => setFormData({ ...formData, nama_jab_sub_unsur: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>TMT Satker</Label>
                      <Input
                        type="date"
                        value={formData.tmt_satker}
                        onChange={(e) => setFormData({ ...formData, tmt_satker: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durasi Satker</Label>
                      <Input
                        placeholder="Contoh: 2 tahun 3 bulan"
                        value={formData.durasi_satker}
                        onChange={(e) => setFormData({ ...formData, durasi_satker: e.target.value })}
                      />
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
            <Label className="text-xs">Unit Es III</Label>
            <Select value={filterUnitEsIII} onValueChange={setFilterUnitEsIII}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueUnitEsIII.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit Es IV</Label>
            <Select value={filterUnitEsIV} onValueChange={setFilterUnitEsIV}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueUnitEsIV.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jenis</Label>
            <Select value={filterJenis} onValueChange={setFilterJenis}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueJenisValues.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Es/Jenjang/JP</Label>
            <Select value={filterEsJenjangJP} onValueChange={setFilterEsJenjangJP}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {uniqueEsJenjangJP.sort().map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterUnitEsIII(""); setFilterUnitEsIV(""); setFilterJenis(""); setFilterEsJenjangJP(""); }}>
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
                <TableHead>Nama Satker</TableHead>
                <TableHead>Unit Es III</TableHead>
                <TableHead>Unit Es IV</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Es/Jenjang/JP</TableHead>
                <TableHead>Nama Jab</TableHead>
                <TableHead>TMT Satker</TableHead>
                <TableHead>Durasi</TableHead>
                {canEdit && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 12 : 11} className="text-center py-8 text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                    <TableCell>{item.nama_satker || "-"}</TableCell>
                    <TableCell>{item.unit_es_iii || "-"}</TableCell>
                    <TableCell>{item.unit_es_iv || "-"}</TableCell>
                    <TableCell>
                      {item.jenis ? <Badge variant="outline">{item.jenis}</Badge> : "-"}
                    </TableCell>
                    <TableCell>
                      {item.es_jenjang_jp ? <Badge variant="secondary">{item.es_jenjang_jp}</Badge> : "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={item.nama_jab_sub_unsur || ""}>
                      {item.nama_jab_sub_unsur || "-"}
                    </TableCell>
                    <TableCell>
                      {item.tmt_satker ? format(new Date(item.tmt_satker), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>{item.durasi_satker || "-"}</TableCell>
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
