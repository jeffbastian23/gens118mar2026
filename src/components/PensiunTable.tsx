import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Clock, Briefcase, Building2, ChevronLeft, ChevronRight, Download, Upload } from "lucide-react";
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

interface PensiunData {
  "Nama Lengkap": string;
  "NIP": string;
  "Jenis Kelamin": string;
  "Usia Tahun": number;
  "Masa Kerja Tahun": number;
  "Jenjang Jabatan": string;
  "Jabatan": string;
  "Eselon 3": string;
}

const PRIMARY_COLOR = '#1e5ba8';

export default function PensiunTable() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [data, setData] = useState<PensiunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ageRangeStats, setAgeRangeStats] = useState<{ name: string; value: number }[]>([]);
  const [serviceYearStats, setServiceYearStats] = useState<{ name: string; value: number }[]>([]);
  const [positionLevelStats, setPositionLevelStats] = useState<{ name: string; value: number }[]>([]);
  const [officeStats, setOfficeStats] = useState<{ name: string; value: number }[]>([]);
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

  const getAgeRange = (age: number): string => {
    if (age < 25) return "< 25";
    if (age <= 30) return "25-30";
    if (age <= 35) return "31-35";
    if (age <= 40) return "36-40";
    if (age <= 45) return "41-45";
    if (age <= 50) return "46-50";
    if (age <= 55) return "51-55";
    return "> 55";
  };

  const getServiceYearRange = (years: number): string => {
    if (years < 5) return "< 5 tahun";
    if (years <= 10) return "5-10 tahun";
    if (years <= 15) return "11-15 tahun";
    if (years <= 20) return "16-20 tahun";
    if (years <= 25) return "21-25 tahun";
    if (years <= 30) return "26-30 tahun";
    return "> 30 tahun";
  };

  const loadExcelData = async () => {
    try {
      // Pertama ambil total jumlah data di database
      const { count: totalCount } = await supabase
        .from("pensiun")
        .select("*", { count: "exact", head: true });
      
      console.log(`[PensiunTable] Total records in database: ${totalCount}`);
      
      // Ambil semua data dalam beberapa chunk untuk melewati limit 1000 row
      const chunkSize = 1000;
      let allData: any[] = [];
      
      if (totalCount && totalCount > 0) {
        const numChunks = Math.ceil(totalCount / chunkSize);
        console.log(`[PensiunTable] Fetching ${numChunks} chunks of ${chunkSize} records each`);
        
        for (let i = 0; i < numChunks; i++) {
          const start = i * chunkSize;
          const end = start + chunkSize - 1;
          
          const { data: chunkData, error } = await supabase
            .from("pensiun")
            .select("*")
            .order("nama_lengkap", { ascending: true })
            .range(start, end);
          
          if (error) {
            console.error(`[PensiunTable] Error fetching chunk ${i + 1}:`, error);
            throw error;
          }
          
          if (chunkData && chunkData.length > 0) {
            allData = [...allData, ...chunkData];
            console.log(`[PensiunTable] Chunk ${i + 1}/${numChunks}: fetched ${chunkData.length} records (total so far: ${allData.length})`);
          }
        }
      }
      
      console.log(`[PensiunTable] Successfully loaded ${allData.length} records from database`);
      
      if (allData && allData.length > 0) {
        // Map database data ke format yang digunakan tabel
        const mappedData: PensiunData[] = allData.map(item => ({
          "Nama Lengkap": item.nama_lengkap,
          "NIP": item.nip,
          "Jenis Kelamin": item.jenis_kelamin || "-",
          "Usia Tahun": item.usia_tahun,
          "Masa Kerja Tahun": item.masa_kerja_tahun,
          "Jenjang Jabatan": item.jenjang_jabatan,
          "Jabatan": item.jabatan,
          "Eselon 3": item.unit_organisasi || "-"
        }));
        setData(mappedData);
        calculateStatsFromData(mappedData);
      } else {
        // Fallback ke file Excel lokal jika database kosong
        const response = await fetch("/data/pensiun.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<PensiunData>(worksheet);
        setData(jsonData);
        calculateStatsFromData(jsonData);
      }
    } catch (error) {
      console.error("Error loading Excel file:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromData = (jsonData: PensiunData[]) => {

      // Calculate age range statistics
      const ageRangeMap = new Map<string, number>();
      jsonData.forEach(item => {
        const range = getAgeRange(item["Usia Tahun"]);
        ageRangeMap.set(range, (ageRangeMap.get(range) || 0) + 1);
      });
      const ageData = Array.from(ageRangeMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const order = ["< 25", "25-30", "31-35", "36-40", "41-45", "46-50", "51-55", "> 55"];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });
      setAgeRangeStats(ageData);

      // Calculate service year statistics
      const serviceYearMap = new Map<string, number>();
      jsonData.forEach(item => {
        const range = getServiceYearRange(item["Masa Kerja Tahun"]);
        serviceYearMap.set(range, (serviceYearMap.get(range) || 0) + 1);
      });
      const serviceData = Array.from(serviceYearMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => {
          const order = ["< 5 tahun", "5-10 tahun", "11-15 tahun", "16-20 tahun", "21-25 tahun", "26-30 tahun", "> 30 tahun"];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });
      setServiceYearStats(serviceData);

      // Calculate position level statistics
      const positionMap = new Map<string, number>();
      jsonData.forEach(item => {
        const level = item["Jenjang Jabatan"] || "Tidak diketahui";
        positionMap.set(level, (positionMap.get(level) || 0) + 1);
      });
      const positionData = Array.from(positionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      setPositionLevelStats(positionData);

      // Calculate office (Eselon 3) statistics - top 10
      const officeMap = new Map<string, number>();
      jsonData.forEach(item => {
        const office = item["Eselon 3"] || "Tidak diketahui";
        if (office && office.trim() !== "") {
          officeMap.set(office, (officeMap.get(office) || 0) + 1);
        }
      });
      const officeData = Array.from(officeMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setOfficeStats(officeData);
  };

  const handleExportExcel = () => {
    const exportData = filteredData.map(item => ({
      "Nama Lengkap": item["Nama Lengkap"],
      "NIP": String(item["NIP"]).replace(/^'/, ""),
      "Jenis Kelamin": item["Jenis Kelamin"],
      "Usia Tahun": item["Usia Tahun"],
      "Masa Kerja Tahun": item["Masa Kerja Tahun"],
      "Jenjang Jabatan": item["Jenjang Jabatan"],
      "Jabatan": item["Jabatan"],
      "Eselon 3": item["Eselon 3"] || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pensiun");
    XLSX.writeFile(workbook, `Data_Pensiun_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Berhasil export ${exportData.length} data pensiun`);
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

      console.log(`[PensiunTable] Total rows in Excel: ${jsonData.length}`);

      // Transform data to match database schema
      const pensiunData = jsonData.map((item: any) => ({
        nip: String(item["NIP"]).replace(/^'/, ""),
        nama_lengkap: item["Nama Lengkap"],
        jenis_kelamin: item["Jenis Kelamin"] || null,
        usia_tahun: item["Usia Tahun"],
        masa_kerja_tahun: item["Masa Kerja Tahun"],
        jenjang_jabatan: item["Jenjang Jabatan"],
        jabatan: item["Jabatan"],
        unit_organisasi: item["Eselon 3"] || null,
      }));

      // Remove duplicates by NIP - keep the last occurrence
      const uniqueData = new Map<string, any>();
      let duplicateCount = 0;
      
      pensiunData.forEach((item) => {
        if (uniqueData.has(item.nip)) {
          duplicateCount++;
        }
        uniqueData.set(item.nip, item);
      });

      const finalData = Array.from(uniqueData.values());
      
      console.log(`[PensiunTable] Unique records after deduplication: ${finalData.length}`);
      if (duplicateCount > 0) {
        console.log(`[PensiunTable] Duplicates removed: ${duplicateCount}`);
        toast.info(`Ditemukan ${duplicateCount} data duplikat (NIP sama), data duplikat dilewati`);
      }

      // Insert in batches of 100
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < finalData.length; i += batchSize) {
        const batch = finalData.slice(i, i + batchSize);
        const { error } = await supabase
          .from("pensiun")
          .upsert(batch, { onConflict: "nip" });

        if (error) {
          console.error(`[PensiunTable] Error importing batch ${i / batchSize + 1}:`, error);
          errorCount += batch.length;
          toast.error(`Error pada batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
          console.log(`[PensiunTable] Batch ${i / batchSize + 1}: successfully imported ${batch.length} records`);
        }
      }

      console.log(`[PensiunTable] Import complete: ${successCount} success, ${errorCount} errors`);
      toast.success(`Berhasil import ${successCount} data pensiun${errorCount > 0 ? `, ${errorCount} gagal` : ''}`);
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

    if (!window.confirm("Apakah Anda yakin ingin menghapus SEMUA data pensiun? Tindakan ini tidak dapat dibatalkan!")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("pensiun")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setData([]);
      setAgeRangeStats([]);
      setServiceYearStats([]);
      setPositionLevelStats([]);
      setOfficeStats([]);

      toast.success("Semua data pensiun berhasil dihapus");
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
          <p className="text-muted-foreground">Memuat data pensiun...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribusi Range Usia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageRangeStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Distribusi Masa Kerja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceYearStats} layout="vertical" margin={{ left: 10, right: 30 }}>
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
              <Briefcase className="h-5 w-5" />
              Distribusi Jenjang Jabatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={positionLevelStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="value" fill={PRIMARY_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Top 10 Kantor Eselon 3
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={officeStats} layout="vertical" margin={{ left: 150, right: 30 }}>
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
          <CardTitle>Data Pensiun Pegawai</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, jabatan..."
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
                      id="import-pensiun-excel"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('import-pensiun-excel')?.click()}
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
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>Usia</TableHead>
                  <TableHead>Masa Kerja</TableHead>
                  <TableHead>Jenjang Jabatan</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Eselon 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Tidak ada data yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item["Nama Lengkap"]}</TableCell>
                      <TableCell>{String(item["NIP"]).replace(/^'/, "")}</TableCell>
                      <TableCell>{item["Jenis Kelamin"]}</TableCell>
                      <TableCell>{item["Usia Tahun"]} tahun</TableCell>
                      <TableCell>{item["Masa Kerja Tahun"]} tahun</TableCell>
                      <TableCell>{item["Jenjang Jabatan"]}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item["Jabatan"]}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item["Eselon 3"] || "-"}</TableCell>
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
