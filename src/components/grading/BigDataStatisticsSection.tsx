import React, { useState, useMemo, Fragment, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BarChart3, Users, ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";

interface GradingData {
  id: string;
  nama_lengkap: string;
  nip: string;
  pendidikan: string | null;
  grade: string | null;
  grade_baru: string | null;
  jabatan: string | null;
  jabatan_baru: string | null;
  pangkat_golongan: string | null;
  eselon_iii: string | null;
  eselon_iv: string | null;
  kemampuan_kerja: string | null;
  rekomendasi: string | null;
  jenis: string | null;
}

interface BigDataStatisticsSectionProps {
  gradingData: GradingData[];
}

type StatisticType = 
  | "pendidikan" 
  | "grade_lama" 
  | "grade_baru" 
  | "jabatan_lama" 
  | "jabatan_baru" 
  | "golongan" 
  | "eselon_iii" 
  | "eselon_iv" 
  | "kemampuan_kerja" 
  | "rekomendasi";

const STAT_OPTIONS: { value: StatisticType; label: string }[] = [
  { value: "pendidikan", label: "Statistik Pendidikan" },
  { value: "grade_lama", label: "Statistik Grading Lama" },
  { value: "grade_baru", label: "Statistik Grading Baru" },
  { value: "jabatan_lama", label: "Statistik Jabatan Lama" },
  { value: "jabatan_baru", label: "Statistik Jabatan Baru" },
  { value: "golongan", label: "Statistik Golongan" },
  { value: "eselon_iii", label: "Statistik Eselon III" },
  { value: "eselon_iv", label: "Statistik Eselon IV" },
  { value: "kemampuan_kerja", label: "Statistik Kemampuan Kerja" },
  { value: "rekomendasi", label: "Statistik Rekomendasi" },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

const getFieldValue = (item: GradingData, statType: StatisticType): string | null => {
  switch (statType) {
    case "pendidikan": return item.pendidikan;
    case "grade_lama": return item.grade;
    case "grade_baru": return item.grade_baru;
    case "jabatan_lama": return item.jabatan;
    case "jabatan_baru": return item.jabatan_baru;
    case "golongan": return item.pangkat_golongan;
    case "eselon_iii": return item.eselon_iii;
    case "eselon_iv": return item.eselon_iv;
    case "kemampuan_kerja": return item.kemampuan_kerja;
    case "rekomendasi": return item.rekomendasi;
    default: return null;
  }
};

function StatChartPanel({ statType, gradingData, label }: { statType: StatisticType; gradingData: GradingData[]; label: string }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    gradingData.forEach(item => {
      const value = getFieldValue(item, statType);
      if (value) {
        const key = value.toString().trim();
        if (key) counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], idx) => ({
        name: name.length > 30 ? name.substring(0, 30) + "..." : name,
        fullName: name,
        value,
        fill: COLORS[idx % COLORS.length],
      }));
  }, [gradingData, statType]);

  const totalData = distribution.reduce((sum, item) => sum + item.value, 0);

  const getEmployeesForCategory = useCallback((categoryName: string): GradingData[] => {
    return gradingData.filter(item => {
      const value = getFieldValue(item, statType);
      return value?.toString().trim() === categoryName ||
        (value?.toString().trim().startsWith(categoryName.replace("...", "")));
    });
  }, [gradingData, statType]);

  const handleChartClick = (categoryFullName: string) => {
    setExpandedCategory(prev => prev === categoryFullName ? null : categoryFullName);
  };

  const handlePieClick = (data: any) => {
    if (data?.fullName) handleChartClick(data.fullName);
  };

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      handleChartClick(data.activePayload[0].payload.fullName);
    }
  };

  const exportToExcel = () => {
    const allEmployees: any[] = [];
    distribution.forEach(item => {
      const employees = getEmployeesForCategory(item.fullName);
      employees.forEach((emp, idx) => {
        allEmployees.push({
          No: allEmployees.length + 1,
          Kategori: item.fullName,
          Nama: emp.nama_lengkap,
          NIP: emp.nip,
          Pendidikan: emp.pendidikan || "-",
          Golongan: emp.pangkat_golongan || "-",
          Jabatan: emp.jabatan || "-",
          Grade: emp.grade || "-",
          "Grade Baru": emp.grade_baru || "-",
          Rekomendasi: emp.rekomendasi || "-",
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(allEmployees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31));
    XLSX.writeFile(wb, `${label.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-sm">{label}</Badge>
        <Badge variant="outline" className="text-sm">Total: {totalData}</Badge>
        <Badge variant="outline" className="text-sm">Kategori: {distribution.length}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribusi {label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution.slice(0, 10)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ value }) => value > 0 ? `${value}` : ''} className="cursor-pointer" onClick={handlePieClick}>
                    {distribution.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke={expandedCategory === entry.fullName ? "#000" : undefined} strokeWidth={expandedCategory === entry.fullName ? 3 : 1} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Jumlah per Kategori (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution.slice(0, 10)} layout="vertical" onClick={handleBarClick} className="cursor-pointer">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {distribution.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke={expandedCategory === entry.fullName ? "#000" : undefined} strokeWidth={expandedCategory === entry.fullName ? 3 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detail Pegawai per Kategori - {label}
            </div>
            <Button variant="outline" size="sm" onClick={exportToExcel} className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-center">Jumlah</TableHead>
                  <TableHead className="text-center">Persentase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribution.map((item) => {
                  const isExpanded = expandedCategory === item.fullName;
                  const employees = isExpanded ? getEmployeesForCategory(item.fullName) : [];
                  return (
                    <Fragment key={item.fullName}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedCategory(isExpanded ? null : item.fullName)}>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="font-medium">{item.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{item.value}</Badge></TableCell>
                        <TableCell className="text-center">{totalData > 0 ? ((item.value / totalData) * 100).toFixed(1) : 0}%</TableCell>
                      </TableRow>
                      {isExpanded && employees.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="p-0 bg-muted/30">
                            <div className="p-4">
                              <ScrollArea className="w-full">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">No</TableHead>
                                      <TableHead>Nama</TableHead>
                                      <TableHead>NIP</TableHead>
                                      <TableHead>Pendidikan</TableHead>
                                      <TableHead>Golongan</TableHead>
                                      <TableHead>Jabatan</TableHead>
                                      <TableHead>Grade</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {employees.slice(0, 20).map((emp, empIdx) => (
                                      <TableRow key={emp.id}>
                                        <TableCell>{empIdx + 1}</TableCell>
                                        <TableCell className="font-medium">{emp.nama_lengkap}</TableCell>
                                        <TableCell>{emp.nip}</TableCell>
                                        <TableCell>{emp.pendidikan || "-"}</TableCell>
                                        <TableCell>{emp.pangkat_golongan || "-"}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{emp.jabatan || "-"}</TableCell>
                                        <TableCell>{emp.grade || "-"}</TableCell>
                                      </TableRow>
                                    ))}
                                    {employees.length > 20 && (
                                      <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                                          ... dan {employees.length - 20} pegawai lainnya
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                                <ScrollBar orientation="horizontal" />
                              </ScrollArea>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BigDataStatisticsSection({ gradingData }: BigDataStatisticsSectionProps) {
  const [selectedStats, setSelectedStats] = useState<StatisticType[]>(["rekomendasi"]);

  const toggleStat = (stat: StatisticType) => {
    setSelectedStats(prev => {
      if (prev.includes(stat)) {
        return prev.filter(s => s !== stat);
      }
      return [...prev, stat];
    });
  };

  return (
    <div className="space-y-6">
      {/* Checkbox Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Parameter Statistik Big Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {STAT_OPTIONS.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`stat-${opt.value}`}
                  checked={selectedStats.includes(opt.value)}
                  onCheckedChange={() => toggleStat(opt.value)}
                />
                <Label htmlFor={`stat-${opt.value}`} className="text-xs sm:text-sm cursor-pointer leading-tight">
                  {opt.label.replace("Statistik ", "")}
                </Label>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              Terpilih: {selectedStats.length} parameter
            </Badge>
          </div>
        </CardContent>
      </Card>

      {selectedStats.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Centang minimal satu parameter untuk menampilkan statistik.
          </CardContent>
        </Card>
      )}

      {selectedStats.map(stat => {
        const label = STAT_OPTIONS.find(o => o.value === stat)?.label || stat;
        return <StatChartPanel key={stat} statType={stat} gradingData={gradingData} label={label} />;
      })}
    </div>
  );
}
