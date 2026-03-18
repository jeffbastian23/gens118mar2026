import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BarChart3, TrendingUp, Users, Clock, Download, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface KarisKarsuData {
  id: string;
  nama: string;
  nip: string;
  satuan_kerja: string;
  tanggal_pengajuan: string | null;
  tanggal_karis_karsu_terbit: string | null;
  pic: string | null;
}

function getWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getKinerjaIndex(workingDays: number): { indeks: number; label: string; color: string } {
  if (workingDays < 12) return { indeks: 5, label: "Indeks 5", color: "hsl(var(--primary))" };
  if (workingDays <= 15) return { indeks: 4, label: "Indeks 4", color: "hsl(142, 76%, 36%)" };
  if (workingDays <= 18) return { indeks: 3, label: "Indeks 3", color: "hsl(48, 96%, 53%)" };
  if (workingDays <= 20) return { indeks: 2, label: "Indeks 2", color: "hsl(25, 95%, 53%)" };
  return { indeks: 1, label: "Indeks 1", color: "hsl(0, 84%, 60%)" };
}

const INDEKS_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(48, 96%, 53%)",
  "hsl(25, 95%, 53%)",
  "hsl(0, 84%, 60%)",
];

const INDEKS_DESCRIPTIONS = [
  { indeks: 5, desc: "< 12 Hari Kerja", color: INDEKS_COLORS[0] },
  { indeks: 4, desc: "12-15 Hari Kerja", color: INDEKS_COLORS[1] },
  { indeks: 3, desc: "16-18 Hari Kerja", color: INDEKS_COLORS[2] },
  { indeks: 2, desc: "19-20 Hari Kerja", color: INDEKS_COLORS[3] },
  { indeks: 1, desc: "> 20 Hari Kerja", color: INDEKS_COLORS[4] },
];

