import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Download, Upload, Search, Building2, Home, Users, MapPin } from "lucide-react";
import * as XLSX from "xlsx";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Employee {
  id: string;
  nm_pegawai: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

interface RumahNegara {
  id: string;
  tanah_nup: string | null;
  kode_barang_rn: string | null;
  kode: string | null;
  nama_rumah: string | null;
  tipe_rn: string | null;
  kondisi: string | null;
  kep_psg: string | null;
  alamat: string | null;
  kelurahan: string | null;
  status_bersertifikat: string | null;
  penghuni: string | null;
  nama_penghuni_id: string | null;
  jabatan: string | null;
  unit_organisasi: string | null;
  golongan_tipe_kelas: string | null;
  created_at: string;
  updated_at: string;
}

const GOLONGAN_OPTIONS = [
  "Golongan I Tipe A Permanen",
  "Golongan II Tipe B Permanen",
  "Golongan II Tipe C Permanen",
  "Golongan II Tipe D Permanen",
  "Golongan II Tipe E Permanen"
];

const KONDISI_OPTIONS = ["Baik", "Rusak"];

const PENGHUNI_OPTIONS = [
  "ASN",
  "ASN (Lebih dari 1 Orang)",
  "PPNPN",
  "Pensiun",
  "Kosong"
];

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RumahNegaraPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin" || role === "super";
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState<RumahNegara[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RumahNegara | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [namaPenghuniText, setNamaPenghuniText] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    tanah_nup: "",
    kode_barang_rn: "",
    kode: "",
    tipe_rn: "",
    kondisi: "",
    kep_psg: "",
    alamat: "",
    kelurahan: "",
    status_bersertifikat: "",
    penghuni: "",
    nama_penghuni_id: "",
    jabatan: "",
    unit_organisasi: "",
    golongan_tipe_kelas: ""
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      const { data: rumahData, error } = await supabase
        .from("rumah_negara")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData((rumahData as RumahNegara[]) || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
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
        const { data: empData, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, uraian_jabatan, nm_unit_organisasi")
          .order("nm_pegawai", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (empData && empData.length > 0) {
          allEmployees = [...allEmployees, ...empData];
          from += batchSize;
          hasMore = empData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      setEmployees(allEmployees);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setFormData({
      tanah_nup: "",
      kode_barang_rn: "",
      kode: "",
      tipe_rn: "",
      kondisi: "",
      kep_psg: "",
      alamat: "",
      kelurahan: "",
      status_bersertifikat: "",
      penghuni: "",
      nama_penghuni_id: "",
      jabatan: "",
      unit_organisasi: "",
      golongan_tipe_kelas: ""
    });
    setEditingItem(null);
    setEmployeeSearch("");
    setNamaPenghuniText("");
  };

  const handleOpenDialog = (item?: RumahNegara) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        tanah_nup: item.tanah_nup || "",
        kode_barang_rn: item.kode_barang_rn || "",
        kode: item.kode || "",
        tipe_rn: item.tipe_rn || "",
        kondisi: item.kondisi || "",
        kep_psg: item.kep_psg || "",
        alamat: item.alamat || "",
        kelurahan: item.kelurahan || "",
        status_bersertifikat: item.status_bersertifikat || "",
        penghuni: item.penghuni || "",
        nama_penghuni_id: item.nama_penghuni_id || "",
        jabatan: item.jabatan || "",
        unit_organisasi: item.unit_organisasi || "",
        golongan_tipe_kelas: item.golongan_tipe_kelas || ""
      });
      // Find employee name for search
      const emp = employees.find(e => e.id === item.nama_penghuni_id);
      if (emp) {
        setEmployeeSearch(emp.nm_pegawai);
      } else if (item.penghuni && !["ASN", "ASN (Lebih dari 1 Orang)"].includes(item.penghuni)) {
        // For non-ASN types, find the name from jabatan field (we store text name there)
        setNamaPenghuniText(item.jabatan || "");
      }
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSelectEmployee = (emp: Employee) => {
    setFormData({
      ...formData,
      nama_penghuni_id: emp.id,
      jabatan: emp.uraian_jabatan,
      unit_organisasi: emp.nm_unit_organisasi
    });
    setEmployeeSearch(emp.nm_pegawai);
  };

  const handlePenghuniChange = (value: string) => {
    setFormData({
      ...formData,
      penghuni: value,
      nama_penghuni_id: "",
      jabatan: "",
      unit_organisasi: ""
    });
    setEmployeeSearch("");
    setNamaPenghuniText("");
  };

  const handleSubmit = async () => {
    try {
      // For non-ASN types, store the text name in jabatan field
      const isASNType = formData.penghuni === "ASN" || formData.penghuni === "ASN (Lebih dari 1 Orang)";
      
      const payload = {
        tanah_nup: formData.tanah_nup || null,
        kode_barang_rn: formData.kode_barang_rn || null,
        kode: formData.kode || null,
        nama_rumah: null, // Removed field
        tipe_rn: formData.tipe_rn || null,
        kondisi: formData.kondisi || null,
        kep_psg: formData.kep_psg || null,
        alamat: formData.alamat || null,
        kelurahan: formData.kelurahan || null,
        status_bersertifikat: formData.status_bersertifikat || null,
        penghuni: formData.penghuni || null,
        nama_penghuni_id: isASNType ? (formData.nama_penghuni_id || null) : null,
        jabatan: isASNType ? (formData.jabatan || null) : (namaPenghuniText || null), // Store text name for non-ASN
        unit_organisasi: isASNType ? (formData.unit_organisasi || null) : null,
        golongan_tipe_kelas: formData.golongan_tipe_kelas || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from("rumah_negara")
          .update(payload)
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("rumah_negara")
          .insert([payload]);

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menyimpan data: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("rumah_negara")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus data: " + error.message);
    } finally {
      setDeleteId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await supabase
        .from("rumah_negara")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
      toast.success("Semua data berhasil dihapus");
      setDeleteAllDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Gagal menghapus semua data: " + error.message);
    }
  };

  const handleExport = () => {
    const exportData = data.map((item, index) => ({
      "No": index + 1,
      "Tanah NUP": item.tanah_nup || "",
      "Kode Barang RN": item.kode_barang_rn || "",
      "Kode": item.kode || "",
      "Tipe RN": item.tipe_rn || "",
      "Kondisi": item.kondisi || "",
      "KEP PSG": item.kep_psg || "",
      "Alamat": item.alamat || "",
      "Kelurahan": item.kelurahan || "",
      "Status Bersertifikat": item.status_bersertifikat || "",
      "Penghuni": item.penghuni || "",
      "Nama Penghuni": getNamaPenghuni(item),
      "Jabatan": item.jabatan || "",
      "Unit Organisasi": item.unit_organisasi || "",
      "Golongan Tipe Kelas": item.golongan_tipe_kelas || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rumah Negara");
    XLSX.writeFile(wb, `rumah_negara_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const importData = jsonData.map((row: any) => ({
          tanah_nup: row["Tanah NUP"] || null,
          kode_barang_rn: row["Kode Barang RN"] || null,
          kode: row["Kode"] || null,
          tipe_rn: row["Tipe RN"] || null,
          kondisi: row["Kondisi"] || null,
          kep_psg: row["KEP PSG"] || null,
          alamat: row["Alamat"] || null,
          kelurahan: row["Kelurahan"] || null,
          status_bersertifikat: row["Status Bersertifikat"] || null,
          penghuni: row["Penghuni"] || null,
          golongan_tipe_kelas: row["Golongan Tipe Kelas"] || null
        }));

        const { error } = await supabase
          .from("rumah_negara")
          .insert(importData);

        if (error) throw error;
        toast.success(`${importData.length} data berhasil diimpor`);
        fetchData();
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      toast.error("Gagal mengimpor data: " + error.message);
    }

    // Reset input
    event.target.value = "";
  };

  const getNamaPenghuni = (item: RumahNegara): string => {
    if (item.penghuni === "ASN" || item.penghuni === "ASN (Lebih dari 1 Orang)") {
      return employees.find(e => e.id === item.nama_penghuni_id)?.nm_pegawai || "-";
    }
    return item.jabatan || "-"; // For non-ASN, name is stored in jabatan
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const namaPenghuni = getNamaPenghuni(item).toLowerCase();
    return (
      namaPenghuni.includes(searchLower) ||
      (item.alamat?.toLowerCase().includes(searchLower) || false) ||
      (item.kelurahan?.toLowerCase().includes(searchLower) || false) ||
      (item.penghuni?.toLowerCase().includes(searchLower) || false) ||
      (item.kode?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Filter employees based on search term - show max 50 results for performance
  const filteredEmployees = employeeSearch.trim().length > 0
    ? employees.filter((emp) =>
        emp.nm_pegawai.toLowerCase().includes(employeeSearch.toLowerCase())
      ).slice(0, 50)
    : [];

  // Dashboard statistics
  const stats = {
    total: data.length,
    byPenghuni: PENGHUNI_OPTIONS.map(type => ({
      name: type,
      value: data.filter(d => d.penghuni === type).length
    })),
    byKelurahan: Array.from(new Set(data.map(d => d.kelurahan).filter(Boolean))).map(kelurahan => ({
      name: kelurahan || "Tidak Diketahui",
      value: data.filter(d => d.kelurahan === kelurahan).length
    })),
    kosong: data.filter(d => d.penghuni === "Kosong").length,
    terisi: data.filter(d => d.penghuni && d.penghuni !== "Kosong").length,
    byKondisi: [
      { name: "Baik", value: data.filter(d => d.kondisi === "Baik").length },
      { name: "Rusak", value: data.filter(d => d.kondisi === "Rusak").length }
    ]
  };

  const isASNType = formData.penghuni === "ASN" || formData.penghuni === "ASN (Lebih dari 1 Orang)";

  if (authLoading || loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Beranda", path: "/" }, { label: "Rumah Negara" }]}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Beranda", path: "/" }, { label: "Rumah Negara" }]}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="data">Data Rumah Negara</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rumah Negara</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terisi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.terisi}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kosong</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.kosong}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lokasi/Jalan</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byKelurahan.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Berdasarkan Tipe Penghuni</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byPenghuni.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.byPenghuni.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Berdasarkan Kondisi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byKondisi}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Jumlah" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Berdasarkan Kelurahan/Jalan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kelurahan/Jalan</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-right">Persentase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.byKelurahan.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.value}</TableCell>
                          <TableCell className="text-right">
                            {stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Data Rumah Negara
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  {isAdmin && (
                    <>
                      <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleImport}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </Button>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={() => setDeleteAllDialogOpen(true)}
                        disabled={data.length === 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Semua
                      </Button>
                      <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Data
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Tanah NUP</TableHead>
                      <TableHead>Kode Barang RN</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Tipe RN</TableHead>
                      <TableHead>Kondisi</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Kelurahan</TableHead>
                      <TableHead>Penghuni</TableHead>
                      <TableHead>Nama Penghuni</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Unit Organisasi</TableHead>
                      <TableHead>Golongan Tipe Kelas</TableHead>
                      {isAdmin && <TableHead className="w-24">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.tanah_nup}</TableCell>
                          <TableCell>{item.kode_barang_rn}</TableCell>
                          <TableCell>{item.kode}</TableCell>
                          <TableCell>{item.tipe_rn}</TableCell>
                          <TableCell>{item.kondisi}</TableCell>
                          <TableCell>{item.alamat}</TableCell>
                          <TableCell>{item.kelurahan}</TableCell>
                          <TableCell>{item.penghuni}</TableCell>
                          <TableCell>{getNamaPenghuni(item)}</TableCell>
                          <TableCell>
                            {(item.penghuni === "ASN" || item.penghuni === "ASN (Lebih dari 1 Orang)") ? item.jabatan : "-"}
                          </TableCell>
                          <TableCell>
                            {(item.penghuni === "ASN" || item.penghuni === "ASN (Lebih dari 1 Orang)") ? item.unit_organisasi : "-"}
                          </TableCell>
                          <TableCell>{item.golongan_tipe_kelas}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDialog(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(item.id)}
                                >
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Data Rumah Negara" : "Tambah Data Rumah Negara"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tanah NUP</Label>
              <Input
                value={formData.tanah_nup}
                onChange={(e) => setFormData({ ...formData, tanah_nup: e.target.value })}
                placeholder="Masukkan Tanah NUP"
              />
            </div>
            <div className="space-y-2">
              <Label>Kode Barang RN</Label>
              <Input
                value={formData.kode_barang_rn}
                onChange={(e) => setFormData({ ...formData, kode_barang_rn: e.target.value })}
                placeholder="Masukkan Kode Barang RN"
              />
            </div>
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Masukkan Kode"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe RN</Label>
              <Input
                value={formData.tipe_rn}
                onChange={(e) => setFormData({ ...formData, tipe_rn: e.target.value })}
                placeholder="Contoh: A/250"
              />
            </div>
            <div className="space-y-2">
              <Label>Kondisi</Label>
              <Select
                value={formData.kondisi}
                onValueChange={(value) => setFormData({ ...formData, kondisi: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kondisi" />
                </SelectTrigger>
                <SelectContent>
                  {KONDISI_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>KEP PSG</Label>
              <Input
                value={formData.kep_psg}
                onChange={(e) => setFormData({ ...formData, kep_psg: e.target.value })}
                placeholder="Masukkan KEP PSG"
              />
            </div>
            <div className="space-y-2">
              <Label>Alamat</Label>
              <Input
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Masukkan Alamat"
              />
            </div>
            <div className="space-y-2">
              <Label>Kelurahan</Label>
              <Input
                value={formData.kelurahan}
                onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                placeholder="Masukkan Kelurahan"
              />
            </div>
            <div className="space-y-2">
              <Label>Status Bersertifikat</Label>
              <Input
                value={formData.status_bersertifikat}
                onChange={(e) => setFormData({ ...formData, status_bersertifikat: e.target.value })}
                placeholder="Masukkan Status Bersertifikat"
              />
            </div>
            <div className="space-y-2">
              <Label>Penghuni</Label>
              <Select
                value={formData.penghuni}
                onValueChange={handlePenghuniChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe Penghuni" />
                </SelectTrigger>
                <SelectContent>
                  {PENGHUNI_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Conditional Nama Penghuni field based on penghuni type */}
            {isASNType ? (
              <div className="space-y-2">
                <Label>Nama Penghuni (dari Daftar Pegawai)</Label>
                <div className="relative">
                  <Input
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    placeholder="Cari nama pegawai..."
                  />
                  {employeeSearch && filteredEmployees.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          className="p-2 hover:bg-muted cursor-pointer"
                          onClick={() => handleSelectEmployee(emp)}
                        >
                          <div className="font-medium">{emp.nm_pegawai}</div>
                          <div className="text-xs text-muted-foreground">{emp.uraian_jabatan}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : formData.penghuni && formData.penghuni !== "Kosong" ? (
              <div className="space-y-2">
                <Label>Nama Penghuni</Label>
                <Input
                  value={namaPenghuniText}
                  onChange={(e) => setNamaPenghuniText(e.target.value)}
                  placeholder="Masukkan nama penghuni"
                />
              </div>
            ) : null}

            {isASNType && (
              <>
                <div className="space-y-2">
                  <Label>Jabatan (Otomatis)</Label>
                  <Input
                    value={formData.jabatan}
                    readOnly
                    className="bg-muted"
                    placeholder="Otomatis terisi dari nama penghuni"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Organisasi (Otomatis)</Label>
                  <Input
                    value={formData.unit_organisasi}
                    readOnly
                    className="bg-muted"
                    placeholder="Otomatis terisi dari nama penghuni"
                  />
                </div>
              </>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Golongan Tipe Kelas</Label>
              <Select
                value={formData.golongan_tipe_kelas}
                onValueChange={(value) => setFormData({ ...formData, golongan_tipe_kelas: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Golongan Tipe Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {GOLONGAN_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit}>
              {editingItem ? "Simpan Perubahan" : "Tambah"}
            </Button>
          </DialogFooter>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Data</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus SEMUA data rumah negara ({data.length} data)? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
              Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
