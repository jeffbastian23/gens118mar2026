import { useEffect, useState } from "react";
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
  DialogTrigger,
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, Upload, Trash2, Search, Edit, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface Mutasi {
  id: string;
  nomor_kep: string;
  tanggal_kep: string;
  nama_lengkap: string;
  nip: string | null;
  pangkat_golongan: string | null;
  jabatan: string | null;
  unit_lama: string;
  unit_baru: string;
  created_at: string;
  created_by_email: string | null;
}

const JABATAN_OPTIONS = [
  "Pengawas (Mutasi)",
  "Pengawas (Promosi)",
  "PBC Madya (Mutasi)",
  "PBC Madya (Promosi)",
  "PBC Muda (Mutasi)",
  "PBC Muda (Promosi)",
  "PBC Pertama (Mutasi)",
  "PBC Pertama (Promosi)",
  "PBC Mahir (Mutasi)",
  "PBC Mahir (Promosi)",
  "PBC Terampil (Mutasi)",
  "PBC Terampil (Promosi)",
  "Pelaksana"
];

export default function MutasiPengolahanData() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const { toast } = useToast();
  const [data, setData] = useState<Mutasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mutasi | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nomor_kep: "",
    tanggal_kep: "",
    nama_lengkap: "",
    nip: "",
    pangkat_golongan: "",
    jabatan: "",
    unit_lama: "",
    unit_baru: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: mutasiData, error } = await supabase
        .from("mutasi")
        .select("*")
        .order("tanggal_kep", { ascending: false });

      if (error) throw error;
      setData(mutasiData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nomor_kep: "",
      tanggal_kep: "",
      nama_lengkap: "",
      nip: "",
      pangkat_golongan: "",
      jabatan: "",
      unit_lama: "",
      unit_baru: ""
    });
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.nomor_kep || !formData.tanggal_kep || !formData.nama_lengkap || !formData.unit_lama || !formData.unit_baru) {
      toast({
        title: "Error",
        description: "Nomor KEP, Tanggal KEP, Nama Lengkap, Unit Lama, dan Unit Baru wajib diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        nomor_kep: formData.nomor_kep,
        tanggal_kep: formData.tanggal_kep,
        nama_lengkap: formData.nama_lengkap,
        nip: formData.nip || null,
        pangkat_golongan: formData.pangkat_golongan || null,
        jabatan: formData.jabatan || null,
        unit_lama: formData.unit_lama,
        unit_baru: formData.unit_baru,
        created_by_email: user?.email
      };

      if (editingItem) {
        const { error } = await supabase
          .from("mutasi")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Sukses", description: "Data berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from("mutasi")
          .insert([payload]);

        if (error) throw error;
        toast({ title: "Sukses", description: "Data berhasil ditambahkan" });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving data:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: Mutasi) => {
    setEditingItem(item);
    setFormData({
      nomor_kep: item.nomor_kep,
      tanggal_kep: item.tanggal_kep,
      nama_lengkap: item.nama_lengkap,
      nip: item.nip || "",
      pangkat_golongan: item.pangkat_golongan || "",
      jabatan: item.jabatan || "",
      unit_lama: item.unit_lama,
      unit_baru: item.unit_baru
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from("mutasi")
        .delete()
        .eq("id", itemToDelete);

      if (error) throw error;

      toast({ title: "Sukses", description: "Data berhasil dihapus" });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting data:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase
        .from("mutasi")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) throw error;

      toast({ title: "Sukses", description: "Semua data berhasil dihapus" });
      setDeleteAllDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting all data:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus semua data",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = () => {
    const exportData = data.map((item, index) => ({
      No: index + 1,
      "Nomor KEP": item.nomor_kep,
      "Tanggal KEP": format(new Date(item.tanggal_kep), "dd/MM/yyyy"),
      "Nama Lengkap": item.nama_lengkap,
      "NIP": item.nip || "",
      "Pangkat/Golongan": item.pangkat_golongan || "",
      "Jabatan": item.jabatan || "",
      "Unit Lama": item.unit_lama,
      "Unit Baru": item.unit_baru
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Mutasi");
    XLSX.writeFile(wb, `Data_Mutasi_${format(new Date(), "yyyyMMdd")}.xlsx`);

    toast({ title: "Sukses", description: "Data berhasil diekspor" });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const importedData = jsonData.map((row: any) => ({
          nomor_kep: row["Nomor KEP"] || row["nomor_kep"] || "",
          tanggal_kep: parseExcelDate(row["Tanggal KEP"] || row["tanggal_kep"]),
          nama_lengkap: row["Nama Lengkap"] || row["nama_lengkap"] || "",
          nip: row["NIP"] || row["nip"] || null,
          pangkat_golongan: row["Pangkat/Golongan"] || row["pangkat_golongan"] || null,
          jabatan: row["Jabatan"] || row["jabatan"] || null,
          unit_lama: row["Unit Lama"] || row["unit_lama"] || "",
          unit_baru: row["Unit Baru"] || row["unit_baru"] || "",
          created_by_email: user?.email
        })).filter((item: any) => item.nomor_kep && item.nama_lengkap && item.tanggal_kep);

        if (importedData.length === 0) {
          toast({
            title: "Error",
            description: "Tidak ada data valid untuk diimpor",
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase
          .from("mutasi")
          .insert(importedData);

        if (error) throw error;

        toast({
          title: "Sukses",
          description: `${importedData.length} data berhasil diimpor`
        });
        fetchData();
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "Error",
        description: "Gagal mengimpor data",
        variant: "destructive"
      });
    }

    e.target.value = "";
  };

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;
    
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return format(date, "yyyy-MM-dd");
    }
    
    if (typeof value === "string") {
      const parts = value.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    
    return null;
  };

  const filteredData = data.filter(item =>
    item.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nomor_kep.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit_lama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit_baru.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg">Memuat data...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Pengolahan Data Mutasi
            <span className="text-sm font-normal text-muted-foreground">
              (Total: {data.length} data)
            </span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            {isAdmin && (
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2" size="sm">
                    <Plus className="w-4 h-4" />
                    Tambah Data
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Data Mutasi" : "Tambah Data Mutasi"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nomor KEP *</Label>
                      <Input
                        placeholder="Masukkan nomor KEP"
                        value={formData.nomor_kep}
                        onChange={(e) => setFormData(prev => ({ ...prev, nomor_kep: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal KEP *</Label>
                      <Input
                        type="date"
                        value={formData.tanggal_kep}
                        onChange={(e) => setFormData(prev => ({ ...prev, tanggal_kep: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Lengkap *</Label>
                      <Input
                        placeholder="Masukkan nama lengkap"
                        value={formData.nama_lengkap}
                        onChange={(e) => setFormData(prev => ({ ...prev, nama_lengkap: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>NIP</Label>
                      <Input
                        placeholder="Masukkan NIP"
                        value={formData.nip}
                        onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Pangkat/Golongan</Label>
                      <Input
                        placeholder="Masukkan pangkat/golongan"
                        value={formData.pangkat_golongan}
                        onChange={(e) => setFormData(prev => ({ ...prev, pangkat_golongan: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jabatan</Label>
                      <Select
                        value={formData.jabatan}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, jabatan: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {JABATAN_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Unit Lama (Kantor Beacukai Lama) *</Label>
                      <Input
                        placeholder="Masukkan unit lama"
                        value={formData.unit_lama}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit_lama: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Baru (Kantor Beacukai Baru) *</Label>
                      <Input
                        placeholder="Masukkan unit baru"
                        value={formData.unit_baru}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit_baru: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingItem ? "Simpan Perubahan" : "Tambah"}
                    </Button>
                  </div>
                </div>
                </DialogContent>
              </Dialog>
            )}
            {isAdmin && (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel}>
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            )}
            {isAdmin && (
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                  id="import-mutasi-excel"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => document.getElementById('import-mutasi-excel')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Import Excel
                </Button>
              </div>
            )}
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setDeleteAllDialogOpen(true)}
                disabled={data.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Hapus Semua
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[calc(100vh-350px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nomor KEP</TableHead>
                <TableHead>Tanggal KEP</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Pangkat/Golongan</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Unit Lama</TableHead>
                <TableHead>Unit Baru</TableHead>
                {isAdmin && <TableHead className="w-24 text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.nomor_kep}</TableCell>
                  <TableCell>{format(new Date(item.tanggal_kep), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{item.nama_lengkap}</TableCell>
                  <TableCell>{item.nip || "-"}</TableCell>
                  <TableCell>{item.pangkat_golongan || "-"}</TableCell>
                  <TableCell>{item.jabatan || "-"}</TableCell>
                  <TableCell>{item.unit_lama}</TableCell>
                  <TableCell>{item.unit_baru}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
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
                          onClick={() => {
                            setItemToDelete(item.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Tidak ada data yang cocok" : "Belum ada data mutasi"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data mutasi ({data.length} data)? Tindakan ini tidak dapat dibatalkan.
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
    </Card>
  );
}
