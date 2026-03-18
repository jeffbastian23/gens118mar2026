import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Calendar, Clock, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";

export default function AbsensiDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 50;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["absensi-stats"],
    queryFn: async () => {
      // Fetch all records in batches
      const pageSize = 1000;
      let from = 0;
      let all: any[] = [];
      while (true) {
        const { data, error } = await supabase
          .from("absensi")
          .select("*")
          .range(from, from + pageSize - 1);

        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }

      const totalRecords = all.length;
      const uniqueEmployees = new Set(all.map((item) => item.nip)).size;
      const today = new Date().toISOString().split("T")[0];
      const todayRecords = all.filter((item) => item.tanggal === today).length;

      // Calculate average attendance per day
      const dateGroups = all.reduce((acc: any, item) => {
        const date = item.tanggal;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const avgPerDay =
        Object.keys(dateGroups).length > 0
          ? (totalRecords / Object.keys(dateGroups).length).toFixed(1)
          : 0;

      // Check for incomplete attendance
      const incompleteRecordsData = all.filter((item) => {
        // Missing jam_masuk or jam_pulang
        if (!item.jam_masuk || !item.jam_pulang) {
          return true;
        }

        // Parse times
        const jamMasuk = item.jam_masuk.split(':');
        const jamPulang = item.jam_pulang.split(':');
        const masukMinutes = parseInt(jamMasuk[0]) * 60 + parseInt(jamMasuk[1]);
        const pulangMinutes = parseInt(jamPulang[0]) * 60 + parseInt(jamPulang[1]);

        // Standard work hours: 07:30 - 17:00
        const standardMasuk = 7 * 60 + 30; // 07:30 = 450 minutes
        const standardPulang = 17 * 60; // 17:00 = 1020 minutes

        // Calculate allowed range (90 minutes tolerance)
        const earliestMasuk = standardMasuk - 90; // 06:00
        const latestMasuk = standardMasuk + 90; // 09:00

        // Check if masuk is within allowed range
        if (masukMinutes < earliestMasuk || masukMinutes > latestMasuk) {
          return true;
        }

        // Calculate expected pulang based on actual masuk
        let expectedPulang = standardPulang;
        
        if (masukMinutes < standardMasuk) {
          // Came early: can leave early proportionally
          const earlyMinutes = standardMasuk - masukMinutes;
          expectedPulang = standardPulang - earlyMinutes;
        } else if (masukMinutes > standardMasuk) {
          // Came late: must stay late proportionally
          const lateMinutes = masukMinutes - standardMasuk;
          expectedPulang = standardPulang + lateMinutes;
        }

        // Allow 15 minutes tolerance for pulang
        const tolerance = 15;
        if (pulangMinutes < expectedPulang - tolerance) {
          return true; // Left too early
        }

        return false;
      });

      const incompleteRecords = incompleteRecordsData.length;

      // Group incomplete records by employee
      const employeeIncompleteMap = incompleteRecordsData.reduce((acc: any, item) => {
        const key = item.nip;
        if (!acc[key]) {
          acc[key] = {
            nama: item.nama,
            nip: item.nip,
            dates: [],
            count: 0
          };
        }
        acc[key].dates.push(item.tanggal);
        acc[key].count++;
        return acc;
      }, {});

      const employeeIncompleteList = Object.values(employeeIncompleteMap).sort((a: any, b: any) => b.count - a.count);

      return {
        totalRecords,
        uniqueEmployees,
        todayRecords,
        avgPerDay,
        incompleteRecords,
        employeeIncompleteList,
      };
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const completeRecords = (stats?.totalRecords || 0) - (stats?.incompleteRecords || 0);
  const completePercentage = stats?.totalRecords ? (completeRecords / stats.totalRecords) * 100 : 0;
  const incompletePercentage = stats?.totalRecords ? ((stats?.incompleteRecords || 0) / stats.totalRecords) * 100 : 0;

  // Filter employees based on search query
  const filteredEmployees = (stats?.employeeIncompleteList || []).filter((employee: any) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const namaMatch = employee.nama?.toLowerCase().includes(query);
    const nipMatch = employee.nip?.toLowerCase().includes(query);
    const datesMatch = employee.dates?.some((date: string) => 
      format(new Date(date), "dd/MM/yy").includes(query) ||
      date.includes(query)
    );
    
    return namaMatch || nipMatch || datesMatch;
  });

  // Pagination calculations
  const totalEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(totalEmployees / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard Absensi</h2>
        <div className="flex gap-0 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-green-500 h-full transition-all"
            style={{ width: `${completePercentage}%` }}
            title={`Lengkap: ${completeRecords} (${completePercentage.toFixed(1)}%)`}
          />
          <div 
            className="bg-red-500 h-full transition-all"
            style={{ width: `${incompletePercentage}%` }}
            title={`Tidak Lengkap: ${stats?.incompleteRecords} (${incompletePercentage.toFixed(1)}%)`}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span className="text-green-600">Lengkap: {completeRecords} ({completePercentage.toFixed(1)}%)</span>
          <span className="text-red-600">Tidak Lengkap: {stats?.incompleteRecords} ({incompletePercentage.toFixed(1)}%)</span>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pegawai
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.uniqueEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Pegawai terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rekaman
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              Total data absensi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Absensi Hari Ini
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayRecords}</div>
            <p className="text-xs text-muted-foreground">
              Rekaman hari ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata per Hari
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgPerDay}</div>
            <p className="text-xs text-muted-foreground">
              Rekaman per hari
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Absensi Tidak Lengkap
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.incompleteRecords}</div>
            <p className="text-xs text-muted-foreground">
              Tidak sesuai aturan
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.employeeIncompleteList && stats.employeeIncompleteList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Pegawai Absensi Tidak Lengkap</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Menampilkan {startIndex + 1}-{Math.min(endIndex, totalEmployees)} dari {totalEmployees} pegawai
              {searchQuery && ` (hasil filter dari ${stats?.employeeIncompleteList?.length || 0} pegawai)`}
            </p>
          </CardHeader>
          <CardContent>
            {/* Search Filter */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan Nama, NIP, atau Tanggal..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Nama Pegawai</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Tanggal Absen Tidak Lengkap</TableHead>
                    <TableHead className="text-right">Total Tidak Lengkap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentEmployees.map((employee: any, index: number) => (
                    <TableRow key={employee.nip}>
                      <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                      <TableCell>{employee.nama}</TableCell>
                      <TableCell>{employee.nip}</TableCell>
                      <TableCell>
                        {employee.dates
                          .sort()
                          .map((date: string) => format(new Date(date), "dd/MM/yy"))
                          .join("; ")}
                      </TableCell>
                      <TableCell className="text-right font-medium">{employee.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Awal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Akhir
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
