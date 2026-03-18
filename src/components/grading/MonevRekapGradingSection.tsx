import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MonevRekapGrading {
  id: string;
  no_urut: number | null;
  nama: string;
  nip: string | null;
  pendidikan: string | null;
  golongan: string | null;
  riwayat_jabatan_hris: string | null;
  jabatan_riwayat_grading: string | null;
  eselon_ii: string | null;
  eselon_iii: string | null;
  eselon_iv: string | null;
  peringkat_jabatan: string | null;
  peringkat_grading: string | null;
  keterangan: string | null;
  konfirmasi_unit: string | null;
  created_at?: string;
  updated_at?: string;
}

const initialFormData = {
  nama: "",
  nip: "",
  pendidikan: "",
  golongan: "",
  riwayat_jabatan_hris: "",
  jabatan_riwayat_grading: "",
  eselon_ii: "",
  eselon_iii: "",
  eselon_iv: "",
  peringkat_jabatan: "",
  peringkat_grading: "",
  keterangan: "",
  konfirmasi_unit: "",
};

interface MonevRekapGradingSectionProps {
  isAdmin?: boolean;
}

export default function MonevRekapGradingSection({ isAdmin = true }: MonevRekapGradingSectionProps) {
  const [data, setData] = useState<MonevRekapGrading[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<MonevRekapGrading | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("monev_rekap_grading")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data rekap grading");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingData(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.nama) {
        toast.error("Nama wajib diisi");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "unknown";

      if (editingData) {
        const { error } = await supabase
          .from("monev_rekap_grading")
          .update({
            nama: formData.nama,
            nip: formData.nip || null,
            pendidikan: formData.pendidikan || null,
            golongan: formData.golongan || null,
            riwayat_jabatan_hris: formData.riwayat_jabatan_hris || null,
            jabatan_riwayat_grading: formData.jabatan_riwayat_grading || null,
            eselon_ii: formData.eselon_ii || null,
            eselon_iii: formData.eselon_iii || null,
            eselon_iv: formData.eselon_iv || null,
            peringkat_jabatan: formData.peringkat_jabatan || null,
            peringkat_grading: formData.peringkat_grading || null,
            keterangan: formData.keterangan || null,
            konfirmasi_unit: formData.konfirmasi_unit || null,
          })
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("monev_rekap_grading")
          .insert({
            nama: formData.nama,
            nip: formData.nip || null,
            pendidikan: formData.pendidikan || null,
            golongan: formData.golongan || null,
            riwayat_jabatan_hris: formData.riwayat_jabatan_hris || null,
            jabatan_riwayat_grading: formData.jabatan_riwayat_grading || null,
            eselon_ii: formData.eselon_ii || null,
            eselon_iii: formData.eselon_iii || null,
            eselon_iv: formData.eselon_iv || null,
            peringkat_jabatan: formData.peringkat_jabatan || null,
            peringkat_grading: formData.peringkat_grading || null,
            keterangan: formData.keterangan || null,
            konfirmasi_unit: formData.konfirmasi_unit || null,
            created_by_email: userEmail,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data");
    }
  };

  const handleEdit = (item: MonevRekapGrading) => {
    setEditingData(item);
    setFormData({
      nama: item.nama,
      nip: item.nip || "",
      pendidikan: item.pendidikan || "",
      golongan: item.golongan || "",
      riwayat_jabatan_hris: item.riwayat_jabatan_hris || "",
      jabatan_riwayat_grading: item.jabatan_riwayat_grading || "",
      eselon_ii: item.eselon_ii || "",
      eselon_iii: item.eselon_iii || "",
      eselon_iv: item.eselon_iv || "",
      peringkat_jabatan: item.peringkat_jabatan || "",
      peringkat_grading: item.peringkat_grading || "",
      keterangan: item.keterangan || "",
      konfirmasi_unit: item.konfirmasi_unit || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("monev_rekap_grading")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      setDeleteId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const handleExportExcel = () => {
    // Use sequential numbering starting from 1 for export
    const exportData = filteredData.map((item, index) => ({
      No: index + 1,
      Nama: item.nama,
      NIP: item.nip || "",
      Pendidikan: item.pendidikan || "",
      Golongan: item.golongan || "",
      "Riwayat Jabatan HRIS": item.riwayat_jabatan_hris || "",
      "Jabatan Riwayat Grading": item.jabatan_riwayat_grading || "",
      "Eselon II": item.eselon_ii || "",
      "Eselon III": item.eselon_iii || "",
      "Eselon IV": item.eselon_iv || "",
      "Peringkat Jabatan": item.peringkat_jabatan || "",
      "Peringkat Grading": item.peringkat_grading || "",
      Keterangan: item.keterangan || "",
      "Konfirmasi Unit": item.konfirmasi_unit || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Grading");
    XLSX.writeFile(wb, "monev_rekap_grading.xlsx");
    toast.success("Data berhasil diekspor ke Excel");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || "unknown";

        for (const row of jsonData as any[]) {
          await supabase.from("monev_rekap_grading").insert({
            nama: row["Nama"] || "",
            nip: row["NIP"] || null,
            pendidikan: row["Pendidikan"] || null,
            golongan: row["Golongan"] || null,
            riwayat_jabatan_hris: row["Riwayat Jabatan HRIS"] || null,
            jabatan_riwayat_grading: row["Jabatan Riwayat Grading"] || null,
            eselon_ii: row["Eselon II"] || null,
            eselon_iii: row["Eselon III"] || null,
            eselon_iv: row["Eselon IV"] || null,
            peringkat_jabatan: row["Peringkat Jabatan"] || null,
            peringkat_grading: row["Peringkat Grading"] || null,
            keterangan: row["Keterangan"] || null,
            konfirmasi_unit: row["Konfirmasi Unit"] || null,
            created_by_email: userEmail,
          });
        }

        toast.success("Data berhasil diimpor");
        fetchData();
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast.error("Gagal mengimpor data");
    }
    e.target.value = "";
  };

  const filteredData = data.filter(item =>
    !searchTerm ||
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.nip && item.nip.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          📊 Rekap Data Grading Pegawai
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama/NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {isAdmin && (
              <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId("all")}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            )}
            <Button variant="outline" onClick={handleExportExcel}>
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
                Tambah Data
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>Pendidikan</TableHead>
                <TableHead>Golongan</TableHead>
                <TableHead>Riwayat Jabatan HRIS</TableHead>
                <TableHead>Jabatan Riwayat Grading</TableHead>
                <TableHead>Eselon II</TableHead>
                <TableHead>Eselon III</TableHead>
                <TableHead>Eselon IV</TableHead>
                <TableHead>Peringkat Jabatan</TableHead>
                <TableHead>Peringkat Grading</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Konfirmasi Unit</TableHead>
                <TableHead className="text-right sticky right-0 bg-background">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "Tidak ada data yang cocok" : "Belum ada data. Klik \"Tambah Data\" untuk menambahkan."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell>{item.nip || "-"}</TableCell>
                    <TableCell>{item.pendidikan || "-"}</TableCell>
                    <TableCell>{item.golongan || "-"}</TableCell>
                    <TableCell>{item.riwayat_jabatan_hris || "-"}</TableCell>
                    <TableCell>{item.jabatan_riwayat_grading || "-"}</TableCell>
                    <TableCell>{item.eselon_ii || "-"}</TableCell>
                    <TableCell>{item.eselon_iii || "-"}</TableCell>
                    <TableCell>{item.eselon_iv || "-"}</TableCell>
                    <TableCell>{item.peringkat_jabatan || "-"}</TableCell>
                    <TableCell>{item.peringkat_grading || "-"}</TableCell>
                    <TableCell>{item.keterangan || "-"}</TableCell>
                    <TableCell>{item.konfirmasi_unit || "-"}</TableCell>
                     <TableCell className="text-right sticky right-0 bg-background">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingData ? "Edit Data" : "Tambah Data Rekap Grading"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama *</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama Lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label>NIP</Label>
                <Input
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="NIP"
                />
              </div>
              <div className="space-y-2">
                <Label>Pendidikan</Label>
                <Input
                  value={formData.pendidikan}
                  onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                  placeholder="Pendidikan"
                />
              </div>
              <div className="space-y-2">
                <Label>Golongan</Label>
                <Input
                  value={formData.golongan}
                  onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                  placeholder="Golongan"
                />
              </div>
              <div className="space-y-2">
                <Label>Riwayat Jabatan HRIS</Label>
                <Input
                  value={formData.riwayat_jabatan_hris}
                  onChange={(e) => setFormData({ ...formData, riwayat_jabatan_hris: e.target.value })}
                  placeholder="Riwayat Jabatan HRIS"
                />
              </div>
              <div className="space-y-2">
                <Label>Jabatan Riwayat Grading</Label>
                <Input
                  value={formData.jabatan_riwayat_grading}
                  onChange={(e) => setFormData({ ...formData, jabatan_riwayat_grading: e.target.value })}
                  placeholder="Jabatan Riwayat Grading"
                />
              </div>
              <div className="space-y-2">
                <Label>Eselon II</Label>
                <Input
                  value={formData.eselon_ii}
                  onChange={(e) => setFormData({ ...formData, eselon_ii: e.target.value })}
                  placeholder="Eselon II"
                />
              </div>
              <div className="space-y-2">
                <Label>Eselon III</Label>
                <Input
                  value={formData.eselon_iii}
                  onChange={(e) => setFormData({ ...formData, eselon_iii: e.target.value })}
                  placeholder="Eselon III"
                />
              </div>
              <div className="space-y-2">
                <Label>Eselon IV</Label>
                <Input
                  value={formData.eselon_iv}
                  onChange={(e) => setFormData({ ...formData, eselon_iv: e.target.value })}
                  placeholder="Eselon IV"
                />
              </div>
              <div className="space-y-2">
                <Label>Peringkat Jabatan</Label>
                <Input
                  value={formData.peringkat_jabatan}
                  onChange={(e) => setFormData({ ...formData, peringkat_jabatan: e.target.value })}
                  placeholder="Peringkat Jabatan"
                />
              </div>
              <div className="space-y-2">
                <Label>Peringkat Grading</Label>
                <Input
                  value={formData.peringkat_grading}
                  onChange={(e) => setFormData({ ...formData, peringkat_grading: e.target.value })}
                  placeholder="Peringkat Grading"
                />
              </div>
              <div className="space-y-2">
                <Label>Keterangan</Label>
                <Input
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Keterangan"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Konfirmasi Unit</Label>
                <Input
                  value={formData.konfirmasi_unit}
                  onChange={(e) => setFormData({ ...formData, konfirmasi_unit: e.target.value })}
                  placeholder="Konfirmasi Unit"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {editingData ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteId !== null && deleteId !== "all"} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
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
      </CardContent>
    </Card>
  );
}
