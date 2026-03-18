import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Building2, ChevronDown, Edit2, Save, X, Download, Upload } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Eselonisasi {
  id: string;
  nama_unit: string;
  tingkat_eselon: string;
  parent_id: string | null;
  kode_unit: string | null;
  no_urut: number | null;
  is_active: boolean;
  created_at: string;
}

interface CorebaseEselonisasiTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseEselonisasiTab({ isAdmin, canEdit }: CorebaseEselonisasiTabProps) {
  const [data, setData] = useState<Eselonisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEselon2, setSelectedEselon2] = useState<string>("");
  const [selectedEselon3, setSelectedEselon3] = useState<string>("");
  const [selectedEselon4, setSelectedEselon4] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nama_unit: "", kode_unit: "" });

  // Form for new entry - stores eselon II, III, and IV names
  const [newEntry, setNewEntry] = useState({
    eselon2: "",
    eselon3: "",
    eselon4: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from("eselonisasi")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(result || []);
    } catch (error: any) {
      console.error("Error fetching eselonisasi:", error);
      toast.error("Gagal memuat data eselonisasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Count unique eselon values from the new data structure
  // nama_unit = Eselon II, tingkat_eselon = Eselon III, kode_unit = Eselon IV
  const uniqueEselon2 = new Set(data.map(d => d.nama_unit).filter(name => name && name.trim() !== ""));
  const uniqueEselon3 = new Set(data.map(d => d.tingkat_eselon).filter(name => name && name.trim() !== ""));
  const uniqueEselon4 = new Set(data.map(d => d.kode_unit).filter(name => name && name.trim() !== ""));

  // Get unique lists for dropdowns in struktur organisasi
  const eselon2List = Array.from(uniqueEselon2).map((name, idx) => ({ id: name, nama_unit: name }));
  const allEselon3ListUnique = Array.from(uniqueEselon3);
  const eselon3List = selectedEselon2 
    ? data.filter(d => d.nama_unit === selectedEselon2).map(d => ({ id: d.tingkat_eselon, nama_unit: d.tingkat_eselon }))
    : [];
  const eselon4List = selectedEselon3
    ? data.filter(d => d.tingkat_eselon === selectedEselon3 && d.kode_unit).map(d => ({ id: d.kode_unit || '', nama_unit: d.kode_unit || '' }))
    : [];

  // Statistics data for pie chart - count unique entries
  const statisticsData = [
    { name: "Eselon II", value: uniqueEselon2.size, color: "#2563eb" },
    { name: "Eselon III", value: uniqueEselon3.size, color: "#16a34a" },
    { name: "Eselon IV", value: uniqueEselon4.size, color: "#ea580c" },
  ];

  // Get selected unit names
  const selectedEselon2Data = selectedEselon2 ? { nama_unit: selectedEselon2 } : null;
  const selectedEselon3Data = selectedEselon3 ? { nama_unit: selectedEselon3 } : null;
  const selectedEselon4Data = selectedEselon4 ? { nama_unit: selectedEselon4 } : null;

  // Export function
  const handleExport = () => {
    const exportData = data.map((item, index) => ({
      No: index + 1,
      "Nama Eselon II": item.nama_unit || "-",
      "Nama Eselon III": item.tingkat_eselon || "-",
      "Nama Eselon IV": item.kode_unit || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Eselonisasi");
    XLSX.writeFile(wb, "data_eselonisasi.xlsx");
    toast.success("Data berhasil diekspor");
  };

  // Import function - sync with Supabase
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const excelData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(excelData, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
        
        if (jsonData.length === 0) {
          toast.error("File Excel tidak memiliki data");
          event.target.value = "";
          return;
        }

        // Show loading notification
        toast.info(`Mengimpor ${jsonData.length} baris data...`);

        let successCount = 0;
        let errorCount = 0;

        // Get the current max no_urut
        const maxOrder = Math.max(0, ...data.map(d => d.no_urut || 0));

        // Process each row and insert to Supabase
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Map Excel columns to database fields
          // Expected columns: "Nama Eselon II", "Nama Eselon III", "Nama Eselon IV" or similar
          const eselon2 = row["Nama Eselon II"] || row["nama_unit"] || row["Eselon II"] || "";
          const eselon3 = row["Nama Eselon III"] || row["tingkat_eselon"] || row["Eselon III"] || "";
          const eselon4 = row["Nama Eselon IV"] || row["kode_unit"] || row["Eselon IV"] || "";

          // Skip empty rows
          if (!eselon2 && !eselon3) continue;

          const { error } = await supabase
            .from("eselonisasi")
            .insert({
              nama_unit: String(eselon2).trim(),
              tingkat_eselon: String(eselon3).trim(),
              kode_unit: eselon4 ? String(eselon4).trim() : null,
              no_urut: maxOrder + i + 1,
              is_active: true,
            });

          if (error) {
            console.error("Error inserting row:", error);
            errorCount++;
          } else {
            successCount++;
          }
        }

        // Show result notification
        if (successCount > 0) {
          toast.success(`${successCount} baris data berhasil diimpor`);
          fetchData(); // Refresh data from Supabase
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} baris data gagal diimpor`);
        }
        
        // Reset file input
        event.target.value = "";
      } catch (error) {
        console.error("Error importing:", error);
        toast.error("Gagal mengimpor data");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddEntry = async () => {
    if (!newEntry.eselon2.trim() || !newEntry.eselon3.trim()) {
      toast.error("Nama Eselon II dan Eselon III wajib diisi");
      return;
    }

    try {
      const maxOrder = Math.max(0, ...data.map(d => d.no_urut || 0));
      // Insert with all three eselon values in the record
      // We use nama_unit to store the combined info, tingkat_eselon for eselon3, kode_unit for eselon4
      const { error } = await supabase
        .from("eselonisasi")
        .insert({
          nama_unit: newEntry.eselon2.trim(), // Store eselon II name
          tingkat_eselon: newEntry.eselon3.trim(), // Store eselon III name
          kode_unit: newEntry.eselon4.trim() || null, // Store eselon IV name
          no_urut: maxOrder + 1,
          is_active: true,
        });

      if (error) throw error;
      toast.success("Data berhasil ditambahkan");
      setNewEntry({ eselon2: "", eselon3: "", eselon4: "" });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error adding entry:", error);
      toast.error("Gagal menambahkan data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("eselonisasi")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const handleDeleteAll = async () => {
    if (!isAdmin) {
      toast.error("Hanya admin yang dapat menghapus semua data");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA data eselonisasi? Tindakan ini tidak dapat dibatalkan!")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("eselonisasi")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setData([]);
      toast.success("Semua data eselonisasi berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus data: " + error.message);
    }
  };

  const startEdit = (item: Eselonisasi) => {
    setEditingId(item.id);
    setEditForm({ nama_unit: item.nama_unit, kode_unit: item.kode_unit || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ nama_unit: "", kode_unit: "" });
  };

  const saveEdit = async (id: string) => {
    try {
      const { error } = await supabase
        .from("eselonisasi")
        .update({ 
          nama_unit: editForm.nama_unit,
          kode_unit: editForm.kode_unit || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Data berhasil diperbarui");
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      console.error("Error updating entry:", error);
      toast.error("Gagal memperbarui data");
    }
  };

  const getEselonBadge = (tingkat: string) => {
    switch (tingkat) {
      case "eselon_2":
        return <Badge className="bg-blue-600">Eselon II</Badge>;
      case "eselon_3":
        return <Badge className="bg-green-600">Eselon III</Badge>;
      case "eselon_4":
        return <Badge className="bg-orange-600">Eselon IV</Badge>;
      default:
        return <Badge>{tingkat}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Statistik Unit Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statisticsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statisticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Summary Stats */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{uniqueEselon2.size}</p>
                  <p className="text-sm text-muted-foreground">Eselon II</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{uniqueEselon3.size}</p>
                  <p className="text-sm text-muted-foreground">Eselon III</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{uniqueEselon4.size}</p>
                  <p className="text-sm text-muted-foreground">Eselon IV</p>
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{data.length}</p>
                <p className="text-sm text-muted-foreground">Total Unit Organisasi</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hierarchy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Struktur Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Eselon 2 Dropdown */}
            <div className="space-y-2">
              <Label>Eselon II (Kantor Wilayah)</Label>
              <Select value={selectedEselon2} onValueChange={(val) => {
                setSelectedEselon2(val);
                setSelectedEselon3("");
                setSelectedEselon4("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kantor Wilayah" />
                </SelectTrigger>
                <SelectContent>
                  {eselon2List.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nama_unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Eselon 3 Dropdown */}
            <div className="space-y-2">
              <Label>Eselon III (Bagian)</Label>
              <Select 
                value={selectedEselon3} 
                onValueChange={(val) => {
                  setSelectedEselon3(val);
                  setSelectedEselon4("");
                }}
                disabled={!selectedEselon2}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Bagian" />
                </SelectTrigger>
                <SelectContent>
                  {eselon3List.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nama_unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Eselon 4 Dropdown */}
            <div className="space-y-2">
              <Label>Eselon IV (Subbagian)</Label>
              <Select 
                value={selectedEselon4} 
                onValueChange={setSelectedEselon4}
                disabled={!selectedEselon3}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Subbagian" />
                </SelectTrigger>
                <SelectContent>
                  {eselon4List.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nama_unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Hierarchy Display */}
          {selectedEselon2Data && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Hierarki Terpilih:</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-sm">{selectedEselon2Data.nama_unit}</Badge>
                {selectedEselon3Data && (
                  <>
                    <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                    <Badge variant="outline" className="text-sm">{selectedEselon3Data.nama_unit}</Badge>
                  </>
                )}
                {selectedEselon4Data && (
                  <>
                    <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                    <Badge variant="outline" className="text-sm">{selectedEselon4Data.nama_unit}</Badge>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daftar Unit Organisasi</CardTitle>
          <div className="flex gap-2">
            {/* Import Button */}
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Impor
              </Button>
            </div>
            {/* Export Button */}
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Ekspor
            </Button>
            {/* Delete All Button */}
            {isAdmin && (
              <Button variant="destructive" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Semua
              </Button>
            )}
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Unit Organisasi</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Nama Eselon II</Label>
                      <Select 
                        value={newEntry.eselon2}
                        onValueChange={(val) => setNewEntry({ ...newEntry, eselon2: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Nama Eselon II" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kantor Wilayah DJBC Jawa Timur I">Kantor Wilayah DJBC Jawa Timur I</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Eselon III</Label>
                      <Select 
                        value={newEntry.eselon3}
                        onValueChange={(val) => setNewEntry({ ...newEntry, eselon3: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Nama Eselon III" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bagian Umum">Bagian Umum</SelectItem>
                          <SelectItem value="Bidang Kepabeanan dan Cukai">Bidang Kepabeanan dan Cukai</SelectItem>
                          <SelectItem value="Bidang Fasilitas Kepabeanan dan Cukai">Bidang Fasilitas Kepabeanan dan Cukai</SelectItem>
                          <SelectItem value="Bidang Penindakan dan Penyidikan">Bidang Penindakan dan Penyidikan</SelectItem>
                          <SelectItem value="Bidang Kepatuhan Internal">Bidang Kepatuhan Internal</SelectItem>
                          <SelectItem value="KPPBC TMP Tanjung Perak">KPPBC TMP Tanjung Perak</SelectItem>
                          <SelectItem value="KPPBC TMP Juanda">KPPBC TMP Juanda</SelectItem>
                          <SelectItem value="KPPBC TMP A Pasuruan">KPPBC TMP A Pasuruan</SelectItem>
                          <SelectItem value="KPPBC TMP B Gresik">KPPBC TMP B Gresik</SelectItem>
                          <SelectItem value="KPPBC TMP B Sidoarjo">KPPBC TMP B Sidoarjo</SelectItem>
                          <SelectItem value="KPPBC TMP C Bojonegoro">KPPBC TMP C Bojonegoro</SelectItem>
                          <SelectItem value="KPPBC TMP C Madura">KPPBC TMP C Madura</SelectItem>
                          <SelectItem value="BLBC Kelas I Surabaya">BLBC Kelas I Surabaya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Eselon IV</Label>
                      <Input
                        value={newEntry.eselon4}
                        onChange={(e) => setNewEntry({ ...newEntry, eselon4: e.target.value })}
                        placeholder="Masukkan nama eselon IV"
                      />
                    </div>
                    <Button onClick={handleAddEntry} className="w-full">
                      Simpan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Eselon II</TableHead>
                <TableHead>Nama Eselon III</TableHead>
                <TableHead>Nama Eselon IV</TableHead>
                {canEdit && <TableHead className="w-24 text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 5 : 4} className="text-center text-muted-foreground">
                    Belum ada data
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          value={editForm.nama_unit}
                          onChange={(e) => setEditForm({ ...editForm, nama_unit: e.target.value })}
                        />
                      ) : (
                        item.nama_unit || "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {item.tingkat_eselon || "-"}
                    </TableCell>
                    <TableCell>
                      {editingId === item.id ? (
                        <Input
                          value={editForm.kode_unit}
                          onChange={(e) => setEditForm({ ...editForm, kode_unit: e.target.value })}
                          placeholder="Nama eselon IV"
                        />
                      ) : (
                        item.kode_unit || "-"
                      )}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {editingId === item.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => saveEdit(item.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEdit(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
