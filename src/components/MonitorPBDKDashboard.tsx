import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { CheckCircle2, XCircle, FileText, Users } from "lucide-react";

interface PBDKStats {
  total: number;
  statusHrisSudah: number;
  statusHrisBelum: number;
  statusPbdkSudah: number;
  statusPbdkBelum: number;
  byJenisPerubahan: { name: string; value: number }[];
  byPetugas: { name: string; count: number }[];
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function MonitorPBDKDashboard() {
  const [stats, setStats] = useState<PBDKStats>({
    total: 0,
    statusHrisSudah: 0,
    statusHrisBelum: 0,
    statusPbdkSudah: 0,
    statusPbdkBelum: 0,
    byJenisPerubahan: [],
    byPetugas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("monitor_pbdk")
        .select("*");

      if (error) throw error;

      const pbdkData = data || [];

      // Calculate stats
      const total = pbdkData.length;
      const statusHrisSudah = pbdkData.filter(d => d.status_hris === "Sudah").length;
      const statusHrisBelum = pbdkData.filter(d => d.status_hris === "Belum").length;
      const statusPbdkSudah = pbdkData.filter(d => d.status_pbdk === "Sudah").length;
      const statusPbdkBelum = pbdkData.filter(d => d.status_pbdk === "Belum").length;

      // Group by jenis perubahan
      const jenisMap = new Map<string, number>();
      pbdkData.forEach(d => {
        const jenis = d.jenis_perubahan_data || "Lainnya";
        jenisMap.set(jenis, (jenisMap.get(jenis) || 0) + 1);
      });
      const byJenisPerubahan = Array.from(jenisMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      // Group by petugas
      const petugasMap = new Map<string, number>();
      pbdkData.forEach(d => {
        const petugas = d.nama_petugas || "Belum Ditugaskan";
        petugasMap.set(petugas, (petugasMap.get(petugas) || 0) + 1);
      });
      const byPetugas = Array.from(petugasMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats({
        total,
        statusHrisSudah,
        statusHrisBelum,
        statusPbdkSudah,
        statusPbdkBelum,
        byJenisPerubahan,
        byPetugas
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg">Memuat dashboard...</p>
      </div>
    );
  }

  const statusHrisData = [
    { name: "Sudah", value: stats.statusHrisSudah },
    { name: "Belum", value: stats.statusHrisBelum }
  ];

  const statusPbdkData = [
    { name: "Sudah", value: stats.statusPbdkSudah },
    { name: "Belum", value: stats.statusPbdkBelum }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data PBDK</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total perubahan data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status HRIS Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.statusHrisSudah}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.statusHrisSudah / stats.total) * 100).toFixed(1) : 0}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status PBDK Selesai</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.statusPbdkSudah}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.statusPbdkSudah / stats.total) * 100).toFixed(1) : 0}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Diproses</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.statusPbdkBelum}</div>
            <p className="text-xs text-muted-foreground">Menunggu proses PBDK</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status HRIS Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Input HRIS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusHrisData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status PBDK Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status PBDK</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusPbdkData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jenis Perubahan Data Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Jenis Perubahan Data</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byJenisPerubahan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Petugas Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Berdasarkan Petugas PBDK</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byPetugas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
