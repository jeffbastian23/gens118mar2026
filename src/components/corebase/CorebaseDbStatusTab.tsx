import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileCheck, Plus, Pencil, Trash2, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { ExcelToolbar, exportToExcel } from "./CorebaseExcelUtils";
import { fetchAllRows, cleanNama, cleanNip } from "./CorebaseFetchUtils";

interface CorebaseDbStatus {
  id: string;
  nama: string;
  nip: string;
  status: string | null;
  flag_cltn: boolean | null;
  cltn_surat_izin_nomor: string | null;
  cltn_tgl_mulai: string | null;
  cltn_tgl_akhir: string | null;
  cltn_status_argo: string | null;
  flag_pemberhentian: boolean | null;
  pemberhentian_jenis: string | null;
  pemberhentian_no_skep: string | null;
  pemberhentian_tgl_skep: string | null;
  pemberhentian_tgl_diterima: string | null;
  pemberhentian_tgl_berlaku: string | null;
  pemberhentian_tindak_lanjut: string | null;
  flag_meninggal: boolean | null;
  meninggal_tgl: string | null;
  created_at: string;
}

interface CorebaseDbStatusTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseDbStatusTab({ isAdmin, canEdit }: CorebaseDbStatusTabProps) {
  const [data, setData] = useState<CorebaseDbStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCltn, setFilterCltn] = useState("");
  const [filterPemberhentian, setFilterPemberhentian] = useState("");
  const [filterMeninggal, setFilterMeninggal] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CorebaseDbStatus | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nip: "",
    status: "",
    flag_cltn: false,
    cltn_surat_izin_nomor: "",
    cltn_tgl_mulai: "",
    cltn_tgl_akhir: "",
    flag_pemberhentian: false,
    pemberhentian_jenis: "",
    pemberhentian_no_skep: "",
    pemberhentian_tgl_skep: "",
    pemberhentian_tgl_diterima: "",
    pemberhentian_tgl_berlaku: "",
    pemberhentian_tindak_lanjut: "",
    flag_meninggal: false,
    meninggal_tgl: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await fetchAllRows<CorebaseDbStatus>("corebase_db_status", "nama", true);
      setData(result);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data DB Status");
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
          const { error } = await supabase.from("corebase_db_status").update(updates).eq("id", item.id);
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

  const calculateCltnArgo = (endDate: string | null): { status: string; color: string } => {
    if (!endDate) return { status: "-", color: "" };
    const monthsRemaining = differenceInMonths(new Date(endDate), new Date());
    if (monthsRemaining <= 3) return { status: "Segera Berakhir", color: "bg-yellow-100 text-yellow-800" };
    if (monthsRemaining <= 6) return { status: "Mendekati Akhir", color: "bg-orange-100 text-orange-800" };
    return { status: "Aktif", color: "bg-green-100 text-green-800" };
  };

  const handleSubmit = async () => {
    try {
      const argoStatus = formData.flag_cltn ? calculateCltnArgo(formData.cltn_tgl_akhir).status : null;

      const payload = {
        nama: formData.nama,
        nip: formData.nip,
        status: formData.status || null,
        flag_cltn: formData.flag_cltn,
        cltn_surat_izin_nomor: formData.flag_cltn ? formData.cltn_surat_izin_nomor || null : null,
        cltn_tgl_mulai: formData.flag_cltn ? formData.cltn_tgl_mulai || null : null,
        cltn_tgl_akhir: formData.flag_cltn ? formData.cltn_tgl_akhir || null : null,
        cltn_status_argo: argoStatus,
        flag_pemberhentian: formData.flag_pemberhentian,
        pemberhentian_jenis: formData.flag_pemberhentian ? formData.pemberhentian_jenis || null : null,
        pemberhentian_no_skep: formData.flag_pemberhentian ? formData.pemberhentian_no_skep || null : null,
        pemberhentian_tgl_skep: formData.flag_pemberhentian ? formData.pemberhentian_tgl_skep || null : null,
        pemberhentian_tgl_diterima: formData.flag_pemberhentian ? formData.pemberhentian_tgl_diterima || null : null,
        pemberhentian_tgl_berlaku: formData.flag_pemberhentian ? formData.pemberhentian_tgl_berlaku || null : null,
        pemberhentian_tindak_lanjut: formData.flag_pemberhentian ? formData.pemberhentian_tindak_lanjut || null : null,
        flag_meninggal: formData.flag_meninggal,
        meninggal_tgl: formData.flag_meninggal ? formData.meninggal_tgl || null : null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("corebase_db_status")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase.from("corebase_db_status").insert(payload);
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

  const handleEdit = (item: CorebaseDbStatus) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      nip: item.nip,
      status: item.status || "",
      flag_cltn: item.flag_cltn || false,
      cltn_surat_izin_nomor: item.cltn_surat_izin_nomor || "",
      cltn_tgl_mulai: item.cltn_tgl_mulai || "",
      cltn_tgl_akhir: item.cltn_tgl_akhir || "",
      flag_pemberhentian: item.flag_pemberhentian || false,
      pemberhentian_jenis: item.pemberhentian_jenis || "",
      pemberhentian_no_skep: item.pemberhentian_no_skep || "",
      pemberhentian_tgl_skep: item.pemberhentian_tgl_skep || "",
      pemberhentian_tgl_diterima: item.pemberhentian_tgl_diterima || "",
      pemberhentian_tgl_berlaku: item.pemberhentian_tgl_berlaku || "",
      pemberhentian_tindak_lanjut: item.pemberhentian_tindak_lanjut || "",
      flag_meninggal: item.flag_meninggal || false,
      meninggal_tgl: item.meninggal_tgl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      const { error } = await supabase.from("corebase_db_status").delete().eq("id", id);
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
      status: "",
      flag_cltn: false,
      cltn_surat_izin_nomor: "",
      cltn_tgl_mulai: "",
      cltn_tgl_akhir: "",
      flag_pemberhentian: false,
      pemberhentian_jenis: "",
      pemberhentian_no_skep: "",
      pemberhentian_tgl_skep: "",
      pemberhentian_tgl_diterima: "",
      pemberhentian_tgl_berlaku: "",
      pemberhentian_tindak_lanjut: "",
      flag_meninggal: false,
      meninggal_tgl: "",
    });
  };

  const handleExport = () => {
    const columns = [
      { key: "nama", label: "Nama" },
      { key: "nip", label: "NIP" },
      { key: "status", label: "Status" },
      { key: "flag_cltn", label: "Flag CLTN" },
      { key: "cltn_surat_izin_nomor", label: "No Surat Izin CLTN" },
      { key: "cltn_tgl_mulai", label: "CLTN Tgl Mulai" },
      { key: "cltn_tgl_akhir", label: "CLTN Tgl Akhir" },
      { key: "cltn_status_argo", label: "CLTN Status Argo" },
      { key: "flag_pemberhentian", label: "Flag Pemberhentian" },
      { key: "pemberhentian_jenis", label: "Jenis Pemberhentian" },
      { key: "pemberhentian_no_skep", label: "No SKEP" },
      { key: "flag_meninggal", label: "Flag Meninggal" },
      { key: "meninggal_tgl", label: "Tgl Meninggal" },
    ];
    exportToExcel(data, columns, "db_status");
  };

  const handleImport = async (jsonData: any[]) => {
    try {
      const records = jsonData.map((row) => ({
        nama: row["Nama"] || "",
        nip: String(row["NIP"] || ""),
        status: row["Status"] || null,
        flag_cltn: row["Flag CLTN"] === true || row["Flag CLTN"] === "true",
        cltn_surat_izin_nomor: row["No Surat Izin CLTN"] || null,
        cltn_tgl_mulai: row["CLTN Tgl Mulai"] || null,
        cltn_tgl_akhir: row["CLTN Tgl Akhir"] || null,
        flag_pemberhentian: row["Flag Pemberhentian"] === true || row["Flag Pemberhentian"] === "true",
        pemberhentian_jenis: row["Jenis Pemberhentian"] || null,
        pemberhentian_no_skep: row["No SKEP"] || null,
        flag_meninggal: row["Flag Meninggal"] === true || row["Flag Meninggal"] === "true",
        meninggal_tgl: row["Tgl Meninggal"] || null,
      }));
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from("corebase_db_status").insert(batch);
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
      const { error } = await supabase.from("corebase_db_status").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus semua data");
    }
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || item.nip.includes(searchTerm);
    if (!matchSearch) return false;
    if (filterStatus && filterStatus !== "all" && item.status !== filterStatus) return false;
    if (filterCltn === "ya" && !item.flag_cltn) return false;
    if (filterCltn === "tidak" && item.flag_cltn) return false;
    if (filterPemberhentian === "ya" && !item.flag_pemberhentian) return false;
    if (filterPemberhentian === "tidak" && item.flag_pemberhentian) return false;
    if (filterMeninggal === "ya" && !item.flag_meninggal) return false;
    if (filterMeninggal === "tidak" && item.flag_meninggal) return false;
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
            <FileCheck className="h-5 w-5" />
            DB Status
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
              tableName="DB Status"
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
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
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
                        <Label>Status</Label>
                        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PNS">PNS</SelectItem>
                            <SelectItem value="P3K">P3K</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Flag CLTN */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Flag CLTN (Cuti Luar Tanggungan Negara)</Label>
                        <Switch
                          checked={formData.flag_cltn}
                          onCheckedChange={(v) => setFormData({ ...formData, flag_cltn: v })}
                        />
                      </div>
                      {formData.flag_cltn && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nomor Surat Izin</Label>
                            <Input
                              value={formData.cltn_surat_izin_nomor}
                              onChange={(e) => setFormData({ ...formData, cltn_surat_izin_nomor: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal Mulai</Label>
                            <Input
                              type="date"
                              value={formData.cltn_tgl_mulai}
                              onChange={(e) => setFormData({ ...formData, cltn_tgl_mulai: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Tanggal Akhir (3 tahun)</Label>
                            <Input
                              type="date"
                              value={formData.cltn_tgl_akhir}
                              onChange={(e) => setFormData({ ...formData, cltn_tgl_akhir: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Flag Pemberhentian */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Flag Pemberhentian</Label>
                        <Switch
                          checked={formData.flag_pemberhentian}
                          onCheckedChange={(v) => setFormData({ ...formData, flag_pemberhentian: v })}
                        />
                      </div>
                      {formData.flag_pemberhentian && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Jenis Pemberhentian</Label>
                            <Input
                              value={formData.pemberhentian_jenis}
                              onChange={(e) => setFormData({ ...formData, pemberhentian_jenis: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>No SKEP</Label>
                            <Input
                              value={formData.pemberhentian_no_skep}
                              onChange={(e) => setFormData({ ...formData, pemberhentian_no_skep: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal SKEP</Label>
                            <Input
                              type="date"
                              value={formData.pemberhentian_tgl_skep}
                              onChange={(e) => setFormData({ ...formData, pemberhentian_tgl_skep: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal Diterima</Label>
                            <Input
                              type="date"
                              value={formData.pemberhentian_tgl_diterima}
                              onChange={(e) => setFormData({ ...formData, pemberhentian_tgl_diterima: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal Berlaku</Label>
                            <Input
                              type="date"
                              value={formData.pemberhentian_tgl_berlaku}
                              onChange={(e) => setFormData({ ...formData, pemberhentian_tgl_berlaku: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tindak Lanjut</Label>
                            <Input
                              value={formData.pemberhentian_tindak_lanjut}
                              onChange={(e) => setFormData({ ...formData, pemberhentian_tindak_lanjut: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Flag Meninggal */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">Flag Meninggal</Label>
                        <Switch
                          checked={formData.flag_meninggal}
                          onCheckedChange={(v) => setFormData({ ...formData, flag_meninggal: v })}
                        />
                      </div>
                      {formData.flag_meninggal && (
                        <div className="space-y-2">
                          <Label>Tanggal Meninggal</Label>
                          <Input
                            type="date"
                            value={formData.meninggal_tgl}
                            onChange={(e) => setFormData({ ...formData, meninggal_tgl: e.target.value })}
                          />
                        </div>
                      )}
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
            <Label className="text-xs">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="PNS">PNS</SelectItem>
                <SelectItem value="P3K">P3K</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CLTN</Label>
            <Select value={filterCltn} onValueChange={setFilterCltn}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="ya">Ya</SelectItem>
                <SelectItem value="tidak">Tidak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pemberhentian</Label>
            <Select value={filterPemberhentian} onValueChange={setFilterPemberhentian}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="ya">Ya</SelectItem>
                <SelectItem value="tidak">Tidak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Meninggal</Label>
            <Select value={filterMeninggal} onValueChange={setFilterMeninggal}>
              <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="ya">Ya</SelectItem>
                <SelectItem value="tidak">Tidak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterStatus(""); setFilterCltn(""); setFilterPemberhentian(""); setFilterMeninggal(""); }}>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-center">CLTN</TableHead>
                <TableHead className="text-center">Pemberhentian</TableHead>
                <TableHead className="text-center">Meninggal</TableHead>
                {canEdit && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    Belum ada data.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                  const argoStatus = item.flag_cltn ? calculateCltnArgo(item.cltn_tgl_akhir) : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.flag_cltn ? (
                          <div className="space-y-1">
                            <Badge className={argoStatus?.color}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {argoStatus?.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground">{item.cltn_surat_izin_nomor}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.flag_pemberhentian ? (
                          <div className="space-y-1">
                            <Badge variant="destructive">{item.pemberhentian_jenis || "Ya"}</Badge>
                            <p className="text-xs text-muted-foreground">{item.pemberhentian_no_skep}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.flag_meninggal ? (
                          <Badge variant="secondary">
                            {item.meninggal_tgl ? format(new Date(item.meninggal_tgl), "dd/MM/yyyy") : "Ya"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
