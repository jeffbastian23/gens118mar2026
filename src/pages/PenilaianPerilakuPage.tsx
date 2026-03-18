import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, Plus, Search, Edit, Trash2, Download, Upload, Users, CheckCircle, XCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import logoKemenkeu from "@/assets/logo-kemenkeu.png";
import logoCustoms from "@/assets/logo-customs.png";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import NotificationBell from "@/components/NotificationBell";
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

interface MonitoringData {
  id: string;
  no_urut: number;
  nama_lengkap: string;
  nip: string;
  status_pengajuan: string;
  status_penetapan: string;
  status_penilaian: string;
  created_at?: string;
}

const STATUS_PENGAJUAN_OPTIONS = ["Belum Mengajukan", "Sudah Mengajukan"];
const STATUS_PENETAPAN_OPTIONS = ["Belum Ditetapkan", "Sudah Ditetapkan"];

export default function PenilaianPerilakuPage() {
  const { user, role, fullName, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role === "admin";

  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<MonitoringData | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nip: "",
    status_pengajuan: "Belum Mengajukan",
    status_penetapan: "Belum Ditetapkan",
    status_penilaian: "Menilai 0 dari 0",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchMonitoringData();
    fetchEmployees();
  }, []);

  // Fetch all data with pagination to handle >1000 rows
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      let allData: MonitoringData[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("monitoring_penilaian_perilaku")
          .select("*")
          .order("no_urut", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += batchSize;
          hasMore = data.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      setMonitoringData(allData);
    } catch (error: any) {
      console.error("Error fetching monitoring data:", error);
      toast.error("Gagal memuat data monitoring");
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees to get satuan kerja by NIP
  const fetchEmployees = async () => {
    try {
      let allEmployees: any[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("employees")
          .select("nip, nm_unit_organisasi")
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

      // Create NIP -> satuan kerja map
      const nipToSatuanKerja: Record<string, string> = {};
      allEmployees.forEach(emp => {
        if (emp.nip) {
          nipToSatuanKerja[emp.nip] = emp.nm_unit_organisasi || "Tidak Diketahui";
        }
      });
      setEmployeesMap(nipToSatuanKerja);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  // Dashboard statistics
  const dashboardStats = useMemo(() => {
    const total = monitoringData.length;
    
    // Status Pengajuan
    const sudahMengajukan = monitoringData.filter(d => d.status_pengajuan === "Sudah Mengajukan").length;
    const belumMengajukan = total - sudahMengajukan;
    
    // Status Penetapan
    const sudahDitetapkan = monitoringData.filter(d => d.status_penetapan === "Sudah Ditetapkan").length;
    const belumDitetapkan = total - sudahDitetapkan;
    
    // Status Penilaian - parse "Menilai X dari Y" format
    const penilaianComplete = monitoringData.filter(d => {
      const match = d.status_penilaian?.match(/Menilai\s+(\d+)\s+dari\s+(\d+)/i);
      if (match) {
        const done = parseInt(match[1]);
        const total = parseInt(match[2]);
        return done === total && total > 0;
      }
      return false;
    }).length;
    const penilaianIncomplete = total - penilaianComplete;
    
    // Cluster by satuan kerja
    const satuanKerjaStats: Record<string, { total: number; pengajuan: number; penetapan: number; penilaian: number }> = {};
    
    monitoringData.forEach(d => {
      const satuanKerja = d.nip && employeesMap[d.nip] ? employeesMap[d.nip] : "Tidak Diketahui";
      
      if (!satuanKerjaStats[satuanKerja]) {
        satuanKerjaStats[satuanKerja] = { total: 0, pengajuan: 0, penetapan: 0, penilaian: 0 };
      }
      
      satuanKerjaStats[satuanKerja].total++;
      
      if (d.status_pengajuan === "Sudah Mengajukan") {
        satuanKerjaStats[satuanKerja].pengajuan++;
      }
      
      if (d.status_penetapan === "Sudah Ditetapkan") {
        satuanKerjaStats[satuanKerja].penetapan++;
      }
      
      const match = d.status_penilaian?.match(/Menilai\s+(\d+)\s+dari\s+(\d+)/i);
      if (match) {
        const done = parseInt(match[1]);
        const totalPenilaian = parseInt(match[2]);
        if (done === totalPenilaian && totalPenilaian > 0) {
          satuanKerjaStats[satuanKerja].penilaian++;
        }
      }
    });
    
    return {
      total,
      pengajuan: { sudah: sudahMengajukan, belum: belumMengajukan, persen: total > 0 ? (sudahMengajukan / total) * 100 : 0 },
      penetapan: { sudah: sudahDitetapkan, belum: belumDitetapkan, persen: total > 0 ? (sudahDitetapkan / total) * 100 : 0 },
      penilaian: { complete: penilaianComplete, incomplete: penilaianIncomplete, persen: total > 0 ? (penilaianComplete / total) * 100 : 0 },
      satuanKerja: satuanKerjaStats,
    };
  }, [monitoringData, employeesMap]);

  const resetForm = () => {
    setFormData({
      nama_lengkap: "",
      nip: "",
      status_pengajuan: "Belum Mengajukan",
      status_penetapan: "Belum Ditetapkan",
      status_penilaian: "Menilai 0 dari 0",
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.nama_lengkap) {
        toast.error("Nama lengkap wajib diisi");
        return;
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      if (editingData) {
        const { error } = await supabase
          .from("monitoring_penilaian_perilaku")
          .update({
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip,
            status_pengajuan: formData.status_pengajuan,
            status_penetapan: formData.status_penetapan,
            status_penilaian: formData.status_penilaian,
          })
          .eq("id", editingData.id);

        if (error) throw error;
        toast.success("Data berhasil diperbarui");
      } else {
        // Get next no_urut
        const { data: maxData } = await supabase
          .from("monitoring_penilaian_perilaku")
          .select("no_urut")
          .order("no_urut", { ascending: false })
          .limit(1);

        const nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut)
          ? maxData[0].no_urut + 1
          : 1;

        const { error } = await supabase
          .from("monitoring_penilaian_perilaku")
          .insert({
            no_urut: nextNoUrut,
            nama_lengkap: formData.nama_lengkap,
            nip: formData.nip,
            status_pengajuan: formData.status_pengajuan,
            status_penetapan: formData.status_penetapan,
            status_penilaian: formData.status_penilaian,
            created_by_email: userEmail,
          });

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      fetchMonitoringData();
      setDialogOpen(false);
      setEditingData(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleEdit = (data: MonitoringData) => {
    setEditingData(data);
    setFormData({
      nama_lengkap: data.nama_lengkap,
      nip: data.nip || "",
      status_pengajuan: data.status_pengajuan || "Belum Mengajukan",
      status_penetapan: data.status_penetapan || "Belum Ditetapkan",
      status_penilaian: data.status_penilaian || "Menilai 0 dari 0",
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("monitoring_penilaian_perilaku")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      fetchMonitoringData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map((data, index) => ({
      "No": data.no_urut || index + 1,
      "Nama": data.nama_lengkap,
      "NIP": data.nip,
      "Status Pengajuan": data.status_pengajuan,
      "Status Penetapan": data.status_penetapan,
      "Status Penilaian": data.status_penilaian,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monitoring Penilaian Perilaku");
    XLSX.writeFile(wb, `Monitoring_Penilaian_Perilaku_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const userEmail = currentUser?.email || "unknown";

      // Get max no_urut
      const { data: maxData } = await supabase
        .from("monitoring_penilaian_perilaku")
        .select("no_urut")
        .order("no_urut", { ascending: false })
        .limit(1);

      let nextNoUrut = (maxData && maxData.length > 0 && maxData[0].no_urut)
        ? maxData[0].no_urut + 1
        : 1;

      const insertData = jsonData.map((row: any) => ({
        no_urut: nextNoUrut++,
        nama_lengkap: row["Nama"] || row["nama_lengkap"] || "",
        nip: String(row["NIP"] || row["nip"] || ""),
        status_pengajuan: row["Status Pengajuan"] || row["status_pengajuan"] || "Belum Mengajukan",
        status_penetapan: row["Status Penetapan"] || row["status_penetapan"] || "Belum Ditetapkan",
        status_penilaian: row["Status Penilaian"] || row["status_penilaian"] || "Menilai 0 dari 0",
        created_by_email: userEmail,
      })).filter(item => item.nama_lengkap);

      if (insertData.length === 0) {
        toast.error("Tidak ada data valid untuk diimpor");
        return;
      }

      const { error } = await supabase.from("monitoring_penilaian_perilaku").insert(insertData);
      if (error) throw error;

      toast.success(`${insertData.length} data berhasil diimpor`);
      fetchMonitoringData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengimpor data");
    }

    e.target.value = "";
  };

  const filteredData = monitoringData.filter(d =>
    !searchTerm ||
    d.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.nip && d.nip.includes(searchTerm))
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <img src={logoKemenkeu} alt="Kementerian Keuangan" className="h-14 w-auto drop-shadow-lg" />
              <img src={logoCustoms} alt="Customs" className="h-12 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold">Penilaian Perilaku</h1>
                <p className="text-sm text-blue-100">Monitoring Penilaian Perilaku Kerja Pegawai</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{fullName || user?.email}</p>
                <p className="text-xs text-blue-100">{role === "admin" ? "Administrator" : role === "overview" ? "Overview" : "Pengguna"}</p>
              </div>
              <NotificationBell />
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="text-white hover:bg-white/20 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Panel Admin
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 gap-2"
              >
                <Home className="h-5 w-5" />
                Beranda
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                className="text-white hover:bg-white/20"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Pengajuan Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Status Pengajuan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Sudah Mengajukan</span>
                      </div>
                      <span className="font-bold text-green-600">{dashboardStats.pengajuan.sudah}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Belum Mengajukan</span>
                      </div>
                      <span className="font-bold text-red-600">{dashboardStats.pengajuan.belum}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className={dashboardStats.pengajuan.persen >= 50 ? "text-green-600" : "text-red-600"}>
                          {dashboardStats.pengajuan.persen.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={dashboardStats.pengajuan.persen} 
                        className="h-2"
                        style={{ 
                          backgroundColor: 'hsl(var(--muted))',
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Penetapan Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Status Penetapan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Sudah Ditetapkan</span>
                      </div>
                      <span className="font-bold text-green-600">{dashboardStats.penetapan.sudah}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Belum Ditetapkan</span>
                      </div>
                      <span className="font-bold text-red-600">{dashboardStats.penetapan.belum}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className={dashboardStats.penetapan.persen >= 50 ? "text-green-600" : "text-red-600"}>
                          {dashboardStats.penetapan.persen.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={dashboardStats.penetapan.persen} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Penilaian Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Status Penilaian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Selesai Menilai</span>
                      </div>
                      <span className="font-bold text-green-600">{dashboardStats.penilaian.complete}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Belum Selesai</span>
                      </div>
                      <span className="font-bold text-red-600">{dashboardStats.penilaian.incomplete}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className={dashboardStats.penilaian.persen >= 50 ? "text-green-600" : "text-red-600"}>
                          {dashboardStats.penilaian.persen.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={dashboardStats.penilaian.persen} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Total Data Info */}
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>Total Data: <strong className="text-foreground">{dashboardStats.total}</strong> pegawai</span>
              </div>
            </Card>

            {/* Satuan Kerja Cluster Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Statistik per Satuan Kerja
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Satuan Kerja</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Pengajuan</TableHead>
                        <TableHead className="text-center">Penetapan</TableHead>
                        <TableHead className="text-center">Penilaian Selesai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(dashboardStats.satuanKerja)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([satuanKerja, stats]) => (
                          <TableRow key={satuanKerja}>
                            <TableCell className="font-medium">{satuanKerja}</TableCell>
                            <TableCell className="text-center">{stats.total}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={stats.pengajuan === stats.total ? "bg-green-500" : "bg-red-500"}>
                                {stats.pengajuan} / {stats.total}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={stats.penetapan === stats.total ? "bg-green-500" : "bg-red-500"}>
                                {stats.penetapan} / {stats.total}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={stats.penilaian === stats.total ? "bg-green-500" : "bg-red-500"}>
                                {stats.penilaian} / {stats.total}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      {Object.keys(dashboardStats.satuanKerja).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Tidak ada data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4">
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari nama atau NIP..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Total: {monitoringData.length} data
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
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
                      Import Excel
                    </Button>
                  </div>
                  <Button onClick={() => { resetForm(); setEditingData(null); setDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Data
                  </Button>
                </div>
              </div>
            </Card>

            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Status Pengajuan</TableHead>
                    <TableHead>Status Penetapan</TableHead>
                    <TableHead>Status Penilaian</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((data, index) => {
                      // Check if penilaian is complete
                      const match = data.status_penilaian?.match(/Menilai\s+(\d+)\s+dari\s+(\d+)/i);
                      const isPenilaianComplete = match ? parseInt(match[1]) === parseInt(match[2]) && parseInt(match[2]) > 0 : false;
                      
                      return (
                        <TableRow key={data.id}>
                          <TableCell>{data.no_urut || index + 1}</TableCell>
                          <TableCell className="font-medium">{data.nama_lengkap}</TableCell>
                          <TableCell>{data.nip}</TableCell>
                          <TableCell>
                            <Badge className={data.status_pengajuan === "Sudah Mengajukan" ? "bg-green-500" : "bg-red-500"}>
                              {data.status_pengajuan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={data.status_penetapan === "Sudah Ditetapkan" ? "bg-green-500" : "bg-red-500"}>
                              {data.status_penetapan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={isPenilaianComplete ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {data.status_penilaian}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(data)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(data.id)}>
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
          </TabsContent>
        </Tabs>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingData ? "Edit Data" : "Tambah Data"}</DialogTitle>
          </DialogHeader>
          {/* Let Him Cook aesthetic text */}
          <div className="text-center mb-2">
            <p className="text-sm italic text-muted-foreground font-light tracking-wide">
              ✨ <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent font-medium italic">"Let Him Cook"</span> ✨
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap *</Label>
              <Input
                value={formData.nama_lengkap}
                onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>NIP</Label>
              <Input
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                placeholder="Masukkan NIP"
              />
            </div>
            <div className="space-y-2">
              <Label>Status Pengajuan</Label>
              <Select
                value={formData.status_pengajuan}
                onValueChange={(value) => setFormData({ ...formData, status_pengajuan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status pengajuan" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PENGAJUAN_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Penetapan</Label>
              <Select
                value={formData.status_penetapan}
                onValueChange={(value) => setFormData({ ...formData, status_penetapan: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status penetapan" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_PENETAPAN_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Penilaian</Label>
              <Input
                value={formData.status_penilaian}
                onChange={(e) => setFormData({ ...formData, status_penilaian: e.target.value })}
                placeholder="Contoh: Menilai 5 dari 5"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {editingData ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
    </div>
  );
}
