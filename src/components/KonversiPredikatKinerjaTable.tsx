import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Download, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// NKP, NPKP, NEP options
const NKP_OPTIONS = ["-", "Baik", "Sedang", "Kurang"];
const NPKP_OPTIONS = ["Sangat Baik", "Baik", "Cukup", "Kurang", "Buruk"];
const NEP_OPTIONS = ["-", "Baik", "Sedang", "Kurang"];

// Conversion table based on user's reference image
const KONVERSI_TABLE = [
  { nkp: "-", npkp: "Sangat Baik", nep: "-", predikat: "Sangat Baik" },
  { nkp: "Baik", npkp: "Baik", nep: "Baik", predikat: "Baik" },
  { nkp: "Sedang", npkp: "Cukup", nep: "Sedang", predikat: "Butuh Perbaikan" },
  { nkp: "Kurang", npkp: "Kurang", nep: "Kurang", predikat: "Kurang" },
  { nkp: "-", npkp: "Buruk", nep: "-", predikat: "Sangat Kurang" },
];

interface KonversiPredikat {
  id: string;
  no_urut: number | null;
  predikat: string;
  nilai_terendah: number;
  nilai_tertinggi: number;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
}

// Function to calculate predikat based on NKP, NPKP, NEP
const calculatePredikat = (nkp: string, npkp: string, nep: string): string => {
  // Priority logic based on the conversion table
  if (npkp === "Sangat Baik" && (nkp === "-" || nkp === "") && (nep === "-" || nep === "")) {
    return "Sangat Baik";
  }
  if (npkp === "Buruk" && (nkp === "-" || nkp === "") && (nep === "-" || nep === "")) {
    return "Sangat Kurang";
  }
  if (nkp === "Baik" && npkp === "Baik" && nep === "Baik") {
    return "Baik";
  }
  if (nkp === "Sedang" && npkp === "Cukup" && nep === "Sedang") {
    return "Butuh Perbaikan";
  }
  if (nkp === "Kurang" && npkp === "Kurang" && nep === "Kurang") {
    return "Kurang";
  }
  
  // Additional logic for mixed values
  if (npkp === "Sangat Baik") return "Sangat Baik";
  if (npkp === "Buruk") return "Sangat Kurang";
  if (npkp === "Baik" || nkp === "Baik" || nep === "Baik") return "Baik";
  if (npkp === "Cukup" || nkp === "Sedang" || nep === "Sedang") return "Butuh Perbaikan";
  if (npkp === "Kurang" || nkp === "Kurang" || nep === "Kurang") return "Kurang";
  
  return "-";
};

// Get badge color based on predikat
const getPredikatBadgeColor = (predikat: string): string => {
  switch (predikat) {
    case "Sangat Baik":
      return "bg-green-600 hover:bg-green-700 text-white";
    case "Baik":
      return "bg-blue-600 hover:bg-blue-700 text-white";
    case "Butuh Perbaikan":
      return "bg-yellow-500 hover:bg-yellow-600 text-white";
    case "Kurang":
      return "bg-orange-500 hover:bg-orange-600 text-white";
    case "Sangat Kurang":
      return "bg-red-600 hover:bg-red-700 text-white";
    default:
      return "bg-gray-400 hover:bg-gray-500 text-white";
  }
};

