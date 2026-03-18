import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ExternalLink } from "lucide-react";
import denahLantai1 from "@/assets/denah-lantai-1.png";
import denahLantai2 from "@/assets/denah-lantai-2.png";

interface GudangStats {
  jumlahRak: number;
  totalKapasitas: number;
  jumlahTerisi: number;
  sisaKapasitas: number;
}

interface RakData {
  nomor_rak: string;
  jumlah_terisi_box: number;
  kapasitas: number;
  percentage: number;
}

interface IsiBerkas {
  status_dokumen: string;
  dimusnahkan: boolean | null;
  kurun_waktu: string;
  usia_retensi: string | null;
}

export default function DashboardArsip() {
  const [stats, setStats] = useState<GudangStats>({
    jumlahRak: 0,
    totalKapasitas: 0,
    jumlahTerisi: 0,
    sisaKapasitas: 0,
  });
  const [chartData, setChartData] = useState<RakData[]>([]);
  const [selectedRak, setSelectedRak] = useState<string>("all");
  const [rakOptions, setRakOptions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dimusnahkanFilter, setDimusnahkanFilter] = useState<string>("all");
  const [documentData, setDocumentData] = useState<IsiBerkas[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDocumentData();
  }, [selectedRak, statusFilter, dimusnahkanFilter]);

  const calculateStatusDokumen = (kurunWaktu: string, usiaRetensi?: string | null): string => {
    try {
      const docDate = new Date(kurunWaktu);
      const now = new Date();
      const diffYears = now.getFullYear() - docDate.getFullYear();
      
      const retensiYears = usiaRetensi ? parseInt(usiaRetensi.split(" ")[0]) : 5;
      
      return diffYears >= retensiYears ? "Inaktif" : "Aktif";
    } catch {
      return "Aktif";
    }
  };

  const fetchDocumentData = async () => {
    let query = supabase.from("isi_berkas").select("*");

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching document data:", error);
      return;
    }

    if (data) {
      const processedData = data.map((item: any) => ({
        ...item,
        status_dokumen: calculateStatusDokumen(item.kurun_waktu, item.usia_retensi),
      }));

      let filtered = processedData;

      if (statusFilter !== "all") {
        filtered = filtered.filter((item: any) => item.status_dokumen === statusFilter);
      }

      if (dimusnahkanFilter !== "all") {
        const isDestroyed = dimusnahkanFilter === "sudah";
        filtered = filtered.filter((item: any) => item.dimusnahkan === isDestroyed);
      }

      setDocumentData(filtered);
    }
  };

  const fetchDashboardData = async () => {
    const { data: gudangData, error: gudangError } = await supabase
      .from("gudang_arsip_tegalsari")
      .select("*");

    if (gudangError) {
      console.error("Error fetching gudang data:", gudangError);
      return;
    }

    if (gudangData) {
      const totalJumlahRak = gudangData.reduce((sum, item) => sum + item.jumlah_rak, 0);
      const totalKapasitas = gudangData.reduce((sum, item) => sum + item.kapasitas, 0);
      const totalTerisi = gudangData.reduce((sum, item) => sum + item.jumlah_terisi_box, 0);
      const totalSisa = totalKapasitas - totalTerisi;

      setStats({
        jumlahRak: totalJumlahRak,
        totalKapasitas: totalKapasitas,
        jumlahTerisi: totalTerisi,
        sisaKapasitas: totalSisa,
      });

      const rakList = gudangData.map((item) => item.nomor_rak);
      setRakOptions(rakList);

      const chartDataProcessed = gudangData.map((item) => ({
        nomor_rak: item.nomor_rak,
        jumlah_terisi_box: item.jumlah_terisi_box,
        kapasitas: item.kapasitas,
        percentage: item.kapasitas > 0 ? (item.jumlah_terisi_box / item.kapasitas) * 100 : 0,
      }));

      setChartData(chartDataProcessed);
    }
  };

  const filteredChartData = selectedRak === "all" 
    ? chartData 
    : chartData.filter(item => item.nomor_rak === selectedRak);

  const filteredStats = selectedRak === "all"
    ? stats
    : {
        jumlahRak: 1,
        totalKapasitas: filteredChartData[0]?.kapasitas || 0,
        jumlahTerisi: filteredChartData[0]?.jumlah_terisi_box || 0,
        sisaKapasitas: (filteredChartData[0]?.kapasitas || 0) - (filteredChartData[0]?.jumlah_terisi_box || 0),
      };

  const links = [
    {
      title: "Link Web MondangSIPT",
      url: "https://bit.ly/MONDANGSIPT_BCJATIM",
    },
    {
      title: "Link SOP Arsip",
      url: "https://kemenkeu.sharepoint.com/:f:/r/sites/SubBagianTUK2/Shared%20Documents/General/2024/MONEV%20SOP%202024/SOP%20TU?csf=1&web=1&e=KGN65b",
    },
    {
      title: "Link Peraturan JRA DJBC 1082",
      url: "https://drive.google.com/drive/folders/1bo5ntZOuzY6uAwUORphSKiGxPMfiebnq",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nomor Rak</label>
              <Select value={selectedRak} onValueChange={setSelectedRak}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Nomor Rak" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">Semua Rak</SelectItem>
                  {rakOptions.map((rak) => (
                    <SelectItem key={rak} value={rak}>
                      {rak}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Dokumen</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Inaktif">Inaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Dimusnahkan</label>
              <Select value={dimusnahkanFilter} onValueChange={setDimusnahkanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status Dimusnahkan" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="belum">Belum Dimusnahkan</SelectItem>
                  <SelectItem value="sudah">Sudah Dimusnahkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jumlah Rak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.jumlahRak}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Kapasitas (Box)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.totalKapasitas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Jumlah Terisi (Box)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.jumlahTerisi}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Sisa Kapasitas (Box)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStats.sisaKapasitas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Persentase Pengisian Dokumen per Rak</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nomor_rak" />
              <YAxis label={{ value: 'Jumlah Dokumen (Box)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === "jumlah_terisi_box") return [value, "Jumlah Terisi"];
                  if (name === "percentage") return [`${value.toFixed(1)}%`, "Persentase"];
                  return [value, name];
                }}
              />
              <Bar dataKey="jumlah_terisi_box" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Floor Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Denah Lantai I</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <img 
              src={denahLantai1} 
              alt="Denah Lantai I" 
              className="w-full h-auto max-w-full rounded-lg border shadow-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Denah Lantai II</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-auto">
            <img 
              src={denahLantai2} 
              alt="Denah Lantai II" 
              className="w-full h-auto max-w-full rounded-lg border shadow-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card>
        <CardHeader>
          <CardTitle>Link Referensi Arsip</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{link.title}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
