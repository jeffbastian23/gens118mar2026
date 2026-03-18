import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Upload, Calendar } from "lucide-react";
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
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface JadwalSidangGrading {
  id: string;
  no_urut: number | null;
  hari_tanggal: string;
  pukul: string | null;
  media: string | null;
  satuan_kerja: string | null;
  created_at?: string;
  updated_at?: string;
}

const initialFormData = {
  hari_tanggal: "",
  pukul: "",
  media: "",
  satuan_kerja: "",
};

interface JadwalSidangGradingSectionProps {
  isAdmin?: boolean;
}

export default function JadwalSidangGradingSection({ isAdmin = true }: JadwalSidangGradingSectionProps) {
  const [data, setData] = useState<JadwalSidangGrading[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<JadwalSidangGrading | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await (supabase as any)
        .from("jadwal_sidang_grading")
        .select("*")
        .order("hari_tanggal", { ascending: true });

      if (error) throw error;
      setData((result as JadwalSidangGrading[]) || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data jadwal sidang");
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
      if (!formData.hari_tanggal) {
        toast.error("Hari/Tanggal wajib diisi");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "unknown";

      // Get next no_urut
      const { data: maxData } = await (supabase as any)
        .from("jadwal_sidang_grading")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);

      const nextNoUrut = ((maxData as any[])?.[0]?.no_urut || 0) + 1;

      if (editingData) {
        const { error } = await (supabase as any)
          .from("jadwal_sidang_grading")
          .update({
            hari_tanggal: formData.hari_tanggal,
            pukul: formData.pukul || null,
            media: formData.media || null,
            satuan_kerja: formData.satuan_kerja || null,
          })
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await (supabase as any)
          .from("jadwal_sidang_grading")
          .insert({
            no_urut: nextNoUrut,
            hari_tanggal: formData.hari_tanggal,
            pukul: formData.pukul || null,
            media: formData.media || null,
            satuan_kerja: formData.satuan_kerja || null,
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

  const handleEdit = (item: JadwalSidangGrading) => {
    setEditingData(item);
    setFormData({
      hari_tanggal: item.hari_tanggal,
      pukul: item.pukul || "",
      media: item.media || "",
      satuan_kerja: item.satuan_kerja || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await (supabase as any)
        .from("jadwal_sidang_grading")
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
    const exportData = data.map((item, index) => ({
      No: item.no_urut || index + 1,
      "Hari/Tanggal": item.hari_tanggal ? format(new Date(item.hari_tanggal), "EEEE, dd MMMM yyyy", { locale: localeId }) : "",
      Pukul: item.pukul || "",
      Media: item.media || "",
      "Satuan Kerja": item.satuan_kerja || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Sidang");
    XLSX.writeFile(wb, "jadwal_sidang_grading.xlsx");
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

        // Get max no_urut
        const { data: maxData } = await (supabase as any)
          .from("jadwal_sidang_grading")
          .select("no_urut")
          .order("no_urut", { ascending: false })
          .limit(1);

        let currentNoUrut = ((maxData as any[])?.[0]?.no_urut || 0);

        for (const row of jsonData as any[]) {
          currentNoUrut++;
          
          // Parse date from Excel (could be various formats)
          let hariTanggal = row["Hari/Tanggal"] || row["Tanggal"];
          if (typeof hariTanggal === "number") {
            // Excel date serial number
            const excelDate = new Date((hariTanggal - 25569) * 86400 * 1000);
            hariTanggal = format(excelDate, "yyyy-MM-dd");
          } else if (hariTanggal) {
            // Try to parse string date
            const parsed = new Date(hariTanggal);
            if (!isNaN(parsed.getTime())) {
              hariTanggal = format(parsed, "yyyy-MM-dd");
            }
          }

          await (supabase as any).from("jadwal_sidang_grading").insert({
            no_urut: currentNoUrut,
            hari_tanggal: hariTanggal || new Date().toISOString().split("T")[0],
            pukul: row["Pukul"] || null,
            media: row["Media"] || null,
            satuan_kerja: row["Satuan Kerja"] || null,
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

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE, dd MMMM yyyy", { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Jadwal Sidang Grading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 items-center justify-end">
          <div className="flex gap-2 flex-wrap">
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
                Tambah Jadwal
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
                <TableHead>Hari/Tanggal</TableHead>
                <TableHead>Pukul</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Satuan Kerja</TableHead>
                {isAdmin && <TableHead className="text-right sticky right-0 bg-background">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada data. Klik "Tambah Jadwal" untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{formatDate(item.hari_tanggal)}</TableCell>
                    <TableCell>{item.pukul || "-"}</TableCell>
                    <TableCell>{item.media || "-"}</TableCell>
                    <TableCell>{item.satuan_kerja || "-"}</TableCell>
                    {isAdmin && (
                    <TableCell className="text-right sticky right-0 bg-background">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingData ? "Edit Jadwal" : "Tambah Jadwal Sidang"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Hari/Tanggal *</Label>
                <Input
                  type="date"
                  value={formData.hari_tanggal}
                  onChange={(e) => setFormData({ ...formData, hari_tanggal: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pukul</Label>
                <Input
                  value={formData.pukul}
                  onChange={(e) => setFormData({ ...formData, pukul: e.target.value })}
                  placeholder="Contoh: 09.00 - 12.00 WIB"
                />
              </div>
              <div className="space-y-2">
                <Label>Media</Label>
                <Input
                  value={formData.media}
                  onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                  placeholder="Contoh: Zoom, MS Teams, Offline"
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan Kerja</Label>
                <Input
                  value={formData.satuan_kerja}
                  onChange={(e) => setFormData({ ...formData, satuan_kerja: e.target.value })}
                  placeholder="Satuan Kerja"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full mt-2">
                {editingData ? "Simpan Perubahan" : "Tambah Jadwal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
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
