import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Search, RefreshCw, Upload, Download, Trash } from "lucide-react";
import * as XLSX from "xlsx";

interface CortaxData {
  id: string;
  nomor: number | null;
  nama_lengkap: string;
  nip: string;
  pangkat: string | null;
  unit: string | null;
  bagian_bidang: string | null;
  login_portal: string | null;
  status_kode_otorisasi: string | null;
  bukti_registrasi: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  nomor: "",
  nama_lengkap: "",
  nip: "",
  pangkat: "",
  unit: "",
  bagian_bidang: "",
  login_portal: "TIDAK",
  status_kode_otorisasi: "BELUM KODE OTORISASI",
  bukti_registrasi: "",
};

export default function AktivasiCortaxDatabase() {
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const [data, setData] = useState<CortaxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CortaxData | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from("aktivasi_cortax")
        .select("*")
        .order("nomor", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.nama_lengkap?.toLowerCase().includes(query) ||
      item.nip?.toLowerCase().includes(query) ||
      item.unit?.toLowerCase().includes(query) ||
      item.bagian_bidang?.toLowerCase().includes(query)
    );
  });

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const handleEdit = (item: CortaxData) => {
    setSelectedItem(item);
    setFormData({
      nomor: item.nomor?.toString() || "",
      nama_lengkap: item.nama_lengkap || "",
      nip: item.nip || "",
      pangkat: item.pangkat || "",
      unit: item.unit || "",
      bagian_bidang: item.bagian_bidang || "",
      login_portal: item.login_portal || "TIDAK",
      status_kode_otorisasi: item.status_kode_otorisasi || "BELUM KODE OTORISASI",
      bukti_registrasi: item.bukti_registrasi || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (item: CortaxData) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("aktivasi_cortax")
        .delete()
        .eq("id", selectedItem.id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data berhasil dihapus",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus data",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nama_lengkap || !formData.nip) {
      toast({
        title: "Error",
        description: "Nama dan NIP wajib diisi",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nomor: formData.nomor ? parseInt(formData.nomor) : null,
        nama_lengkap: formData.nama_lengkap,
        nip: formData.nip,
        pangkat: formData.pangkat || null,
        unit: formData.unit || null,
        bagian_bidang: formData.bagian_bidang || null,
        login_portal: formData.login_portal,
        status_kode_otorisasi: formData.status_kode_otorisasi,
        bukti_registrasi: formData.bukti_registrasi || null,
      };

      if (selectedItem) {
        const { error } = await supabase
          .from("aktivasi_cortax")
          .update(payload)
          .eq("id", selectedItem.id);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from("aktivasi_cortax")
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Berhasil", description: "Data berhasil ditambahkan" });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header row and process data
      const rows = jsonData.slice(1).filter((row) => row.length > 0 && row[1]);

      const insertData = rows.map((row) => ({
        nomor: row[0] ? parseInt(row[0]) : null,
        nama_lengkap: row[1] || "",
        nip: row[2]?.toString() || "",
        pangkat: row[3] || null,
        unit: row[4] || null,
        bagian_bidang: row[5] || null,
        login_portal: row[6] || "TIDAK",
        status_kode_otorisasi: row[7] || "BELUM KODE OTORISASI",
        bukti_registrasi: row[8] && row[8] !== "#N/A" ? row[8] : null,
      })).filter((item) => item.nama_lengkap && item.nip);

      if (insertData.length === 0) {
        toast({
          title: "Error",
          description: "Tidak ada data valid yang ditemukan dalam file",
          variant: "destructive",
        });
        return;
      }

      // Insert in batches of 50
      const batchSize = 50;
      for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize);
        const { error } = await supabase.from("aktivasi_cortax").insert(batch);
        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: `${insertData.length} data berhasil diimport`,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengimport data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Database Aktivasi Cortax</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIP, unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            {isAdmin && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const exportData = filteredData.map((item, index) => ({
                      "No": item.nomor || index + 1,
                      "Nama Lengkap": item.nama_lengkap,
                      "NIP": item.nip,
                      "Pangkat": item.pangkat || "-",
                      "Unit": item.unit || "-",
                      "Bagian/Bidang": item.bagian_bidang || "-",
                      "Login Portal": item.login_portal || "TIDAK",
                      "Status Otorisasi": item.status_kode_otorisasi === "YA" || item.status_kode_otorisasi === "SUDAH KODE OTORISASI" ? "SUDAH" : "BELUM",
                      "Bukti Registrasi": item.bukti_registrasi && item.bukti_registrasi !== "#N/A" ? "SELESAI" : "BELUM",
                    }));
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Data Cortax");
                    XLSX.writeFile(wb, "Data_Aktivasi_Cortax.xlsx");
                    toast({ title: "Berhasil", description: `${exportData.length} data berhasil diexport` });
                  }}
                  disabled={filteredData.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center gap-2"
                >
                  <Upload className={`w-4 h-4 ${importing ? "animate-pulse" : ""}`} />
                  {importing ? "Importing..." : "Import Excel"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDeleteAllDialogOpen(true)}
                  disabled={data.length === 0 || deletingAll}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash className={`w-4 h-4 ${deletingAll ? "animate-pulse" : ""}`} />
                  {deletingAll ? "Menghapus..." : "Hapus Data"}
                </Button>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button onClick={handleAdd} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Tambah Data
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Pangkat</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Bagian/Bidang</TableHead>
                <TableHead>Login Portal</TableHead>
                <TableHead>Status Otorisasi</TableHead>
                <TableHead>Bukti Registrasi</TableHead>
                {isAdmin && <TableHead className="w-24">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Tidak ada data yang cocok" : "Belum ada data"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nomor || index + 1}</TableCell>
                    <TableCell className="font-medium">{item.nama_lengkap}</TableCell>
                    <TableCell>{item.nip}</TableCell>
                    <TableCell>{item.pangkat || "-"}</TableCell>
                    <TableCell>{item.unit || "-"}</TableCell>
                    <TableCell>{item.bagian_bidang || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.login_portal === "YA"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.login_portal || "TIDAK"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status_kode_otorisasi === "YA" || item.status_kode_otorisasi === "SUDAH KODE OTORISASI"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status_kode_otorisasi === "YA" || item.status_kode_otorisasi === "SUDAH KODE OTORISASI"
                          ? "SUDAH"
                          : "BELUM"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.bukti_registrasi && item.bukti_registrasi !== "#N/A"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.bukti_registrasi && item.bukti_registrasi !== "#N/A" ? "SELESAI" : "BELUM"}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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
        <div className="mt-4 text-sm text-muted-foreground">
          Total: {filteredData.length} data
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Edit Data Cortax" : "Tambah Data Cortax"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nomor">Nomor</Label>
              <Input
                id="nomor"
                type="number"
                value={formData.nomor}
                onChange={(e) => setFormData({ ...formData, nomor: e.target.value })}
                placeholder="Nomor urut"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nama_lengkap">Nama Lengkap *</Label>
              <Input
                id="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                placeholder="Nama lengkap pegawai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP *</Label>
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="NIP 18 digit"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pangkat">Pangkat</Label>
              <Input
                id="pangkat"
                value={formData.pangkat}
                onChange={(e) => setFormData({ ...formData, pangkat: e.target.value })}
                placeholder="Contoh: III/c"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Unit kerja"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bagian_bidang">Bagian/Bidang</Label>
              <Input
                id="bagian_bidang"
                value={formData.bagian_bidang}
                onChange={(e) => setFormData({ ...formData, bagian_bidang: e.target.value })}
                placeholder="Bagian atau bidang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login_portal">Login Portal</Label>
              <Select
                value={formData.login_portal}
                onValueChange={(value) => setFormData({ ...formData, login_portal: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUDAH">SUDAH</SelectItem>
                  <SelectItem value="TIDAK">TIDAK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status_kode_otorisasi">Status Kode Otorisasi</Label>
              <Select
                value={formData.status_kode_otorisasi}
                onValueChange={(value) =>
                  setFormData({ ...formData, status_kode_otorisasi: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUDAH KODE OTORISASI">SUDAH KODE OTORISASI</SelectItem>
                  <SelectItem value="BELUM KODE OTORISASI">BELUM KODE OTORISASI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bukti_registrasi">Link Bukti Registrasi</Label>
              <Input
                id="bukti_registrasi"
                value={formData.bukti_registrasi}
                onChange={(e) => setFormData({ ...formData, bukti_registrasi: e.target.value })}
                placeholder="URL bukti registrasi (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Menyimpan..." : selectedItem ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data{" "}
              <strong>{selectedItem?.nama_lengkap}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Data Confirmation */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>semua {data.length} data</strong> aktivasi cortax? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                setDeletingAll(true);
                try {
                  const { error } = await supabase
                    .from("aktivasi_cortax")
                    .delete()
                    .neq("id", "00000000-0000-0000-0000-000000000000");
                  
                  if (error) throw error;
                  
                  toast({
                    title: "Berhasil",
                    description: "Semua data berhasil dihapus",
                  });
                  fetchData();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Gagal menghapus data",
                    variant: "destructive",
                  });
                } finally {
                  setDeletingAll(false);
                  setDeleteAllDialogOpen(false);
                }
              }} 
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