export default function PerkawinanDashboard() {
  const [data, setData] = useState<KarisKarsuData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPic, setFilterPic] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      const { data: result, error } = await supabase
        .from("karis_karsu")
        .select("id, nama, nip, satuan_kerja, tanggal_pengajuan, tanggal_karis_karsu_terbit, pic")
        .order("created_at", { ascending: false });
      if (!error) setData(result || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const uniquePics = [...new Set(data.map(d => d.pic).filter(Boolean))] as string[];

  const filteredData = useMemo(() => {
    if (filterPic === "all") return data;
    return data.filter(d => d.pic === filterPic);
  }, [data, filterPic]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const completed = filteredData.filter(d => d.tanggal_karis_karsu_terbit).length;
    const pending = total - completed;

    const kinerjaData: { indeks: number; count: number; items: KarisKarsuData[] }[] = [
      { indeks: 5, count: 0, items: [] },
      { indeks: 4, count: 0, items: [] },
      { indeks: 3, count: 0, items: [] },
      { indeks: 2, count: 0, items: [] },
      { indeks: 1, count: 0, items: [] },
    ];

    let totalWorkingDays = 0;
    let countWithDays = 0;

    filteredData.forEach(item => {
      if (item.tanggal_pengajuan && item.tanggal_karis_karsu_terbit) {
        const days = getWorkingDays(new Date(item.tanggal_pengajuan), new Date(item.tanggal_karis_karsu_terbit));
        const ki = getKinerjaIndex(days);
        const idx = 5 - ki.indeks;
        kinerjaData[idx].count++;
        kinerjaData[idx].items.push(item);
        totalWorkingDays += days;
        countWithDays++;
      }
    });

    const avgDays = countWithDays > 0 ? Math.round(totalWorkingDays / countWithDays) : 0;
    const avgKinerja = countWithDays > 0 ? getKinerjaIndex(avgDays) : null;

    const picMap: Record<string, number> = {};
    filteredData.forEach(item => {
      const pic = item.pic || "Belum ditentukan";
      picMap[pic] = (picMap[pic] || 0) + 1;
    });
    const picData = Object.entries(picMap).map(([name, value]) => ({ name, value }));

    return { total, completed, pending, kinerjaData, avgDays, avgKinerja, picData, countWithDays };
  }, [filteredData]);

  const handleExportStatistik = () => {
    const exportRows: any[] = [];

    // Summary row
    exportRows.push({
      Kategori: "RINGKASAN",
      Keterangan: "",
      Jumlah: "",
    });
    exportRows.push({ Kategori: "Total Pengajuan", Keterangan: "", Jumlah: stats.total });
    exportRows.push({ Kategori: "Selesai", Keterangan: "", Jumlah: stats.completed });
    exportRows.push({ Kategori: "Dalam Proses", Keterangan: "", Jumlah: stats.pending });
    exportRows.push({ Kategori: "Rata-rata Hari Kerja", Keterangan: stats.avgKinerja?.label || "-", Jumlah: stats.avgDays });
    exportRows.push({ Kategori: "", Keterangan: "", Jumlah: "" });
    exportRows.push({ Kategori: "DISTRIBUSI INDEKS KINERJA", Keterangan: "", Jumlah: "" });

    stats.kinerjaData.forEach(group => {
      const desc = INDEKS_DESCRIPTIONS[5 - group.indeks];
      exportRows.push({ Kategori: `Indeks ${group.indeks}`, Keterangan: desc.desc, Jumlah: group.count });
    });

    exportRows.push({ Kategori: "", Keterangan: "", Jumlah: "" });
    exportRows.push({ Kategori: "DETAIL PER PEGAWAI", Keterangan: "", Jumlah: "" });

    // Detail sheet
    const detailRows: any[] = [];
    stats.kinerjaData.forEach(group => {
      group.items.forEach(item => {
        const days = getWorkingDays(new Date(item.tanggal_pengajuan!), new Date(item.tanggal_karis_karsu_terbit!));
        detailRows.push({
          Nama: item.nama,
          NIP: item.nip,
          "Satuan Kerja": item.satuan_kerja,
          "Tanggal Pengajuan": item.tanggal_pengajuan,
          "Tanggal Terbit": item.tanggal_karis_karsu_terbit,
          "Hari Kerja": days,
          "Indeks Kinerja": `Indeks ${group.indeks}`,
          PIC: item.pic || "-",
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws1, "Statistik");
    if (detailRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(detailRows);
      XLSX.utils.book_append_sheet(wb, ws2, "Detail Kinerja");
    }
    XLSX.writeFile(wb, "statistik_karis_karsu.xlsx");
    toast.success("Data statistik berhasil diekspor");
  };

  const pieData = stats.kinerjaData
    .filter(k => k.count > 0)
    .map(k => ({ name: `Indeks ${k.indeks}`, value: k.count }));

  const barData = stats.kinerjaData.map(k => ({ name: `Indeks ${k.indeks}`, jumlah: k.count }));

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter & Export row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        </div>
        <div className="w-[200px]">
          <Label className="text-xs text-muted-foreground">PIC</Label>
          <Select value={filterPic} onValueChange={setFilterPic}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Semua PIC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua PIC</SelectItem>
              {uniquePics.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {filterPic !== "all" && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFilterPic("all")}>
            Reset Filter
          </Button>
        )}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportStatistik}>
            <Download className="h-4 w-4 mr-1" />Export Statistik
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pengajuan</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Selesai</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100"><Clock className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Proses</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Hari Kerja</p>
                <p className="text-2xl font-bold">{stats.avgDays} <span className="text-sm font-normal">hari</span></p>
                {stats.avgKinerja && (
                  <Badge variant="outline" className="mt-1" style={{ borderColor: stats.avgKinerja.color, color: stats.avgKinerja.color }}>
                    {stats.avgKinerja.label}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kinerja Index Legend */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Pengelolaan Kinerja - Formula Indeks</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {INDEKS_DESCRIPTIONS.map(item => (
              <div key={item.indeks} className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: item.color }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="font-semibold text-sm">Indeks {item.indeks}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Distribusi Indeks Kinerja</CardTitle></CardHeader>
          <CardContent>
            {stats.countWithDays === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada data yang selesai</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="jumlah" fill="hsl(var(--primary))">
                    {barData.map((_, idx) => <Cell key={idx} fill={INDEKS_COLORS[idx]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Proporsi Indeks Kinerja</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Belum ada data yang selesai</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((entry, idx) => {
                      const indeksNum = parseInt(entry.name.replace("Indeks ", ""));
                      return <Cell key={idx} fill={INDEKS_COLORS[5 - indeksNum]} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail per Indeks */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Detail Kinerja per Pegawai</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.kinerjaData.map(group => {
              if (group.items.length === 0) return null;
              const indeksInfo = INDEKS_DESCRIPTIONS[5 - group.indeks];
              return (
                <div key={group.indeks}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: indeksInfo.color }} />
                    <span className="font-semibold">Indeks {group.indeks}</span>
                    <span className="text-sm text-muted-foreground">({indeksInfo.desc})</span>
                    <Badge variant="secondary">{group.count} pegawai</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-5">
                    {group.items.map(item => {
                      const days = getWorkingDays(new Date(item.tanggal_pengajuan!), new Date(item.tanggal_karis_karsu_terbit!));
                      return (
                        <div key={item.id} className="p-2 border rounded text-sm">
                          <p className="font-medium">{item.nama}</p>
                          <p className="text-muted-foreground">{item.nip} • {days} hari kerja</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
