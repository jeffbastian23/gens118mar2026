import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Award, AlertTriangle, GraduationCap, FileText, ScrollText, FileCheck2, BarChart3, Download, Presentation } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import JadwalSidangGradingSection from "./JadwalSidangGradingSection";
import BigDataStatisticsSection from "./BigDataStatisticsSection";
import BigDataFilterSection from "./BigDataFilterSection";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const PKT_COLORS: Record<string, string> = {
  'Sangat Baik': '#10b981',
  'Baik': '#3b82f6',
  'Cukup': '#f59e0b',
  'Kurang': '#ef4444',
  'Buruk': '#6b7280',
};

interface GradingData {
  id: string;
  nama_lengkap: string;
  nip: string;
  jenis: string;
  rekomendasi: string;
  pkt_2024: string;
  pkt_2025: string;
  hukuman_disiplin: boolean;
  tugas_belajar: boolean;
  upkp: boolean;
  grade: string;
  grade_baru: string;
  pangkat_golongan: string;
  pendidikan: string;
  lokasi: string;
  jabatan: string;
  jabatan_baru: string;
  eselon_iii: string;
  eselon_iv: string;
  kemampuan_kerja: string;
}

interface KepSalinanData {
  id: string;
}

interface PetikanData {
  id: string;
}

interface PermohonanData {
  id: string;
}

interface GradingDashboardProps {
  gradingData: GradingData[];
  kepSalinanData: KepSalinanData[];
  petikanData: any[];
  permohonanData: any[];
  isAdmin?: boolean;
};