export default function KonversiPredikatKinerjaTable({ isAdmin = true }: { isAdmin?: boolean }) {
  const [data, setData] = useState<KonversiPredikat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<KonversiPredikat | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nkp: "-",
    npkp: "Baik",
    nep: "-",
  });

  // Computed predikat based on form data
  const computedPredikat = calculatePredikat(formData.nkp, formData.npkp, formData.nep);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("konversi_predikat_kinerja")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nkp: "-",
      npkp: "Baik",
      nep: "-",
    });
    setEditingData(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.npkp) {
        toast.error("NPKP wajib dipilih");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || "unknown";
      const predikat = calculatePredikat(formData.nkp, formData.npkp, formData.nep);

      if (editingData) {
        const { error } = await supabase
          .from("konversi_predikat_kinerja")
          .update({
            predikat: predikat,
            nilai_terendah: 0,
            nilai_tertinggi: 0,
            keterangan: `NKP: ${formData.nkp}, NPKP: ${formData.npkp}, NEP: ${formData.nep}`,
          })
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const nextNoUrut = data.length > 0 ? Math.max(...data.map(d => d.no_urut || 0)) + 1 : 1;
        
        const { error } = await supabase
          .from("konversi_predikat_kinerja")
          .insert({
            no_urut: nextNoUrut,
            predikat: predikat,
            nilai_terendah: 0,
            nilai_tertinggi: 0,
            keterangan: `NKP: ${formData.nkp}, NPKP: ${formData.npkp}, NEP: ${formData.nep}`,
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

  const handleEdit = (item: KonversiPredikat) => {
    setEditingData(item);
    // Parse keterangan to get NKP, NPKP, NEP values
    const keterangan = item.keterangan || "";
    const nkpMatch = keterangan.match(/NKP: ([^,]+)/);
    const npkpMatch = keterangan.match(/NPKP: ([^,]+)/);
    const nepMatch = keterangan.match(/NEP: (.+)$/);
    
    setFormData({
      nkp: nkpMatch ? nkpMatch[1].trim() : "-",
      npkp: npkpMatch ? npkpMatch[1].trim() : "Baik",
      nep: nepMatch ? nepMatch[1].trim() : "-",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase
        .from("konversi_predikat_kinerja")
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

  const handleExport = () => {
    const exportData = data.map((item, index) => {
      const keterangan = item.keterangan || "";
      const nkpMatch = keterangan.match(/NKP: ([^,]+)/);
      const npkpMatch = keterangan.match(/NPKP: ([^,]+)/);
      const nepMatch = keterangan.match(/NEP: (.+)$/);
      
      return {
        No: item.no_urut || index + 1,
        NKP: nkpMatch ? nkpMatch[1].trim() : "-",
        NPKP: npkpMatch ? npkpMatch[1].trim() : "-",
        NEP: nepMatch ? nepMatch[1].trim() : "-",
        "Predikat Kinerja": item.predikat,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Konversi Predikat");
    XLSX.writeFile(wb, "konversi_predikat_kinerja.xlsx");
    toast.success("Data berhasil diekspor");
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
          const nkp = row["NKP"] || "-";
          const npkp = row["NPKP"] || "Baik";
          const nep = row["NEP"] || "-";
          const predikat = calculatePredikat(nkp, npkp, nep);
          
          await supabase.from("konversi_predikat_kinerja").insert({
            no_urut: row["No"] || null,
            predikat: predikat,
            nilai_terendah: 0,
            nilai_tertinggi: 0,
            keterangan: `NKP: ${nkp}, NPKP: ${npkp}, NEP: ${nep}`,
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

  // Parse item keterangan to display NKP, NPKP, NEP
  const parseKeterangan = (keterangan: string | null) => {
    if (!keterangan) return { nkp: "-", npkp: "-", nep: "-" };
    const nkpMatch = keterangan.match(/NKP: ([^,]+)/);
    const npkpMatch = keterangan.match(/NPKP: ([^,]+)/);
    const nepMatch = keterangan.match(/NEP: (.+)$/);
    return {
      nkp: nkpMatch ? nkpMatch[1].trim() : "-",
      npkp: npkpMatch ? npkpMatch[1].trim() : "-",
      nep: nepMatch ? nepMatch[1].trim() : "-",
    };
  };

  return (
    <Card className="mt-6">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <CardTitle className="text-lg">Konversi Predikat Kinerja Tahunan</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Hasil kinerja pegawai yang telah ditetapkan, dilakukan konversi ke Predikat Kinerja Tahunan Pegawai
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {isAdmin && (
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
            )}
            {isAdmin && (
            <Button size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Reference conversion table */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg border">
          <p className="text-sm font-medium mb-3">Ketentuan Konversi:</p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800">
                  <TableHead className="text-white font-bold text-center">NKP</TableHead>
                  <TableHead className="text-white font-bold text-center">NPKP</TableHead>
                  <TableHead className="text-white font-bold text-center">NEP</TableHead>
                  <TableHead className="text-white font-bold text-center">Predikat Kinerja</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {KONVERSI_TABLE.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center">{row.nkp}</TableCell>
                    <TableCell className="text-center">{row.npkp}</TableCell>
                    <TableCell className="text-center">{row.nep}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getPredikatBadgeColor(row.predikat)}>
                        {row.predikat}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Data table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead className="text-center">NKP</TableHead>
                <TableHead className="text-center">NPKP</TableHead>
                <TableHead className="text-center">NEP</TableHead>
                <TableHead className="text-center">Predikat Kinerja</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                    Belum ada data. Klik "Tambah" untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  const parsed = parseKeterangan(item.keterangan);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.no_urut || index + 1}</TableCell>
                      <TableCell className="text-center">{parsed.nkp}</TableCell>
                      <TableCell className="text-center">{parsed.npkp}</TableCell>
                      <TableCell className="text-center">{parsed.nep}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getPredikatBadgeColor(item.predikat)}>
                          {item.predikat}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Data" : "Tambah Data Konversi"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>NKP (Nilai Kinerja Pegawai)</Label>
              <Select 
                value={formData.nkp} 
                onValueChange={(v) => setFormData({ ...formData, nkp: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih NKP" />
                </SelectTrigger>
                <SelectContent>
                  {NKP_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>NPKP (Nilai Perilaku Kerja Pegawai) *</Label>
              <Select 
                value={formData.npkp} 
                onValueChange={(v) => setFormData({ ...formData, npkp: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih NPKP" />
                </SelectTrigger>
                <SelectContent>
                  {NPKP_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>NEP (Nilai Ekspektasi Pegawai)</Label>
              <Select 
                value={formData.nep} 
                onValueChange={(v) => setFormData({ ...formData, nep: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih NEP" />
                </SelectTrigger>
                <SelectContent>
                  {NEP_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-calculated Predikat Kinerja */}
            <div className="p-4 bg-muted rounded-lg border">
              <Label className="text-sm text-muted-foreground">Predikat Kinerja (Otomatis)</Label>
              <div className="mt-2">
                <Badge className={`text-lg px-4 py-2 ${getPredikatBadgeColor(computedPredikat)}`}>
                  {computedPredikat}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingData ? "Simpan Perubahan" : "Tambah Data"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
    </Card>
  );
}
