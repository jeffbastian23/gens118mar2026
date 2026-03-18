import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Users, RefreshCw, Building2, Filter, FileCheck, FileX, Download, ExternalLink, FileDown, BarChart3 } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface CortaxData {
  id: string;
  nama_lengkap: string;
  nip: string;
  pangkat: string | null;
  unit: string | null;
  bagian_bidang: string | null;
  login_portal: string | null;
  status_kode_otorisasi: string | null;
  bukti_registrasi: string | null;
}

interface UnitStats {
  name: string;
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

interface SatkerData {
  id: string;
  satuan_kerja: string;
  total_pegawai: number;
  sudah_aktivasi: number;
  belum_aktivasi: number;
}

// Helper to check if registration is complete based on bukti_registrasi
const isRegistrationComplete = (item: CortaxData): boolean => {
  return !!(item.bukti_registrasi && item.bukti_registrasi !== "#N/A" && item.bukti_registrasi.trim() !== "");
};

export default function AktivasiCortaxDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<CortaxData[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitStats, setUnitStats] = useState<UnitStats[]>([]);
  const [selectedBagian, setSelectedBagian] = useState<string>("all");
  const [bagianOptions, setBagianOptions] = useState<string[]>([]);
  const [satkerData, setSatkerData] = useState<SatkerData[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from("aktivasi_cortax")
        .select("*")
        .order("bagian_bidang", { ascending: true });

      if (error) throw error;
      setData(result || []);
      calculateUnitStats(result || []);
      
      // Extract unique bagian/bidang for filter
      const uniqueBagian = [...new Set((result || []).map(item => item.bagian_bidang).filter(Boolean))] as string[];
      setBagianOptions(uniqueBagian.sort());
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

  const fetchSatkerData = async () => {
    try {
      const { data: result, error } = await supabase
        .from("satker_cortax")
        .select("*")
        .order("satuan_kerja", { ascending: true });

      if (error) throw error;
      setSatkerData(result || []);
    } catch (error: any) {
      console.error("Error fetching satker data:", error);
    }
  };

  const calculateUnitStats = (items: CortaxData[]) => {
    const unitMap = new Map<string, { total: number; completed: number }>();

    items.forEach((item) => {
      const unitName = item.bagian_bidang || "Tidak Terklasifikasi";
      const current = unitMap.get(unitName) || { total: 0, completed: 0 };
      current.total += 1;
      // Use bukti_registrasi to determine completion
      if (isRegistrationComplete(item)) {
        current.completed += 1;
      }
      unitMap.set(unitName, current);
    });

    const stats: UnitStats[] = [];
    unitMap.forEach((value, key) => {
      stats.push({
        name: key,
        total: value.total,
        completed: value.completed,
        pending: value.total - value.completed,
        percentage: value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0,
      });
    });

    // Sort by name
    stats.sort((a, b) => a.name.localeCompare(b.name));
    setUnitStats(stats);
  };

  useEffect(() => {
    fetchData();
    fetchSatkerData();
  }, []);

  // Filter data based on selected bagian
  const filteredData = selectedBagian === "all" 
    ? data 
    : selectedBagian === "incomplete"
    ? data.filter(d => !isRegistrationComplete(d))
    : data.filter(d => d.bagian_bidang === selectedBagian);

  const totalPegawai = filteredData.length;
  const sudahSelesai = filteredData.filter(isRegistrationComplete).length;
  const belumSelesai = totalPegawai - sudahSelesai;
  const overallPercentage = totalPegawai > 0 ? Math.round((sudahSelesai / totalPegawai) * 100) : 0;

  const completedList = filteredData.filter(isRegistrationComplete);
  const pendingList = filteredData.filter(d => !isRegistrationComplete(d));

  const exportToExcel = (dataToExport: CortaxData[], filename: string) => {
    const exportData = dataToExport.map((item, index) => ({
      "No": index + 1,
      "Nama Lengkap": item.nama_lengkap,
      "NIP": item.nip,
      "Pangkat": item.pangkat || "-",
      "Unit": item.unit || "-",
      "Bagian/Bidang": item.bagian_bidang || "-",
      "Login Portal": item.login_portal || "TIDAK",
      "Status Otorisasi": item.status_kode_otorisasi === "YA" || item.status_kode_otorisasi === "SUDAH KODE OTORISASI" ? "SUDAH" : "BELUM",
      "Bukti Registrasi": item.bukti_registrasi && item.bukti_registrasi !== "#N/A" ? "SELESAI" : "BELUM",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    toast({
      title: "Berhasil",
      description: `${dataToExport.length} data berhasil diexport`,
    });
  };

  // Get pending bagian for filter
  const pendingBagian = unitStats.filter(u => u.pending > 0);

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter Data
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("http://s.kemenkeu.go.id/coretaxjatim1", "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Link Petunjuk
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/documents/Panduan_Coretax_DJP.pdf';
                  link.download = 'Panduan_Coretax_DJP.pdf';
                  link.click();
                }}
                className="flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Unduh Petunjuk
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Bagian/Bidang:</span>
              <Select value={selectedBagian} onValueChange={setSelectedBagian}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Pilih Bagian/Bidang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bagian/Bidang</SelectItem>
                  <SelectItem value="incomplete">
                    <span className="text-red-600 font-medium">Belum Selesai (Semua)</span>
                  </SelectItem>
                  {bagianOptions.map((bagian) => (
                    <SelectItem key={bagian} value={bagian}>
                      {bagian}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchData} disabled={loading} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          
          {/* Quick filter for incomplete bagian */}
          {pendingBagian.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Bagian yang belum 100%:</p>
              <div className="flex flex-wrap gap-2">
                {pendingBagian.map((unit) => (
                  <Badge 
                    key={unit.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-red-50 border-red-200 text-red-700"
                    onClick={() => setSelectedBagian(unit.name)}
                  >
                    {unit.name} ({unit.pending} belum)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPegawai}</div>
            {selectedBagian !== "all" && (
              <p className="text-xs text-muted-foreground">
                {selectedBagian === "incomplete" ? "Filter: Belum Selesai" : `Filter: ${selectedBagian}`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Sudah Ada Bukti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{sudahSelesai}</div>
            <p className="text-xs text-green-600">Sudah upload bukti registrasi</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <FileX className="w-4 h-4" />
              Belum Ada Bukti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{belumSelesai}</div>
            <p className="text-xs text-red-600">Belum upload bukti registrasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress Keseluruhan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallPercentage}%</div>
            <Progress value={overallPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Unit Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Status per Bagian/Bidang (Berdasarkan Bukti Registrasi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Memuat data...</p>
          ) : unitStats.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Belum ada data</p>
          ) : (
            <div className="space-y-4">
              {unitStats.map((unit) => (
                <div 
                  key={unit.name} 
                  className={`space-y-2 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBagian === unit.name ? 'bg-blue-50 border border-blue-200' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedBagian(unit.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {unit.percentage === 100 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-medium">{unit.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={unit.percentage === 100 ? "default" : "destructive"}
                        className={unit.percentage === 100 ? "bg-green-600" : ""}
                      >
                        {unit.completed}/{unit.total}
                      </Badge>
                      {unit.pending > 0 && (
                        <Badge variant="outline" className="border-red-300 text-red-600">
                          {unit.pending} belum
                        </Badge>
                      )}
                      <span className="text-sm font-medium w-12 text-right">
                        {unit.percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={unit.percentage}
                    className={`h-2 ${
                      unit.percentage === 100
                        ? "[&>div]:bg-green-500"
                        : unit.percentage >= 50
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-red-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed List */}
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Sudah Ada Bukti Registrasi ({completedList.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(completedList, "Cortax_Sudah_Bukti_Registrasi")}
                disabled={completedList.length === 0}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {completedList.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Belum ada yang selesai</p>
              ) : (
                <ul className="divide-y">
                  {completedList.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-green-50/50"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.nip} • {item.bagian_bidang || "-"}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.login_portal === "YA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            Portal: {item.login_portal || "TIDAK"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.status_kode_otorisasi === "YA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            Otorisasi: {item.status_kode_otorisasi === "YA" ? "SUDAH" : "BELUM"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending List */}
        <Card className="border-red-200">
          <CardHeader className="bg-red-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <FileX className="w-5 h-5" />
                Belum Ada Bukti Registrasi ({pendingList.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToExcel(pendingList, "Cortax_Belum_Bukti_Registrasi")}
                disabled={pendingList.length === 0}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {pendingList.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Semua sudah selesai</p>
              ) : (
                <ul className="divide-y">
                  {pendingList.map((item) => (
                    <li
                      key={item.id}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-red-50/50"
                    >
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.nip} • {item.bagian_bidang || "-"}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.login_portal === "YA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            Portal: {item.login_portal || "TIDAK"}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.status_kode_otorisasi === "YA" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            Otorisasi: {item.status_kode_otorisasi === "YA" ? "SUDAH" : "BELUM"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satker Statistics Chart */}
      {satkerData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistik Aktivasi per Satuan Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={satkerData.map((item) => ({
                    name: item.satuan_kerja.replace("BC ", "").replace("BLBC ", ""),
                    "Sudah Aktivasi": item.sudah_aktivasi,
                    "Belum Aktivasi": item.belum_aktivasi,
                    total: item.total_pegawai,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{ 
                      backgroundColor: "white", 
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Sudah Aktivasi" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Belum Aktivasi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Summary stats */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Satker</p>
                <p className="text-xl font-bold text-blue-600">{satkerData.length}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Pegawai</p>
                <p className="text-xl font-bold">{satkerData.reduce((acc, item) => acc + item.total_pegawai, 0)}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Sudah Aktivasi</p>
                <p className="text-xl font-bold text-green-600">{satkerData.reduce((acc, item) => acc + item.sudah_aktivasi, 0)}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Belum Aktivasi</p>
                <p className="text-xl font-bold text-red-600">{satkerData.reduce((acc, item) => acc + item.belum_aktivasi, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
