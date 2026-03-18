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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Download, Upload, Trash2, Search, Edit } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";

interface MonitorPBDK {
  id: string;
  no_urut: number;
  employee_id: string | null;
  nama_pegawai: string;
  nip: string | null;
  uraian_jabatan: string | null;
  jabatan: string | null;
  jenis_perubahan_data: string;
  detail_data: string | null;
  status_hris: string;
  tanggal_input_hris: string | null;
  status_pbdk: string;
  tanggal_pbdk: string | null;
  nama_petugas: string | null;
  petugas_id: string | null;
  keterangan: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string | null;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface TimUPK {
  id: string;
  name: string;
}

export default function MonitorPBDKDatabase() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin" || role === "super";
  const { toast } = useToast();
  const [data, setData] = useState<MonitorPBDK[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timUpk, setTimUpk] = useState<TimUPK[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonitorPBDK | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    employee_id: "",
    nama_pegawai: "",
    nip: "",
    uraian_jabatan: "",
    jabatan: "",
    jenis_perubahan_data: "",
    detail_data: "",
    status_hris: "Belum",
    tanggal_input_hris: "",
    status_pbdk: "Belum",
    tanggal_pbdk: "",
    nama_petugas: "",
    petugas_id: "",
    keterangan: ""
  });

  // Filter employees based on search term
  const filteredEmployees = employees.filter(emp =>
    emp.nm_pegawai.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    (emp.nip && emp.nip.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchData();
    fetchEmployees();
    fetchTimUpk();
  }, []);

  const fetchData = async () => {
    try {
      const { data: pbdkData, error } = await supabase
        .from("monitor_pbdk")
        .select("*")
        .order("no_urut", { ascending: true });

      if (error) throw error;
      setData(pbdkData || []);
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

  const fetchEmployees = async () => {
    try {
      // Fetch all employees with pagination to avoid 1000 row limit
      let allEmployees: Employee[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, uraian_jabatan, nm_unit_organisasi")
          .order("nm_pegawai")
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allEmployees = [...allEmployees, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      setEmployees(allEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTimUpk = async () => {
    try {
      const { data, error } = await supabase
        .from("tim_upk")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTimUpk(data || []);
    } catch (error) {
      console.error("Error fetching Tim UPK:", error);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employee_id: employeeId,
        nama_pegawai: employee.nm_pegawai,
        nip: employee.nip || "",
        uraian_jabatan: employee.uraian_jabatan || "",
        jabatan: employee.nm_unit_organisasi || ""
      }));
    }
  };

  const handlePetugasChange = (petugasId: string) => {
    const petugas = timUpk.find(t => t.id === petugasId);
    if (petugas) {
      setFormData(prev => ({
        ...prev,
        petugas_id: petugasId,
        nama_petugas: petugas.name
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      nama_pegawai: "",
      nip: "",
      uraian_jabatan: "",
      jabatan: "",
      jenis_perubahan_data: "",
      detail_data: "",
      status_hris: "Belum",
      tanggal_input_hris: "",
      status_pbdk: "Belum",
      tanggal_pbdk: "",
      nama_petugas: "",
      petugas_id: "",
      keterangan: ""
    });
    setEditingItem(null);
    setEmployeeSearchTerm("");
  };

  const handleSubmit = async () => {
    if (!formData.nama_pegawai || !formData.jenis_perubahan_data) {
      toast({
        title: "Error",
        description: "Nama pegawai dan jenis perubahan data wajib diisi",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        employee_id: formData.employee_id || null,
        nama_pegawai: formData.nama_pegawai,
        nip: formData.nip || null,
        uraian_jabatan: formData.uraian_jabatan || null,
        jabatan: formData.jabatan || null,
        jenis_perubahan_data: formData.jenis_perubahan_data,
        detail_data: formData.detail_data || null,
        status_hris: formData.status_hris,
        tanggal_input_hris: formData.tanggal_input_hris || null,
        status_pbdk: formData.status_pbdk,
        tanggal_pbdk: formData.tanggal_pbdk || null,
        nama_petugas: formData.nama_petugas || null,
        petugas_id: formData.petugas_id || null,
        keterangan: formData.keterangan || null,
        created_by_email: user?.email
      };

      if (editingItem) {
        const { error } = await supabase
          .from("monitor_pbdk")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast({ title: "Sukses", description: "Data berhasil diperbarui" });
      } else {
        const { error } = await supabase
          .from("monitor_pbdk")
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

  const handleEdit = (item: MonitorPBDK) => {
    setEditingItem(item);
    setFormData({
      employee_id: item.employee_id || "",
      nama_pegawai: item.nama_pegawai,
      nip: item.nip || "",
      uraian_jabatan: item.uraian_jabatan || "",
      jabatan: item.jabatan || "",
      jenis_perubahan_data: item.jenis_perubahan_data,
      detail_data: item.detail_data || "",
      status_hris: item.status_hris,
      tanggal_input_hris: item.tanggal_input_hris || "",
      status_pbdk: item.status_pbdk,
      tanggal_pbdk: item.tanggal_pbdk || "",
      nama_petugas: item.nama_petugas || "",
      petugas_id: item.petugas_id || "",
      keterangan: item.keterangan || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from("monitor_pbdk")
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
        .from("monitor_pbdk")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

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
      "Nama Pegawai": item.nama_pegawai,
      NIP: item.nip || "",
      "Uraian Jabatan": item.uraian_jabatan || "",
      Jabatan: item.jabatan || "",
      "Jenis Perubahan Data": item.jenis_perubahan_data,
      "Detail Data": item.detail_data || "",
      "Status HRIS": item.status_hris,
      "Tanggal Input HRIS": item.tanggal_input_hris ? format(new Date(item.tanggal_input_hris), "dd/MM/yyyy") : "",
      "Status PBDK": item.status_pbdk,
      "Tanggal PBDK": item.tanggal_pbdk ? format(new Date(item.tanggal_pbdk), "dd/MM/yyyy") : "",
      "Nama Petugas": item.nama_petugas || "",
      Keterangan: item.keterangan || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monitor PBDK");
    XLSX.writeFile(wb, `Monitor_PBDK_${format(new Date(), "yyyyMMdd")}.xlsx`);

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
          nama_pegawai: row["Nama Pegawai"] || row["nama_pegawai"] || "",
          nip: row["NIP"] || row["nip"] || null,
          jenis_perubahan_data: row["Jenis Perubahan Data"] || row["jenis_perubahan_data"] || "KGB",
          detail_data: row["Detail Data"] || row["detail_data"] || null,
          status_hris: row["Status HRIS"] || row["status_hris"] || row["Status Input HRIS"] || "Belum",
          tanggal_input_hris: parseExcelDate(row["Tanggal Input HRIS"] || row["tanggal_input_hris"]),
          status_pbdk: row["Status PBDK"] || row["status_pbdk"] || "Belum",
          tanggal_pbdk: parseExcelDate(row["Tanggal PBDK"] || row["tanggal_pbdk"]),
          nama_petugas: row["Nama Petugas PBDK"] || row["Nama Petugas"] || row["nama_petugas"] || null,
          keterangan: row["Keterangan"] || row["keterangan"] || null,
          created_by_email: user?.email
        })).filter((item: any) => item.nama_pegawai);

        if (importedData.length === 0) {
          toast({
            title: "Error",
            description: "Tidak ada data valid untuk diimpor",
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase
          .from("monitor_pbdk")
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
    
    // If it's a number (Excel serial date)
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return format(date, "yyyy-MM-dd");
    }
    
    // If it's a string like "05/01/2025"
    if (typeof value === "string") {
      const parts = value.split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    
    return null;
  };

  const filteredData = data.filter(item =>
    item.nama_pegawai.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenis_perubahan_data.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nama_petugas?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <CardTitle>Database Monitor PBDK</CardTitle>
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
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah Data
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Data PBDK" : "Tambah Data PBDK"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Pegawai *</Label>
                      <Select
                        value={formData.employee_id}
                        onValueChange={handleEmployeeChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pegawai..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <div className="p-2 sticky top-0 bg-background z-10">
                            <Input
                              placeholder="Cari nama pegawai..."
                              value={employeeSearchTerm}
                              onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                              className="h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {filteredEmployees.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              Tidak ada pegawai ditemukan
                            </div>
                          ) : (
                            filteredEmployees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.nm_pegawai}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>NIP</Label>
                      <Input
                        value={formData.nip}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Uraian Jabatan</Label>
                      <Input
                        value={formData.uraian_jabatan}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jabatan (Unit Organisasi)</Label>
                      <Input
                        value={formData.jabatan}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Jenis Perubahan Data *</Label>
                      <Select
                        value={formData.jenis_perubahan_data}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, jenis_perubahan_data: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Keluarga Tertanggung">Keluarga Tertanggung</SelectItem>
                          <SelectItem value="KGB">KGB</SelectItem>
                          <SelectItem value="Pangkat">Pangkat</SelectItem>
                          <SelectItem value="Pendidikan">Pendidikan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Detail Data</Label>
                      <Input
                        value={formData.detail_data}
                        onChange={(e) => setFormData(prev => ({ ...prev, detail_data: e.target.value }))}
                        placeholder="Masukkan detail..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status HRIS</Label>
                      <Select
                        value={formData.status_hris}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status_hris: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sudah">Sudah</SelectItem>
                          <SelectItem value="Belum">Belum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Input HRIS</Label>
                      <Input
                        type="date"
                        value={formData.tanggal_input_hris}
                        onChange={(e) => setFormData(prev => ({ ...prev, tanggal_input_hris: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status PBDK</Label>
                      <Select
                        value={formData.status_pbdk}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status_pbdk: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sudah">Sudah</SelectItem>
                          <SelectItem value="Belum">Belum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal PBDK</Label>
                      <Input
                        type="date"
                        value={formData.tanggal_pbdk}
                        onChange={(e) => setFormData(prev => ({ ...prev, tanggal_pbdk: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Petugas</Label>
                      <Select
                        value={formData.petugas_id}
                        onValueChange={handlePetugasChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih petugas..." />
                        </SelectTrigger>
                        <SelectContent>
                          {timUpk.map(upk => (
                            <SelectItem key={upk.id} value={upk.id}>
                              {upk.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Keterangan</Label>
                      <Input
                        value={formData.keterangan}
                        onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
                        placeholder="Keterangan tambahan..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}>
                      Batal
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingItem ? "Perbarui" : "Simpan"}
                    </Button>
                  </div>
                </div>
                </DialogContent>
              </Dialog>
            )}
            {isAdmin && (
              <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
            )}
            {isAdmin && (
              <label>
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            )}
            {isAdmin && (
              <Button
                variant="destructive"
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
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[calc(100vh-320px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead className="min-w-[120px]">Nama Pegawai</TableHead>
                <TableHead className="w-[100px]">NIP</TableHead>
                <TableHead className="w-[100px]">Jenis</TableHead>
                <TableHead className="w-[100px]">Detail</TableHead>
                <TableHead className="w-[70px]">HRIS</TableHead>
                <TableHead className="w-[90px]">Tgl HRIS</TableHead>
                <TableHead className="w-[70px]">PBDK</TableHead>
                <TableHead className="w-[90px]">Tgl PBDK</TableHead>
                <TableHead className="w-[100px]">Petugas</TableHead>
                <TableHead className="w-[100px]">Ket</TableHead>
                {isAdmin && <TableHead className="w-16">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 12 : 11} className="text-center py-8 text-gray-500">
                    {searchTerm ? "Tidak ada data yang sesuai pencarian" : "Belum ada data"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2">{index + 1}</TableCell>
                    <TableCell className="font-medium py-2 truncate max-w-[120px]" title={item.nama_pegawai}>{item.nama_pegawai}</TableCell>
                    <TableCell className="py-2 text-xs">{item.nip || "-"}</TableCell>
                    <TableCell className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        item.jenis_perubahan_data === "KGB" ? "bg-blue-100 text-blue-700" :
                        item.jenis_perubahan_data === "Keluarga Tertanggung" ? "bg-green-100 text-green-700" :
                        item.jenis_perubahan_data === "Pangkat" ? "bg-purple-100 text-purple-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {item.jenis_perubahan_data === "Keluarga Tertanggung" ? "K.T" : item.jenis_perubahan_data}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate py-2 text-xs" title={item.detail_data || ""}>
                      {item.detail_data || "-"}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        item.status_hris === "Sudah" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {item.status_hris === "Sudah" ? "✓" : "✗"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {item.tanggal_input_hris ? format(new Date(item.tanggal_input_hris), "dd/MM/yy") : "-"}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        item.status_pbdk === "Sudah" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {item.status_pbdk === "Sudah" ? "✓" : "✗"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {item.tanggal_pbdk ? format(new Date(item.tanggal_pbdk), "dd/MM/yy") : "-"}
                    </TableCell>
                    <TableCell className="py-2 text-xs truncate max-w-[100px]" title={item.nama_petugas || ""}>{item.nama_petugas || "-"}</TableCell>
                    <TableCell className="max-w-[100px] truncate py-2 text-xs" title={item.keterangan || ""}>
                      {item.keterangan || "-"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-2">
                        <div className="flex gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                            onClick={() => {
                              setItemToDelete(item.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <div className="px-4 py-2 border-t text-sm text-muted-foreground">
          Total: {filteredData.length} data
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data PBDK ({data.length} data)? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-500 hover:bg-red-600">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
