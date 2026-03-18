import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Users, CheckCircle, Clock, Plane, Building2, PieChart, Database } from "lucide-react";
import { PieChart as RechartPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import OlahDataOtomatis from "@/components/OlahDataOtomatis";

interface EmployeeStrength {
  total: number;
  hadir: number;
  cuti: number;
  tugas: number;
  persentaseHadir: number;
}

interface UnitStrength {
  unit: string;
  total: number;
  hadir: number;
  persentase: number;
}

const UNIT_LIST = [
  "Kanwil DJBC Jawa Timur I",
  "KPPBC TMP Tanjung Perak",
  "KPPBC TMP C Juanda",
  "KPPBC TMP A Surabaya",
  "KPPBC TMP Tanjung Wangi",
  "KPPBC TMP Pasuruan",
  "PSO Sidoarjo",
  "PSO Gresik",
  "PSO Mojokerto"
];

const COLORS = ['#22C55E', '#F59E0B', '#3B82F6'];

export default function KekuatanPegawaiPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [strength, setStrength] = useState<EmployeeStrength>({
    total: 0, hadir: 0, cuti: 0, tugas: 0, persentaseHadir: 0
  });
  const [unitStrength, setUnitStrength] = useState<UnitStrength[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStrengthData();
    }
  }, [user, selectedDate]);

  const fetchStrengthData = async () => {
    try {
      setLoading(true);
      
      // Get total employees
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("id, nm_pegawai, nm_unit_organisasi");
      
      if (empError) throw empError;
      const totalEmployees = employees?.length || 0;

      // Get attendance for selected date
      const { data: absensi, error: absenError } = await supabase
        .from("absensi")
        .select("nip")
        .eq("tanggal", selectedDate)
        .not("jam_masuk", "is", null);
      
      if (absenError) throw absenError;
      const hadirCount = absensi?.length || 0;

      // Get cuti for selected date
      const { data: cutiData, error: cutiError } = await supabase
        .from("cuti")
        .select("*")
        .eq("tahun_cuti", new Date(selectedDate).getFullYear());
      
      if (cutiError) throw cutiError;
      
      // Count employees on cuti for the selected date
      let cutiCount = 0;
      cutiData?.forEach(cuti => {
        const cutiDates = [
          cuti.tanggal_cuti_tahunan,
          cuti.tanggal_cuti_sakit,
          cuti.tanggal_cuti_alasan_penting,
          cuti.tanggal_cuti_melahirkan,
          cuti.tanggal_cuti_besar_non_keagamaan
        ].filter(Boolean);
        
        // Simple check if the date is mentioned in any cuti field
        if (cutiDates.some(d => d?.includes(format(new Date(selectedDate), "dd/MM/yyyy")))) {
          cutiCount++;
        }
      });

      // Get surat tugas for selected date
      const { data: assignments, error: assignError } = await supabase
        .from("assignments")
        .select("employee_ids, tanggal_mulai_kegiatan, tanggal_selesai_kegiatan")
        .lte("tanggal_mulai_kegiatan", selectedDate)
        .gte("tanggal_selesai_kegiatan", selectedDate);
      
      if (assignError) throw assignError;
      
      // Count unique employees on assignment
      const tugasEmployeeIds = new Set<string>();
      assignments?.forEach(a => {
        a.employee_ids?.forEach((id: string) => tugasEmployeeIds.add(id));
      });
      const tugasCount = tugasEmployeeIds.size;

      // Calculate percentages
      const persentaseHadir = totalEmployees > 0 ? 
        Math.round((hadirCount / totalEmployees) * 100) : 0;

      setStrength({
        total: totalEmployees,
        hadir: hadirCount,
        cuti: cutiCount,
        tugas: tugasCount,
        persentaseHadir
      });

      // Calculate per-unit strength
      const unitData: UnitStrength[] = UNIT_LIST.map(unit => {
        const unitEmployees = employees?.filter(e => 
          e.nm_unit_organisasi?.toLowerCase().includes(unit.toLowerCase().split(' ')[0])
        ) || [];
        
        // For simplicity, estimate attendance based on overall percentage
        const unitHadir = Math.round((unitEmployees.length * persentaseHadir) / 100);
        
        return {
          unit: unit.replace("KPPBC TMP ", "").replace("Kanwil DJBC ", ""),
          total: unitEmployees.length,
          hadir: unitHadir,
          persentase: unitEmployees.length > 0 ? 
            Math.round((unitHadir / unitEmployees.length) * 100) : 0
        };
      });

      setUnitStrength(unitData);

    } catch (error) {
      console.error("Error fetching strength data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Hadir', value: strength.hadir },
    { name: 'Cuti', value: strength.cuti },
    { name: 'Tugas Luar', value: strength.tugas }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-lg">Memuat...</p>
      </div>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Beranda", path: "/" }, { label: "Kekuatan Pegawai" }]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Kekuatan Pegawai</h1>
            <p className="text-muted-foreground">
              Monitoring kehadiran dan status pegawai
            </p>
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="olah-data" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Olah Data Otomatis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Pegawai</p>
                      <p className="text-2xl font-bold">{strength.total}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Hadir</p>
                      <p className="text-2xl font-bold text-green-600">{strength.hadir}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Cuti</p>
                      <p className="text-2xl font-bold text-amber-600">{strength.cuti}</p>
                    </div>
                    <Clock className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tugas Luar</p>
                      <p className="text-2xl font-bold text-blue-600">{strength.tugas}</p>
                    </div>
                    <Plane className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Distribusi Status Pegawai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {loading ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">Memuat data...</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPie>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartPie>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Percentage Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Persentase Kekuatan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="16"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="16"
                          strokeDasharray={`${strength.persentaseHadir * 5.03} 503`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-green-600">
                          {strength.persentaseHadir}%
                        </span>
                        <span className="text-sm text-muted-foreground">Hadir</span>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-muted-foreground">
                      Kekuatan Pegawai Kanwil DJBC Jawa Timur I
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Per Unit Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Kekuatan Per Satuan Kerja</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitStrength} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="unit" fontSize={12} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Persentase Hadir']} />
                      <Bar dataKey="persentase" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="olah-data">
            <OlahDataOtomatis />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}