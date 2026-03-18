import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Briefcase, Filter, BarChart3, Building2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

interface Employee {
  id: string;
  nm_pegawai: string;
  nip: string;
  uraian_jabatan: string;
  nm_unit_organisasi: string;
}

// Function to extract simplified jabatan from uraian_jabatan
function extractSimplifiedJabatan(uraianJabatan: string): string {
  if (!uraianJabatan) return "-";
  
  const jabatanLower = uraianJabatan.toLowerCase();
  
  // Kepala Kantor Wilayah - must be checked before Kepala Kantor
  if (jabatanLower.includes("kepala kantor wilayah")) {
    return "Kepala Kantor Wilayah";
  }
  
  // Kepala Kantor - includes KPPBC, Balai Laboratorium, etc.
  if (jabatanLower.includes("kepala kantor pengawasan") || 
      jabatanLower.includes("kepala kantor pelayanan") ||
      jabatanLower.includes("kepala kantor bea") ||
      jabatanLower.includes("kepala kantor balai")) {
    return "Kepala Kantor";
  }
  
  if (jabatanLower.includes("kepala bidang")) {
    return "Kepala Bidang";
  }
  if (jabatanLower.includes("kepala bagian")) {
    return "Kepala Bagian";
  }
  if (jabatanLower.includes("kepala seksi")) {
    return "Kepala Seksi";
  }
  if (jabatanLower.includes("kepala subbagian") || jabatanLower.includes("kasubbag")) {
    return "Kepala Subbagian";
  }
  
  // Pemeriksa categories
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli utama")) {
    return "Pemeriksa Bea dan Cukai Ahli Utama";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli madya") || jabatanLower.includes("pemeriksa bea dan cukai madya")) {
    return "Pemeriksa Bea dan Cukai Madya";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli muda") || jabatanLower.includes("pemeriksa bea dan cukai muda")) {
    return "Pemeriksa Bea dan Cukai Muda";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai ahli pertama") || jabatanLower.includes("pemeriksa bea dan cukai pertama")) {
    return "Pemeriksa Bea dan Cukai Pertama";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai penyelia")) {
    return "Pemeriksa Bea dan Cukai Penyelia";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai mahir")) {
    return "Pemeriksa Bea dan Cukai Mahir";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai terampil")) {
    return "Pemeriksa Bea dan Cukai Terampil";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai lanjutan")) {
    return "Pemeriksa Bea dan Cukai Lanjutan";
  }
  if (jabatanLower.includes("pemeriksa bea dan cukai pelaksana")) {
    return "Pemeriksa Bea dan Cukai Pelaksana";
  }
  
  // Pelaksana categories
  if (jabatanLower.includes("pelaksana pemeriksa")) {
    return "Pelaksana Pemeriksa";
  }
  
  // Other functional positions
  if (jabatanLower.includes("pranata komputer")) {
    return "Pranata Komputer";
  }
  if (jabatanLower.includes("pranata keuangan apbn mahir")) {
    return "Pranata Keuangan Apbn Mahir";
  }
  if (jabatanLower.includes("pranata keuangan apbn terampil")) {
    return "Pranata Keuangan Apbn Terampil";
  }
  if (jabatanLower.includes("analis")) {
    return "Analis";
  }
  if (jabatanLower.includes("auditor")) {
    return "Auditor";
  }
  
  // Default: extract text before "pada" or comma
  const padaIndex = uraianJabatan.toLowerCase().indexOf(" pada ");
  if (padaIndex !== -1) {
    return uraianJabatan.substring(0, padaIndex).trim();
  }
  
  const commaIndex = uraianJabatan.indexOf(",");
  if (commaIndex !== -1) {
    return uraianJabatan.substring(0, commaIndex).trim();
  }
  
  return uraianJabatan.trim();
}

