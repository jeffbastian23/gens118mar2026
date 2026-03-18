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
import { Users, Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ExcelToolbar, exportToExcel } from "./CorebaseExcelUtils";
import { fetchAllRows, cleanNama, cleanNip } from "./CorebaseFetchUtils";

interface CorebaseDbPensiun {
  id: string;
  nama: string;
  nip: string;
  tgl_lahir: string | null;
  kode_jabatan: string | null;
  eselon_jenjang: string | null;
  bup: number | null;
  tmt_pensiun: string | null;
  created_at: string;
}

interface CorebaseDbPensiunTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseDbPensiunTab({ isAdmin, canEdit }: CorebaseDbPensiunTabProps) {
  const [data, setData] = useState<CorebaseDbPensiun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUsiaMin, setFilterUsiaMin] = useState("");
  const [filterUsiaMax, setFilterUsiaMax] = useState("");
  const [filterTglLahirMin, setFilterTglLahirMin] = useState("");
  const [filterTglLahirMax, setFilterTglLahirMax] = useState("");
  const [filterEselon, setFilterEselon] = useState("");
  const [filterBup, setFilterBup] = useState("");
  const [filterTmtPensiunMin, setFilterTmtPensiunMin] = useState("");
  const [filterTmtPensiunMax, setFilterTmtPensiunMax] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CorebaseDbPensiun | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    tgl_lahir: "",
    kode_jabatan: "",
    eselon_jenjang: "",
    bup: "58",
    tmt_pensiun: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await fetchAllRows<CorebaseDbPensiun>("corebase_db_pensiun", "nama", true);
      setData(result);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data DB Pensiun");
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

        // Auto-calculate BUP and TMT Pensiun based on eselon_jenjang
        if (item.eselon_jenjang) {
          const newBup = determineBup(item.eselon_jenjang);
          if (newBup !== item.bup) updates.bup = newBup;
          if (item.tgl_lahir) {
            const newTmt = calculateTmtPensiun(item.tgl_lahir, newBup);
            if (newTmt && newTmt !== item.tmt_pensiun) updates.tmt_pensiun = newTmt;
          }
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("corebase_db_pensiun").update(updates).eq("id", item.id);
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

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const determineBup = (eselonJenjang: string): number => {
    if (eselonJenjang.toLowerCase().includes("utama")) return 65;
    if (eselonJenjang.toLowerCase().includes("madya") || eselonJenjang.toLowerCase().includes("jpt")) return 60;
    return 58;
  };

  const calculateTmtPensiun = (tglLahir: string | null, bup: number): string => {
    if (!tglLahir) return "";
    const birth = new Date(tglLahir);
    // TMT Pensiun = tanggal 1 bulan berikutnya setelah usia mencapai BUP
    const pensiunDate = new Date(birth.getFullYear() + bup, birth.getMonth() + 1, 1);
    return `${pensiunDate.getFullYear()}-${String(pensiunDate.getMonth() + 1).padStart(2, "0")}-01`;
  };

  const handleSubmit = async () => {
    try {
      const bupValue = formData.eselon_jenjang ? determineBup(formData.eselon_jenjang) : parseInt(formData.bup) || 58;
      const autoTmtPensiun = calculateTmtPensiun(formData.tgl_lahir || null, bupValue);

      const payload = {
        nama: formData.nama,
        nip: formData.nip,
        tgl_lahir: formData.tgl_lahir || null,
        kode_jabatan: formData.kode_jabatan || null,
        eselon_jenjang: formData.eselon_jenjang || null,
        bup: bupValue,
        tmt_pensiun: formData.tmt_pensiun || autoTmtPensiun || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("corebase_db_pensiun")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase.from("corebase_db_pensiun").insert(payload);
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

  const handleEdit = (item: CorebaseDbPensiun) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nip: item.nip,
      tgl_lahir: item.tgl_lahir || "",
      kode_jabatan: item.kode_jabatan || "",
      eselon_jenjang: item.eselon_jenjang || "",
      bup: item.bup?.toString() || "58",
      tmt_pensiun: item.tmt_pensiun || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const { error } = await supabase.from("corebase_db_pensiun").delete().eq("id", id);
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
      tgl_lahir: "",
      kode_jabatan: "",
      eselon_jenjang: "",
      bup: "58",
      tmt_pensiun: "",
    });
  };

  const handleExport = () => {
    const columns = [
      { key: "nama", label: "Nama" },
      { key: "nip", label: "NIP" },
      { key: "tgl_lahir", label: "Tanggal Lahir" },
      { key: "kode_jabatan", label: "Kode Jabatan" },
      { key: "eselon_jenjang", label: "Eselon/Jenjang" },
      { key: "bup", label: "BUP" },
      { key: "tmt_pensiun", label: "TMT Pensiun" },
    ];
    exportToExcel(data, columns, "db_pensiun");
  };

  const handleImport = async (jsonData: any[]) => {
    try {
      const records = jsonData.map((row) => ({
        nama: row["Nama"] || "",
        nip: String(row["NIP"] || ""),
        tgl_lahir: row["Tanggal Lahir"] || null,
        kode_jabatan: row["Kode Jabatan"] || null,
        eselon_jenjang: row["Eselon/Jenjang"] || null,
        bup: parseInt(row["BUP"]) || 58,
        tmt_pensiun: row["TMT Pensiun"] || null,
      }));
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("corebase_db_pensiun").insert(batch);
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
      const { error } = await supabase.from("corebase_db_pensiun").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus semua data");
    }
  };

  const [filterUsiaColor, setFilterUsiaColor] = useState("");

  const filteredData = data.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.nip.includes(searchTerm);
    if (!matchSearch) return false;

    const age = calculateAge(item.tgl_lahir);
    if (filterUsiaMin && (age === null || age < parseInt(filterUsiaMin))) return false;
    if (filterUsiaMax && (age === null || age > parseInt(filterUsiaMax))) return false;

    if (filterTglLahirMin && (!item.tgl_lahir || item.tgl_lahir < filterTglLahirMin)) return false;
    if (filterTglLahirMax && (!item.tgl_lahir || item.tgl_lahir > filterTglLahirMax)) return false;

    if (filterEselon && filterEselon !== "all" && item.eselon_jenjang !== filterEselon) return false;
    if (filterBup && filterBup !== "all" && item.bup !== parseInt(filterBup)) return false;

    if (filterTmtPensiunMin && (!item.tmt_pensiun || item.tmt_pensiun < filterTmtPensiunMin)) return false;
    if (filterTmtPensiunMax && (!item.tmt_pensiun || item.tmt_pensiun > filterTmtPensiunMax)) return false;

    // Color filter: red = near retirement (BUP - age <= 2 & age < BUP), gray = already past BUP
    if (filterUsiaColor === "merah") {
      const isNear = age !== null && item.bup !== null && (item.bup - age) <= 2 && age < item.bup;
      if (!isNear) return false;
    }
    if (filterUsiaColor === "abu") {
      const isPast = age !== null && item.bup !== null && age >= item.bup;
      if (!isPast) return false;
    }

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
            <Users className="h-5 w-5" />
            DB Pensiun
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
              tableName="DB Pensiun"
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
                      <Label>Tanggal Lahir</Label>
                      <Input
                        type="date"
                        value={formData.tgl_lahir}
                        onChange={(e) => {
                          const newTglLahir = e.target.value;
                          const bup = parseInt(formData.bup) || 58;
                          const newTmt = calculateTmtPensiun(newTglLahir, bup);
                          setFormData({ ...formData, tgl_lahir: newTglLahir, tmt_pensiun: newTmt });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kode Jabatan</Label>
                      <Input
                        value={formData.kode_jabatan}
                        onChange={(e) => setFormData({ ...formData, kode_jabatan: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Eselon/Jenjang</Label>
                      <Select
                        value={formData.eselon_jenjang}
                        onValueChange={(v) => {
                          const newBup = determineBup(v);
                          const newTmt = calculateTmtPensiun(formData.tgl_lahir, newBup);
                          setFormData({ ...formData, eselon_jenjang: v, bup: newBup.toString(), tmt_pensiun: newTmt });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih eselon/jenjang" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pelaksana">Pelaksana (BUP 58)</SelectItem>
                          <SelectItem value="Fungsional Ahli Pertama">Fungsional Ahli Pertama (BUP 58)</SelectItem>
                          <SelectItem value="Fungsional Ahli Muda">Fungsional Ahli Muda (BUP 58)</SelectItem>
                          <SelectItem value="Fungsional Ahli Madya">Fungsional Ahli Madya (BUP 60)</SelectItem>
                          <SelectItem value="Fungsional Ahli Utama">Fungsional Ahli Utama (BUP 65)</SelectItem>
                          <SelectItem value="Pejabat Pengawas">Pejabat Pengawas (BUP 58)</SelectItem>
                          <SelectItem value="Pejabat Administrator">Pejabat Administrator (BUP 58)</SelectItem>
                          <SelectItem value="JPT Pratama">JPT Pratama (BUP 60)</SelectItem>
                          <SelectItem value="JPT Madya">JPT Madya (BUP 60)</SelectItem>
                          <SelectItem value="JPT Utama">JPT Utama (BUP 65)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>BUP (Batas Usia Pensiun)</Label>
                      <Input
                        type="number"
                        value={formData.bup}
                        onChange={(e) => setFormData({ ...formData, bup: e.target.value })}
                        disabled
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>TMT Pensiun</Label>
                      <Input
                        type="date"
                        value={formData.tmt_pensiun}
                        onChange={(e) => setFormData({ ...formData, tmt_pensiun: e.target.value })}
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
            <Label className="text-xs">Usia (Min-Max)</Label>
            <div className="flex gap-1">
              <Input type="number" placeholder="Min" value={filterUsiaMin} onChange={(e) => setFilterUsiaMin(e.target.value)} className="w-16 h-8 text-xs" />
              <Input type="number" placeholder="Max" value={filterUsiaMax} onChange={(e) => setFilterUsiaMax(e.target.value)} className="w-16 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tgl Lahir (Range)</Label>
            <div className="flex gap-1">
              <Input type="date" value={filterTglLahirMin} onChange={(e) => setFilterTglLahirMin(e.target.value)} className="w-32 h-8 text-xs" />
              <Input type="date" value={filterTglLahirMax} onChange={(e) => setFilterTglLahirMax(e.target.value)} className="w-32 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Eselon/Jenjang</Label>
            <Select value={filterEselon} onValueChange={setFilterEselon}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="Pelaksana">Pelaksana</SelectItem>
                <SelectItem value="Fungsional Ahli Pertama">Ahli Pertama</SelectItem>
                <SelectItem value="Fungsional Ahli Muda">Ahli Muda</SelectItem>
                <SelectItem value="Fungsional Ahli Madya">Ahli Madya</SelectItem>
                <SelectItem value="Fungsional Ahli Utama">Ahli Utama</SelectItem>
                <SelectItem value="Pejabat Pengawas">Pejabat Pengawas</SelectItem>
                <SelectItem value="Pejabat Administrator">Pejabat Administrator</SelectItem>
                <SelectItem value="JPT Pratama">JPT Pratama</SelectItem>
                <SelectItem value="JPT Madya">JPT Madya</SelectItem>
                <SelectItem value="JPT Utama">JPT Utama</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">BUP</Label>
            <Select value={filterBup} onValueChange={setFilterBup}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="58">58</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="65">65</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">TMT Pensiun (Range)</Label>
            <div className="flex gap-1">
              <Input type="date" value={filterTmtPensiunMin} onChange={(e) => setFilterTmtPensiunMin(e.target.value)} className="w-32 h-8 text-xs" />
              <Input type="date" value={filterTmtPensiunMax} onChange={(e) => setFilterTmtPensiunMax(e.target.value)} className="w-32 h-8 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Warna Usia</Label>
            <Select value={filterUsiaColor} onValueChange={setFilterUsiaColor}>
              <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="merah">🔴 Mendekati Pensiun</SelectItem>
                <SelectItem value="abu">⚫ Sudah Pensiun</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterUsiaMin(""); setFilterUsiaMax(""); setFilterTglLahirMin(""); setFilterTglLahirMax(""); setFilterEselon(""); setFilterBup(""); setFilterTmtPensiunMin(""); setFilterTmtPensiunMax(""); setFilterUsiaColor(""); }}>
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
                <TableHead>Tgl Lahir</TableHead>
                <TableHead className="text-center">Usia</TableHead>
                <TableHead>Kode Jabatan</TableHead>
                <TableHead>Eselon/Jenjang</TableHead>
                <TableHead className="text-center">BUP</TableHead>
                <TableHead>TMT Pensiun</TableHead>
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
                filteredData.map((item, index) => {
                  const age = calculateAge(item.tgl_lahir);
                  const isNearRetirement = age !== null && item.bup !== null && (item.bup - age) <= 2;
                  const isRetired = age !== null && item.bup !== null && age >= item.bup;
                  return (
                    <TableRow key={item.id} className={isNearRetirement ? (isRetired ? "bg-gray-100 dark:bg-gray-800/50" : "bg-red-50 dark:bg-red-950/30") : ""}>
                      <TableCell className="font-mono">{index + 1}</TableCell>
                      <TableCell className={`font-medium ${isNearRetirement ? (isRetired ? "text-muted-foreground" : "text-red-600 dark:text-red-400 font-semibold") : ""}`}>{item.nama}</TableCell>
                      <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                      <TableCell>
                        {item.tgl_lahir ? format(new Date(item.tgl_lahir), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isNearRetirement ? "destructive" : "outline"}>
                          {age ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.kode_jabatan || "-"}</TableCell>
                      <TableCell>{item.eselon_jenjang || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{item.bup ?? 58}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.tmt_pensiun ? format(new Date(item.tmt_pensiun), "dd/MM/yyyy") : "-"}
                      </TableCell>
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
