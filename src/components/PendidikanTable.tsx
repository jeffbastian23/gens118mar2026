import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, GraduationCap, Calendar, MapPin, BookOpen, School, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface PendidikanData {
  "Nama Lengkap": string;
  "NIP": string;
  "Pendidikan": string;
  "Tahun Lulus": number;
  "Lokasi Pendidikan": string;
  "Jurusan": string;
  "Nama Lembaga Pendidikan": string;
}

const PRIMARY_COLOR = '#1e5ba8';

export default function PendidikanTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [data, setData] = useState<PendidikanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [educationLevelStats, setEducationLevelStats] = useState<{ name: string; value: number }[]>([]);
  const [graduationYearStats, setGraduationYearStats] = useState<{ name: string; value: number }[]>([]);
  const [locationStats, setLocationStats] = useState<{ name: string; value: number }[]>([]);
  const [majorStats, setMajorStats] = useState<{ name: string; value: number }[]>([]);
  const [institutionStats, setInstitutionStats] = useState<{ name: string; value: number }[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    loadExcelData();
  }, []);

  const getYearRange = (year: number): string => {
    if (year < 2000) return "< 2000";
    if (year <= 2005) return "2000-2005";
    if (year <= 2010) return "2006-2010";
    if (year <= 2015) return "2011-2015";
    if (year <= 2020) return "2016-2020";
    if (year <= 2025) return "2021-2025";
    return "> 2025";
  };

  const loadExcelData = async () => {
    try {
      // First get the total count
      const { count: totalCount } = await supabase
        .from("pendidikan")
        .select("*", { count: "exact", head: true });
      
      console.log(`[PendidikanTable] Total records in database: ${totalCount}`);
      
      // Fetch all records in chunks to bypass 1000 row limit
      const chunkSize = 1000;
      let allData: any[] = [];
      
      if (totalCount && totalCount > 0) {
        const numChunks = Math.ceil(totalCount / chunkSize);
        console.log(`[PendidikanTable] Fetching ${numChunks} chunks of ${chunkSize} records each`);
        
        for (let i = 0; i < numChunks; i++) {
          const start = i * chunkSize;
          const end = start + chunkSize - 1;
          
          const { data: chunkData, error } = await supabase
            .from("pendidikan")
            .select("*")
            .order("nama_lengkap", { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`[PendidikanTable] Error fetching chunk ${i + 1}:`, error);
            throw error;
          }
          
          if (chunkData) {
            allData = [...allData, ...chunkData];
            console.log(`[PendidikanTable] Chunk ${i + 1}/${numChunks}: fetched ${chunkData.length} records (total so far: ${allData.length})`);
          }
        }
      }
      
      console.log(`[PendidikanTable] Successfully loaded ${allData.length} records from database`);
      
      if (allData && allData.length > 0) {
        // Map database data to expected format
        const mappedData: PendidikanData[] = allData.map(item => ({
          "Nama Lengkap": item.nama_lengkap,
          "NIP": item.nip,
          "Pendidikan": item.pendidikan,
          "Tahun Lulus": item.tahun_lulus,
          "Lokasi Pendidikan": item.lokasi_pendidikan,
          "Jurusan": item.jurusan || "-",
          "Nama Lembaga Pendidikan": item.nama_lembaga_pendidikan || "-"
        }));
        console.log(`[PendidikanTable] Displaying ${mappedData.length} records in UI`);
        setData(mappedData);
        calculateStatsFromData(mappedData);
      } else {
        // Fallback to Excel file
        const response = await fetch("/data/pendidikan.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<PendidikanData>(worksheet);
        setData(jsonData);
        calculateStatsFromData(jsonData);
      }
    } catch (error) {
      console.error("Error loading Excel file:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromData = (jsonData: PendidikanData[]) => {

      // Calculate education level statistics
      const educationMap = new Map<string, number>();
      jsonData.forEach(item => {
        const level = item["Pendidikan"] || "Tidak diketahui";
        educationMap.set(level, (educationMap.get(level) || 0) + 1);
      });
      const educationData = Array.from(educationMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setEducationLevelStats(educationData);

      // Calculate graduation year statistics
      const yearMap = new Map<string, number>();
      jsonData.forEach(item => {
        const year = item["Tahun Lulus"];
        if (year) {
          const range = getYearRange(year);
          yearMap.set(range, (yearMap.get(range) || 0) + 1);
        }
      });
      const yearData = Array.from(yearMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const order = ["< 2000", "2000-2005", "2006-2010", "2011-2015", "2016-2020", "2021-2025", "> 2025"];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });
      setGraduationYearStats(yearData);

      // Calculate location statistics
      const locationMap = new Map<string, number>();
      jsonData.forEach(item => {
        const location = item["Lokasi Pendidikan"] || "Tidak diketahui";
        locationMap.set(location, (locationMap.get(location) || 0) + 1);
      });
      const locationData = Array.from(locationMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setLocationStats(locationData);

      // Calculate major statistics - top 10
      const majorMap = new Map<string, number>();
      jsonData.forEach(item => {
        const major = item["Jurusan"] || "Tidak diketahui";
        if (major && major.trim() !== "" && major !== "-") {
          majorMap.set(major, (majorMap.get(major) || 0) + 1);
        }
      });
      const majorData = Array.from(majorMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setMajorStats(majorData);

      // Calculate institution statistics - top 10
      const institutionMap = new Map<string, number>();
      jsonData.forEach(item => {
        const institution = item["Nama Lembaga Pendidikan"] || "Tidak diketahui";
        if (institution && institution.trim() !== "" && institution !== "-") {
          institutionMap.set(institution, (institutionMap.get(institution) || 0) + 1);
        }
      });
      const institutionData = Array.from(institutionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setInstitutionStats(institutionData);
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Nama Lengkap": item["Nama Lengkap"],
      "NIP": String(item["NIP"]).replace(/^'/, ""),
      "Pendidikan": item["Pendidikan"],
      "Tahun Lulus": item["Tahun Lulus"],
      "Lokasi Pendidikan": item["Lokasi Pendidikan"],
      "Jurusan": item["Jurusan"] || "-",
      "Nama Lembaga Pendidikan": item["Nama Lembaga Pendidikan"] || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pendidikan");
    XLSX.writeFile(workbook, `Data_Pendidikan_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Berhasil export ${exportData.length} data pendidikan`);
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !isAdmin) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Transform data to match database schema
      const pendidikanData = jsonData.map((item: any) => ({
        nip: String(item["NIP"]).replace(/^'/, ""),
        nama_lengkap: item["Nama Lengkap"],
        pendidikan: item["Pendidikan"],
        tahun_lulus: item["Tahun Lulus"],
        lokasi_pendidikan: item["Lokasi Pendidikan"],
        jurusan: item["Jurusan"] === "-" ? null : item["Jurusan"],
        nama_lembaga_pendidikan: item["Nama Lembaga Pendidikan"] === "-" ? null : item["Nama Lembaga Pendidikan"],
      }));

      // Insert in batches of 100
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      
      console.log(`[Import] Starting import of ${pendidikanData.length} records in ${Math.ceil(pendidikanData.length / batchSize)} batches`);
      
      for (let i = 0; i < pendidikanData.length; i += batchSize) {
        const batch = pendidikanData.slice(i, i + batchSize);
        console.log(`[Import] Processing batch ${Math.floor(i / batchSize) + 1}: records ${i + 1} to ${Math.min(i + batchSize, pendidikanData.length)}`);
        
        const { error } = await supabase
          .from("pendidikan")
          .upsert(batch, { onConflict: "nip", ignoreDuplicates: false });

        if (error) {
          console.error(`[Import] Error on batch ${Math.floor(i / batchSize) + 1}:`, error);
          toast.error(`Error pada batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`[Import] Batch ${Math.floor(i / batchSize) + 1} success: ${batch.length} records (total success: ${successCount})`);
        }
      }

      console.log(`[Import] Import complete: ${successCount} success, ${errorCount} errors`);
      toast.success(`Berhasil import ${successCount} data pendidikan${errorCount > 0 ? ` (${errorCount} error)` : ''}`);
      await loadExcelData();
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Gagal import data: " + error);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleDeleteAllData = async () => {
    if (!isAdmin) {
      toast.error("Hanya admin yang dapat menghapus semua data");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA data pendidikan? Tindakan ini tidak dapat dibatalkan!")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("pendidikan")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setData([]);
      setEducationLevelStats([]);
      setGraduationYearStats([]);
      setLocationStats([]);
      setMajorStats([]);
      setInstitutionStats([]);

      toast.success("Semua data pendidikan berhasil dihapus");
    } catch (error: any) {
      console.error("Error deleting all data:", error);
      toast.error("Gagal menghapus data: " + error.message);
    }
  };

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Memuat data pendidikan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Jenjang Pendidikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={educationLevelStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tahun Lulus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graduationYearStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasi Pendidikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Top 10 Jurusan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={majorStats} layout="vertical" margin={{ left: 120, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={110} style={{ fontSize: '10px' }} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              Top 10 Lembaga Pendidikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={institutionStats} layout="vertical" margin={{ left: 150, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} style={{ fontSize: '10px' }} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Pendidikan Pegawai</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, jurusan, lembaga..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Menampilkan {filteredData.length} dari {data.length} data pegawai
          </p>
          <div className="flex justify-between items-center gap-2 mt-2">
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
              )}
              {isAdmin && (
                <>
                  <div>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImportExcel}
                      className="hidden"
                      id="import-pendidikan-excel"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('import-pendidikan-excel')?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Import Excel
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAllData}
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Hapus Semua Database
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScroll('left')}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleScroll('right')}
                className="h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
            <div ref={scrollContainerRef} className="overflow-x-auto">
              <Table className="min-w-max">
                <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Pendidikan</TableHead>
                  <TableHead>Tahun Lulus</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Jurusan</TableHead>
                  <TableHead>Lembaga Pendidikan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item["Nama Lengkap"]}</TableCell>
                      <TableCell>{String(item["NIP"]).replace(/^'/, "")}</TableCell>
                      <TableCell>{item["Pendidikan"]}</TableCell>
                      <TableCell>{item["Tahun Lulus"]}</TableCell>
                      <TableCell>{item["Lokasi Pendidikan"]}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item["Jurusan"] || "-"}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{item["Nama Lembaga Pendidikan"] || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
