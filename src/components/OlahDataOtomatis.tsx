import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface Employee {
  id: string;
  nip: string | null;
  nm_pegawai: string;
  nm_unit_organisasi: string;
}

interface OlahDataRow {
  no: number;
  nip: string;
  nama: string;
  unitOrganisasi: string;
  countST: number;
  countCuti: number;
  countAbsen: number;
}

export default function OlahDataOtomatis() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [cutiData, setCutiData] = useState<any[]>([]);
  const [absensiData, setAbsensiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all employees
      const { data: empData } = await supabase
        .from("employees")
        .select("id, nip, nm_pegawai, nm_unit_organisasi")
        .order("nm_pegawai");

      // Fetch all assignments
      const { data: stData } = await supabase
        .from("assignments")
        .select("employee_ids");

      // Fetch all cuti
      const { data: cutData } = await supabase
        .from("cuti")
        .select("nip");

      // Fetch all absensi
      const { data: absData } = await supabase
        .from("absensi")
        .select("nip");

      setEmployees(empData || []);
      setAssignments(stData || []);
      setCutiData(cutData || []);
      setAbsensiData(absData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Create the processed data
  const processedData: OlahDataRow[] = useMemo(() => {
    // Get unique NIPs from all sources
    const nipSet = new Set<string>();
    
    // Add from employees
    employees.forEach(e => {
      if (e.nip) nipSet.add(e.nip);
    });

    // Add from assignments (need to match employee_ids to NIPs)
    assignments.forEach(a => {
      if (a.employee_ids) {
        a.employee_ids.forEach((id: string) => {
          const emp = employees.find(e => e.id === id);
          if (emp?.nip) nipSet.add(emp.nip);
        });
      }
    });

    // Add from cuti
    cutiData.forEach(c => {
      if (c.nip) nipSet.add(c.nip);
    });

    // Add from absensi
    absensiData.forEach(a => {
      if (a.nip) nipSet.add(a.nip);
    });

    // Build data rows
    const rows: OlahDataRow[] = [];
    let no = 1;

    nipSet.forEach(nip => {
      // Find employee data
      const employee = employees.find(e => e.nip === nip);
      
      // Count ST (assignments)
      let stCount = 0;
      assignments.forEach(a => {
        if (a.employee_ids) {
          const matchedEmp = employees.find(e => e.nip === nip);
          if (matchedEmp && a.employee_ids.includes(matchedEmp.id)) {
            stCount++;
          }
        }
      });

      // Count Cuti
      const cutiCount = cutiData.filter(c => c.nip === nip).length;

      // Count Absen
      const absenCount = absensiData.filter(a => a.nip === nip).length;

      // Only add if there's any activity
      if (stCount > 0 || cutiCount > 0 || absenCount > 0) {
        rows.push({
          no: no++,
          nip,
          nama: employee?.nm_pegawai || "-",
          unitOrganisasi: employee?.nm_unit_organisasi || "-",
          countST: stCount,
          countCuti: cutiCount,
          countAbsen: absenCount
        });
      }
    });

    return rows;
  }, [employees, assignments, cutiData, absensiData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return processedData;
    return processedData.filter(row => 
      row.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.unitOrganisasi.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  const handleExport = () => {
    const exportData = filteredData.map(row => ({
      "No": row.no,
      "NIP": row.nip,
      "Nama": row.nama,
      "Unit Organisasi": row.unitOrganisasi,
      "Jumlah ST": row.countST,
      "Jumlah Cuti": row.countCuti,
      "Jumlah Absen": row.countAbsen
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Olah Data Otomatis");
    XLSX.writeFile(wb, `Olah_Data_Pegawai_${format(new Date(), "yyyyMMdd")}.xlsx`);
    toast.success("Data berhasil diekspor");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Memuat data...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Olah Data Otomatis</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Data agregat dari Surat Tugas, Cuti, dan Absensi per pegawai
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari NIP, Nama, atau Unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="min-w-[150px]">NIP</TableHead>
                <TableHead className="min-w-[200px]">Nama</TableHead>
                <TableHead className="min-w-[200px]">Unit Organisasi</TableHead>
                <TableHead className="w-24 text-center">ST</TableHead>
                <TableHead className="w-24 text-center">Cuti</TableHead>
                <TableHead className="w-24 text-center">Absen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row) => (
                  <TableRow key={row.nip}>
                    <TableCell className="text-center">{row.no}</TableCell>
                    <TableCell className="font-mono text-sm">{row.nip}</TableCell>
                    <TableCell>{row.nama}</TableCell>
                    <TableCell className="text-sm">{row.unitOrganisasi}</TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-6 rounded ${row.countST > 0 ? 'bg-blue-100 text-blue-700' : 'text-muted-foreground'}`}>
                        {row.countST}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-6 rounded ${row.countCuti > 0 ? 'bg-amber-100 text-amber-700' : 'text-muted-foreground'}`}>
                        {row.countCuti}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-6 rounded ${row.countAbsen > 0 ? 'bg-green-100 text-green-700' : 'text-muted-foreground'}`}>
                        {row.countAbsen}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          Total: {filteredData.length} pegawai dengan aktivitas
        </p>
      </CardContent>
    </Card>
  );
}
