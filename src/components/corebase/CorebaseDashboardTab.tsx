import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart3, Database, FileCheck, Users, MapPin, Briefcase, Building2, UserCheck,
  Search, Download, Filter, ChevronDown, ChevronUp, Heart, Skull, AlertTriangle, CalendarClock,
} from "lucide-react";
import { fetchAllRows } from "./CorebaseFetchUtils";
import { exportToExcel } from "./CorebaseExcelUtils";

// Reuse convertJabatan from GoljabTab
function convertJabatan(jabatan: string | null): string {
  if (!jabatan) return "-";
  const j = jabatan.trim();
  const pelaksanaKeywords = [
    "Pawang Anjing Pelacak", "Instruktur Anjing Pelacak", "Sekretaris Eselon",
    "Pelaksana Tugas Belajar", "Pengadministrasi Perkantoran",
    "Pengolah Data dan Informasi", "Penata Layanan Operasional",
  ];
  for (const keyword of pelaksanaKeywords) {
    if (j.startsWith(keyword) || j.includes(keyword)) return "Pelaksana";
  }
  if (j.includes("Madya") || j.includes("Ahli Madya")) return "Pemeriksa Bea Cukai Madya";
  if (j.includes("Muda") || j.includes("Ahli Muda")) return "Pemeriksa Bea Cukai Muda";
  if (j.includes("Pertama") || j.includes("Ahli Pertama")) return "Pemeriksa Bea Cukai Pertama";
  if (j.includes("Pelaksana Lanjutan") || j.includes("Mahir")) return "Pemeriksa Bea Cukai Mahir";
  if (j.includes("Pelaksana") || j.includes("Terampil")) return "Pemeriksa Bea Cukai Terampil";
  return j;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color?: string;
}

