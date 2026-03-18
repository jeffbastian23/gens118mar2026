import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Building2, RefreshCw } from "lucide-react";

interface SatkerData {
  id: string;
  satuan_kerja: string;
  total_pegawai: number;
  sudah_aktivasi: number;
  belum_aktivasi: number;
  created_at: string;
  updated_at: string;
}

const SATKER_OPTIONS = [
  "BC Perak",
  "BC Sidoarjo",
  "BC Juanda",
  "BC Madura",
  "BC Gresik",
  "BC Pasuruan",
  "BC Bojonegoro",
  "BLBC Surabaya",
];

export default function SatkerCortaxDashboard() {
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const [data, setData] = useState<SatkerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<SatkerData | null>(null);
  
  const [formData, setFormData] = useState({
    satuan_kerja: "",
    total_pegawai: 0,
    sudah_aktivasi: 0,
    belum_aktivasi: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from("satker_cortax")
        .select("*")
        .order("satuan_kerja", { ascending: true });

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

  const resetForm = () => {
    setFormData({
      satuan_kerja: "",
      total_pegawai: 0,
      sudah_aktivasi: 0,
      belum_aktivasi: 0,
    });
    setEditingData(null);
  };

  const handleOpenDialog = (satker?: SatkerData) => {
    if (satker) {
      setEditingData(satker);
      setFormData({
        satuan_kerja: satker.satuan_kerja,
        total_pegawai: satker.total_pegawai,
        sudah_aktivasi: satker.sudah_aktivasi,
        belum_aktivasi: satker.belum_aktivasi,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.satuan_kerja) {
      toast({
        title: "Error",
        description: "Pilih Satuan Kerja terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingData) {
        // Update
        const { error } = await supabase
          .from("satker_cortax")
          .update({
            satuan_kerja: formData.satuan_kerja,
            total_pegawai: formData.total_pegawai,
            sudah_aktivasi: formData.sudah_aktivasi,
            belum_aktivasi: formData.belum_aktivasi,
          })
          .eq("id", editingData.id);

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data satker berhasil diperbarui",
        });
      } else {
        // Check if satker already exists
        const existingSatker = data.find(
          (d) => d.satuan_kerja === formData.satuan_kerja
        );
        if (existingSatker) {
          toast({
            title: "Error",
            description: "Satuan Kerja sudah ada dalam database",
            variant: "destructive",
          });
          return;
        }

        // Insert
        const { error } = await supabase.from("satker_cortax").insert({
          satuan_kerja: formData.satuan_kerja,
          total_pegawai: formData.total_pegawai,
          sudah_aktivasi: formData.sudah_aktivasi,
          belum_aktivasi: formData.belum_aktivasi,
        });

        if (error) throw error;

        toast({
          title: "Berhasil",
          description: "Data satker berhasil ditambahkan",
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan data",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("satker_cortax")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Data satker berhasil dihapus",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  // Calculate belum_aktivasi when total_pegawai or sudah_aktivasi changes
  const handleFormChange = (field: string, value: string | number) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === "total_pegawai" || field === "sudah_aktivasi") {
      const total = field === "total_pegawai" ? Number(value) : newFormData.total_pegawai;
      const sudah = field === "sudah_aktivasi" ? Number(value) : newFormData.sudah_aktivasi;
      newFormData.belum_aktivasi = Math.max(0, total - sudah);
    }
    
    setFormData(newFormData);
  };

  // Get available satker options (exclude already added ones unless editing)
  const availableSatkerOptions = SATKER_OPTIONS.filter(
    (option) =>
      !data.some((d) => d.satuan_kerja === option) ||
      (editingData && editingData.satuan_kerja === option)
  );

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      total_pegawai: acc.total_pegawai + item.total_pegawai,
      sudah_aktivasi: acc.sudah_aktivasi + item.sudah_aktivasi,
      belum_aktivasi: acc.belum_aktivasi + item.belum_aktivasi,
    }),
    { total_pegawai: 0, sudah_aktivasi: 0, belum_aktivasi: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dashboard Satker Aktivasi Cortax
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              {isAdmin && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => handleOpenDialog()}
                      disabled={availableSatkerOptions.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Satker
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingData ? "Edit Data Satker" : "Tambah Data Satker"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingData
                        ? "Perbarui data aktivasi Cortax untuk satuan kerja ini"
                        : "Masukkan data aktivasi Cortax untuk satuan kerja baru"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="satuan_kerja">Satuan Kerja</Label>
                      <Select
                        value={formData.satuan_kerja}
                        onValueChange={(value) =>
                          handleFormChange("satuan_kerja", value)
                        }
                        disabled={!!editingData}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Satuan Kerja" />
                        </SelectTrigger>
                        <SelectContent>
                          {(editingData
                            ? SATKER_OPTIONS
                            : availableSatkerOptions
                          ).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_pegawai">Total Pegawai</Label>
                      <Input
                        id="total_pegawai"
                        type="number"
                        min={0}
                        value={formData.total_pegawai}
                        onChange={(e) =>
                          handleFormChange(
                            "total_pegawai",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sudah_aktivasi">Sudah Aktivasi</Label>
                      <Input
                        id="sudah_aktivasi"
                        type="number"
                        min={0}
                        max={formData.total_pegawai}
                        value={formData.sudah_aktivasi}
                        onChange={(e) =>
                          handleFormChange(
                            "sudah_aktivasi",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="belum_aktivasi">
                        Belum Aktivasi (Otomatis)
                      </Label>
                      <Input
                        id="belum_aktivasi"
                        type="number"
                        value={formData.belum_aktivasi}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Batal
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingData ? "Simpan Perubahan" : "Tambah"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">
              Memuat data...
            </p>
          ) : data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Belum ada data satker. Klik "Tambah Satker" untuk menambahkan.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Satuan Kerja</TableHead>
                    <TableHead className="text-center">Total Pegawai</TableHead>
                    <TableHead className="text-center">Sudah Aktivasi</TableHead>
                    <TableHead className="text-center">Belum Aktivasi</TableHead>
                    <TableHead className="text-center">Persentase</TableHead>
                    {isAdmin && <TableHead className="text-center w-[120px]">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const percentage =
                      item.total_pegawai > 0
                        ? Math.round(
                            (item.sudah_aktivasi / item.total_pegawai) * 100
                          )
                        : 0;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.satuan_kerja}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.total_pegawai}
                        </TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {item.sudah_aktivasi}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">
                          {item.belum_aktivasi}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              percentage === 100
                                ? "bg-green-100 text-green-700"
                                : percentage >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {percentage}%
                          </span>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDialog(item)}
                              >
                                <Pencil className="w-4 h-4 text-blue-600" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Konfirmasi Hapus
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus data{" "}
                                      <strong>{item.satuan_kerja}</strong>? Tindakan
                                      ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {/* Total Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2} className="text-right">
                      Total Keseluruhan:
                    </TableCell>
                    <TableCell className="text-center">
                      {totals.total_pegawai}
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {totals.sudah_aktivasi}
                    </TableCell>
                    <TableCell className="text-center text-red-600">
                      {totals.belum_aktivasi}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        {totals.total_pegawai > 0
                          ? Math.round(
                              (totals.sudah_aktivasi / totals.total_pegawai) * 100
                            )
                          : 0}
                        %
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