// Get badge color based on jabatan category
function getJabatanColor(jabatan: string): string {
  const jabatanLower = jabatan.toLowerCase();
  if (jabatanLower.includes("kepala kantor") || jabatanLower.includes("kepala seksi") || 
      jabatanLower.includes("kepala bidang") || jabatanLower.includes("kepala bagian") ||
      jabatanLower.includes("kepala subbagian")) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (jabatanLower.includes("pemeriksa")) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (jabatanLower.includes("pelaksana")) {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (jabatanLower.includes("pranata")) {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }
  if (jabatanLower.includes("analis") || jabatanLower.includes("auditor")) {
    return "bg-rose-100 text-rose-800 border-rose-200";
  }
  return "bg-gray-100 text-gray-800 border-gray-200";
}

interface JabatanTabProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export default function JabatanTab({ isAdmin, canEdit }: JabatanTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnitOrganisasi, setSelectedUnitOrganisasi] = useState<Set<string>>(new Set());
  const [selectedDetailJabatan, setSelectedDetailJabatan] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let allEmployees: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from("employees")
          .select("id, nm_pegawai, nip, uraian_jabatan, nm_unit_organisasi")
          .order("nm_pegawai", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allEmployees = [...allEmployees, ...data];
        
        if (data.length < pageSize) break;
        page++;
      }
      
      const employeesData: Employee[] = allEmployees.map(emp => ({
        id: emp.id,
        nm_pegawai: emp.nm_pegawai,
        nip: emp.nip || '',
        uraian_jabatan: emp.uraian_jabatan || '',
        nm_unit_organisasi: emp.nm_unit_organisasi || '',
      }));
      setEmployees(employeesData);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique unit organisasi options
  const unitOrganisasiOptions = useMemo(() => {
    const unitSet = new Set<string>();
    employees.forEach(emp => {
      if (emp.nm_unit_organisasi) {
        unitSet.add(emp.nm_unit_organisasi);
      }
    });
    return Array.from(unitSet).sort();
  }, [employees]);

  // Process employees with extracted jabatan
  const employeesWithJabatan = useMemo(() => {
    return employees.map(emp => {
      const jabatanExtracted = extractSimplifiedJabatan(emp.uraian_jabatan);
      return {
        ...emp,
        jabatanExtracted,
      };
    });
  }, [employees]);

  // Get unique simplified jabatan options for detail filter - filtered by selected unit
  const detailJabatanOptions = useMemo(() => {
    const jabatanSet = new Set<string>();
    employeesWithJabatan
      .filter(emp => selectedUnitOrganisasi.size === 0 || selectedUnitOrganisasi.has(emp.nm_unit_organisasi))
      .forEach(emp => {
        if (emp.jabatanExtracted && emp.jabatanExtracted !== "-") {
          jabatanSet.add(emp.jabatanExtracted);
        }
      });
    return Array.from(jabatanSet).sort();
  }, [employeesWithJabatan, selectedUnitOrganisasi]);

  // Filter employees by selected unit, detail jabatan, and search term
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employeesWithJabatan.filter(emp => {
      // First filter by unit organisasi if any selected
      if (selectedUnitOrganisasi.size > 0 && !selectedUnitOrganisasi.has(emp.nm_unit_organisasi)) {
        return false;
      }
      // Then filter by detail jabatan if any selected
      if (selectedDetailJabatan.size > 0 && !selectedDetailJabatan.has(emp.jabatanExtracted)) {
        return false;
      }
      // Then filter by search term
      return emp.nm_pegawai.toLowerCase().includes(term) ||
        emp.nip.toLowerCase().includes(term) ||
        emp.jabatanExtracted.toLowerCase().includes(term) ||
        emp.nm_unit_organisasi.toLowerCase().includes(term);
    });
  }, [employeesWithJabatan, searchTerm, selectedUnitOrganisasi, selectedDetailJabatan]);

  // Statistics for unit organisasi
  const unitStatistics = useMemo(() => {
    const stats: Record<string, number> = {};
    const filteredByJabatan = employeesWithJabatan.filter(emp => 
      selectedDetailJabatan.size === 0 || selectedDetailJabatan.has(emp.jabatanExtracted)
    );
    
    filteredByJabatan.forEach(emp => {
      if (emp.nm_unit_organisasi) {
        stats[emp.nm_unit_organisasi] = (stats[emp.nm_unit_organisasi] || 0) + 1;
      }
    });
    return stats;
  }, [employeesWithJabatan, selectedDetailJabatan]);

  // Statistics for detail jabatan
  const jabatanStatistics = useMemo(() => {
    const stats: Record<string, number> = {};
    const filteredByUnit = employeesWithJabatan.filter(emp => 
      selectedUnitOrganisasi.size === 0 || selectedUnitOrganisasi.has(emp.nm_unit_organisasi)
    );
    
    filteredByUnit.forEach(emp => {
      if (emp.jabatanExtracted && emp.jabatanExtracted !== "-") {
        stats[emp.jabatanExtracted] = (stats[emp.jabatanExtracted] || 0) + 1;
      }
    });
    return stats;
  }, [employeesWithJabatan, selectedUnitOrganisasi]);

  // Handle unit organisasi toggle
  const handleUnitToggle = (unit: string) => {
    setSelectedUnitOrganisasi(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unit)) {
        newSet.delete(unit);
      } else {
        newSet.add(unit);
      }
      return newSet;
    });
  };

  // Handle select all units
  const handleSelectAllUnits = () => {
    if (selectedUnitOrganisasi.size === unitOrganisasiOptions.length) {
      setSelectedUnitOrganisasi(new Set());
    } else {
      setSelectedUnitOrganisasi(new Set(unitOrganisasiOptions));
    }
  };

  // Handle detail jabatan toggle
  const handleDetailJabatanToggle = (jabatan: string) => {
    setSelectedDetailJabatan(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jabatan)) {
        newSet.delete(jabatan);
      } else {
        newSet.add(jabatan);
      }
      return newSet;
    });
  };

  // Handle select all detail jabatan
  const handleSelectAllDetail = () => {
    if (selectedDetailJabatan.size === detailJabatanOptions.length) {
      setSelectedDetailJabatan(new Set());
    } else {
      setSelectedDetailJabatan(new Set(detailJabatanOptions));
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredEmployees.map((emp, index) => ({
      "No": index + 1,
      "Nama Pegawai": emp.nm_pegawai,
      "NIP": emp.nip,
      "Jabatan": emp.jabatanExtracted,
      "Unit Organisasi": emp.nm_unit_organisasi,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Jabatan Pegawai");

    // Set column widths
    ws["!cols"] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 20 },
      { wch: 35 },
      { wch: 50 },
    ];

    XLSX.writeFile(wb, `Data_Jabatan_Pegawai_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Unit Organisasi Filter */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Filter Unit Organisasi
            {selectedUnitOrganisasi.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedUnitOrganisasi.size} dipilih
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              onClick={handleSelectAllUnits}
              className="text-xs text-primary hover:underline"
            >
              {selectedUnitOrganisasi.size === unitOrganisasiOptions.length ? "Batal Pilih Semua" : "Pilih Semua"}
            </button>
            {selectedUnitOrganisasi.size > 0 && (
              <button
                onClick={() => setSelectedUnitOrganisasi(new Set())}
                className="text-xs text-muted-foreground hover:underline"
              >
                Hapus Pilihan
              </button>
            )}
          </div>
          <ScrollArea className="h-[100px]">
            <div className="flex flex-wrap gap-2">
              {unitOrganisasiOptions.map(unit => (
                <Badge
                  key={unit}
                  variant={selectedUnitOrganisasi.has(unit) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedUnitOrganisasi.has(unit) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => handleUnitToggle(unit)}
                >
                  {unit}
                  <span className="ml-1 text-xs opacity-70">
                    ({unitStatistics[unit] || 0})
                  </span>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Jabatan Filter */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter Detail Jabatan
            {selectedDetailJabatan.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedDetailJabatan.size} dipilih
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              onClick={handleSelectAllDetail}
              className="text-xs text-primary hover:underline"
            >
              {selectedDetailJabatan.size === detailJabatanOptions.length ? "Batal Pilih Semua" : "Pilih Semua"}
            </button>
            {selectedDetailJabatan.size > 0 && (
              <button
                onClick={() => setSelectedDetailJabatan(new Set())}
                className="text-xs text-muted-foreground hover:underline"
              >
                Hapus Pilihan
              </button>
            )}
          </div>
          <ScrollArea className="h-[150px]">
            <div className="flex flex-wrap gap-2">
              {detailJabatanOptions.map(jabatan => (
                <Badge
                  key={jabatan}
                  variant={selectedDetailJabatan.has(jabatan) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedDetailJabatan.has(jabatan) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10"
                  }`}
                  onClick={() => handleDetailJabatanToggle(jabatan)}
                >
                  {jabatan}
                  <span className="ml-1 text-xs opacity-70">
                    ({jabatanStatistics[jabatan] || 0})
                  </span>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unit Organisasi Statistics */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Statistik Unit Organisasi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {Object.entries(unitStatistics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([unit, count]) => (
                    <div 
                      key={unit} 
                      className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                        selectedUnitOrganisasi.has(unit) 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleUnitToggle(unit)}
                    >
                      <span className="text-sm text-muted-foreground truncate max-w-[250px]" title={unit}>
                        {unit}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Unit:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {Object.keys(unitStatistics).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Jabatan Statistics */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Statistik Detail Jabatan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {Object.entries(jabatanStatistics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([jabatan, count]) => (
                    <div 
                      key={jabatan} 
                      className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all ${
                        selectedDetailJabatan.has(jabatan) 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleDetailJabatanToggle(jabatan)}
                    >
                      <span className="text-sm text-muted-foreground truncate max-w-[250px]" title={jabatan}>
                        {jabatan}
                      </span>
                      <Badge variant="secondary" className={getJabatanColor(jabatan)}>
                        {count}
                      </Badge>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Jenis Jabatan:</span>
                <span className="text-lg font-bold text-blue-600">
                  {Object.keys(jabatanStatistics).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Data Jabatan Pegawai
              <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                Total: {filteredEmployees.length} pegawai
              </span>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, jabatan, unit organisasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Menampilkan {filteredEmployees.length} dari {employees.length} data pegawai
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Uraian Jabatan</TableHead>
                  <TableHead>Unit Organisasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Tidak ada data yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.nm_pegawai}</TableCell>
                      <TableCell className="font-mono text-sm">{item.nip}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getJabatanColor(item.jabatanExtracted)}>
                          {item.jabatanExtracted}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.nm_unit_organisasi}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