function StatCard({ title, count, icon, color = "text-primary" }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatItem({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0">
      <span className="text-sm truncate mr-2">{label}</span>
      <Badge variant="secondary" className={`shrink-0 ${color}`}>{value}</Badge>
    </div>
  );
}

interface CorebaseDashboardTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function CorebaseDashboardTab({ isAdmin, canEdit }: CorebaseDashboardTabProps) {
  const [counts, setCounts] = useState({
    pokok: 0, status: 0, pensiun: 0, rekamJejak: 0, goljab: 0, eselonisasi: 0, pegawaiAtasan: 0,
  });
  const [goljabData, setGoljabData] = useState<any[]>([]);
  
  // RPC-based stats (no longer need full table data)
  const [usiaStats, setUsiaStats] = useState<[string, number][]>([]);
  const [agamaStats, setAgamaStats] = useState<[string, number][]>([]);
  const [genderStats, setGenderStats] = useState<[string, number][]>([]);
  const [statusStats, setStatusStats] = useState<any>(null);
  const [pensiunStats, setPensiunStats] = useState<any>(null);
  const [goljabStats, setGoljabStats] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSatker, setSelectedSatker] = useState<string[]>([]);
  const [selectedJabatanKonversi, setSelectedJabatanKonversi] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>("goljab");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch counts (head-only, minimal egress)
      const [pokok, status, pensiun, rekamJejak, eselonisasi, pegawai] = await Promise.all([
        supabase.from("corebase_db_pokok").select("id", { count: "exact", head: true }),
        supabase.from("corebase_db_status").select("id", { count: "exact", head: true }),
        supabase.from("corebase_db_pensiun").select("id", { count: "exact", head: true }),
        supabase.from("corebase_db_rekam_jejak").select("id", { count: "exact", head: true }),
        supabase.from("eselonisasi").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
      ]);

      // Fetch goljab data for table (only needed columns)
      const allGoljab = await fetchAllRows<any>("corebase_db_goljab" as any, "nama", true, "nama,nip,jabatan,unit,satuan_kerja,id");
      setGoljabData(allGoljab);

      setCounts({
        pokok: pokok.count || 0,
        status: status.count || 0,
        pensiun: pensiun.count || 0,
        rekamJejak: rekamJejak.count || 0,
        goljab: allGoljab.length,
        eselonisasi: eselonisasi.count || 0,
        pegawaiAtasan: pegawai.count || 0,
      });
      
      // Fetch aggregate stats via RPC functions (minimal egress ~1KB each vs ~2.7MB)
      const [ageRes, genderRes, religionRes, statusRes, pensiunRes, goljabStatsRes] = await Promise.all([
        supabase.rpc("get_corebase_age_stats" as any),
        supabase.rpc("get_corebase_gender_stats" as any),
        supabase.rpc("get_corebase_religion_stats" as any),
        supabase.rpc("get_corebase_status_stats" as any),
        supabase.rpc("get_corebase_pensiun_stats" as any),
        supabase.rpc("get_corebase_goljab_stats" as any),
      ]);

      // Parse RPC results
      if (ageRes.data) {
        setUsiaStats((ageRes.data as any[]).map((r: any) => [r.range_label, r.count]));
      }
      if (genderRes.data) {
        setGenderStats((genderRes.data as any[]).map((r: any) => [r.label, r.count]));
      }
      if (religionRes.data) {
        setAgamaStats((religionRes.data as any[]).map((r: any) => [r.label, r.count]));
      }
      if (statusRes.data) {
        setStatusStats(statusRes.data);
      }
      if (pensiunRes.data) {
        setPensiunStats(pensiunRes.data);
      }
      if (goljabStatsRes.data) {
        setGoljabStats(goljabStatsRes.data);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Goljab statistics from RPC
  const satkerStats = useMemo(() => {
    if (goljabStats?.satker) {
      return (goljabStats.satker as any[]).map((r: any) => [r.label, r.count] as [string, number]);
    }
    // Fallback to local data
    const map = new Map<string, number>();
    goljabData.forEach(d => {
      const key = d.satuan_kerja || "Tidak diketahui";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [goljabData, goljabStats]);

  const jabatanKonversiStats = useMemo(() => {
    // Jabatan conversion must be done client-side since it's a JS function
    const map = new Map<string, number>();
    goljabData.forEach(d => {
      const key = convertJabatan(d.jabatan);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [goljabData]);

  const unitStats = useMemo(() => {
    if (goljabStats?.unit) {
      return (goljabStats.unit as any[]).map((r: any) => [r.label, r.count] as [string, number]);
    }
    const map = new Map<string, number>();
    goljabData.forEach(d => {
      const key = d.unit || "Tidak diketahui";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [goljabData, goljabStats]);

  const uniqueSatker = useMemo(() => satkerStats.map(s => s[0]), [satkerStats]);
  const uniqueJabatanKonversi = useMemo(() => jabatanKonversiStats.map(s => s[0]), [jabatanKonversiStats]);
  const uniqueUnit = useMemo(() => unitStats.map(s => s[0]), [unitStats]);

  // DB Status statistics from RPC
  const cltnStats = useMemo(() => {
    if (statusStats) {
      return { active: statusStats.cltn_active || 0, inactive: statusStats.cltn_inactive || 0 };
    }
    return { active: 0, inactive: 0 };
  }, [statusStats]);

  const pemberhentianStats = useMemo(() => {
    if (statusStats) {
      return {
        total: statusStats.pemberhentian_total || 0,
        byJenis: (statusStats.pemberhentian_by_jenis || []).map((r: any) => [r.label, r.count] as [string, number]),
      };
    }
    return { total: 0, byJenis: [] as [string, number][] };
  }, [statusStats]);

  const meninggalCount = useMemo(() => {
    return statusStats?.meninggal || 0;
  }, [statusStats]);

  // DB Pensiun statistics from RPC
  const bupStats = useMemo(() => {
    if (pensiunStats?.bup) {
      return (pensiunStats.bup as any[]).map((r: any) => [r.label, r.count] as [string, number]);
    }
    return [] as [string, number][];
  }, [pensiunStats]);

  const tmtPensiunStats = useMemo(() => {
    if (pensiunStats?.tmt_pensiun) {
      return (pensiunStats.tmt_pensiun as any[]).map((r: any) => [r.label, r.count] as [string, number]);
    }
    return [] as [string, number][];
  }, [pensiunStats]);

  // Filtered goljab data for table
  const filteredGoljabData = useMemo(() => {
    return goljabData.filter(item => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!item.nama?.toLowerCase().includes(term) && !item.nip?.includes(term) &&
            !item.jabatan?.toLowerCase().includes(term) && !item.satuan_kerja?.toLowerCase().includes(term) &&
            !item.unit?.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (selectedSatker.length > 0 && !selectedSatker.includes(item.satuan_kerja || "Tidak diketahui")) return false;
      if (selectedJabatanKonversi.length > 0 && !selectedJabatanKonversi.includes(convertJabatan(item.jabatan))) return false;
      if (selectedUnit.length > 0 && !selectedUnit.includes(item.unit || "Tidak diketahui")) return false;
      return true;
    });
  }, [goljabData, searchTerm, selectedSatker, selectedJabatanKonversi, selectedUnit]);

  const toggleSatker = (s: string) => {
    setSelectedSatker(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const toggleJabatanKonversi = (j: string) => {
    setSelectedJabatanKonversi(prev => prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]);
  };
  const toggleUnit = (u: string) => {
    setSelectedUnit(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);
  };

  const handleExportFiltered = () => {
    const columns = [
      { key: "nama", label: "Nama" },
      { key: "nip", label: "NIP" },
      { key: "jabatan_konversi", label: "Jabatan (Konversi)" },
      { key: "unit", label: "Unit" },
      { key: "satuan_kerja", label: "Satuan Kerja" },
    ];
    const exportData = filteredGoljabData.map(item => ({
      ...item,
      jabatan_konversi: convertJabatan(item.jabatan),
    }));
    exportToExcel(exportData, columns, "statistik_goljab");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard title="DB Pokok" count={counts.pokok} icon={<Database className="h-5 w-5" />} />
        <StatCard title="DB Status" count={counts.status} icon={<FileCheck className="h-5 w-5" />} color="text-green-600" />
        <StatCard title="DB Pensiun" count={counts.pensiun} icon={<Users className="h-5 w-5" />} color="text-orange-600" />
        <StatCard title="DB Rekam Jejak" count={counts.rekamJejak} icon={<MapPin className="h-5 w-5" />} color="text-purple-600" />
        <StatCard title="DB Goljab" count={counts.goljab} icon={<Briefcase className="h-5 w-5" />} color="text-blue-600" />
        <StatCard title="Eselonisasi" count={counts.eselonisasi} icon={<Building2 className="h-5 w-5" />} color="text-teal-600" />
        <StatCard title="Pegawai & Atasan" count={counts.pegawaiAtasan} icon={<UserCheck className="h-5 w-5" />} color="text-indigo-600" />
      </div>

      {/* DB Goljab Detailed Statistics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            Statistik DB Goljab
            <Badge variant="secondary">Total: {goljabData.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Unit Organisasi */}
          <Card className="border">
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "satker" ? null : "satker")}>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-600" />
                Filter Unit Organisasi
                {expandedSection === "satker" ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
            {expandedSection === "satker" && (
              <CardContent className="pt-0 px-4 pb-3">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mb-2" onClick={() => setSelectedSatker(selectedSatker.length === uniqueSatker.length ? [] : [...uniqueSatker])}>
                  {selectedSatker.length === uniqueSatker.length ? "Hapus Semua" : "Pilih Semua"}
                </Button>
                <div className="flex flex-wrap gap-1.5">
                  {satkerStats.map(([name, count]) => (
                    <Badge key={name} variant={selectedSatker.includes(name) ? "default" : "outline"} className="cursor-pointer text-xs hover:opacity-80" onClick={() => toggleSatker(name)}>
                      {name} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Filter Unit */}
          <Card className="border">
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "unit" ? null : "unit")}>
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Filter Unit
                {expandedSection === "unit" ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
            {expandedSection === "unit" && (
              <CardContent className="pt-0 px-4 pb-3">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mb-2" onClick={() => setSelectedUnit(selectedUnit.length === uniqueUnit.length ? [] : [...uniqueUnit])}>
                  {selectedUnit.length === uniqueUnit.length ? "Hapus Semua" : "Pilih Semua"}
                </Button>
                <div className="flex flex-wrap gap-1.5">
                  {unitStats.map(([name, count]) => (
                    <Badge key={name} variant={selectedUnit.includes(name) ? "default" : "outline"} className="cursor-pointer text-xs hover:opacity-80" onClick={() => toggleUnit(name)}>
                      {name} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Filter Detail Jabatan (Konversi) */}
          <Card className="border">
            <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "jabatan" ? null : "jabatan")}>
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4 text-violet-600" />
                Filter Detail Jabatan
                {expandedSection === "jabatan" ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
            {expandedSection === "jabatan" && (
              <CardContent className="pt-0 px-4 pb-3">
                <Button variant="link" size="sm" className="p-0 h-auto text-xs mb-2" onClick={() => setSelectedJabatanKonversi(selectedJabatanKonversi.length === uniqueJabatanKonversi.length ? [] : [...uniqueJabatanKonversi])}>
                  {selectedJabatanKonversi.length === uniqueJabatanKonversi.length ? "Hapus Semua" : "Pilih Semua"}
                </Button>
                <div className="flex flex-wrap gap-1.5">
                  {jabatanKonversiStats.map(([name, count]) => (
                    <Badge key={name} variant={selectedJabatanKonversi.includes(name) ? "default" : "outline"} className="cursor-pointer text-xs hover:opacity-80" onClick={() => toggleJabatanKonversi(name)}>
                      {name} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Statistik Unit Organisasi & Detail Jabatan side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-600" />
                  Statistik Unit Organisasi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-3 max-h-64 overflow-y-auto">
                {satkerStats.map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <span className="text-sm truncate mr-2" title={name}>{name}</span>
                    <Badge variant="secondary" className="shrink-0">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Statistik Detail Jabatan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-3 max-h-64 overflow-y-auto">
                {jabatanKonversiStats.map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <span className="text-sm truncate mr-2">{name}</span>
                    <Badge variant="secondary" className="shrink-0">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Data Jabatan Pegawai Table */}
          <Card className="border">
            <CardHeader className="py-3 px-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Data Jabatan Pegawai
                  <Badge variant="secondary">Total: {filteredGoljabData.length} pegawai</Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportFiltered}>
                  <Download className="h-4 w-4 mr-1" />
                  Export Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, NIP, jabatan, unit organisasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Menampilkan {filteredGoljabData.length} dari {goljabData.length} data pegawai
              </p>
              <div className="rounded-md border overflow-x-auto max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Jabatan (Konversi)</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Satuan Kerja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGoljabData.slice(0, 100).map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{item.nama}</TableCell>
                        <TableCell className="font-mono text-xs">{item.nip}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{convertJabatan(item.jabatan)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]" title={item.unit || ""}>{item.unit || "-"}</TableCell>
                        <TableCell className="text-sm truncate max-w-[200px]" title={item.satuan_kerja || ""}>{item.satuan_kerja || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredGoljabData.length > 100 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-3">
                          ... dan {filteredGoljabData.length - 100} data lainnya
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredGoljabData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Belum ada data.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Statistik Tambahan dari DB Pokok, DB Status, DB Pensiun */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Statistik DB Pokok */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" />
              Statistik DB Pokok
              <Badge variant="secondary">{counts.pokok}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Usia */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <CalendarClock className="h-4 w-4 text-blue-500" /> Distribusi Usia
              </h4>
              <div className="max-h-48 overflow-y-auto">
                {usiaStats.map(([label, count]) => (
                  <MiniStatItem key={label} label={label} value={count} />
                ))}
              </div>
            </div>
            {/* Agama */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Heart className="h-4 w-4 text-pink-500" /> Agama
              </h4>
              <div className="max-h-48 overflow-y-auto">
                {agamaStats.map(([label, count]) => (
                  <MiniStatItem key={label} label={label} value={count} />
                ))}
              </div>
            </div>
            {/* Gender */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Users className="h-4 w-4 text-indigo-500" /> Gender
              </h4>
              <div className="max-h-48 overflow-y-auto">
                {genderStats.map(([label, count]) => (
                  <MiniStatItem key={label} label={label} value={count} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistik DB Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5 text-green-600" />
              Statistik DB Status
              <Badge variant="secondary">{counts.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CLTN */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" /> CLTN
              </h4>
              <MiniStatItem label="Aktif CLTN" value={cltnStats.active} color="text-yellow-600" />
              <MiniStatItem label="Tidak CLTN" value={cltnStats.inactive} />
            </div>
            {/* Pemberhentian */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Pemberhentian
              </h4>
              <MiniStatItem label="Total Pemberhentian" value={pemberhentianStats.total} color="text-red-600" />
              {pemberhentianStats.byJenis.map(([label, count]: [string, number]) => (
                <MiniStatItem key={label} label={label} value={count} />
              ))}
            </div>
            {/* Meninggal */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Skull className="h-4 w-4 text-gray-500" /> Meninggal
              </h4>
              <MiniStatItem label="Total Meninggal" value={meninggalCount} color="text-gray-600" />
            </div>
          </CardContent>
        </Card>

        {/* Statistik DB Pensiun */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-orange-600" />
              Statistik DB Pensiun
              <Badge variant="secondary">{counts.pensiun}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* BUP */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <CalendarClock className="h-4 w-4 text-orange-500" /> BUP (Batas Usia Pensiun)
              </h4>
              <div className="max-h-48 overflow-y-auto">
                {bupStats.map(([label, count]) => (
                  <MiniStatItem key={label} label={label} value={count} />
                ))}
              </div>
            </div>
            {/* TMT Pensiun */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <CalendarClock className="h-4 w-4 text-red-500" /> TMT Pensiun (per Tahun)
              </h4>
              <div className="max-h-48 overflow-y-auto">
                {tmtPensiunStats.map(([label, count]) => (
                  <MiniStatItem key={label} label={label} value={count} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