export default function GradingDashboard({ gradingData, kepSalinanData, petikanData, permohonanData, isAdmin = true }: GradingDashboardProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalPegawai = gradingData.length;
    const potensiPKP = gradingData.filter(d => 
      (d.pkt_2024 === "Sangat Baik" || d.pkt_2024 === "Baik") &&
      (d.pkt_2025 === "Sangat Baik" || d.pkt_2025 === "Baik")
    ).length;
    const tidakPotensiPKP = gradingData.filter(d =>
      (d.pkt_2024 && !["Sangat Baik", "Baik"].includes(d.pkt_2024)) ||
      (d.pkt_2025 && !["Sangat Baik", "Baik"].includes(d.pkt_2025))
    ).length;
    const hukumanDisiplin = gradingData.filter(d => d.hukuman_disiplin).length;
    const tugasBelajar = gradingData.filter(d => d.tugas_belajar).length;
    const totalKep = kepSalinanData.length;
    const totalPetikan = petikanData.length;
    const totalPermohonan = permohonanData.length;

    return { totalPegawai, potensiPKP, tidakPotensiPKP, hukumanDisiplin, tugasBelajar, totalKep, totalPetikan, totalPermohonan };
  }, [gradingData, kepSalinanData, petikanData, permohonanData]);

  // PKT Distribution for 2024 and 2025
  const pktDistribution2024 = useMemo(() => {
    const counts: Record<string, number> = {
      'Sangat Baik': 0,
      'Baik': 0,
      'Butuh Perbaikan': 0,
      'Kurang': 0,
      'Sangat Kurang': 0,
    };
    gradingData.forEach(d => {
      if (d.pkt_2024 && counts.hasOwnProperty(d.pkt_2024)) {
        counts[d.pkt_2024]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: PKT_COLORS[name as keyof typeof PKT_COLORS] }));
  }, [gradingData]);

  const pktDistribution2025 = useMemo(() => {
    const counts: Record<string, number> = {
      'Sangat Baik': 0,
      'Baik': 0,
      'Butuh Perbaikan': 0,
      'Kurang': 0,
      'Sangat Kurang': 0,
    };
    gradingData.forEach(d => {
      if (d.pkt_2025 && counts.hasOwnProperty(d.pkt_2025)) {
        counts[d.pkt_2025]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: PKT_COLORS[name as keyof typeof PKT_COLORS] }));
  }, [gradingData]);

  // Jenis Distribution (PU, PK, PTB, Pelaksana Tertentu)
  const jenisDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    gradingData.forEach(d => {
      if (d.jenis) {
        counts[d.jenis] = (counts[d.jenis] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value], idx) => ({ name, value, fill: COLORS[idx % COLORS.length] }));
  }, [gradingData]);

  // Rekomendasi Distribution
  const rekomendasiDistribution = useMemo(() => {
    const counts: Record<string, number> = { 'Naik': 0, 'Tetap': 0, 'Turun': 0, 'Belum': 0 };
    gradingData.forEach(d => {
      if (d.rekomendasi && counts.hasOwnProperty(d.rekomendasi)) {
        counts[d.rekomendasi]++;
      } else {
        counts['Belum']++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [gradingData]);

  // Grade Distribution
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    gradingData.forEach(d => {
      const grade = d.grade || 'N/A';
      counts[grade] = (counts[grade] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => {
        const numA = parseInt(a) || 999;
        const numB = parseInt(b) || 999;
        return numA - numB;
      })
      .slice(0, 12)
      .map(([name, value]) => ({ name: `Grade ${name}`, value }));
  }, [gradingData]);

  // Pendidikan Distribution
  const pendidikanDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    gradingData.forEach(d => {
      if (d.pendidikan) {
        counts[d.pendidikan] = (counts[d.pendidikan] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value], idx) => ({ name, value, fill: COLORS[idx % COLORS.length] }));
  }, [gradingData]);

  // Lokasi Distribution (Top 5)
  const lokasiDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    gradingData.forEach(d => {
      if (d.lokasi) {
        counts[d.lokasi] = (counts[d.lokasi] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, value }));
  }, [gradingData]);

  const handleDownloadMateri = () => {
    const link = document.createElement('a');
    link.href = '/documents/Slide_Grading_2026_rev.pptx';
    link.download = 'Slide_Grading_2026_rev.pptx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Materi Download Button */}
      <div className="flex justify-end">
        <Button onClick={handleDownloadMateri} variant="outline" className="gap-2">
          <Presentation className="h-4 w-4" />
          <Download className="h-4 w-4" />
          Download Materi Grading (PPT)
        </Button>
      </div>

      {/* Row 1: Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pegawai</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalPegawai}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Potensi PKP</CardTitle>
            <Award className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.potensiPKP}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tidak Potensi PKP</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{stats.tidakPotensiPKP}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hukuman Disiplin</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats.hukumanDisiplin}</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: More Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tugas Belajar</CardTitle>
            <GraduationCap className="h-5 w-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{stats.tugasBelajar}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total KEP & Salinan</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.totalKep}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Petikan</CardTitle>
            <ScrollText className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{stats.totalPetikan}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Permohonan</CardTitle>
            <FileCheck2 className="h-5 w-5 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-700 dark:text-pink-300">{stats.totalPermohonan}</div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Charts - PKT Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribusi PKT 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pktDistribution2024}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {pktDistribution2024.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pktDistribution2024.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <Badge variant="secondary" style={{ backgroundColor: item.fill, color: 'white' }}>
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribusi PKT 2025
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pktDistribution2025}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {pktDistribution2025.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pktDistribution2025.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <Badge variant="secondary" style={{ backgroundColor: item.fill, color: 'white' }}>
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Jenis & Rekomendasi Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi per Jenis (PU/PK/PTB)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jenisDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {jenisDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Rekomendasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rekomendasiDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#9ca3af" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Grade & Pendidikan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pendidikan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pendidikanDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {pendidikanDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Lokasi Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi per Lokasi (Top 6)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lokasiDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Row 7: Jadwal Sidang Grading */}
      <JadwalSidangGradingSection isAdmin={isAdmin} />

      {/* Row 8: Filter Statistik Big Data */}
      <BigDataFilterSection gradingData={gradingData} />

      {/* Row 9: Big Data Statistics Parameter */}
      <BigDataStatisticsSection gradingData={gradingData} />
    </div>
  );
}
